import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { PITCH_CLASS_NAMES, scaleNotes, scaleRun, rootMidi } from '../audio/scales.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const MUSIC_FONT = "'Noto Music'";
const SQUARE_GAP = 4;      // background showing between squares, like the keys' gaps
const SPACE = 12;          // distance between staff lines
const CLEF_WIDTH = 3 * GRID;

/**
 * Shows a scale two ways, one above the other, directly on the paper:
 *
 *   - the 13 notes from the scale's root up to the root an octave above as a row of
 *     squares (the high root gets its own square): white wells for notes outside the
 *     scale, yellow for notes in it, labeled with the scale's own spelling (E♭, not
 *     D♯) or the plain name;
 *   - the scale written ascending on a treble staff, from the root in octave 4 to the
 *     octave above, with ledger lines above and below and accidentals. A scale with
 *     different notes coming down (`descending`, the melodic minor) is written up and
 *     back down.
 *
 * The note that is sounding is red in both (white text on the red square). While a
 * run up and down is played, `setSounding` also takes the step in the run, so the
 * squares show the notes of the direction being played and the staff marks that one
 * note rather than every note of the same pitch. Pressing
 * a square plays its note through `onNoteOn` / `onNoteOff` and marks it sounding while
 * held. The staff lines are the one place lines are drawn: they are notation.
 */
export class ScaleView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { onNoteOn = () => {}, onNoteOff = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onNoteOn = onNoteOn;
        this.onNoteOff = onNoteOff;
        this.scale = null;
        this.sounding = null;
        this._squares = [];
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
        // The clef and accidentals come from a web font; draw again once it is ready.
        document.fonts?.load(`48px ${MUSIC_FONT}`, '𝄞♯♭').then(() => this.draw());
    }

    /** Shows a scale from `scales.js` (any root). */
    update(scale) {
        this.scale = scale;
        this.root = rootMidi(scale);
        this.up = scaleNotes(scale);
        this.down = scaleNotes(scale, 4, { descending: true });
        // The staff writes the way down only when it differs from the way up.
        this.staffNotes = scale.descending ? scaleRun(scale) : this.up;
        this.step = null;
        this.draw();
    }

    /**
     * Marks a MIDI note as sounding (red), or none with null. `step` is its index in
     * `scaleRun(scale)` when the note comes from a run up and down, or null.
     */
    setSounding(midi, step = null) {
        this.sounding = midi;
        this.step = step;
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
            const square = this._squares.find(s => x >= s.x && x <= s.x + s.size && y >= s.y && y <= s.y + s.size);
            if (!square) return;
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            held = square.midi;
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
        if (!this.scale) return;

        const x0 = INSET, width = w - 2 * INSET;
        const size = Math.min(4 * GRID, (width - 12 * SQUARE_GAP) / 13);
        // Squares, a gap, room above the staff (the clef, notes up to B5), the staff, and
        // room below it (the clef's tail, the ledger line of C4).
        const content = size + 2 * GRID + 2 * SPACE + 4 * SPACE + 2 * SPACE;
        const top = Math.max(INSET, (h - content) / 2);
        this._drawSquares(x0, top, size);
        this._drawStaff(x0, top + size + 2 * GRID + 2 * SPACE, width);
    }

    _drawSquares(x0, y, size) {
        const { ctx } = this;
        // Root … root an octave up, in the direction being played.
        const descending = this.step !== null && this.step >= this.up.length;
        const notes = descending ? this.down : this.up;
        const inScale = new Map(notes.map(n => [n.midi - this.root, n.name]));
        // A sounding note within the octave lights its own square; one outside it lights
        // the square of the same pitch class.
        let soundingIndex = null;
        if (this.sounding !== null) {
            const above = this.sounding - this.root;
            soundingIndex = above >= 0 && above <= 12 ? above : ((above % 12) + 12) % 12;
        }
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this._squares = [];
        // `i` counts semitones above the root; the squares start on the root.
        for (let i = 0; i <= 12; i++) {
            const x = x0 + i * (size + SQUARE_GAP);
            const sounding = i === soundingIndex;
            ctx.fillStyle = sounding ? COLORS.red : inScale.has(i) ? COLORS.yellow : COLORS.white;
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 6);
            ctx.fill();
            ctx.fillStyle = sounding ? COLORS.white : COLORS.ink;
            ctx.fillText(inScale.get(i) ?? PITCH_CLASS_NAMES[(this.root + i) % 12], x + size / 2, y + size / 2);
            this._squares.push({ x, y, size, midi: this.root + i });
        }
    }

    _drawStaff(x0, top, width) {
        const { ctx } = this;
        const bottom = top + 4 * SPACE;           // the E4 line
        const yOf = position => bottom - (position - 2) * SPACE / 2;   // position: C4 = 0

        // Five lines.
        ctx.fillStyle = COLORS.ink;
        for (let i = 0; i < 5; i++) ctx.fillRect(x0, Math.round(top + i * SPACE), width, 1);

        // Treble clef, at standard proportions: about 7 spaces tall, reaching 4.4 spaces
        // above the G line (the second line from the bottom), which its curl wraps.
        const probe = 100;
        ctx.font = `${probe}px ${MUSIC_FONT}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const m = ctx.measureText('𝄞');
        const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        if (glyphHeight > 0) {
            const fontSize = probe * (7 * SPACE) / glyphHeight;
            ctx.font = `${fontSize}px ${MUSIC_FONT}`;
            const ascent = m.actualBoundingBoxAscent * fontSize / probe;
            const gLine = bottom - SPACE;
            ctx.fillText('𝄞', x0 + 4, gLine - 4.4 * SPACE + ascent);
        }

        // Notes, evenly spaced after the clef. A run up and down needs the room.
        const notes = this.staffNotes;
        const run = notes !== this.up;
        const left = x0 + CLEF_WIDTH + (run ? GRID : 2 * GRID), right = x0 + width - GRID;
        const stepX = notes.length > 1 ? (right - left) / (notes.length - 1) : 0;
        ctx.font = `${2 * SPACE}px ${MUSIC_FONT}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        notes.forEach((note, i) => {
            const x = left + i * stepX;
            const position = note.position;
            const y = yOf(position);
            // Ledger lines below the staff (C4 and lower) and above it (A5 and higher).
            ctx.fillStyle = COLORS.ink;
            for (let p = 0; p >= position; p -= 2) ctx.fillRect(x - 11, Math.round(yOf(p)), 22, 1);
            for (let p = 12; p <= position; p += 2) ctx.fillRect(x - 11, Math.round(yOf(p)), 22, 1);
            if (note.accidental) ctx.fillText(note.accidental, x - 11, y);
            const sounding = run && this.step !== null ? i === this.step : note.midi === this.sounding;
            ctx.fillStyle = sounding ? COLORS.red : COLORS.ink;
            ctx.beginPath();
            ctx.ellipse(x, y, 7, 5, -0.35, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
}
