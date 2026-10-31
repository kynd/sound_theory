/**
 * Adds a small record button under every embedded demo (`.demo-wrap`) on a page. It
 * records the demo's frame with its sound and downloads the result as an MP4.
 *
 * A page cannot read its own pixels and audio directly, so this uses the browser's
 * screen capture of the current tab (`getDisplayMedia`), which asks the viewer to
 * confirm each time. Where the browser supports region capture (Chrome), the video is
 * cropped to the demo's iframe; elsewhere it is the whole tab. The tab's audio comes
 * with it. MP4 is used where MediaRecorder can write it (Chrome, Safari); otherwise
 * (Firefox) the file is WebM.
 *
 * Loaded once by the page layout; it does nothing on pages without demos.
 */

// Best first: H.264 + AAC in MP4, then plain MP4, then WebM as a fallback.
const MIME_TYPES = [
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
        if (typeof CropTarget !== 'undefined' && videoTrack?.cropTo) {
            try { await videoTrack.cropTo(await CropTarget.fromElement(this.iframe)); } catch { /* whole tab */ }
        }

        const chunks = [];
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : {});
        recorder.addEventListener('dataavailable', e => { if (e.data.size) chunks.push(e.data); });
        recorder.addEventListener('stop', () => {
            stream.getTracks().forEach(track => track.stop());
            const type = recorder.mimeType || mimeType || 'video/webm';
            this._download(new Blob(chunks, { type }), type.startsWith('video/mp4') ? 'mp4' : 'webm');
            this.recorder = null;
            this._render();
        });
        // Sharing stopped from the browser's own controls ends the recording too.
        videoTrack?.addEventListener('ended', () => this.stop());

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
