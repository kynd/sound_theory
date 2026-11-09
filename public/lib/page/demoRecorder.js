/**
 * Adds a small record button under every embedded demo (`.demo-wrap`) on a page. It
 * records the demo's frame with its sound and downloads the result as an MP4.
 *
 * A page cannot read its own pixels and audio directly, so this uses the browser's
 * screen capture of the current tab (`getDisplayMedia`), which asks the viewer to
 * confirm each time; the tab's audio comes with it. Tab capture alone misses things:
 * it leaves out the mouse pointer, and it can skip updates to a canvas, so a demo's
 * live graphics (a scope, a trail behind the pointer, a playhead) go missing. So the
 * video is composed on a canvas of our own, once per screen frame: the captured demo
 * (cropped to its iframe, by the browser where region capture exists, by us
 * otherwise), the demo's canvas drawn over it straight from the iframe (same origin),
 * and the pointer drawn where it is. MP4 is used where MediaRecorder can write it
 * (Chrome, Safari); otherwise (Firefox) the file is WebM.
 *
 * Loaded once by the page layout; it does nothing on pages without demos.
 */

// Best first: H.264 + AAC in MP4, then plain MP4, then WebM as a fallback. avc3 comes
// before avc1 because it allows the frame size to change mid-recording; with avc1 a
// size change can freeze or corrupt the rest of the video.
const MIME_TYPES = [
    'video/mp4;codecs=avc3.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm',
];

function pickMimeType() {
    if (typeof MediaRecorder === 'undefined') return null;
    return MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type)) ?? '';
}

function slug(text) {
    return (text || 'demo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// The mouse pointer, an arrow 20 CSS pixels tall with its tip at (0, 0), drawn black
// with a white edge like the system's.
const ARROW = [[0, 0], [0, 17], [4.5, 13], [7.5, 20], [10.2, 19], [7.3, 12.2], [12.5, 12.2]];

/**
 * Composes the recorded video of one demo, once per screen frame: the captured frame
 * of the demo, then the demo's canvases drawn over it as they are right now (on the
 * demo's background, so an older capture of them never shows through), then the mouse
 * pointer. `stream` is the captured tab; `cropped` says whether the browser has
 * already cropped it to the iframe. `stream` (this object's) is the result, video only.
 */
class FrameComposer {
    constructor(iframe, stream, cropped) {
        this.iframe = iframe;
        this.cropped = cropped;
        this.scale = window.devicePixelRatio || 1;
        this.canvas = document.createElement('canvas');
        // H.264 needs even sizes.
        this.canvas.width = 2 * Math.round(iframe.clientWidth * this.scale / 2);
        this.canvas.height = 2 * Math.round(iframe.clientHeight * this.scale / 2);
        this.ctx = this.canvas.getContext('2d');
        this.video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, srcObject: stream });
        this.ready = this.video.play().catch(() => {});
        this.stream = this.canvas.captureStream(60);

        this.pointer = null;   // { x, y } in the iframe's CSS pixels, or null when outside
        const win = iframe.contentWindow;
        this._move = e => { if (e.pointerType !== 'touch') this.pointer = { x: e.clientX, y: e.clientY }; };
        this._leave = e => { if (!e.relatedTarget) this.pointer = null; };
        win?.addEventListener('pointermove', this._move, true);
        win?.addEventListener('pointerdown', this._move, true);
        win?.document.addEventListener('pointerout', this._leave, true);

        const loop = () => { this._draw(); this._frame = requestAnimationFrame(loop); };
        this._frame = requestAnimationFrame(loop);
    }

    _draw() {
        const { ctx, canvas, video, iframe } = this;
        const doc = iframe.contentDocument;
        const width = iframe.clientWidth, height = iframe.clientHeight;
        const body = doc ? getComputedStyle(doc.body).backgroundColor : '';
        const background = body && body !== 'rgba(0, 0, 0, 0)' ? body : '#fff';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const f = canvas.width / width;   // CSS pixels to video pixels
        ctx.setTransform(f, 0, 0, f, 0, 0);

        // The captured demo: the part of the iframe inside the window.
        const box = iframe.getBoundingClientRect();
        const left = Math.max(0, -box.left), top = Math.max(0, -box.top);
        const right = Math.min(width, window.innerWidth - box.left), bottom = Math.min(height, window.innerHeight - box.top);
        if (video.videoWidth && right > left && bottom > top) {
            if (this.cropped) {
                ctx.drawImage(video, left, top, right - left, bottom - top);
            } else {
                const k = video.videoWidth / window.innerWidth;
                ctx.drawImage(video, (box.left + left) * k, (box.top + top) * k, (right - left) * k, (bottom - top) * k,
                    left, top, right - left, bottom - top);
            }
        }
        if (!doc) return;

        // The demo's canvases, as they are now.
        for (const c of doc.querySelectorAll('canvas')) {
            const r = c.getBoundingClientRect();
            if (!r.width || !r.height || !c.width || !c.height) continue;
            ctx.fillStyle = background;
            ctx.fillRect(r.left, r.top, r.width, r.height);
            ctx.drawImage(c, r.left, r.top, r.width, r.height);
        }

        // The pointer.
        if (this.pointer) {
            const { x, y } = this.pointer;
            ctx.beginPath();
            ARROW.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x + px, y + py));
            ctx.closePath();
            ctx.lineJoin = 'round';
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.fill();
        }
    }

    dispose() {
        cancelAnimationFrame(this._frame);
        const win = this.iframe.contentWindow;
        win?.removeEventListener('pointermove', this._move, true);
        win?.removeEventListener('pointerdown', this._move, true);
        win?.document.removeEventListener('pointerout', this._leave, true);
        this.stream.getTracks().forEach(track => track.stop());
        this.video.srcObject = null;
    }
}

