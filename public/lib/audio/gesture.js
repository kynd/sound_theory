import * as Tone from 'tone';

/**
 * Sound controlled continuously by a gesture rather than by notes: one voice whose
 * pitch, brightness, and on/off follow a pointer or a drawn line.
 */

/** Semitones of the major pentatonic scale, for snapping a gesture to notes that never clash. */
export const PENTATONIC_PCS = [0, 2, 4, 7, 9];

/**
 * Maps a position from 0 to 1 onto a MIDI pitch between `low` and `high`, either
 * continuously or snapped to the nearest note whose pitch class is in `pcs`
 * (relative to `root`).
 */
export function pitchAt(position, { low = 48, high = 84, pcs = null, root = 0 } = {}) {
    const midi = low + position * (high - low);
    if (!pcs) return midi;
    let best = Math.round(midi), distance = Infinity;
    for (let m = Math.floor(midi) - 6; m <= Math.ceil(midi) + 6; m++) {
        if (!pcs.includes(((m - root) % 12 + 12) % 12)) continue;
        if (Math.abs(m - midi) < distance) { best = m; distance = Math.abs(m - midi); }
    }
    return best;
}

/** Maps a position from 0 to 1 onto a filter cutoff from 100 Hz to 8 kHz, evenly in octaves. */
export function cutoffAt(position) {
    return 100 * Math.pow(80, position);
}

/** Maps a position from 0 to 1 onto a filter resonance (Q) from 0.5 to 15, evenly in ratio. */
export function resonanceAt(position) {
    return 0.5 * Math.pow(30, position);
}

/**
 * One continuous voice: an oscillator through a resonant low-pass filter and a gate.
 * `setPitch`, `setCutoff`, and `setResonance` glide to new values; `start` and `stop` open and close
 * the gate. The oscillator runs silently while the gate is closed.
 */
export class GestureSynth {
    constructor({ type = 'sawtooth', resonance = 6 } = {}) {
        this.osc = new Tone.Oscillator({ type, frequency: 220 });
        this.filter = new Tone.Filter({ type: 'lowpass', frequency: 1000, Q: resonance, rolloff: -24 });
        this.gate = new Tone.Gain(0);
        this.output = new Tone.Gain(0.25);
        this.osc.chain(this.filter, this.gate, this.output);
        this.osc.start();
        this.sounding = false;
    }

    connect(destination) { this.output.connect(destination); return this; }

    set type(type) { this.osc.type = type; }

    setPitch(midi, glide = 0.02) { this.osc.frequency.rampTo(Tone.Frequency(midi, 'midi').toFrequency(), glide); }

    setCutoff(hz, glide = 0.02) { this.filter.frequency.rampTo(hz, glide); }

    setResonance(q, glide = 0.02) { this.filter.Q.rampTo(q, glide); }

    start() { this.sounding = true; this.gate.gain.rampTo(1, 0.02); }

    stop() { this.sounding = false; this.gate.gain.rampTo(0, 0.08); }

    dispose() { [this.osc, this.filter, this.gate, this.output].forEach(n => n.dispose()); }
}

/**
 * Plays a drawn contour on a GestureSynth, sweeping left to right over `duration`
 * seconds and looping: `sample(x)` gives the drawn height (0–1) at position x, or
 * null where nothing is drawn (the voice is silent there), and `pitch(y)` turns a
 * height into a MIDI pitch. `onPosition(x)` reports the playhead, and -1 when stopped.
 * Same start/stop/playing contract as a continuous source.
 */
export class ContourPlayer {
    constructor(synth, { sample, pitch, duration = 4, onPosition = () => {} }) {
        Object.assign(this, { synth, sample, pitch, duration, onPosition });
        this._timer = null;
    }

    get playing() { return this._timer !== null; }

    start() {
        this.stop();
        this._t0 = Tone.immediate();
        this._timer = setInterval(() => this._tick(), 16);
        this._tick();
    }

    stop() {
        if (this._timer === null) return;
        clearInterval(this._timer);
        this._timer = null;
        this.synth.stop();
        this.onPosition(-1);
    }

    _tick() {
        const x = ((Tone.immediate() - this._t0) / this.duration) % 1;
        const y = this.sample(x);
        if (y === null) {
            if (this.synth.sounding) this.synth.stop();
        } else {
            this.synth.setPitch(this.pitch(y), 0.03);
            if (!this.synth.sounding) this.synth.start();
        }
        this.onPosition(x);
    }
}
