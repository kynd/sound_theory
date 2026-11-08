import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const INSET = 32;       // the demos' plot inset
const TRAIL = 120;      // points kept in the trail
const DOT = 16;         // size of the pointer's dot
const LINE = 8;         // width of the trail where it meets the dot

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
/** `a` mixed toward `b` by `t` (0–1), as an opaque CSS color. */
const mix = (a, b, t) => {
    const [p, q] = [rgb(a), rgb(b)];
    return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(',')})`;
};

/**
 * A surface to play by dragging: a white well on the paper where the pointer's
 * position is reported as x and y from 0 to 1 (y = 0 at the bottom) through
 * `onStart(x, y)`, `onMove(x, y)`, and `onEnd()`. While dragging, the pointer shows as a
 * red dot trailing a yellow line, a smooth curve through the recent positions that
 * thins and fades toward its tail, so the gesture stays visible. With `marks`
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
        this._drawTrail(a);
        const head = this.trail[this.trail.length - 1];
        if (this.down && head) {
            ctx.fillStyle = COLORS.red;
            ctx.beginPath();
            ctx.arc(a.x + head.x * a.w, a.y + (1 - head.y) * a.h, DOT / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * The trail as quadratic curves through the midpoints between positions (each
     * position is a control point), one piece per position so that each can take its own
     * fade and width. The fade mixes yellow into the well's white rather than using
     * transparency, so the round ends where pieces overlap don't show as beads.
     */
    _drawTrail(a) {
        const { ctx, trail } = this;
        const pts = trail.map(p => ({ x: a.x + p.x * a.w, y: a.y + (1 - p.y) * a.h, life: p.life }));
        const n = pts.length;
        if (n < 2) return;
        const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < n - 1; i++) {
            const from = i === 0 ? pts[0] : mid(pts[i - 1], pts[i]);
            const to = i === n - 2 ? pts[n - 1] : mid(pts[i], pts[i + 1]);
            const life = Math.max(0, Math.min(pts[i].life, pts[i + 1].life));
            const along = (i + 1) / (n - 1);    // 0 at the tail, 1 at the head
            ctx.strokeStyle = mix(COLORS.white, COLORS.yellow, life);
            ctx.lineWidth = LINE * (0.25 + 0.75 * along);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            if (i === 0) ctx.lineTo(to.x, to.y);
            else ctx.quadraticCurveTo(pts[i].x, pts[i].y, to.x, to.y);
            ctx.stroke();
        }
    }
}
