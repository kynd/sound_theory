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
 *
 * With `spectrum: true` the partials' amplitudes are also drawn below the wave as
 * yellow bars, one slot per entry in the partial list (so a list padded with zeros
 * keeps the slots fixed while partials are added). A bar's height is the partial's
 * magnitude; its sign (a sine turned upside down) shows only in the wave.
 */
export class PartialsView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object} [opts]
     * @param {boolean} [opts.spectrum]  also draw the amplitudes as bars below the wave.
     */
    constructor(canvas, { spectrum = false } = {}) {
        this.canvas = canvas;
        this.spectrum = spectrum;
        canvas.parentElement.classList.add('dp-plot');
        if (spectrum) canvas.parentElement.classList.add('dp-plots-2');
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
        // With a spectrum, the wave takes the top and the bars the bottom, one inset
        // apart, each half the height, as the plots of a Scope in 'both' mode.
        const bars = this.spectrum ? Math.round((h - 3 * INSET) / 2) : 0;
        const waveHeight = this.spectrum ? h - 3 * INSET - bars : h - 2 * INSET;
        const mid = INSET + waveHeight / 2, amp = waveHeight / 2;
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

        if (this.spectrum) this._drawSpectrum(x0, h - INSET, width, bars);
    }

    _drawSpectrum(x0, bottom, width, height) {
        const { ctx, partials } = this;
        const largest = Math.max(...partials.map(Math.abs));
        if (largest === 0) return;
        const slot = width / partials.length;
        const gap = Math.min(2, slot / 4);
        ctx.fillStyle = COLORS.yellow;
        partials.forEach((a, k) => {
            const barHeight = Math.abs(a) / largest * height;
            if (barHeight > 0) ctx.fillRect(x0 + k * slot + gap / 2, bottom - barHeight, slot - gap, barHeight);
        });
    }
}
