import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { FULL } from '../audio/rhythm.js';
import { formatValue } from './controls.js';

const GRID = 16;           // the demos' base grid
const ROW = 2 * GRID;      // one track per row
const LABEL = 5 * GRID;    // label column, like the panel's labels
const GAP = 4;             // background showing between cells, like the keys' gaps
const GROUP_GAP = 12;      // between beat groups
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";
const DRAG_RATE = 0.00025; // seconds a hit moves per pixel dragged sideways
const VOLUME_RATE = 0.01;  // velocity a hit gains per pixel dragged up
const MIN_VELOCITY = 0.05; // the softest a hit can be dragged down to
const DRAG_START = 4;      // pixels a press moves before it becomes a drag

/**
 * A rhythm pattern (see rhythm.js) as an editable grid, one row per track (labeled on
 * the left) and one cell per step, with extra space between beat groups. Cells are
 * white wells; a hit fills its cell yellow from the bottom, as high as its velocity.
 * The column that is sounding shows its wells in butter and its hits in red. Clicking
 * a cell turns it on (a full hit) or off, and dragging a hit up or down makes it
 * louder or softer (a hundredth of a full hit per pixel), with its velocity shown on
 * its cell as a percentage while dragging; each change is reported to `onEdit`. A
 * track moved off the grid (`offset`) has its hits drawn moved by the same share of a
 * step, and so does a hit with its own `offsets` entry.
 *
 * With `shift` (seconds), a hit can also be dragged left or right to move it off the
 * grid, by up to `shift` either way. The hit moves far less than the pointer (a
 * quarter of a millisecond per pixel, drawn at the step's scale), and its offset is
 * shown on its cell while dragging. A drag goes the way it starts, sideways or up and
 * down. The grid leaves room on the right for the last hit moved as late as it can go.
 *
 * With `count`, a row above the tracks counts the beats: one well per beat group,
 * as wide as the group, numbered from 1 and starting again each bar
 * (`pattern.beatsPerBar`, or every group being one bar's beats). The sounding beat is
 * red with white text.
 *
 * The canvas sits in a `.canvas-wrap.dp-strip`; the grid sets the strip's height to
 * fit its rows.
 */
