import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const INSET = 32;   // px from the edges, on the 16px grid
const GAP = 1;      // px between cells, so the cells read as a grid without lines

/**
 * A grid to paint on (`grid[col][row]`, row 0 at the bottom): pressing an empty cell
 * and dragging paints, pressing a painted cell and dragging erases. Painted cells are
 * yellow on white wells; the cells of the sounding column turn red. `onChange()` is
 * called after each stroke.
 */
export class PaintGrid {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, grid, { onChange = () => {} } = {}) {
        this.canvas = canvas;
        this.grid = grid;
        this.onChange = onChange;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.column = -1;
        this._paint = null;
        this.viewport.onResize(() => this._resize());
        canvas.addEventListener('pointerdown', e => this._down(e));
        canvas.addEventListener('pointermove', e => this._move(e));
        canvas.addEventListener('pointerup', () => this._up());
        canvas.addEventListener('pointercancel', () => this._up());
        canvas.style.touchAction = 'none';
        this._resize();
    }

    /** Marks column `i` as sounding, or none with -1. */
    setColumn(i) {
        this.column = i;
        this.draw();
    }

    _cell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const cols = this.grid.length, rows = this.grid[0].length;
        const w = rect.width - 2 * INSET, h = rect.height - 2 * INSET;
        const col = Math.floor((e.clientX - rect.left - INSET) / w * cols);
        const row = rows - 1 - Math.floor((e.clientY - rect.top - INSET) / h * rows);
        if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
        return [col, row];
    }

    _down(e) {
        const cell = this._cell(e);
        if (!cell) return;
        this.canvas.setPointerCapture(e.pointerId);
        this._paint = this.grid[cell[0]][cell[1]] ? 0 : 1;
        this._set(cell);
    }

    _move(e) {
        if (this._paint === null) return;
        const cell = this._cell(e);
        if (cell) this._set(cell);
    }

    _up() {
        if (this._paint === null) return;
        this._paint = null;
        this.onChange();
    }

    _set([col, row]) {
        this.grid[col][row] = this._paint;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport, grid } = this;
        const w = viewport.width, h = viewport.height, pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const cols = grid.length, rows = grid[0].length;
        const cw = (w - 2 * INSET) / cols, ch = (h - 2 * INSET) / rows;
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const on = grid[col][row] > 0;
                ctx.fillStyle = on ? (col === this.column ? COLORS.red : COLORS.yellow) : COLORS.white;
                ctx.fillRect(INSET + col * cw, INSET + (rows - 1 - row) * ch, cw - GAP, ch - GAP);
            }
        }
    }
}
