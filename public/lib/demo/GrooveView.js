import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { compHits, riffNotes } from '../audio/chords.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const LINE = GRID;         // one line of text
const ROW = 2 * GRID;      // one part per row, at most
const TICK = 4;            // width of a stroke
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const BASS_SOUNDS = ['synth-bass', 'sub-808', 'bass', 'contrabass'];

/**
 * A progression's groove, for comparing styles by their timing: one row per part, time
 * running left to right across the whole progression, and every stroke a short
 * vertical bar where it starts, regardless of its pitch or how many notes it has. The
 * chords are the top row (yellow), the bass below it (dark green), then the drum
 * pattern (`drums`, see rhythm.js), one row per drum it uses, repeated through the
 * progression (butter, pale enough that a sounding red stroke stands out). A bar's height follows its loudness, for the drums. Rows are labeled on the
 * left, in a column as wide as the longest label, rounded up to the grid; the chord
 * symbols sit on a line above, and bar lines (every four beats) are thin and pale.
 *
 * Rows are 32 px tall (less only when the stage is too short), so the drawing needs
 * 96 px plus 32 px per row; a page sizes the demo's frame to that, so nothing is left
 * empty between the rows and the keyboard below.
 *
 * The bass row is the riff (`riffNotes`), or the melody when it is played on a bass
 * sound (a tumbao, an 808), or else each chord's bass note where the chord starts.
 *
 * Strokes turn red while they sound. The view follows `position()`, a function giving
 * the playing position in beats from the start of the progression (null when stopped),
 * and redraws every frame while it plays; the player's callbacks (`setChord`, `setHit`,
 * `setNote`, `setBass`) only start that. Same `update(progression, voicings)` as
 * ProgressionView, so a demo can use either.
 */
export class GrooveView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object}   [opts]
     * @param {Function} [opts.position]  the playing position in beats, or null.
     */
    constructor(canvas, { position = () => null } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.position = position;
        this.progression = null;
        this.rows = [];
        this.length = 0;
        this._running = false;
        this.viewport.onResize(() => this._resize());
        this._resize();
        document.fonts?.ready.then(() => this.draw());
    }

    /** Redraws for a progression and its voicings (from `voiceProgression`). */
    update(progression, voicings) {
        this.progression = progression;
        const { chords, melody = [], drums, sounds = {} } = progression;
        const starts = [];
        let at = 0;
        for (const chord of chords) { starts.push(at); at += chord.beats; }
        this.length = Math.max(at, melody.reduce((s, n) => s + n.beats, 0));
        this.starts = starts;

        // Chords: every hit of the comp (or the chord where it starts), as one stroke.
        const hits = compHits(progression, voicings);
        const chordRow = { label: 'Chords', color: COLORS.yellow, events: [] };
        hits.forEach((list, i) => list.forEach(hit => {
            if (hit.part !== 'bass') chordRow.events.push({ at: starts[i] + hit.at, beats: hit.beats, velocity: 1 });
        }));

        // Bass: the riff, a melody on a bass sound, or the bass note of each chord.
        const bassRow = { label: 'Bass', color: COLORS.darkGreen, events: [] };
        const riff = riffNotes(progression, voicings);
        if (riff.length) {
            bassRow.events = riff.map(n => ({ at: n.at, beats: n.beats, velocity: 1 }));
        } else if (melody.length && BASS_SOUNDS.includes(sounds.melody)) {
            let t = 0;
            for (const note of melody) {
                if (note.midi !== null) bassRow.events.push({ at: t + (note.offset ?? 0), beats: note.beats, velocity: 1 });
                t += note.beats;
            }
        } else if (sounds.bass) {
            chords.forEach((chord, i) => {
                if (voicings[i]?.notes.length && !chord.tied) bassRow.events.push({ at: starts[i], beats: chord.beats, velocity: 1 });
            });
        }

        // Drums: each track's pattern repeated through the progression.
        const drumRows = [];
        if (drums) {
            const step = 1 / drums.stepsPerBeat;
            for (const track of drums.tracks) {
                const row = { label: track.label, color: COLORS.butter, events: [] };
                const cycle = track.steps.length * step;
                for (let start = 0; start < this.length - 1e-6; start += cycle) {
                    track.steps.forEach((velocity, k) => {
                        if (velocity > 0) row.events.push({ at: start + k * step, beats: step, velocity: Math.min(1, velocity * (track.gain ?? 1)) });
                    });
                }
                // A drum the pattern does not use gets no row.
                if (row.events.length) drumRows.push(row);
            }
        }
        this.rows = [chordRow, ...(bassRow.events.length ? [bassRow] : []), ...drumRows];
        this.draw();
    }

    // The player's callbacks: any of them means it is playing, so follow it.
    setChord() { this._run(); }
    setNote() { this._run(); }
    setHit() { this._run(); }
    setBass() { this._run(); }

    /** Redraws every frame while the position is known, then once more when it stops. */
    _run() {
        if (this._running) return;
        this._running = true;
        const frame = () => {
            this.draw();
            if (this.position() === null) { this._running = false; return; }
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport, progression, rows } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!progression || !this.length) return;

        ctx.font = FONT;
        ctx.textBaseline = 'middle';
        // The label column, as wide as the longest label, rounded up to the grid.
        const labelW = Math.ceil(Math.max(...rows.map(r => ctx.measureText(r.label).width)) / GRID) * GRID;
        const x0 = INSET + labelW + GRID, x1 = w - INSET;
        const xOf = beat => x0 + (beat / this.length) * (x1 - x0);
        const top = INSET + LINE + GRID;
        const rowH = Math.max(GRID, Math.min(ROW, Math.floor((h - top - INSET) / Math.max(1, rows.length))));
        const bottom = top + rows.length * rowH;

        // Bar lines, thin, pale, and see-through, every four beats, ends included.
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.ink;
        for (let b = 0; b <= this.length + 1e-6; b += 4) ctx.fillRect(Math.round(xOf(b)) - 0.5, top, 1, bottom - top);
        ctx.restore();

        // Chord symbols over the chords they name.
        ctx.fillStyle = COLORS.ink;
        ctx.textAlign = 'center';
        progression.chords.forEach((chord, i) => {
            if (!chord.symbol || chord.tied) return;
            const a = this.starts[i], b = a + chord.beats;
            ctx.fillText(chord.symbol, (xOf(a) + xOf(b)) / 2, INSET + LINE / 2);
        });

        const position = this.position();
        rows.forEach((row, r) => {
            const y = top + r * rowH;
            ctx.fillStyle = COLORS.ink;
            ctx.textAlign = 'left';
            ctx.fillText(row.label, INSET, y + rowH / 2);
            for (const event of row.events) {
                // A stroke is red from where it starts for as long as it sounds, at most
                // half a beat, so quick ones still show.
                const lit = position !== null && position >= event.at && position < event.at + Math.max(0.15, Math.min(event.beats, 0.5));
                const height = (rowH - 8) * (0.4 + 0.6 * event.velocity);
                ctx.fillStyle = lit ? COLORS.red : row.color;
                ctx.beginPath();
                ctx.roundRect(xOf(event.at) - TICK / 2, y + (rowH - height) / 2, TICK, height, TICK / 2);
                ctx.fill();
            }
        });
    }
}
