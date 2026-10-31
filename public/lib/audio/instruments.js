import * as Tone from 'tone';
import { midiToNote } from './AudioEngine.js';

/**
 * Sound sources behind one contract, so a demo can swap a sine wave for a piano or a
 * drum kit without changing how it plays notes.
 *
 * Every instrument:
 *   - takes notes as MIDI numbers (60 = C4), never as names or frequencies;
 *   - plays through its own `output` node, which the caller connects onward;
 *   - exposes `ready`, a promise that resolves once any samples have loaded;
 *   - may expose `pads`, a list of `{ label, midi }`, when it has no pitch and should
 *     be played from pads instead of piano keys (one pad per sound). Null otherwise.
 *
 * `noteOn` and `noteOff` take an optional `time` on the audio clock (Tone's seconds),
 * for sequencers that schedule notes ahead. Live playing leaves it out: now.
 */
export class Instrument {
    constructor() {
        this.output = new Tone.Gain();
        this.ready = Promise.resolve();
        this.pads = null;
    }

    connect(destination) { this.output.connect(destination); return this; }

    /** Starts a note. `velocity` is 0–1. */
    noteOn(midi, velocity = 0.8, time = Tone.now()) {}

    /** Releases a note started with noteOn. One-shot sounds ignore it. */
    noteOff(midi, time = Tone.now()) {}

    /** Releases every sounding note. */
    releaseAll() {}

    dispose() { this.output.dispose(); }
}

/** A polyphonic synthesizer built from one of Tone's monophonic voices. */
export class PolyInstrument extends Instrument {
    /**
     * @param {Function} voice    a Tone voice class (Tone.Synth, Tone.FMSynth, …).
     * @param {object}   options  options for each voice.
     * @param {object}   [opts]
     * @param {number}   [opts.volume]  in dB, to level instruments against each other.
     */
    constructor(voice, options = {}, { volume = 0 } = {}) {
        super();
        this.synth = new Tone.PolySynth(voice, options).connect(this.output);
        this.synth.maxPolyphony = 32;
        this.synth.volume.value = volume;
    }

    noteOn(midi, velocity = 0.8, time = Tone.now()) { this.synth.triggerAttack(midiToNote(midi), time, velocity); }
    noteOff(midi, time = Tone.now()) { this.synth.triggerRelease(midiToNote(midi), time); }
    releaseAll() { this.synth.releaseAll(); }
    dispose() { this.synth.dispose(); super.dispose(); }
}

/**
 * An instrument played from recorded samples. Tone's Sampler repitches the nearest
 * sample, so a few notes per octave cover the whole range.
 */
export class SampledInstrument extends Instrument {
    /**
     * @param {object} urls     map from note name to file name, e.g. { C4: 'C4.mp3' }.
     * @param {string} baseUrl  prefix for every file name.
     * @param {object} [opts]
     * @param {number} [opts.release]  release time in seconds.
     * @param {number} [opts.volume]   in dB.
     */
    constructor(urls, baseUrl, { release = 1, volume = 0 } = {}) {
        super();
        this.loaded = false;
        this.ready = new Promise((resolve, reject) => {
            this.sampler = new Tone.Sampler({
                urls, baseUrl, release,
                onload: () => { this.loaded = true; resolve(); },
                onerror: reject,
            }).connect(this.output);
        });
        this.sampler.volume.value = volume;
    }

    noteOn(midi, velocity = 0.8, time = Tone.now()) {
        if (this.loaded) this.sampler.triggerAttack(midiToNote(midi), time, velocity);
    }
    noteOff(midi, time = Tone.now()) {
        if (this.loaded) this.sampler.triggerRelease(midiToNote(midi), time);
    }
    releaseAll() { this.sampler.releaseAll(); }
    dispose() { this.sampler.dispose(); super.dispose(); }
}

/**
 * A synthesized drum kit: kick, snare, clap, hat, open hat, tom, and crash. It is
 * played from pads, one per piece (`pads`). Each piece also sits on a white key, the
 * same in every octave (C to B in that order). A rim click (a stick on the snare's
 * rim, the side stick) sits on C♯, as in General MIDI, for rhythm patterns and the
 * pulse; it has no pad, and the other black keys are silent. Every piece is a
 * one-shot, so noteOff does nothing. `DRUM_NOTES` names each piece's note.
 */
