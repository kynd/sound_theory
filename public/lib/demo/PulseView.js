import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;           // the demos' base grid
const INSET = 2 * GRID;    // space around the drawing
const TRACK = 16;          // thickness of the white track
const DOT = 14;            // radius of a full hit
const SPACING = 4 * GRID;  // distance between beats

/**
 * Draws a pulse as a line of beats scrolling from right to left along a white track,
 * one beat every SPACING pixels. Each beat sounds as it reaches the middle and turns red
 * for the first half of its beat; then it moves on and leaves at the left. The faster
 * the tempo, the faster the beats move. A beat is a yellow dot whose size follows its
 * velocity.
 *
 * Driven by the audio clock rather than by when callbacks happen to run: `addBeat` takes
 * each beat's scheduled time, and the drawing places the middle exactly at the beat
 * being heard, moving between scheduled beats at the speed they were scheduled at.
 */
export class PulseView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object}   opts
     * @param {Function} opts.now  the audio clock, in seconds (`audioNow`).
     */
    constructor(canvas, { now }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.now = now;
        this.stepDuration = 0.5;
        this.velocity = 1;
        this._clear();
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /**
     * Sets the seconds per beat, used for beats not scheduled yet, and the velocity of
     * the beats shown at rest.
     */
    update(stepDuration, velocity = this.velocity) {
        this.stepDuration = stepDuration;
        this.velocity = velocity;
        if (!this._frame) this.draw();
    }

    /** A beat scheduled to sound at `time` on the audio clock, in order. */
    addBeat(time, velocity) {
        this._times.push(time);
        this._velocities.push(velocity);
        if (!this._frame) this._frame = requestAnimationFrame(() => this._tick());
    }

    /** Forgets the beats and returns to rest, the first beat waiting in the middle. */
    stop() {
        cancelAnimationFrame(this._frame);
        this._clear();
        this.draw();
    }

    _clear() {
        this._frame = 0;
        this._first = 0;        // index of _times[0] among all beats
        this._times = [];
        this._velocities = [];
    }

    _tick() {
        this._frame = requestAnimationFrame(() => this._tick());
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    /** How many beats have gone by the middle, counting fractions; 0 at rest. */
    _position() {
        const times = this._times;
        if (!times.length) return 0;
        const now = this.now();
        // Beats no longer needed: every beat before the one now passing.
        while (times.length > 2 && times[1] <= now) {
            times.shift();
            this._velocities.shift();
            this._first++;
        }
        if (now < times[0]) return this._first - (times[0] - now) / this.stepDuration;
        if (times.length === 1) return this._first + (now - times[0]) / this.stepDuration;
        if (now < times[1]) return this._first + (now - times[0]) / (times[1] - times[0]);
        return this._first + 1 + (now - times[1]) / this.stepDuration;
    }

    _velocity(j) {
        const k = j - this._first;
        return k >= 0 && k < this._velocities.length ? this._velocities[k]
            : this._velocities.at(-1) ?? this.velocity;
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const left = INSET, right = w - INSET;
        const cx = w / 2, cy = h / 2;
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(left, cy - TRACK / 2, right - left, TRACK);

        // Beats enter and leave at the ends of the track.
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, 0, right - left, h);
        ctx.clip();
        const pos = this._position();
        const playing = this._times.length > 0;
        // At rest only the beats still to come are shown; playing, the ones gone by
        // too, from the first beat on.
        const from = Math.max(0, Math.ceil(pos - (cx - left + DOT) / SPACING));
        const to = Math.floor(pos + (right - cx + DOT) / SPACING);
        for (let j = from; j <= to; j++) {
            const x = cx + (j - pos) * SPACING;
            const v = Math.min(1, this._velocity(j));
            const since = pos - j;
            ctx.fillStyle = playing && since >= 0 && since < 0.5 ? COLORS.red : COLORS.yellow;
            ctx.beginPath();
            ctx.arc(x, cy, DOT * (0.4 + 0.6 * v), 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
    }
}
