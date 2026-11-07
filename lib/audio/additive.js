import * as Tone from 'tone';

/**
 * Additive synthesis: a tone built as a sum of sine waves (partials) at whole-number
 * multiples of a fundamental frequency. `partials[k]` is the amplitude of the sine
 * at (k + 1) × frequency, so `[1]` is a plain sine wave.
 *
 * Every partial starts in phase (a rising sine at time zero). The summed wave is
 * scaled so its peak is 1, matching what the Web Audio PeriodicWave plays.
 */

/** Amplitudes of the first `n` harmonics of a classic waveform. */
export function harmonicSeries(shape, n) {
    return Array.from({ length: n }, (_, i) => {
        const k = i + 1;
        if (shape === 'sine') return k === 1 ? 1 : 0;
        if (shape === 'square') return k % 2 ? 1 / k : 0;
        if (shape === 'sawtooth') return 1 / k;
        throw new Error(`Unknown shape: ${shape}`);
    });
}

/** The unscaled sum of the partials at `phase` (0–1 is one period of the fundamental). */
export function partialSum(partials, phase) {
    let v = 0;
    for (let k = 0; k < partials.length; k++) {
        if (partials[k]) v += partials[k] * Math.sin(2 * Math.PI * (k + 1) * phase);
    }
    return v;
}

/** The largest absolute value of the sum over one period, or 0 when every partial is 0. */
export function partialPeak(partials, samples = 1024) {
    let peak = 0;
    for (let i = 0; i < samples; i++) peak = Math.max(peak, Math.abs(partialSum(partials, i / samples)));
    return peak;
}

/**
 * A continuously running additive tone, started and stopped with a short fade so it
 * never clicks. Connect `output` onward (to a MasterBus, a Scope).
 */
export class AdditiveOscillator {
    /**
     * @param {object} [opts]
     * @param {number}   [opts.frequency]  of the fundamental, in Hz.
     * @param {number[]} [opts.partials]   amplitudes, fundamental first.
     * @param {number}   [opts.amplitude]  peak level of the summed wave, 0–1.
     */
    constructor({ frequency = 220, partials = [1], amplitude = 0.5 } = {}) {
        this.output = new Tone.Gain(0);
        this._osc = new Tone.Oscillator({ frequency, type: 'sine' }).connect(this.output);
        this._amplitude = amplitude;
        this._playing = false;
        this.partials = partials;
    }

    connect(destination) { this.output.connect(destination); return this; }

    get playing() { return this._playing; }

    /** Call after `startAudio()`, inside a user gesture. */
    start() {
        if (this._osc.state !== 'started') this._osc.start();
        this._playing = true;
        this._applyLevel();
    }

    stop() {
        this._playing = false;
        this._applyLevel();
    }

    get frequency() { return this._osc.frequency.value; }
    set frequency(hz) { this._osc.frequency.rampTo(hz, 0.03); }

    get amplitude() { return this._amplitude; }
    set amplitude(a) { this._amplitude = a; this._applyLevel(); }

    get partials() { return [...this._partials]; }
    set partials(partials) {
        this._partials = [...partials];
        this._silent = partialPeak(this._partials) === 0;
        // A PeriodicWave of all zeros cannot be normalized, so keep the last audible
        // wave in the oscillator and mute the output instead.
        if (!this._silent) this._osc.partials = this._partials;
        this._applyLevel();
    }

    /** Sets one partial's amplitude. */
    setPartial(index, amplitude) {
        const partials = this.partials;
        while (partials.length <= index) partials.push(0);
        partials[index] = amplitude;
        this.partials = partials;
    }

    dispose() { this._osc.dispose(); this.output.dispose(); }

    _applyLevel() {
        const level = this._playing && !this._silent ? this._amplitude : 0;
        this.output.gain.rampTo(level, 0.03);
    }
}

/**
 * Several AdditiveOscillators that start and stop together, one per frequency, all
 * with the same partials: a chord or an interval. Same start/stop/playing contract as
 * AdditiveOscillator, so it works with wirePlayButton.
 */
export class Chord {
    /**
     * @param {number[]} frequencies  one per note, in Hz.
     * @param {object}   [opts]
     * @param {number[]} [opts.partials]   shared by every note.
     * @param {number}   [opts.amplitude]  per note, 0–1.
     */
    constructor(frequencies, { partials = [1], amplitude = 0.25 } = {}) {
        this.output = new Tone.Gain();
        this.tones = frequencies.map(frequency =>
            new AdditiveOscillator({ frequency, partials, amplitude }).connect(this.output));
    }

    connect(destination) { this.output.connect(destination); return this; }

    get playing() { return this.tones[0].playing; }
    start() { this.tones.forEach(tone => tone.start()); }
    stop() { this.tones.forEach(tone => tone.stop()); }

    get frequencies() { return this.tones.map(tone => tone.frequency); }
    set frequencies(hz) { hz.forEach((f, i) => { this.tones[i].frequency = f; }); }

    dispose() { this.tones.forEach(tone => tone.dispose()); this.output.dispose(); }
}
