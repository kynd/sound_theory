import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const INSET = 32;          // the demos' plot inset
const COLUMNS = 240;       // resolution of the drawn line along x

/**
 * A surface to draw a line on, read back as a height (0–1, 0 at the bottom) at each
 * position from left to right: `sample(x)` gives the height at x, or null where
 * nothing is drawn. Drawing over a part replaces it; `clear()` erases everything.
 * The line is pink on a white well, and `setPlayhead(x)` (or -1 for none) marks the
 * position being played with a red dot on the line, or a small butter dot at the
 * bottom where it is silent.
 */
export class DrawPad {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { onDraw = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.onDraw = onDraw;
        this.heights = new Array(COLUMNS).fill(null);
        this.playhead = -1;
        canvas.style.touchAction = 'none';
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
    }

    /** The drawn height at x (0–1), or null. */
    sample(x) {
        return this.heights[Math.min(COLUMNS - 1, Math.max(0, Math.floor(x * COLUMNS)))];
    }

    /** Replaces the drawing with heights from `fn(x)` (null for gaps). */
    fill(fn) {
        this.heights = this.heights.map((_, i) => fn((i + 0.5) / COLUMNS));
        this.draw();
    }

    clear() { this.heights.fill(null); this.draw(); }

    setPlayhead(x) { this.playhead = x; this.draw(); }

    _area() {
        return { x: INSET, y: INSET, w: this.viewport.width - 2 * INSET, h: this.viewport.height - 2 * INSET };
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    _point(e) {
        const rect = this.canvas.getBoundingClientRect();
        const a = this._area();
        const clamp = v => Math.max(0, Math.min(1, v));
        return { x: clamp((e.clientX - rect.left - a.x) / a.w), y: clamp(1 - (e.clientY - rect.top - a.y) / a.h) };
    }

    _wirePointer() {
        let last = null;
        this.canvas.addEventListener('pointerdown', e => {
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            last = this._point(e);
            this._paint(last, last);
        });
        this.canvas.addEventListener('pointermove', e => {
            if (!last) return;
            const p = this._point(e);
            this._paint(last, p);
            last = p;
        });
        const end = () => { if (last) { last = null; this.onDraw(); } };
        this.canvas.addEventListener('pointerup', end);
        this.canvas.addEventListener('pointercancel', end);
    }

    /** Sets every column between two points to the height along the line joining them. */
    _paint(a, b) {
        const i0 = Math.floor(a.x * (COLUMNS - 1)), i1 = Math.floor(b.x * (COLUMNS - 1));
        const step = i1 >= i0 ? 1 : -1;
        for (let i = i0; ; i += step) {
            const t = i1 === i0 ? 1 : (i - i0) / (i1 - i0);
            this.heights[i] = a.y + (b.y - a.y) * t;
            if (i === i1) break;
        }
        this.draw();
    }

    draw() {
        const { ctx, viewport } = this;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, viewport.width, viewport.height);
        const a = this._area();
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.roundRect(a.x, a.y, a.w, a.h, 8);
        ctx.fill();
        const px = i => a.x + ((i + 0.5) / COLUMNS) * a.w, py = y => a.y + (1 - y) * a.h;
        ctx.strokeStyle = COLORS.pink;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        this.heights.forEach((y, i) => {
            if (y === null) return;
            const prev = i > 0 ? this.heights[i - 1] : null;
            if (prev === null) ctx.moveTo(px(i), py(y)); else ctx.lineTo(px(i), py(y));
        });
        ctx.stroke();
        if (this.playhead >= 0) {
            const x = a.x + this.playhead * a.w, y = this.sample(this.playhead);
            if (y === null) {
                ctx.fillStyle = COLORS.butter;
                ctx.beginPath();
                ctx.arc(x, a.y + a.h - 8, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = COLORS.red;
                ctx.beginPath();
                ctx.arc(x, py(y), 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
