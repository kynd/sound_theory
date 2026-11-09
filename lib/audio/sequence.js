/**
 * Plays a list of notes one after another on an instrument, at a fixed pace, once or
 * in a loop (a repeated bass note is a one-note loop). Same start/stop/playing
 * contract as a continuous source, so it works with wirePlayButton; played once, it
 * also stops by itself at the end.
 *
 * Timing uses browser timers rather than Tone's Transport: steps are a few hundred
 * milliseconds apart, so timer jitter of a few milliseconds is not heard, and every
 * note goes through the instrument's ordinary noteOn and noteOff.
 */
export class Sequence {
    /**
     * @param {object}   instrument  anything with noteOn(midi) and noteOff(midi).
     * @param {object}   [opts]
     * @param {number}   [opts.step]     seconds from one note to the next.
     * @param {number}   [opts.gate]     share of the step a note is held, 0–1.
     * @param {Function} [opts.onStep]   called with (index, midi) as each note starts,
     *                                   and with (-1, null) when the sequence ends.
     * @param {Function} [opts.onEnd]    called when the sequence ends or is stopped.
     * @param {boolean}  [opts.loop]     start over at the end until stopped.
     * @param {number}   [opts.velocity] 0–1, for every note.
     */
    constructor(instrument, { step = 0.35, gate = 0.9, onStep = () => {}, onEnd = () => {}, loop = false, velocity = 0.8 } = {}) {
        this.instrument = instrument;
        this.notes = [];
        this.step = step;
        this.gate = gate;
        this.loop = loop;
        this.velocity = velocity;
        this.onStep = onStep;
        this.onEnd = onEnd;
        this._timers = [];
        this._sounding = null;
    }

    get playing() { return this._timers.length > 0; }

    /** Plays `this.notes` (MIDI numbers) from the start. */
    start() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        this._release();
        const ms = this.step * 1000;
        this.notes.forEach((midi, i) => {
            this._timers.push(setTimeout(() => {
                this._release();
                this.instrument.noteOn(midi, this.velocity);
                this._sounding = midi;
                this.onStep(i, midi);
            }, i * ms));
            this._timers.push(setTimeout(() => this._release(), (i + this.gate) * ms));
        });
        this._timers.push(setTimeout(() => {
            if (this.loop) this.start(); else this._finish();
        }, this.notes.length * ms));
    }

    stop() {
        if (!this._timers.length) return;
        this._finish();
    }

    _release() {
        if (this._sounding === null) return;
        this.instrument.noteOff(this._sounding);
        this._sounding = null;
    }

    _finish() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        this._release();
        this.onStep(-1, null);
        this.onEnd();
    }
}
