import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const INSET = 32;       // the demos' plot inset
const TRAIL = 40;       // points kept in the trail
const DOT = 16;         // size of the pointer's dot

/**
 * A surface to play by dragging: a white well on the paper where the pointer's
 * position is reported as x and y from 0 to 1 (y = 0 at the bottom) through
 * `onStart(x, y)`, `onMove(x, y)`, and `onEnd()`. While dragging, the pointer shows as a
 * red dot trailed by fading yellow dots, so the gesture stays visible. With `marks`
 * (positions from 0 to 1 along x), short ticks along the bottom edge show where
 * snapped notes fall.
 */
export class XYPad {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas, { onStart = () => {}, onMove = () => {}, onEnd = () => {} } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        Object.assign(this, { onStart, onMove, onEnd });
        this.marks = [];
        this.trail = [];
        this.down = false;
        canvas.style.touchAction = 'none';
        this.viewport.onResize(() => this._resize());
        this._wirePointer();
        this._resize();
        const frame = () => { this._fade(); this.draw(); requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
    }

    setMarks(marks) { this.marks = marks ?? []; }

    _area() {
        const w = this.viewport.width, h = this.viewport.height;
        return { x: INSET, y: INSET, w: w - 2 * INSET, h: h - 2 * INSET };
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
    }

    _position(e) {
        const rect = this.canvas.getBoundingClientRect();
        const a = this._area();
        const clamp = v => Math.max(0, Math.min(1, v));
        return { x: clamp((e.clientX - rect.left - a.x) / a.w), y: clamp(1 - (e.clientY - rect.top - a.y) / a.h) };
    }

    _wirePointer() {
        this.canvas.addEventListener('pointerdown', e => {
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            this.down = true;
            const p = this._position(e);
            this.trail.push({ ...p, life: 1 });
            this.onStart(p.x, p.y);
        });
        this.canvas.addEventListener('pointermove', e => {
            if (!this.down) return;
            const p = this._position(e);
            this.trail.push({ ...p, life: 1 });
            if (this.trail.length > TRAIL) this.trail.shift();
            this.onMove(p.x, p.y);
        });
        const end = () => { if (this.down) { this.down = false; this.onEnd(); } };
        this.canvas.addEventListener('pointerup', end);
        this.canvas.addEventListener('pointercancel', end);
    }

    _fade() {
        for (const p of this.trail) p.life -= this.down ? 0.01 : 0.04;
        this.trail = this.trail.filter(p => p.life > 0);
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
        ctx.fillStyle = COLORS.butter;
        for (const m of this.marks) ctx.fillRect(a.x + m * a.w - 1, a.y + a.h - 8, 2, 8);
        this.trail.forEach((p, i) => {
            const last = i === this.trail.length - 1 && this.down;
            ctx.globalAlpha = last ? 1 : Math.max(0, p.life);
            ctx.fillStyle = last ? COLORS.red : COLORS.yellow;
            const size = last ? DOT : DOT * 0.6;
            ctx.beginPath();
            ctx.arc(a.x + p.x * a.w, a.y + (1 - p.y) * a.h, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}