export class DrumKit extends Instrument {
    constructor() {
        super();
        const out = this.output;
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05, octaves: 6,
            envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
        }).connect(out);
        this.snareNoise = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
            volume: -8,
        }).connect(out);
        this.snareBody = new Tone.MembraneSynth({
            pitchDecay: 0.02, octaves: 2,
            envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
            volume: -10,
        }).connect(out);
        this.clap = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.004, decay: 0.12, sustain: 0 },
            volume: -6,
        }).connect(out);
        this.toms = new Tone.PolySynth(Tone.MembraneSynth, {
            pitchDecay: 0.08, octaves: 2,
            envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
        }).connect(out);
        this.toms.volume.value = -4;
        // One synth for both hats, so a closed hat cuts off an open one (a choke).
        this.hat = new Tone.MetalSynth({
            harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
            envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
            volume: -20,
        }).connect(out);
        this.crash = new Tone.MetalSynth({
            harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1.5,
            envelope: { attack: 0.001, decay: 1.4, release: 0.6 },
            volume: -22,
        }).connect(out);
        // A short, high, woody click.
        this.rim = new Tone.MembraneSynth({
            pitchDecay: 0.008, octaves: 2,
            envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
            volume: -4,
        }).connect(out);

        const hit = (synth, note, dur) => (t, v) => synth.triggerAttackRelease(note, dur, t, v);
        const hat = decay => (t, v) => {
            this.hat.envelope.decay = decay;
            this.hat.triggerAttackRelease(300, decay, t, v);
        };
        this._pieces = {
            0:  { label: 'Kick',  play: hit(this.kick, 'C1', 0.4) },
            2:  { label: 'Snare', play: (t, v) => {
                      this.snareNoise.triggerAttackRelease(0.18, t, v);
                      this.snareBody.triggerAttackRelease('G2', 0.12, t, v);
                  } },
            4:  { label: 'Clap',  play: (t, v) => this.clap.triggerAttackRelease(0.12, t, v) },
            5:  { label: 'Hat',   play: hat(0.05) },
            7:  { label: 'Open',  play: hat(0.4) },
            9:  { label: 'Tom',   play: hit(this.toms, 'C2', 0.5) },
            11: { label: 'Crash', play: hit(this.crash, 300, 1.4) },
            1:  { label: 'Rim',   play: hit(this.rim, 'A4', 0.05), padless: true },
        };
        // One pad per piece on a white key, in kit order. Each plays the piece's note in octave 4.
        this.pads = Object.entries(this._pieces)
            .filter(([, piece]) => !piece.padless)
            .map(([pc, piece]) => ({ label: piece.label, midi: 60 + Number(pc) }));
    }

    noteOn(midi, velocity = 0.8, time = Tone.now()) {
        this._pieces[((midi % 12) + 12) % 12]?.play(time, velocity);
    }

    dispose() {
        [this.kick, this.snareNoise, this.snareBody, this.clap, this.toms, this.hat, this.crash, this.rim]
            .forEach(node => node.dispose());
        super.dispose();
    }
}

/** The note of each drum kit piece, in octave 4 (any octave plays the same piece). */
export const DRUM_NOTES = { kick: 60, rim: 61, snare: 62, clap: 64, hat: 65, open: 67, tom: 69, crash: 71 };

/**
 * A held noise source. Noise has no pitch, so it is played from a single pad; any
 * note plays the same sound, which lasts while any is held.
 */
export class NoiseInstrument extends Instrument {
    /** @param {'white'|'pink'|'brown'} [type] */
    constructor(type = 'white', { volume = -10 } = {}) {
        super();
        this.synth = new Tone.NoiseSynth({
            noise: { type },
            envelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.3 },
            volume,
        }).connect(this.output);
        this._held = new Set();
        this.pads = [{ label: 'Play', midi: 60 }];
    }

    noteOn(midi, velocity = 0.8) {
        if (this._held.size === 0) this.synth.triggerAttack(Tone.now(), velocity);
        this._held.add(midi);
    }
    noteOff(midi) {
        this._held.delete(midi);
        if (this._held.size === 0) this.synth.triggerRelease(Tone.now());
    }
    releaseAll() { this._held.clear(); this.synth.triggerRelease(Tone.now()); }
    dispose() { this.synth.dispose(); super.dispose(); }
}

/** Salamander Grand Piano samples, recorded every minor third, hosted by Tone.js. */
/**
 * Orchestral and guitar samples from the tonejs-instruments library by Nicholas
 * Brosowsky (samples from VSCO 2 Community Edition, the University of Iowa
 * Electronic Music Studios, and Freesound; CC BY 3.0). Each list is a subset of the
 * recorded notes, at least three semitones apart; the Sampler repitches in between.
 * File names spell sharps with "s" (F#3 → Fs3.mp3).
 */
