import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';
import { FULL, SOFT } from '../audio/rhythm.js';

const GRID = 16;           // the demos' base grid
const ROW = 2 * GRID;      // one track per row
const LABEL = 5 * GRID;    // label column, like the panel's labels
const GAP = 4;             // background showing between cells, like the keys' gaps
const GROUP_GAP = 12;      // between beat groups
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";

/** A click cycles a cell through rest, full hit, soft hit. */
const NEXT = new Map([[0, FULL], [FULL, SOFT], [SOFT, 0]]);

/**
 * A rhythm pattern (see rhythm.js) as an editable grid, one row per track (labeled on
 * the left) and one cell per step, with extra space between beat groups. Cells are
 * white wells; a hit fills its cell yellow from the bottom, as high as its velocity.
 * The column that is sounding shows its wells in butter and its hits in red. Clicking
 * a cell cycles it through rest, full, and soft, and reports it to `onEdit`. A track
 * moved off the grid (`offset`) has its hits drawn moved by the same share of a step.
 *
 * The canvas sits in a `.canvas-wrap.dp-strip`; the grid sets the strip's height to
 * fit its rows.
 */
export class StepGrid {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object}   [opts]
     * @param {Function} [opts.onEdit]  called with (trackIndex, step, velocity).
     */
    constructor(canvas, { onEdit = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onEdit = onEdit;
        this.pattern = null;
        this.stepDuration = 1;
        this.step = -1;
        this._cells = [];
        this.viewport.onResize(() => this._resize());
        canvas.addEventListener('pointerdown', e => this._press(e));
        this._resize();
    }

    /** Redraws for a pattern; `stepDuration` (seconds) converts track offsets to steps. */
    update(pattern, stepDuration = this.stepDuration) {
        this.pattern = pattern;
        this.stepDuration = stepDuration;
        this.viewport.wrap.style.height = `${pattern.tracks.length * ROW}px`;
        this.draw();
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
        const track = this.pattern.tracks[cell.track];
        const velocity = NEXT.get(track.steps[cell.step]) ?? FULL;
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
        const cellW = (w - left - gaps) / steps;
        const xs = [];
        for (let i = 0, x = left; i < steps; i++) {
            if (i > 0) x += cellW + (starts.has(i) ? GROUP_GAP : GAP);
            xs.push(x);
        }
        const pitch = cellW + GAP;   // one step's width, for offsets

        ctx.font = FONT;
        ctx.textBaseline = 'middle';
        pattern.tracks.forEach((track, t) => {
            const y = t * ROW, cellH = ROW - GAP;
            ctx.fillStyle = COLORS.ink;
            ctx.textAlign = 'left';
            ctx.fillText(track.label, 0, y + cellH / 2);

            const shift = ((track.offset ?? 0) / this.stepDuration) * pitch;
            track.steps.forEach((velocity, i) => {
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
            });
        });
    }
}
