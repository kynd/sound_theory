import * as Tone from 'tone';

/**
 * Sound painted as a picture of its spectrum, as on the ANS synthesizer (Evgeny
 * Murzin, 1958), Xenakis's UPIC, or a spectrogram played backward: rows are sine
 * waves at fixed frequencies, spaced evenly in pitch but not tuned to any scale, and
 * columns are moments in time. A painted cell turns its sine on for that moment.
 */

/** `rows` frequencies from `low` to `high` Hz, evenly spaced in pitch, lowest first. */
export function spectralFrequencies(rows, low = 60, high = 6000) {
    return Array.from({ length: rows }, (_, i) => low * (high / low) ** (i / (rows - 1)));
}

const LOOKAHEAD = 0.1;
const TICK_MS = 25;

/**
 * Plays a grid (`grid[col][row]`, 0–1) left to right in a loop over `duration`
 * seconds, one sine per row, with the start/stop/playing contract of a continuous
 * source. The grid can be changed while it plays. Each column's level is shared out
 * among its sounding rows so dense columns do not get louder. `onColumn(i)` reports
 * the column that is sounding, and -1 when stopped.
 */
export class SpectralPlayer {
    constructor(grid, { duration = 8, frequencies = spectralFrequencies(grid[0].length), onColumn = () => {} } = {}) {
        this.grid = grid;
        this.duration = duration;
        this.onColumn = onColumn;
        this.output = new Tone.Gain(0.5);
        this._voices = frequencies.map(frequency => {
            const gain = new Tone.Gain(0).connect(this.output);
            const osc = new Tone.Oscillator(frequency, 'sine').connect(gain);
            return { osc, gain };
        });
        this._timer = null;
        this._draws = new Set();
    }

    get playing() { return this._timer !== null; }

    start() {
        this.stop();
        this._voices.forEach(v => v.osc.start());
        this._column = 0;
        this._next = Tone.immediate() + 0.05;
        this._timer = setInterval(() => this._schedule(), TICK_MS);
        this._schedule();
    }

    stop() {
        if (this._timer === null) return;
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        const now = Tone.immediate();
        this._voices.forEach(v => { v.gain.gain.cancelScheduledValues(now); v.gain.gain.setTargetAtTime(0, now, 0.02); v.osc.stop(now + 0.2); });
        this.onColumn(-1);
    }

    _schedule() {
        const now = Tone.immediate();
        const step = this.duration / this.grid.length;
        while (this._next < now + LOOKAHEAD) {
            const col = this._column;
            const levels = this.grid[col];
            const loud = Math.sqrt(levels.reduce((a, v) => a + v * v, 0)) || 1;
            this._voices.forEach((v, row) => v.gain.gain.setTargetAtTime(levels[row] / Math.max(1, loud), this._next, step / 6));
            const draw = setTimeout(() => { this._draws.delete(draw); if (this.playing) this.onColumn(col); },
                Math.max(0, (this._next - now) * 1000));
            this._draws.add(draw);
            this._next += step;
            this._column = (col + 1) % this.grid.length;
        }
    }

    dispose() {
        this.stop();
        this._voices.forEach(v => { v.osc.dispose(); v.gain.dispose(); });
        this.output.dispose();
    }
}
