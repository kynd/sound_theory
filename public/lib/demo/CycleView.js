import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const RING = 16;           // thickness of a track's ring, at most
const DOT = 7;             // radius of a full hit

/**
 * Draws a rhythm pattern (see rhythm.js) as a cycle: the pattern's steps run clockwise
 * from the top around a ring, so the end of the cycle meets its start. Each track is a
 * white ring, the first track outermost. A hit is a yellow dot whose size follows its
 * velocity; the hits of the step that is sounding are red. A track moved off the grid
 * (`offset`) is drawn moved by the same share of a step.
 */
export class CycleView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.pattern = null;
        this.stepDuration = 1;
        this.step = -1;
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Redraws for a pattern; `stepDuration` (seconds) converts track offsets to steps. */
    update(pattern, stepDuration = this.stepDuration) {
        this.pattern = pattern;
        this.stepDuration = stepDuration;
        this.draw();
    }

    /**
     * Marks step `i` as sounding, or none with -1. An array gives each track its own
     * step (for voices that drift apart).
     */
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

        const cx = w / 2, cy = h / 2;
        const outer = Math.min(w, h) / 2 - INSET;
        const tracks = pattern.tracks;
        // Rings share the radius evenly, leaving the middle as wide as one ring's share.
        const share = outer / (tracks.length + 1);
        const thickness = Math.min(RING, share * 0.75);
        // A lone ring has room for larger dots, so accents stand out.
        const dot = tracks.length === 1 ? 2 * DOT : Math.min(DOT, thickness / 2 + 1);

        tracks.forEach((track, t) => {
            const r = outer - Math.max(thickness / 2, dot) - t * share;
            ctx.fillStyle = COLORS.white;
            ctx.beginPath();
            ctx.arc(cx, cy, r + thickness / 2, 0, 2 * Math.PI);
            ctx.arc(cx, cy, r - thickness / 2, 0, 2 * Math.PI, true);
            ctx.fill();

            const n = track.steps.length;
            const shift = (track.offset ?? 0) / this.stepDuration;
            track.steps.forEach((velocity, i) => {
                if (velocity <= 0) return;
                const a = ((i + shift) / n) * 2 * Math.PI - Math.PI / 2;
                const v = Math.min(1, velocity * (track.gain ?? 1));
                const step = Array.isArray(this.step) ? this.step[t] : this.step;
                ctx.fillStyle = i === step ? COLORS.red : COLORS.yellow;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dot * (0.4 + 0.6 * v), 0, 2 * Math.PI);
                ctx.fill();
            });
        });
    }
}