export class StepGrid {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object}   [opts]
     * @param {Function} [opts.onEdit]  called with (trackIndex, step, velocity).
     * @param {boolean}  [opts.count]   show the beat count above the tracks.
     * @param {number}   [opts.shift]   let hits be dragged off the grid, up to this
     *                                  many seconds either way.
     */
    constructor(canvas, { onEdit = () => {}, count = false, shift = 0 } = {}) {
        this.canvas = canvas;
        this.count = count;
        this.shift = shift;
        this._drag = null;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onEdit = onEdit;
        this.pattern = null;
        this.stepDuration = 1;
        this.step = -1;
        this._cells = [];
        this.viewport.onResize(() => this._resize());
        // Dragging on the grid edits it instead of scrolling the page.
        canvas.style.touchAction = 'none';
        canvas.addEventListener('pointerdown', e => this._press(e));
        canvas.addEventListener('pointermove', e => this._move(e));
        canvas.addEventListener('pointerup', () => this._release());
        canvas.addEventListener('pointercancel', () => { this._drag = null; this.draw(); });
        this._resize();
    }

    /** Redraws for a pattern; `stepDuration` (seconds) converts track offsets to steps. */
    update(pattern, stepDuration = this.stepDuration) {
        this.pattern = pattern;
        this.stepDuration = stepDuration;
        this.viewport.wrap.style.height = `${this._top() + pattern.tracks.length * ROW}px`;
        this.draw();
    }

    /** Height of the count row and the space below it, or 0 without a count. */
    _top() {
        return this.count ? ROW + GRID : 0;
    }

    /** Marks step `i` as sounding, or none with -1. */
    setStep(i) {
        this.step = i;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    _press(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const cell = this._cells.find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
        if (!cell) return;
        e.preventDefault();
        // Wait to see whether the press becomes a drag (only a hit can be dragged).
        const track = this.pattern.tracks[cell.track];
        this.canvas.setPointerCapture(e.pointerId);
        this._drag = {
            cell, x: e.clientX, y: e.clientY, axis: null,
            offset: track.offsets?.[cell.step] ?? 0,
            velocity: track.steps[cell.step],
        };
    }

    _move(e) {
        const drag = this._drag;
        if (!drag || drag.velocity <= 0) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.axis) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_START) return;
            // Sideways only moves hits in time when the grid allows it.
            drag.axis = Math.abs(dx) > Math.abs(dy) ? (this.shift ? 'time' : 'none') : 'volume';
        }
        const { track: t, step } = drag.cell;
        const track = this.pattern.tracks[t];
        if (drag.axis === 'time') {
            track.offsets ??= track.steps.map(() => 0);
            const offset = Math.round((drag.offset + dx * DRAG_RATE) * 1000) / 1000;
            track.offsets[step] = Math.max(-this.shift, Math.min(this.shift, offset));
        } else if (drag.axis === 'volume') {
            const velocity = Math.round((drag.velocity - dy * VOLUME_RATE) * 100) / 100;
            track.steps[step] = Math.max(MIN_VELOCITY, Math.min(FULL, velocity));
            this.onEdit(t, step, track.steps[step]);
        }
        this.draw();
    }

    _release() {
        const drag = this._drag;
        if (!drag) return;
        this._drag = null;
        if (drag.axis) this.draw();
        else this._toggle(drag.cell);
    }

    /** Turns a cell on as a full hit, or off. */
    _toggle(cell) {
        const track = this.pattern.tracks[cell.track];
        const velocity = track.steps[cell.step] > 0 ? 0 : FULL;
        track.steps[cell.step] = velocity;
        this.onEdit(cell.track, cell.step, velocity);
        this.draw();
    }

    draw() {
        const { ctx, viewport, pattern } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        this._cells = [];
        if (!pattern) return;

        // Step positions: equal cells, with wider gaps where a beat group starts.
        const steps = pattern.tracks[0].steps.length;
        const starts = new Set();
        pattern.groups.reduce((at, size) => { starts.add(at); return at + size; }, 0);
        const left = LABEL + GRID;
        const gaps = (steps - 1) * GAP + (pattern.groups.length - 1) * (GROUP_GAP - GAP);
        // Room on the right for the last hit moved late: `late` steps at most.
        const late = (this.shift + Math.max(0, ...pattern.tracks.map(t => t.offset ?? 0))) / this.stepDuration;
        const cellW = (w - left - gaps - late * GAP) / (steps + late);
        const xs = [];
        for (let i = 0, x = left; i < steps; i++) {
            if (i > 0) x += cellW + (starts.has(i) ? GROUP_GAP : GAP);
            xs.push(x);
        }
        const pitch = cellW + GAP;   // one step's width, for offsets

        ctx.font = FONT;
        ctx.textBaseline = 'middle';
        const top = this._top();
        if (this.count) {
            // One well per beat; the beat that holds the sounding step is red.
            const perBar = pattern.beatsPerBar ?? pattern.groups.length;
            let first = 0;
            pattern.groups.forEach((size, b) => {
                const x1 = xs[first], x2 = xs[first + size - 1] + cellW;
                const sounding = this.step >= first && this.step < first + size;
                ctx.fillStyle = sounding ? COLORS.red : COLORS.white;
                ctx.beginPath();
                ctx.roundRect(x1, 0, x2 - x1, ROW - GAP, 4);
                ctx.fill();
                ctx.fillStyle = sounding ? COLORS.white : COLORS.ink;
                ctx.textAlign = 'center';
                ctx.fillText(String(b % perBar + 1), (x1 + x2) / 2, (ROW - GAP) / 2);
                first += size;
            });
        }
        pattern.tracks.forEach((track, t) => {
            const y = top + t * ROW, cellH = ROW - GAP;
            ctx.fillStyle = COLORS.ink;
            ctx.textAlign = 'left';
            ctx.fillText(track.label, 0, y + cellH / 2);

            track.steps.forEach((velocity, i) => {
                const offset = (track.offset ?? 0) + (track.offsets?.[i] ?? 0);
                const shift = (offset / this.stepDuration) * pitch;
                const x = xs[i], sounding = i === this.step;
                ctx.fillStyle = sounding ? COLORS.butter : COLORS.white;
                ctx.beginPath();
                ctx.roundRect(x, y, cellW, cellH, 4);
                ctx.fill();
                this._cells.push({ x, y, w: cellW, h: cellH, track: t, step: i });
                if (velocity <= 0) return;
                const v = Math.min(1, velocity * (track.gain ?? 1));
                const fillH = cellH * v;
                ctx.fillStyle = sounding ? COLORS.red : COLORS.yellow;
                ctx.beginPath();
                ctx.roundRect(x + shift, y + cellH - fillH, cellW, fillH, 4);
                ctx.fill();
                // The dragged hit's offset or velocity, on its cell; white where the red
                // fill reaches the text.
                const drag = this._drag;
                if ((drag?.axis === 'time' || drag?.axis === 'volume') && drag.cell.track === t && drag.cell.step === i) {
                    const text = drag.axis === 'time' ? formatValue(track.offsets[i], 's') : `${Math.round(velocity * 100)}%`;
                    ctx.fillStyle = sounding && fillH > cellH / 2 ? COLORS.white : COLORS.ink;
                    ctx.textAlign = 'center';
                    ctx.fillText(text, x + shift + cellW / 2, y + cellH / 2);
                }
            });
        });
    }
}
