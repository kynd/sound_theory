import * as Tone from 'tone';

// Tone schedules everything 0.1 s ahead by default, which is heard as lag when a
// key is pressed. The demos are played live, so events happen at once. A demo that
// schedules sequences on the Transport can raise this again.
Tone.getContext().lookAhead = 0;

/**
 * Browsers keep audio suspended until the page receives a user gesture. Call this
 * from inside a pointer or key handler before the first note; later calls return
 * immediately.
 *
 * Do not await it before playing. Schedule the note right after calling it: while
 * the context is suspended its clock stands still, so the note starts as soon as audio
 * resumes. Awaiting lets a quick tap's noteOff run before its noteOn, which leaves a
 * sustained sound (noise, a synth) playing forever.
 */
export async function startAudio() {
    if (Tone.getContext().state !== 'running') await Tone.start();
}

/** Converts a MIDI note number to Tone's scientific pitch name (60 → "C4"). */
export function midiToNote(midi) {
    return Tone.Frequency(midi, 'midi').toNote();
}

/** Converts a MIDI note number to frequency in Hz, at A4 = 440 Hz. */
export function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Converts a frequency in Hz to a fractional MIDI number, at A4 = 440 Hz. */
export function frequencyToMidi(hz) {
    return 69 + 12 * Math.log2(hz / 440);
}

/** The nearest note to a frequency and how far off it is, in cents (1/100 semitone). */
export function nearestNote(hz) {
    const midi = frequencyToMidi(hz);
    const nearest = Math.round(midi);
    return { midi: nearest, name: midiToNote(nearest), cents: Math.round((midi - nearest) * 100) };
}

/**
 * The last stage before the speakers: a volume control and a limiter. Every demo
 * routes its sound through one MasterBus, so distortion or runaway delay feedback
 * cannot exceed full scale.
 */
export class MasterBus {
    /** @param {object} [opts] @param {number} [opts.volume] in dB. */
    constructor({ volume = -6 } = {}) {
        this.input = new Tone.Gain();
        this._volume = new Tone.Volume(volume);
        this._limiter = new Tone.Limiter(-1);
        this.input.chain(this._volume, this._limiter, Tone.getDestination());
    }

    /** Output level in dB. */
    get volume() { return this._volume.volume.value; }
    set volume(db) { this._volume.volume.rampTo(db, 0.05); }
}
