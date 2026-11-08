import * as Tone from 'tone';
import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const GRID = 16;     // the demos' base grid
const INSET = 2 * GRID;   // space around the plot

/**
 * The level of a straight-line ADSR envelope (0–1) at `t` seconds after the note
 * starts, for a note released `hold` seconds in. Released early, during the attack or
 * the decay, the release starts from wherever the level has got to, as Tone's does.
 */
export function envelopeLevel(t, { attack, decay, sustain, release }, hold) {
    const held = s => {
        if (s < attack) return s / attack;
        if (s < attack + decay) return 1 - (1 - sustain) * (s - attack) / decay;
        return sustain;
    };
    if (t < 0) return 0;
    if (t < hold) return held(t);
    const from = held(hold);
    return t < hold + release ? from * (1 - (t - hold) / release) : 0;
}

/**
 * Draws an ADSR envelope as a yellow filled shape on the paper: level over time for a
 * note held `hold` seconds, over a fixed span of `span` seconds so that longer stages
 * take more room. While a note plays (`play(time)`), the part already sounded fills
 * pink, moving with the audio clock. No labels: the page explains the stages.
 *
 * The shape is computed with `envelopeLevel`, which matches the straight-line stages
 * of the `envelope` synth engine.
 */
export class EnvelopeView {
    /**
     * @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`.
     * @param {object} opts
     * @param {number} opts.hold  seconds from note on to note off.
     * @param {number} opts.span  seconds across the plot.
     */
    constructor(canvas, { hold, span }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.hold = hold;
        this.span = span;
        this.envelope = { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 };
        this._start = null;
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Redraws for new envelope settings (`attack`, `decay`, `sustain`, `release`). */
    update(envelope) {
        this.envelope = { ...envelope };
        this.draw();
    }

    /** Shows a note that started at `time` on the audio clock (Tone's seconds). */
    play(time = Tone.now()) {
        this._start = time;
        const loop = () => {
            if (this._start !== time) return;
            this.draw();
            if (Tone.now() - time < this.span) requestAnimationFrame(loop);
            else { this._start = null; this.draw(); }
        };
        requestAnimationFrame(loop);
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this.draw();
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height;
        const pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const x0 = INSET, width = w - 2 * INSET;
        const bottom = h - INSET, height = h - 2 * INSET;
        const steps = Math.max(200, Math.round(width));
        const shape = () => {
            ctx.beginPath();
            ctx.moveTo(x0, bottom);
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * this.span;
                ctx.lineTo(x0 + (i / steps) * width, bottom - envelopeLevel(t, this.envelope, this.hold) * height);
            }
            ctx.lineTo(x0 + width, bottom);
            ctx.closePath();
        };

        shape();
        ctx.fillStyle = COLORS.yellow;
        ctx.fill();

        if (this._start !== null) {
            const elapsed = Math.min(this.span, Math.max(0, Tone.now() - this._start));
            ctx.save();
            ctx.beginPath();
            ctx.rect(x0, 0, (elapsed / this.span) * width, h);
            ctx.clip();
            shape();
            ctx.fillStyle = COLORS.pink;
            ctx.fill();
            ctx.restore();
        }
    }
}
