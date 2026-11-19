import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the drawing
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const RING = 16;     // ring thickness
const DOT = 8;       // note radius

/**
 * Draws notes within one octave on a ring: the full circle is one octave (1200 cents),
 * starting at the top and running clockwise. The ring is a white well; each note is a
 * yellow dot labeled with its name outside the ring, and the latest note is red with
 * its label inside, so it can sit right next to another note (the Pythagorean comma)
 * without the labels colliding.
 */
export class FifthsRing {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.notes = [];
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Redraws for a list of `{ name, cents }`, oldest first; the last is the latest. */
    update(notes) {
        this.notes = notes;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport, notes } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) / 2 - INSET - 2 * GRID;
        const at = (cents, radius) => {
            const a = (cents / 1200) * 2 * Math.PI - Math.PI / 2;
            return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
        };

        // The octave as a white well.
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.arc(cx, cy, r + RING / 2, 0, 2 * Math.PI);
        ctx.arc(cx, cy, r - RING / 2, 0, 2 * Math.PI, true);
        ctx.fill();

        notes.forEach((note, i) => {
            const latest = i === notes.length - 1 && notes.length > 1;
            const [x, y] = at(note.cents, r);
            ctx.fillStyle = latest ? COLORS.red : COLORS.yellow;
            ctx.beginPath();
            ctx.arc(x, y, DOT, 0, 2 * Math.PI);
            ctx.fill();
            const [lx, ly] = at(note.cents, latest ? r - 2 * GRID : r + 2 * GRID);
            ctx.fillStyle = COLORS.ink;
            ctx.fillText(note.name, lx, ly);
        });
    }
}