const TONEJS_INSTRUMENTS_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';
const TONEJS_INSTRUMENTS = {
    'violin':          ['A3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'],
    'cello':           ['C2', 'D#2', 'G2', 'A#2', 'C#3', 'E3', 'G3', 'A#3', 'C#4', 'E4', 'G4', 'B4'],
    'flute':           ['C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6', 'C7'],
    'clarinet':        ['D3', 'F3', 'A#3', 'D4', 'F4', 'A#4', 'D5', 'F5', 'A#5', 'D6', 'F#6'],
    'trumpet':         ['F3', 'A3', 'C4', 'D#4', 'G4', 'A#4', 'D5', 'F5', 'A5', 'C6'],
    'guitar-acoustic': ['D2', 'F2', 'G#2', 'B2', 'D3', 'F3', 'G#3', 'B3', 'D4', 'F4', 'G#4', 'B4', 'D5'],
};
function tonejsInstrument(name, opts) {
    const urls = Object.fromEntries(
        TONEJS_INSTRUMENTS[name].map(note => [note, `${note.replace('#', 's')}.mp3`]));
    return new SampledInstrument(urls, `${TONEJS_INSTRUMENTS_BASE}${name}/`, opts);
}

const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/';
function salamanderUrls() {
    const urls = { A0: 'A0.mp3', C8: 'C8.mp3' };
    for (let octave = 1; octave <= 7; octave++) {
        for (const [note, file] of [['C', 'C'], ['D#', 'Ds'], ['F#', 'Fs'], ['A', 'A']]) {
            urls[note + octave] = `${file}${octave}.mp3`;
        }
    }
    return urls;
}

/**
 * The URL of one recorded note: `instrument` is 'piano' (Salamander) or a name in the
 * tonejs-instruments set ('cello', 'flute' …), `file` a file name such as 'C4.mp3'.
 * For sources that play a recording directly (granular synthesis).
 */
export function sampleUrl(instrument, file) {
    return instrument === 'piano' ? `${SALAMANDER_BASE}${file}` : `${TONEJS_INSTRUMENTS_BASE}${instrument}/${file}`;
}

const ENVELOPE = { attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.4 };
const waveform = (type, volume) =>
    new PolyInstrument(Tone.Synth, { oscillator: { type }, envelope: ENVELOPE }, { volume });

/**
 * Every preset a demo can offer, in menu order. `group` becomes the optgroup in an
 * instrument menu. Add a preset here, never in a demo.
 */
export const INSTRUMENTS = [
    { id: 'sine',     label: 'Sine',     group: 'Waveforms', create: () => waveform('sine', 0) },
    { id: 'triangle', label: 'Triangle', group: 'Waveforms', create: () => waveform('triangle', -2) },
    { id: 'square',   label: 'Square',   group: 'Waveforms', create: () => waveform('square', -12) },
    { id: 'sawtooth', label: 'Sawtooth', group: 'Waveforms', create: () => waveform('sawtooth', -10) },
    { id: 'fm', label: 'FM synth', group: 'Synths', create: () => new PolyInstrument(Tone.FMSynth, {
        harmonicity: 3, modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 },
        modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1 },
    }, { volume: -6 }) },
    { id: 'am', label: 'AM synth', group: 'Synths', create: () => new PolyInstrument(Tone.AMSynth, {
        harmonicity: 2,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.8 },
    }, { volume: -4 }) },
    { id: 'piano', label: 'Piano', group: 'Sampled', create: () =>
        new SampledInstrument(salamanderUrls(), SALAMANDER_BASE, { release: 1, volume: -2 }) },
    { id: 'violin',   label: 'Violin',   group: 'Sampled', create: () => tonejsInstrument('violin',   { release: 0.6, volume: -10 }) },
    { id: 'cello',    label: 'Cello',    group: 'Sampled', create: () => tonejsInstrument('cello',    { release: 0.6, volume: -8 }) },
    { id: 'flute',    label: 'Flute',    group: 'Sampled', create: () => tonejsInstrument('flute',    { release: 0.4, volume: -7 }) },
    { id: 'clarinet', label: 'Clarinet', group: 'Sampled', create: () => tonejsInstrument('clarinet', { release: 0.4, volume: -11 }) },
    { id: 'trumpet',  label: 'Trumpet',  group: 'Sampled', create: () => tonejsInstrument('trumpet',  { release: 0.4, volume: -8 }) },
    { id: 'guitar',   label: 'Acoustic guitar', group: 'Sampled', create: () => tonejsInstrument('guitar-acoustic', { release: 1, volume: -11 }) },
    { id: 'drums', label: 'Drum kit', group: 'Drums', create: () => new DrumKit() },
    { id: 'white-noise', label: 'White noise', group: 'Noise', create: () => new NoiseInstrument('white', { volume: -14 }) },
    { id: 'pink-noise',  label: 'Pink noise',  group: 'Noise', create: () => new NoiseInstrument('pink', { volume: -8 }) },
];

export function createInstrument(id) {
    const def = INSTRUMENTS.find(d => d.id === id);
    if (!def) throw new Error(`Unknown instrument: ${id}`);
    return def.create();
}