class DemoRecorder {
    constructor(wrap) {
        this.iframe = wrap.querySelector('iframe');
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = 'demo-record';
        this.button.addEventListener('click', () => (this.recorder ? this.stop() : this.start()));
        wrap.append(this.button);
        this.recorder = null;
        this._render();
    }

    _render() {
        const recording = !!this.recorder;
        this.button.replaceChildren(
            document.createTextNode(recording ? 'stop' : 'record'),
            Object.assign(document.createElement('span'), {
                className: recording ? 'demo-record-mark stop' : 'demo-record-mark',
            }));
    }

    async start() {
        const mimeType = pickMimeType();
        if (mimeType === null || !navigator.mediaDevices?.getDisplayMedia) {
            alert('Recording is not supported in this browser.');
            return;
        }
        let stream;
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 60, displaySurface: 'browser' },
                audio: { suppressLocalAudioPlayback: false },
                preferCurrentTab: true,
                selfBrowserSurface: 'include',
                surfaceSwitching: 'exclude',
            });
        } catch {
            return;   // The viewer declined.
        }

        const [videoTrack] = stream.getVideoTracks();
        // Crop to the demo where region capture exists.
        let cropped = false;
        if (typeof CropTarget !== 'undefined' && videoTrack?.cropTo) {
            try { await videoTrack.cropTo(await CropTarget.fromElement(this.iframe)); cropped = true; } catch { /* whole tab */ }
        }
        // Without a crop, the demo can be found in the video only when it shows this tab.
        const surface = videoTrack?.getSettings?.().displaySurface;
        const composer = cropped || surface === 'browser' || surface === undefined
            ? new FrameComposer(this.iframe, stream, cropped) : null;
        const recorded = composer
            ? new MediaStream([...composer.stream.getVideoTracks(), ...stream.getAudioTracks()])
            : stream;

        const chunks = [];
        const recorder = new MediaRecorder(recorded, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : {});
        recorder.addEventListener('dataavailable', e => { if (e.data.size) chunks.push(e.data); });
        recorder.addEventListener('stop', () => {
            composer?.dispose();
            stream.getTracks().forEach(track => track.stop());
            const type = recorder.mimeType || mimeType || 'video/webm';
            this._download(new Blob(chunks, { type }), type.startsWith('video/mp4') ? 'mp4' : 'webm');
            this.recorder = null;
            this._render();
        });
        // Sharing stopped from the browser's own controls ends the recording too.
        videoTrack?.addEventListener('ended', () => this.stop());

        await composer?.ready;
        this.recorder = recorder;
        recorder.start(1000);
        this._render();
    }

    stop() {
        if (this.recorder?.state === 'recording') this.recorder.stop();
    }

    _download(blob, extension) {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${slug(this.iframe?.title)}-${stamp}.${extension}`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    }
}

function addDemoRecorders() {
    document.querySelectorAll('.demo-wrap').forEach(wrap => {
        if (wrap.querySelector('iframe') && !wrap.querySelector('.demo-record')) new DemoRecorder(wrap);
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addDemoRecorders);
else addDemoRecorders();
