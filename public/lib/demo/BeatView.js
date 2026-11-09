import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the plot
// The harmonics that beat are near 1000 Hz, more than a hundred cycles per swell, too
// dense to see. They are drawn at this lower pitch instead, keeping the real
// difference between them, so each cycle shows and the swells keep their real rate.
const DRAWN_HZ = 48;

/**
 * Draws two sine waves over `seconds`, each as a thin yellow line, and their sum (the
 * main wave) as a thick red line on top.
 *
 * `update(beat)` draws two waves that differ by `beat` hertz, the way a pair of nearly
 * coinciding harmonics sounds. Equal frequencies give a sum of constant size; a
 * difference of Δ hertz makes the sum swell and shrink Δ times per second (beats). The
 * waves are drawn at a lower pitch than they sound (see DRAWN_HZ); the beat rate is
 * drawn as it is.
 *
 * `setWaves(f1, f2)` draws any two frequencies, in cycles per second of the span (the
 * ratio demo: eight cycles of the lower wave and the upper one at a ratio to it).
 *
 * Computed, not measured from audio, so it shows whether or not anything is playing.
 */
export class BeatView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { seconds = 0.5 } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.seconds = seconds;
        this.f1 = DRAWN_HZ;
        this.f2 = DRAWN_HZ;
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Redraws for a new beat rate in hertz (0 for none). */
    update(beat) {
        this.setWaves(DRAWN_HZ, DRAWN_HZ + beat);
    }

    /** Redraws two sine waves at `f1` and `f2` cycles per second of the plot's span. */
    setWaves(f1, f2) {
        this.f1 = f1;
        this.f2 = f2;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const x0 = INSET, width = w - 2 * INSET;
        const mid = h / 2, amp = h / 2 - INSET;
        // Several points per cycle keep the curves smooth.
        const { f1, f2 } = this;
        const steps = Math.max(Math.round(width * 2), Math.round(Math.max(f1, f2) * this.seconds * 24));
        // Each wave at half height, so their sum fits.
        const a = t => 0.5 * Math.sin(2 * Math.PI * f1 * t);
        const b = t => 0.5 * Math.sin(2 * Math.PI * f2 * t);

        const trace = (fn, color, lineWidth) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * this.seconds;
                const x = x0 + (i / steps) * width, y = mid - fn(t) * amp;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        trace(a, COLORS.yellow, 1.5);
        trace(b, COLORS.yellow, 1.5);
        trace(t => a(t) + b(t), COLORS.red, 2);
    }
}
