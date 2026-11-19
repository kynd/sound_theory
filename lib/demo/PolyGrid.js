import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;           // the demos' base grid
const ROW = 2 * GRID;      // one note per row
const GAP = 4;             // background showing between cells, as in StepGrid
const PART_GAP = 2 * GRID; // between parts
const FONT = "13px 'Google Sans Code', ui-monospace, monospace";

/**
 * Parts of notes stacked one above another, each dividing the same width into its own
 * number of columns, so that columns of parts with different counts line up in time
 * (a polyrhythm of melodies; see `notePartsPattern` in rhythm.js). A part is
 * `{ rows: [{ label }], cells }`, `cells[row][col]` on (1) or off (0), rows listed top
 * to bottom and labeled on the left, in a column as wide as the longest label, rounded
 * up to the grid. Cells are white wells and notes fill them yellow; the sounding column
 * of every part shows its wells in butter and its notes in red.
 *
 * Pressing a cell toggles it, and dragging on carries the change across the cells the
 * pointer passes in the same part. Each change is reported to `onEdit(part, row, col,
 * value)`.
 *
 * The canvas sits in a `.canvas-wrap.dp-strip`; the grid sets the strip's height to
 * fit its rows.
 */
export class PolyGrid {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas, { onEdit = () => {} } = {}) {
        this.canvas = canvas;
        this.onEdit = onEdit;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.parts = [];
        this.phase = -1;
        this._cells = [];
        this._drag = null;
        this.viewport.onResize(() => this._resize());
        canvas.style.touchAction = 'none';
        canvas.addEventListener('pointerdown', e => this._press(e));
        canvas.addEventListener('pointermove', e => this._move(e));
        canvas.addEventListener('pointerup', () => { this._drag = null; });
        canvas.addEventListener('pointercancel', () => { this._drag = null; });
        this._resize();
        // Labels are measured to size their column; measure again once the font is in.
        document.fonts?.ready.then(() => this.draw());
    }

    /** Shows `parts` and sizes the strip to their rows. */
    update(parts) {
        this.parts = parts;
        const rows = parts.reduce((n, part) => n + part.rows.length, 0);
        this.viewport.wrap.style.height = `${rows * ROW + Math.max(0, parts.length - 1) * PART_GAP}px`;
        this.draw();
    }

    /** Marks where the cycle is, 0 to 1, or nowhere with -1. */
    setPhase(phase) {
        this.phase = phase;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    _cellAt(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        return this._cells.find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    }

    _set(cell, value) {
        const row = this.parts[cell.part].cells[cell.row];
        if (row[cell.col] === value) return;
        row[cell.col] = value;
        this.onEdit(cell.part, cell.row, cell.col, value);
        this.draw();
    }

    _press(e) {
        const cell = this._cellAt(e);
        if (!cell) return;
        e.preventDefault();
        this.canvas.setPointerCapture(e.pointerId);
        const value = this.parts[cell.part].cells[cell.row][cell.col] ? 0 : 1;
        this._drag = { part: cell.part, value };
        this._set(cell, value);
    }

    _move(e) {
        if (!this._drag) return;
        const cell = this._cellAt(e);
        if (cell && cell.part === this._drag.part) this._set(cell, this._drag.value);
    }

    draw() {
        const { ctx, viewport, parts } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        this._cells = [];
        if (!parts.length) return;

        ctx.font = FONT;
        ctx.textBaseline = 'middle';
        const labels = parts.flatMap(part => part.rows.map(r => r.label));
        const labelW = Math.ceil(Math.max(...labels.map(l => ctx.measureText(l).width)) / GRID) * GRID;
        const left = labelW + GRID, width = w - left + GAP;
        let y = 0;
        parts.forEach((part, p) => {
            const cols = part.cells[0].length;
            const pitch = width / cols, cellW = pitch - GAP;
            const sounding = this.phase < 0 ? -1 : Math.floor(this.phase * cols);
            part.rows.forEach((row, r) => {
                const cellH = ROW - GAP;
                ctx.fillStyle = COLORS.ink;
                ctx.textAlign = 'left';
                ctx.fillText(row.label, 0, y + cellH / 2);
                for (let c = 0; c < cols; c++) {
                    const x = left + c * pitch, on = part.cells[r][c] > 0;
                    ctx.fillStyle = on ? (c === sounding ? COLORS.red : COLORS.yellow) : (c === sounding ? COLORS.butter : COLORS.white);
                    ctx.beginPath();
                    ctx.roundRect(x, y, cellW, cellH, 4);
                    ctx.fill();
                    this._cells.push({ x, y, w: cellW, h: cellH, part: p, row: r, col: c });
                }
                y += ROW;
            });
            y += PART_GAP;
        });
    }
}
