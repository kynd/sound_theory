import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const LINE = GRID;         // one line of text
const CELL = 2 * GRID;     // height of a chord
const BAR_GAP = GRID;      // space between bars
const GAP = 4;             // space between chords within a bar
const BEATS_PER_BAR = 4;
const BARS_PER_LINE = 4;
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";

/**
 * A progression as a chord chart, the way a lead sheet writes a form: four bars to a
 * line, each chord a white well as wide as its share of the bar with its symbol inside,
 * and its Roman numeral (where the progression has them) on a line below. The sounding
 * chord is red with white text. A chord longer than a bar fills each of its bars, with
 * the symbol in the first. Pressing a chord plays it through `onPress(i)` /
 * `onRelease(i)`.
 *
 * Same interface as ProgressionView (`update`, `setChord`, `setNote`), so a demo can
 * use either; the melody is not drawn.
 */
export class ChordChart {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { onPress = () => {}, onRelease = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onPress = onPress;
        this.onRelease = onRelease;
        this.progression = null;
        this.chord = -1;
        this._cells = [];
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
    }

    /** Redraws for a progression (the voicings are not needed). */
    update(progression) {
        this.progression = progression;
        this.chord = -1;
        this.draw();
    }

    /** Marks chord `i` as sounding, or none with -1. */
    setChord(i) { this.chord = i; this.draw(); }

    /** The melody is not drawn. */
    setNote() {}

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    _wirePointer() {
        let held = -1;
        const release = () => {
            if (held < 0) return;
            this.onRelease(held);
            held = -1;
        };
        this.canvas.addEventListener('pointerdown', e => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const cell = this._cells.find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + CELL);
            if (!cell) return;
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            held = cell.index;
            this.onPress(held);
        });
        this.canvas.addEventListener('pointerup', release);
        this.canvas.addEventListener('pointercancel', release);
    }

    draw() {
        const { ctx, viewport, progression } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        this._cells = [];
        if (!progression) return;

        const { chords } = progression;
        const hasRoman = chords.some(c => c.roman);
        // A line: the chords, then a grid unit and the Roman numerals; lines are two
        // grid units apart.
        const lineHeight = CELL + (hasRoman ? GRID + LINE : 0) + 2 * GRID;
        const barWidth = (w - 2 * INSET - (BARS_PER_LINE - 1) * BAR_GAP) / BARS_PER_LINE;
        const xOf = beat => {
            const bar = Math.floor(beat / BEATS_PER_BAR + 1e-6);
            return INSET + (bar % BARS_PER_LINE) * (barWidth + BAR_GAP) + ((beat - bar * BEATS_PER_BAR) / BEATS_PER_BAR) * barWidth;
        };

        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let at = 0;
        chords.forEach((chord, i) => {
            const sounding = i === this.chord;
            // One piece per bar the chord covers.
            for (let start = at, first = true; start < at + chord.beats - 1e-6; first = false) {
                const bar = Math.floor(start / BEATS_PER_BAR + 1e-6);
                const end = Math.min(at + chord.beats, (bar + 1) * BEATS_PER_BAR);
                const x1 = xOf(start) + (start > bar * BEATS_PER_BAR + 1e-6 ? GAP / 2 : 0);
                const x2 = end >= (bar + 1) * BEATS_PER_BAR - 1e-6 ? xOf(bar * BEATS_PER_BAR) + barWidth : xOf(end) - GAP / 2;
                const y = INSET + Math.floor(bar / BARS_PER_LINE) * lineHeight;
                ctx.fillStyle = sounding ? COLORS.red : COLORS.white;
                ctx.beginPath();
                ctx.roundRect(x1, y, x2 - x1, CELL, 6);
                ctx.fill();
                if (first) {
                    const cx = (x1 + x2) / 2;
                    ctx.fillStyle = sounding ? COLORS.white : COLORS.ink;
                    ctx.fillText(chord.symbol, cx, y + CELL / 2);
                    ctx.fillStyle = COLORS.ink;
                    if (hasRoman) ctx.fillText(chord.roman ?? '', cx, y + CELL + GRID + LINE / 2);
                }
                this._cells.push({ x: x1, y, w: x2 - x1, index: i });
                start = end;
            }
            at += chord.beats;
        });
    }
}
