import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const ROW = 2 * GRID;      // one track per row; a square is at most this size
const ROW_GAP = GRID;      // between rows
const GAP = 4;             // background showing between squares, as in StepGrid
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";

/**
 * Draws each track of a rhythm pattern (see rhythm.js) as a row of equal squares, one
 * per step of the track's own loop, numbered from 1 (or labeled with the track's
 * `names`, such as note names), for polymeters: every step lasts
 * the same time, so every square is the same size, and a shorter loop is a shorter
 * row. Rows start on the same left edge, the first track on top.
 *
 * Squares are white wells; a hit fills its square yellow from the bottom, as high as
 * its velocity (as in StepGrid). The square of the step that is sounding is red with a
 * white number. `setStep(i)` lights step `i` modulo each track's length, so the rows
 * wrap at their own lengths and their first squares turn red together only when the
 * loops meet again.
 *
 * The square size fits `maxSteps` squares across the stage (at most 32 px) and does
 * not depend on the pattern, so it stays the same when a loop's length changes.
 */
export class LoopView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object} [opts]
     * @param {number} [opts.maxSteps]  the longest loop the view must fit.
     */
    constructor(canvas, { maxSteps = 9 } = {}) {
        this.canvas = canvas;
        this.maxSteps = maxSteps;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.pattern = null;
        this.step = -1;
        this.viewport.onResize(() => this._resize());
        this._resize();
        document.fonts?.ready.then(() => this.draw());
    }

    /** Redraws for a pattern. */
    update(pattern) {
        this.pattern = pattern;
        this.draw();
    }

    /** Marks step `i` of the pattern as sounding, or none with -1. */
    setStep(i) {
        this.step = i;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport, pattern } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!pattern) return;

        const fit = (w - 2 * INSET + GAP) / this.maxSteps - GAP;
        const size = Math.max(GRID, Math.min(ROW, Math.floor(fit)));
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        pattern.tracks.forEach((track, t) => {
            const n = track.steps.length;
            const y = INSET + t * (ROW + ROW_GAP) + (ROW - size) / 2;
            const sounding = this.step >= 0 ? this.step % n : -1;
            track.steps.forEach((velocity, i) => {
                const x = INSET + i * (size + GAP);
                const on = i === sounding;
                ctx.fillStyle = on ? COLORS.red : COLORS.white;
                ctx.fillRect(x, y, size, size);
                const v = Math.min(1, velocity * (track.gain ?? 1));
                if (!on && v > 0) {
                    ctx.fillStyle = COLORS.yellow;
                    ctx.fillRect(x, y + size * (1 - v), size, size * v);
                }
                ctx.fillStyle = on ? COLORS.white : COLORS.ink;
                ctx.fillText(track.names?.[i] ?? String(i + 1), x + size / 2, y + size / 2);
            });
        });
    }
}
