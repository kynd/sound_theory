import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;          // the demos' base grid
const INSET = 2 * GRID;   // space around the drawing
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const DOT = 2 * GRID;     // a note's circle
const BAR = GRID;         // the white well the notes sit on

/**
 * Shows a tetrachord on a line of pitch, directly on the paper: a white bar from the
 * lowest note to the highest, `span` cents long, with the four notes as yellow circles
 * at their exact pitches, so notes between the keys (quarter tones) sit between the
 * names. Below the bar, the names of the twelve-tone notes in that span (`names`, one
 * every 100 cents) mark where the keys are. The note that is sounding is red.
 *
 * Pressing a circle plays it through `onNoteOn(i)` / `onNoteOff(i)`, `i` counting from
 * the lowest note. `update(cents)` takes the notes in cents above the lowest.
 */
export class TetrachordView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object}   opts
     * @param {string[]} opts.names  twelve-tone note names, one every 100 cents from the lowest.
     * @param {number}   [opts.span] cents from the lowest note to the highest.
     */
    constructor(canvas, { names, span = 500, onNoteOn = () => {}, onNoteOff = () => {} }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        Object.assign(this, { names, span, onNoteOn, onNoteOff });
        this.cents = [];
        this.sounding = null;
        this._dots = [];
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
        document.fonts?.ready.then(() => this.draw());
    }

    /** Shows notes at these pitches, in cents above the lowest. */
    update(cents) {
        this.cents = [...cents];
        this.draw();
    }

    /** Marks note `i` as sounding (red), or none with null. */
    setSounding(i) {
        this.sounding = i;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    _wirePointer() {
        let held = null;
        const release = () => {
            if (held === null) return;
            this.onNoteOff(held);
            if (this.sounding === held) this.setSounding(null);
            held = null;
        };
        this.canvas.addEventListener('pointerdown', e => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const dot = this._dots.find(d => Math.hypot(x - d.x, y - d.y) <= DOT / 2);
            if (!dot) return;
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            held = dot.i;
            this.onNoteOn(held);
            this.setSounding(held);
        });
        this.canvas.addEventListener('pointerup', release);
        this.canvas.addEventListener('pointercancel', release);
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // The circles, a grid unit, and a line of names.
        const content = DOT + GRID + GRID;
        const mid = Math.max(INSET, (h - content) / 2) + DOT / 2;
        // Circles at either end stay inside the margins.
        const left = INSET + DOT / 2, right = w - INSET - DOT / 2;
        const xAt = cents => left + (cents / this.span) * (right - left);

        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.roundRect(left - BAR / 2, mid - BAR / 2, right - left + BAR, BAR, BAR / 2);
        ctx.fill();

        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.ink;
        const namesY = mid + DOT / 2 + GRID + GRID / 2;
        this.names.forEach((name, i) => ctx.fillText(name, xAt(i * 100), namesY));

        this._dots = this.cents.map((c, i) => ({ i, x: xAt(c), y: mid }));
        for (const { i, x, y } of this._dots) {
            ctx.fillStyle = i === this.sounding ? COLORS.red : COLORS.yellow;
            ctx.beginPath();
            ctx.arc(x, y, DOT / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
