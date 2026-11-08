import * as Tone from 'tone';
import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

// The demos' one text style: same size, weight, and color everywhere.
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the plots and between them
const LABEL = 2 * GRID;   // the spectrum's frequency labels and the grid unit above them

// The trigger's filter: a band pass, a DC blocker and a steep low pass, as in a
// hardware oscilloscope's "HF reject" trigger coupling.
const TRIGGER_HIGHPASS = 20;    // Hz, removes any offset
const TRIGGER_LOWPASS = 150;    // Hz, leaves the fundamental in charge
const TRIGGER_STAGES = 4;       // one-pole low passes in a row, 24 dB per octave

/**
 * Where to start drawing a waveform so that a periodic wave holds still from frame to
 * frame: the position of a rising zero crossing, at most `values.length - span`. It is
 * fractional, interpolated between the samples on either side, so the picture does not
 * shimmer by a sample from frame to frame.
 *
 * Triggering on the raw signal fails when a strong harmonic (a resonant filter's peak)
 * crosses zero several times per period: each frame may pick a different crossing, and
 * the picture jumps. So the crossing is found on a filtered copy in which the
 * fundamental outweighs every harmonic, and the drawing then starts at the signal's
 * own next rising crossing, so a sine still starts at zero. The filters settle over the
 * first part of the buffer, which is not searched. Falls back to the first raw
 * crossing (or 0) when the filtered copy has none, as in silence.
 */
function triggerPoint(values, span, sampleRate) {
    const n = values.length;
    const last = n - span;
    const rawCrossing = from => {
        for (let i = Math.max(1, from); i <= last; i++) {
            const a = values[i - 1], b = values[i];
            if (a < 0 && b >= 0) return i - 1 + a / (a - b);
        }
        return -1;
    };

    const hp = Math.exp(-2 * Math.PI * TRIGGER_HIGHPASS / sampleRate);
    const lp = 1 - Math.exp(-2 * Math.PI * TRIGGER_LOWPASS / sampleRate);
    const settle = n - 2 * span;   // the part of the buffer left for the filters to settle
    // Start the DC blocker as if it had been running, at the first sample less the
    // settling part's mean; started from zero, its slow decay would shift the crossing
    // by a different amount in every frame.
    let mean = 0;
    for (let i = 0; i < settle; i++) mean += values[i];
    mean /= Math.max(1, settle);
    let prevIn = values[0], prevHp = values[0] - mean, prevOut = 0;
    const stages = new Float64Array(TRIGGER_STAGES).fill(prevHp);
    for (let i = 0; i <= last; i++) {
        const hpOut = values[i] - prevIn + hp * prevHp;
        prevIn = values[i]; prevHp = hpOut;
        let v = hpOut;
        for (let k = 0; k < TRIGGER_STAGES; k++) v = stages[k] += lp * (v - stages[k]);
        if (i > settle && prevOut < 0 && v >= 0) {
            const raw = rawCrossing(i);
            return raw >= 0 ? raw : i;
        }
        prevOut = v;
    }
    const raw = rawCrossing(settle);
    return raw >= 0 ? raw : Math.max(0, settle);
}

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
     * @param {number} [opts.size]      waveform length in samples, a power of two. Half
     *                                  of it is drawn; the scope reads twice as much, so
     *                                  the trigger filter has time to settle.
     * @param {number} [opts.fftSize]   spectrum bins, a power of two. More bins resolve
     *                                  low frequencies better but react more slowly.
     */
    constructor(canvas, source, { mode = 'wave', size = 2048, fftSize = 4096 } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mode = mode;
        this.viewport = new Viewport(canvas);
        this.waveform = new Tone.Waveform(2 * size);
        this.size = size;
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
        const span = this.size >> 1;
        const mid = y0 + h / 2, amp = h / 2;
        const crossing = triggerPoint(values, span, Tone.getContext().sampleRate);
        const start = Math.ceil(crossing), shift = start - crossing;

        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < span; i++) {
            const x = x0 + ((i + shift) / (span - 1)) * w;
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
