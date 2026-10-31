import * as Tone from 'tone';
import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

// The demos' one text style: same size, weight, and color everywhere.
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the plots and between them
const LABEL = 2 * GRID;   // the spectrum's frequency labels and the grid unit above them

/**
 * Draws a signal on a canvas, as a waveform (amplitude over time), a spectrum (level
 * over frequency), or both stacked. Connect any Tone node as the source; the scope
 * only listens and does not pass audio on.
 *
 * Plots sit directly on the paper, with no panels or grid lines. The waveform is a
 * red line (the main wave); the spectrum is filled yellow below the curve. Only the
 * spectrum's frequencies are labeled; the waveform's time span is left to the page.
 */
export class Scope {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {Tone.ToneAudioNode} source
     * @param {object} [opts]
     * @param {'wave'|'spectrum'|'both'} [opts.mode]
     * @param {number} [opts.size]      waveform analysis length in samples, a power of
     *                                  two. Half of it is drawn.
     * @param {number} [opts.fftSize]   spectrum bins, a power of two. More bins resolve
     *                                  low frequencies better but react more slowly.
     */
    constructor(canvas, source, { mode = 'wave', size = 2048, fftSize = 4096 } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mode = mode;
        this.viewport = new Viewport(canvas);
        this.waveform = new Tone.Waveform(size);
        this.fft = new Tone.FFT(fftSize);
        source.connect(this.waveform);
        source.connect(this.fft);
        this._snapshot = null;

        this.viewport.onResize(() => this._resize());
        this._resize();
        const loop = () => { this.draw(); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
    }

    /** Whether the display is holding a still frame. */
    get frozen() { return this._snapshot !== null; }

    /** Holds the current frame on screen until `unfreeze()`, or replaces the held frame. */
    freeze() {
        this._snapshot = { wave: this.waveform.getValue().slice(), fft: this.fft.getValue().slice() };
    }

    unfreeze() {
        clearInterval(this._onsetTimer);
        this._snapshot = null;
    }

    /**
     * Freezes the display just after the next sound arrives, for catching a short hit.
     * Output latency varies by device, so this watches the newest samples for the
     * signal to rise above `threshold` instead of waiting a fixed time after the note.
     * @param {object} [opts]
     * @param {number} [opts.threshold]  peak level that counts as an onset.
     * @param {number} [opts.delay]      ms after the onset to freeze, so the onset sits
     *                                   inside the drawn half of the waveform.
     * @param {number} [opts.timeout]    ms to wait before freezing anyway.
     */
    freezeOnNextOnset({ threshold = 0.01, delay = 25, timeout = 1000 } = {}) {
        clearInterval(this._onsetTimer);
        const started = performance.now();
        this._onsetTimer = setInterval(() => {
            const values = this.waveform.getValue();
            let peak = 0;
            for (let i = values.length - 256; i < values.length; i++) peak = Math.max(peak, Math.abs(values[i]));
            if (peak > threshold || performance.now() - started > timeout) {
                clearInterval(this._onsetTimer);
                setTimeout(() => this.freeze(), delay);
            }
        }, 5);
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        // Read the analysers every frame even while frozen: the spectrum's smoothing
        // only advances when it is read, so skipping reads would leave the old sound
        // in it for the next freeze.
        const liveWave = this.waveform.getValue();
        const liveFft = this.fft.getValue();
        const wave = this._snapshot?.wave ?? liveWave;
        const fft = this._snapshot?.fft ?? liveFft;

        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.font = FONT;
        ctx.fillStyle = COLORS.ink;
        const x = INSET, y = INSET, iw = w - 2 * INSET, ih = h - 2 * INSET;
        if (this.mode === 'both') {
            const top = Math.round((ih - INSET) / 2);
            this._drawWave(wave, x, y, iw, top);
            this._drawSpectrum(fft, x, y + top + INSET, iw, ih - top - INSET);
        } else if (this.mode === 'spectrum') {
            this._drawSpectrum(fft, x, y, iw, ih);
        } else {
            this._drawWave(wave, x, y, iw, ih);
        }
        if (this.frozen) {
            ctx.fillStyle = COLORS.ink;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('Frozen', x + iw, y + GRID / 2);
            ctx.textAlign = 'left';
        }
    }

    _drawWave(values, x0, y0, w, h) {
        const { ctx } = this;
        const span = values.length >> 1;
        const mid = y0 + h / 2, amp = h / 2;

        // Start at a rising zero crossing so a periodic wave holds still (a trigger).
        let start = 0;
        for (let i = 1; i < span; i++) {
            if (values[i - 1] < 0 && values[i] >= 0) { start = i; break; }
        }

        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < span; i++) {
            const x = x0 + (i / (span - 1)) * w;
            const y = mid - Math.max(-1.1, Math.min(1.1, values[start + i])) * amp;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

    }

    _drawSpectrum(values, x0, y0, w, h) {
        const { ctx, fft } = this;
        const fMin = 20, fMax = 20000, dbMin = -100, dbMax = -10;
        const xOf = f => x0 + (Math.log(f / fMin) / Math.log(fMax / fMin)) * w;
        const top = y0, bottom = y0 + h - LABEL;
        const yOf = db => bottom - ((Math.max(dbMin, Math.min(dbMax, db)) - dbMin) / (dbMax - dbMin)) * (bottom - top);

        ctx.fillStyle = COLORS.ink;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        const labelY = y0 + h - GRID / 2;
        for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
            ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, xOf(f), labelY);
        }
        ctx.textAlign = 'right';
        ctx.fillText('Hz', x0 + w, labelY);
        ctx.textAlign = 'left';

        const points = [];
        for (let i = 1; i < values.length; i++) {
            const f = fft.getFrequencyOfIndex(i);
            if (f < fMin || f > fMax) continue;
            points.push([xOf(f), yOf(values[i])]);
        }
        if (points.length < 2) return;

        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.moveTo(points[0][0], bottom);
        for (const [x, y] of points) ctx.lineTo(x, y);
        ctx.lineTo(points[points.length - 1][0], bottom);
        ctx.closePath();
        ctx.fill();
    }
}
