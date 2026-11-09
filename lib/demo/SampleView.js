import { Viewport } from './viewport.js';
import { COLORS } from './colors.js';

const INSET = 32;   // px from the edges, on the 16px grid

/**
 * Draws a recording as its waveform, a red line across the plot (the lowest and
 * highest sample under each pixel), cut into `slices` equal parts. The slice that is
 * sounding is filled yellow behind the wave, and butter when it plays backward.
 */
export class SampleView {
    /** @param {HTMLCanvasElement} canvas  inside a `.canvas-wrap`. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.viewport = new Viewport(canvas);
        this.buffer = null;
        this.slices = 1;
        this.slice = -1;
        this.reversed = false;
        this._peaks = null;
        this.viewport.onResize(() => this._resize());
        this._resize();
    }

    /** Sets the recording (a loaded ToneAudioBuffer, or null) and the slice count. */
    update(buffer, slices = this.slices) {
        if (buffer !== this.buffer) { this.buffer = buffer; this._peaks = null; }
        this.slices = Math.max(1, Math.round(slices));
        this.draw();
    }

    /** Marks slice `i` as sounding (backward if `reversed`), or none with -1. */
    setSlice(i, reversed = false) {
        this.slice = i;
        this.reversed = reversed;
        this.draw();
    }

    _resize() {
        this.canvas.width = this.viewport.pixelWidth;
        this.canvas.height = this.viewport.pixelHeight;
        this._peaks = null;
        this.draw();
    }

    /** The lowest and highest sample under each pixel column, from the first channel. */
    _measure(width) {
        const data = this.buffer.getChannelData(0);
        const per = data.length / width;
        const peaks = [];
        for (let x = 0; x < width; x++) {
            let lo = 0, hi = 0;
            const end = Math.min(data.length, Math.floor((x + 1) * per));
            for (let i = Math.floor(x * per); i < end; i++) {
                if (data[i] < lo) lo = data[i];
                if (data[i] > hi) hi = data[i];
            }
            peaks.push([lo, hi]);
        }
        return peaks;
    }

    draw() {
        const { ctx, viewport } = this;
        const w = viewport.width, h = viewport.height, pr = viewport.pixelRatio;
        ctx.setTransform(pr, 0, 0, pr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!this.buffer?.loaded) return;
        const left = INSET, width = Math.max(1, Math.floor(w - 2 * INSET));
        const top = INSET, height = h - 2 * INSET, mid = top + height / 2;
        const scale = height * 0.35;   // the wave at 70% of the height, so the slice shows around it
        if (this.slice >= 0) {
            const sw = width / this.slices;
            ctx.fillStyle = this.reversed ? COLORS.butter : COLORS.yellow;
            ctx.fillRect(left + this.slice * sw, top, sw, height);
        }
        if (!this._peaks || this._peaks.length !== width) this._peaks = this._measure(width);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this._peaks.forEach(([lo, hi], x) => {
            ctx.moveTo(left + x + 0.5, mid - hi * scale);
            ctx.lineTo(left + x + 0.5, mid - lo * scale + 1);
        });
        ctx.stroke();
    }
}
