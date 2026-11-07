import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { compHits } from '../audio/chords.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const LINE = GRID;         // one line of text
const GAP = 4;             // background showing between chords
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";

/**
 * A chord progression as a piano roll, directly on the paper: time runs left to right
 * (each chord as wide as its beats), pitch bottom to top, and each note of a chord's
 * voicing is a yellow bar across the chord's width, so the way voices move from chord
 * to chord shows as bars that stay level or step a little. A melody is drawn over the
 * chords in pink, each note as long as it sounds and as thick as it is loud. A chord
 * with a `comp` is drawn as its hits (the bass alone, the
 * notes above it) at the beats they fall on. Sounding notes are red.
 *
 * The chord symbols sit on a line above the roll (on two lines, alternating, when a
 * symbol is wider than its chord, and the same for the Roman numerals); the Roman
 * numerals and functions
 * (T, SD, D, SDm), where the progression has them, on lines below. Pressing a chord
 * plays it through `onPress(i)` / `onRelease(i)`.
 */
export class ProgressionView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { onPress = () => {}, onRelease = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onPress = onPress;
        this.onRelease = onRelease;
        this.progression = null;
        this.voicings = [];
        this.hits = [];
        this.chord = -1;
        this.note = -1;
        this.hit = -1;
        this._columns = [];
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
    }

    /** Redraws for a progression and its voicings (from `voiceProgression`). */
    update(progression, voicings) {
        this.progression = progression;
        this.voicings = voicings;
        this.hits = compHits(progression, voicings);
        this.chord = this.note = this.hit = -1;
        this.draw();
    }

    /** Marks chord `i` as sounding, or none with -1. */
    setChord(i) { this.chord = i; this.draw(); }

    /** Marks melody note `i` as sounding, or none with -1. */
    setNote(i) { this.note = i; this.draw(); }

    /** Marks hit `k` of the sounding chord's comp as sounding, or none with -1. */
    setHit(k) { this.hit = k; this.draw(); }

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
            const x = e.clientX - rect.left;
            const column = this._columns.find(c => x >= c.x && x <= c.x + c.w);
            if (!column) return;
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            held = column.index;
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
        this._columns = [];
        if (!progression) return;

        const { chords, melody = [] } = progression;
        const hasRoman = chords.some(c => c.roman);
        const hasFn = chords.some(c => c.fn);

        // Time: the whole progression (or melody, if longer) across the width.
        const chordBeats = chords.reduce((s, c) => s + c.beats, 0);
        const melodyBeats = melody.reduce((s, n) => s + n.beats, 0);
        const beats = Math.max(chordBeats, melodyBeats);
        const x0 = INSET, rollWidth = w - 2 * INSET;
        const xOf = beat => x0 + (beat / beats) * rollWidth;

        // Pitch: every note shown, with a semitone of room above and below.
        const all = [...this.voicings.flatMap(v => v.notes), ...melody.filter(n => n.midi !== null).map(n => n.midi)];
        const low = Math.min(...all) - 1, high = Math.max(...all) + 1;
        // Symbols, and Roman numerals, alternate between two lines when one would run
        // into the next.
        ctx.font = FONT;
        const crowded = key => chords.some(c => {
            const room = (c.beats / beats) * rollWidth - GAP;
            return c[key] && ctx.measureText(c[key]).width > room;
        });
        const stagger = crowded('symbol'), romanStagger = hasRoman && crowded('roman');
        const romanLines = hasRoman ? (romanStagger ? 2 : 1) : 0;
        const top = INSET + (stagger ? 2 : 1) * LINE + GRID;
        const bottom = h - INSET - romanLines * LINE - (hasFn ? LINE : 0) - (hasRoman || hasFn ? GRID : 0);
        const row = (bottom - top) / (high - low + 1);
        const yOf = midi => top + (high - midi) * row;
        const barH = Math.max(2, Math.min(row - 1, 8));

        const bar = (x1, x2, midi, color, height = barH) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x1, yOf(midi) + (row - height) / 2, Math.max(1, x2 - x1), height, height / 2);
            ctx.fill();
        };

        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let at = 0;
        chords.forEach((chord, i) => {
            const x1 = xOf(at) + GAP / 2, x2 = xOf(at + chord.beats) - GAP / 2;
            const sounding = i === this.chord;
            (this.hits[i] ?? []).forEach((hit, k) => {
                const red = sounding && (!progression.comp || k === this.hit);
                const h1 = hit.at ? xOf(at + hit.at) + GAP / 2 : x1;
                const h2 = hit.at + hit.beats < chord.beats - 1e-6 ? xOf(at + hit.at + hit.beats) - GAP / 2 : x2;
                for (const midi of hit.notes) bar(h1, h2, midi, red ? COLORS.red : COLORS.yellow);
            });
            const cx = (x1 + x2) / 2;
            ctx.fillStyle = COLORS.ink;
            if (chord.symbol && this.voicings[i]?.notes.length) ctx.fillText(chord.symbol, cx, INSET + LINE / 2 + (stagger && i % 2 ? LINE : 0));
            let y = bottom + GRID + LINE / 2;
            if (hasRoman) {
                ctx.fillText(chord.roman ?? '', cx, y + (romanStagger && i % 2 ? LINE : 0));
                y += romanLines * LINE;
            }
            if (hasFn) ctx.fillText(chord.fn ?? '', cx, y);
            this._columns.push({ x: x1, w: x2 - x1, index: i });
            at += chord.beats;
        });

        at = 0;
        melody.forEach((note, i) => {
            // A note's sounding length (`gate`) sets the bar's length, and its loudness
            // (`velocity`) the bar's thickness.
            if (note.midi !== null) {
                const height = Math.max(2, barH * (0.4 + 0.6 * (note.velocity ?? 0.8)) / 0.88);
                bar(xOf(at) + GAP / 2, xOf(at + note.beats * (note.gate ?? 1)) - GAP / 2, note.midi,
                    i === this.note ? COLORS.red : COLORS.pink, height);
            }
            at += note.beats;
        });
    }
}
