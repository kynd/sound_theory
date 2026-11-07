import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { partialSum, partialPeak } from '../audio/additive.js';

const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the plot
const PERIODS = 2;

/**
 * Draws an additive tone directly on the paper, with no panels, titles, or labels:
 * two periods of the fundamental, each partial as a thin yellow line and their sum
 * (the main wave) as a thick red line on top.
 *
 * Partials are drawn at the same scale as the sum, which is scaled to a peak of 1 the
 * way AdditiveOscillator plays it, so the yellow lines add up to the red one.
 * The drawing is computed from the partials, not measured from audio, so it shows
 * whether or not the tone is playing.
 */
export class PartialsView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.partials = [1];
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Redraws for new partial amplitudes. */
    update(partials) {
        this.partials = [...partials];
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport, partials } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const x0 = INSET, width = w - 2 * INSET;
        const mid = h / 2, amp = h / 2 - INSET;
        const peak = partialPeak(partials);
        const scale = peak > 0 ? 1 / peak : 0;
        const steps = Math.max(200, Math.round(width));

        const trace = (fn, color, lineWidth) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const phase = (i / steps) * PERIODS;
                const x = x0 + (i / steps) * width, y = mid - fn(phase) * scale * amp;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        partials.forEach((a, k) => {
            if (a !== 0) trace(phase => a * Math.sin(2 * Math.PI * (k + 1) * phase), COLORS.yellow, 2);
        });
        if (peak > 0) trace(phase => partialSum(partials, phase), COLORS.red, 3);
    }
}
