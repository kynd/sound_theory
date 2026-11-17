import { Viewport } from './viewport.js';
import { COLORS, accent } from './colors.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const LINE = GRID;         // one line of text
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const RING = 16;           // ring thickness
const DOT = 8;             // a chord note's radius
const EDGE = 4;            // the width of a chord's outline

/** The twelve notes from C, spelled the common way. */
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/**
 * The twelve notes of the octave on a circle, directly on the paper: C at the top and
 * each semitone a twelfth of the way round clockwise, on a white ring with the names
 * outside it. A chord is an outlined shape joining its notes, the color of its quality
 * (`qualities`, in order: the first quality takes `accent(0)`, and so on), with a dot
 * at every note and the chord's `symbol` in the middle of the shape. Chords of the same quality are the same shape, turned.
 *
 * `update({ notes, quality, symbol })` takes the chord's notes (MIDI numbers or pitch classes;
 * only the pitch class counts) its quality's index, and its name; `update(null)` clears it.
 */
export class ChordCircle {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.chord = null;
        this.viewport.onResize(() => this._resize());
        this._resize();
        document.fonts?.ready.then(() => this.draw());
    }

    update(chord) {
        this.chord = chord;
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

        // The ring centered in the space left by the margins and a line of names around it.
        const r = Math.max(0, Math.min(w, h) / 2 - INSET - LINE - RING / 2);
        const cx = w / 2, cy = h / 2;
        const at = (pc, radius) => {
            const angle = -Math.PI / 2 + (pc / 12) * 2 * Math.PI;
            return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
        };

        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = RING;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.ink;
        NAMES.forEach((name, pc) => ctx.fillText(name, ...at(pc, r + RING / 2 + LINE)));

        if (!this.chord) return;
        const pcs = [...new Set(this.chord.notes.map(n => ((n % 12) + 12) % 12))].sort((a, b) => a - b);
        const color = accent(this.chord.quality ?? 0);
        const points = pcs.map(pc => at(pc, r));

        // The shape as an outline, so the name inside sits on the paper.
        ctx.strokeStyle = color;
        ctx.lineWidth = EDGE;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color;
        for (const [x, y] of points) {
            ctx.beginPath();
            ctx.arc(x, y, DOT, 0, 2 * Math.PI);
            ctx.fill();
        }

        // The chord's name in the middle of its shape (at the centroid, always inside).
        if (!this.chord.symbol) return;
        const mx = points.reduce((t, [x]) => t + x, 0) / points.length;
        const my = points.reduce((t, [, y]) => t + y, 0) / points.length;
        ctx.fillStyle = COLORS.ink;
        ctx.fillText(this.chord.symbol, mx, my);
    }
}
