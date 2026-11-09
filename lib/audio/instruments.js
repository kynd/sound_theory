import * as Tone from 'tone';
import { midiToNote, midiToFrequency } from './AudioEngine.js';

/**
 * What Tone is given for a MIDI note: its name for a whole number, its frequency for a
 * fractional one (64.5 is a quarter tone above E4), so every instrument can play
 * pitches between the keys. The same MIDI number always gives the same value, so a
 * noteOff finds its noteOn.
 */
const pitch = midi => (Number.isInteger(midi) ? midiToNote(midi) : midiToFrequency(midi));

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

    /**
     * Bends the sounding note `midi` to `toMidi` (fractional for a quarter tone), from
     * `time` over `seconds`. Only instruments that can glide a sounding note do it
     * (BendSynth); the others ignore it and keep the note at its pitch.
     */
    bend(midi, toMidi, time = Tone.now(), seconds = 0.1) {}

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

    noteOn(midi, velocity = 0.8, time = Tone.now()) { this.synth.triggerAttack(pitch(midi), time, velocity); }
    noteOff(midi, time = Tone.now()) { this.synth.triggerRelease(pitch(midi), time); }
    releaseAll() { this.synth.releaseAll(); }
    dispose() { this.synth.dispose(); super.dispose(); }
}

/**
 * A short, struck synth tone, like a mallet on a bar: every note decays by itself, so
 * it can be played by something that only sends noteOn (a step sequencer).
 */
export class MalletSynth extends Instrument {
    constructor({ volume = -8 } = {}) {
        super();
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.4 },
        }).connect(this.output);
        this.synth.maxPolyphony = 32;
        this.synth.volume.value = volume;
    }

    noteOn(midi, velocity = 0.8, time = Tone.now()) { this.synth.triggerAttackRelease(pitch(midi), 0.3, time, velocity); }
    releaseAll() { this.synth.releaseAll(); }
    dispose() { this.synth.dispose(); super.dispose(); }
}

/**
 * A monophonic synth whose sounding note can bend: one voice, so its pitch can glide
 * after the note starts, as a guitarist bends a string. Samplers and the polyphonic
 * synths cannot. A new note replaces the one sounding; a noteOff releases only the
 * note that is sounding, so a late noteOff never cuts off the next note.
 */
export class BendSynth extends Instrument {
    constructor(options = {}, { volume = 0 } = {}) {
        super();
        this.synth = new Tone.MonoSynth(options).connect(this.output);
        this.synth.volume.value = volume;
        this._midi = null;
    }

    noteOn(midi, velocity = 0.8, time = Tone.now()) {
        this._midi = midi;
        this.synth.triggerAttack(midiToFrequency(midi), time, velocity);
    }
    noteOff(midi, time = Tone.now()) {
        if (midi === this._midi) this.synth.triggerRelease(time);
    }
    releaseAll() { this.synth.triggerRelease(); this._midi = null; }

    bend(midi, toMidi, time = Tone.now(), seconds = 0.1) {
        const frequency = this.synth.frequency;
        frequency.setValueAtTime(midiToFrequency(midi), time);
        frequency.exponentialRampToValueAtTime(midiToFrequency(toMidi), time + seconds);
    }

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
        if (this.loaded) this.sampler.triggerAttack(pitch(midi), time, velocity);
    }
    noteOff(midi, time = Tone.now()) {
        if (this.loaded) this.sampler.triggerRelease(pitch(midi), time);
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

/**
 * One impact built from layers, the way a film or game sound is: a low thump (a sine
 * whose pitch drops fast, felt more than heard), a crack (a very short burst of bright
 * noise, the attack that says "hard"), a ring (a short metallic clang, the body), and a
 * tail (dark noise fading slowly into a long reverb, the space). Each layer in
 * `layers` (`{ id, label, gain }`) has its own level; 0 silences it. Played from one
 * pad.
 */
export class LayeredHit extends Instrument {
    constructor() {
        super();
        const layer = (id, label) => ({ id, label, gain: new Tone.Gain(1).connect(this.output) });
        this.layers = [layer('thump', 'Thump'), layer('crack', 'Crack'), layer('ring', 'Ring'), layer('tail', 'Tail')];
        const [thump, crack, ring, tail] = this.layers;
        this._thump = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 6,
            envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.2 }, volume: 0 }).connect(thump.gain);
        this._crackFilter = new Tone.Filter(2500, 'highpass').connect(crack.gain);
        this._crack = new Tone.NoiseSynth({ noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 }, volume: -2 }).connect(this._crackFilter);
        this._ring = new Tone.MetalSynth({ harmonicity: 3.1, modulationIndex: 16, resonance: 3000, octaves: 1,
            envelope: { attack: 0.001, decay: 0.5, release: 0.3 }, volume: -16 }).connect(ring.gain);
        this._reverb = new Tone.Reverb({ decay: 5, wet: 1 }).connect(tail.gain);
        this._tailFilter = new Tone.Filter(700, 'lowpass').connect(this._reverb);
        this._tail = new Tone.NoiseSynth({ noise: { type: 'pink' },
            envelope: { attack: 0.005, decay: 1.5, sustain: 0, release: 0.5 }, volume: -4 }).connect(this._tailFilter);
        this.ready = this._reverb.ready;
        // The Mix pad plays every layer; the pads after it play one layer each.
        this.pads = [{ label: 'Mix', midi: 60 }, ...this.layers.map((l, i) => ({ label: l.label, midi: 61 + i }))];
        this._triggers = [
            (time, velocity) => this._thump.triggerAttackRelease('G1', 0.5, time, velocity),
            (time, velocity) => this._crack.triggerAttackRelease(0.06, time, velocity),
            (time, velocity) => this._ring.triggerAttackRelease(200, 0.4, time, velocity),
            (time, velocity) => this._tail.triggerAttackRelease(1.5, time, velocity),
        ];
    }

    /** MIDI 60 (the Mix pad) plays all four layers; 61 to 64 play one layer alone. */
    noteOn(midi, velocity = 0.9, time = Tone.now()) {
        const solo = this._triggers[midi - 61];
        if (solo) solo(time, velocity);
        else this._triggers.forEach(trigger => trigger(time, velocity));
    }

    dispose() {
        [this._thump, this._crack, this._crackFilter, this._ring, this._reverb, this._tailFilter, this._tail]
            .forEach(node => node.dispose());
        this.layers.forEach(l => l.gain.dispose());
        super.dispose();
    }
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
    'bass-electric':   ['E1', 'G1', 'A#1', 'C#2', 'E2', 'G2', 'A#2', 'C#3', 'E3', 'G3', 'A#3', 'C#4', 'E4', 'G4'],
    'organ':           ['C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6'],
    'harmonium':       ['C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'G4', 'A#4', 'C#5'],
    'guitar-electric': ['C#2', 'E2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6'],
    'guitar-nylon':    ['B1', 'D2', 'F#2', 'A2', 'C#3', 'E3', 'G3', 'B3', 'D#4', 'F#4', 'A4', 'C#5', 'E5', 'G5', 'A#5'],
    'harp':            ['E1', 'G1', 'B1', 'D2', 'F2', 'A2', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'A4', 'C5', 'E5', 'G5', 'B5', 'D6', 'F6', 'A6', 'D7', 'F7'],
    'xylophone':       ['G4', 'C5', 'G5', 'C6', 'G6', 'C7', 'G7', 'C8'],
    'saxophone':       ['C#3', 'E3', 'G3', 'A#3', 'C#4', 'E4', 'G4', 'A#4', 'C#5', 'E5', 'G5'],
    'french-horn':     ['A1', 'C2', 'D#2', 'G2', 'D3', 'F3', 'A3', 'C4', 'D5', 'F5'],
    'trombone':        ['A#1', 'C#2', 'F2', 'G#2', 'C3', 'D#3', 'G#3', 'C4', 'D#4'],
    'tuba':            ['F1', 'A#1', 'D#2', 'A#2', 'D3', 'F3', 'A#3', 'D4'],
    'bassoon':         ['G2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'],
    'contrabass':      ['F#1', 'A#1', 'D2', 'F#2', 'A2', 'C#3', 'E3', 'G#3', 'B3'],
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
/**
 * Synthesizers with their parameters as data, like the effects in effects.js: each
 * engine is a Tone voice with starting options and a list of parameters a demo can
 * expose. A parameter has `key`, `label`, and `apply(synth, value)`, plus either a
 * range (`min`, `max`, `step`, `unit`, `scale`) or `options` (a list of values, for a
 * select), and its default `value`.
 *
 *   - subtractive: a bright oscillator through a resonant low-pass filter, the filter
 *     opened by its own envelope, then shaped by the amplitude envelope (ADSR).
 *   - filter: the subtractive engine's first half alone, an oscillator through a
 *     resonant low-pass filter that stays where it is set, with no envelope to speak
 *     of (the sound starts and stops at once and holds at full level).
 *   - envelope: the second half alone, a plain oscillator shaped by an ADSR envelope.
 *     Its stages are straight lines, so they can be drawn exactly (EnvelopeView).
 *   - fm: frequency modulation, one sine (the modulator) bending the pitch of another
 *     (the carrier); the ratio of their frequencies sets which partials appear and
 *     the index how strong they are.
 *   - am: amplitude modulation, one wave changing the loudness of another, which adds
 *     sidebands around each partial.
 */
const bothEnvelopes = (stage, v) => ({ envelope: { [stage]: v }, filterEnvelope: { [stage]: v } });
const SECONDS = { min: 0.005, max: 2, step: 0.005, unit: 's' };
export const SYNTH_ENGINES = [
    { id: 'subtractive', label: 'Subtractive', voice: Tone.MonoSynth, volume: -14, options: {
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 },
        filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5, baseFrequency: 300, octaves: 3 },
    }, params: [
        { key: 'wave', label: 'Wave', options: ['sawtooth', 'square', 'triangle', 'sine'], value: 'sawtooth',
          apply: (s, v) => s.set({ oscillator: { type: v } }) },
        { key: 'cutoff', label: 'Cutoff', min: 40, max: 5000, step: 1, scale: 'log', unit: 'Hz', value: 300,
          apply: (s, v) => s.set({ filterEnvelope: { baseFrequency: v } }) },
        { key: 'resonance', label: 'Resonance', min: 0.1, max: 15, step: 0.1, value: 2,
          apply: (s, v) => s.set({ filter: { Q: v } }) },
        { key: 'amount', label: 'Env amt', min: 0, max: 6, step: 0.1, value: 3,
          apply: (s, v) => s.set({ filterEnvelope: { octaves: v } }) },
        { key: 'attack', label: 'Attack', ...SECONDS, value: 0.01, apply: (s, v) => s.set(bothEnvelopes('attack', v)) },
        { key: 'decay', label: 'Decay', ...SECONDS, value: 0.3, apply: (s, v) => s.set(bothEnvelopes('decay', v)) },
        { key: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, value: 0.6,
          apply: (s, v) => s.set({ envelope: { sustain: v } }) },
        { key: 'release', label: 'Release', ...SECONDS, max: 4, value: 0.5, apply: (s, v) => s.set(bothEnvelopes('release', v)) },
    ] },
    { id: 'filter', label: 'Filter', voice: Tone.MonoSynth, volume: -14, options: {
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.02, decay: 0, sustain: 1, release: 0.05 },
        // Zero octaves: the envelope never moves the cutoff.
        filterEnvelope: { attack: 0, decay: 0, sustain: 1, release: 0, baseFrequency: 10000, octaves: 0 },
    }, params: [
        { key: 'wave', label: 'Wave', options: ['sawtooth', 'square', 'triangle', 'sine'], value: 'sawtooth',
          apply: (s, v) => s.set({ oscillator: { type: v } }) },
        { key: 'cutoff', label: 'Cutoff', min: 40, max: 10000, step: 1, scale: 'log', unit: 'Hz', value: 10000,
          apply: (s, v) => s.set({ filterEnvelope: { baseFrequency: v } }) },
        { key: 'resonance', label: 'Resonance', min: 0.1, max: 15, step: 0.1, value: 1,
          apply: (s, v) => s.set({ filter: { Q: v } }) },
    ] },
    { id: 'envelope', label: 'Envelope', voice: Tone.Synth, volume: -12, options: {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5,
            attackCurve: 'linear', decayCurve: 'linear', releaseCurve: 'linear' },
    }, params: [
        { key: 'wave', label: 'Wave', options: ['sawtooth', 'square', 'triangle', 'sine'], value: 'sawtooth',
          apply: (s, v) => s.set({ oscillator: { type: v } }) },
        { key: 'attack', label: 'Attack', ...SECONDS, value: 0.01, apply: (s, v) => s.set({ envelope: { attack: v } }) },
        { key: 'decay', label: 'Decay', ...SECONDS, value: 0.3, apply: (s, v) => s.set({ envelope: { decay: v } }) },
        { key: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, value: 0.6,
          apply: (s, v) => s.set({ envelope: { sustain: v } }) },
        { key: 'release', label: 'Release', ...SECONDS, value: 0.5, apply: (s, v) => s.set({ envelope: { release: v } }) },
    ] },
    { id: 'fm', label: 'FM', voice: Tone.FMSynth, volume: -12, options: {
        harmonicity: 2, modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 },
        modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.8 },
    }, params: [
        { key: 'ratio', label: 'Ratio', min: 0.5, max: 8, step: 0.5, value: 2, apply: (s, v) => s.set({ harmonicity: v }) },
        { key: 'index', label: 'Index', min: 0, max: 40, step: 0.5, value: 10, apply: (s, v) => s.set({ modulationIndex: v }) },
        { key: 'modDecay', label: 'Mod decay', ...SECONDS, value: 0.3, apply: (s, v) => s.set({ modulationEnvelope: { decay: v } }) },
        { key: 'attack', label: 'Attack', ...SECONDS, value: 0.01, apply: (s, v) => s.set({ envelope: { attack: v } }) },
        { key: 'release', label: 'Release', ...SECONDS, max: 4, value: 0.8, apply: (s, v) => s.set({ envelope: { release: v } }) },
    ] },
    { id: 'am', label: 'AM', voice: Tone.AMSynth, volume: -10, options: {
        harmonicity: 2,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.8 },
    }, params: [
        { key: 'ratio', label: 'Ratio', min: 0.25, max: 8, step: 0.25, value: 2, apply: (s, v) => s.set({ harmonicity: v }) },
        { key: 'attack', label: 'Attack', ...SECONDS, value: 0.01, apply: (s, v) => s.set({ envelope: { attack: v } }) },
        { key: 'release', label: 'Release', ...SECONDS, max: 4, value: 0.8, apply: (s, v) => s.set({ envelope: { release: v } }) },
    ] },
];

/** A synth from SYNTH_ENGINES, with `set(key, value)` and `get(key)` for its parameters. */
export class SynthEngine extends PolyInstrument {
    constructor(id) {
        const def = SYNTH_ENGINES.find(d => d.id === id);
        if (!def) throw new Error(`Unknown synth engine: ${id}`);
        super(def.voice, def.options, { volume: def.volume });
        this.def = def;
        this.values = {};
        for (const param of def.params) this.set(param.key, param.value);
    }

    get(key) { return this.values[key]; }

    set(key, value) {
        const param = this.def.params.find(p => p.key === key);
        if (!param) throw new Error(`Unknown parameter: ${this.def.id}.${key}`);
        this.values[key] = value;
        param.apply(this.synth, value);
    }
}

/**
 * One note of an instrument held for as long as it plays, with the start/stop/playing
 * contract of a continuous source, so wirePlayButton can sound a steady tone.
 */
export class HeldNote {
    constructor(instrument, midi) {
        this.instrument = instrument;
        this.midi = midi;
        this._playing = false;
    }

    get playing() { return this._playing; }
    start() { if (!this._playing) this.instrument.noteOn(this.midi); this._playing = true; }
    stop() { if (this._playing) this.instrument.noteOff(this.midi); this._playing = false; }
}

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
    // An electric piano in the manner of FM tine pianos: a sine modulating a sine at the
    // same frequency, the modulation fading fast so each note starts with a bell-like
    // bite and settles into a warm tone. Used for the backing in the jazz demos.
    { id: 'epiano', label: 'Electric piano', group: 'Synths', create: () => new PolyInstrument(Tone.FMSynth, {
        harmonicity: 1, modulationIndex: 4,
        oscillator: { type: 'sine' }, modulation: { type: 'sine' },
        envelope: { attack: 0.002, decay: 1.6, sustain: 0.25, release: 0.8 },
        modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.05, release: 0.5 },
    }, { volume: -8 }) },
    // The same tine piano with a stronger, longer bite, louder for backing a band.
    { id: 'epiano-bright', label: 'Electric piano (bright)', group: 'Synths', create: () => new PolyInstrument(Tone.FMSynth, {
        harmonicity: 1, modulationIndex: 9,
        oscillator: { type: 'sine' }, modulation: { type: 'sine' },
        envelope: { attack: 0.002, decay: 2, sustain: 0.35, release: 0.8 },
        modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0.1, release: 0.5 },
    }, { volume: -4 }) },
    // A drawbar organ: the fundamental and a few harmonics at fixed levels, sounding at
    // full level for as long as the key is held and stopping at once.
    { id: 'organ-synth', label: 'Drawbar organ', group: 'Synths', create: () => new PolyInstrument(Tone.Synth, {
        oscillator: { type: 'custom', partials: [1, 0.8, 0.6, 0.5, 0, 0.3, 0, 0.3] },
        envelope: { attack: 0.005, decay: 0, sustain: 1, release: 0.06 },
    }, { volume: -16 }) },
    // A soft pad: detuned saws with a slow attack and release.
    { id: 'pad', label: 'Synth pad', group: 'Synths', create: () => new PolyInstrument(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
        envelope: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 1.2 },
    }, { volume: -20 }) },
    // A synth bass: a saw through a low-pass filter that snaps open on each note.
    { id: 'synth-bass', label: 'Synth bass', group: 'Synths', create: () => new PolyInstrument(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', Q: 2 },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.15 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.2, baseFrequency: 100, octaves: 3 },
    }, { volume: -10 }) },
    // One voice, so its notes can bend (BendSynth): a sawtooth through a low-pass
    // filter that opens at the start of each note, like a lead guitar.
    { id: 'synth-lead', label: 'Synth lead', group: 'Synths', create: () => new BendSynth({
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', Q: 1 },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.7, release: 0.25 },
        filterEnvelope: { attack: 0.005, decay: 0.5, sustain: 0.5, release: 0.3, baseFrequency: 400, octaves: 3 },
    }, { volume: -12 }) },
    { id: 'piano', label: 'Piano', group: 'Sampled', create: () =>
        new SampledInstrument(salamanderUrls(), SALAMANDER_BASE, { release: 1, volume: -2 }) },
    { id: 'violin',   label: 'Violin',   group: 'Sampled', create: () => tonejsInstrument('violin',   { release: 0.6, volume: -10 }) },
    { id: 'cello',    label: 'Cello',    group: 'Sampled', create: () => tonejsInstrument('cello',    { release: 0.6, volume: -8 }) },
    { id: 'flute',    label: 'Flute',    group: 'Sampled', create: () => tonejsInstrument('flute',    { release: 0.4, volume: -7 }) },
    { id: 'clarinet', label: 'Clarinet', group: 'Sampled', create: () => tonejsInstrument('clarinet', { release: 0.4, volume: -11 }) },
    { id: 'trumpet',  label: 'Trumpet',  group: 'Sampled', create: () => tonejsInstrument('trumpet',  { release: 0.4, volume: -8 }) },
    { id: 'guitar',   label: 'Acoustic guitar', group: 'Sampled', create: () => tonejsInstrument('guitar-acoustic', { release: 1, volume: -11 }) },
    { id: 'bass',     label: 'Electric bass', group: 'Sampled', create: () => tonejsInstrument('bass-electric', { release: 0.3, volume: -4 }) },
    { id: 'organ',    label: 'Organ',    group: 'Sampled', create: () => tonejsInstrument('organ',    { release: 0.3, volume: -10 }) },
    { id: 'harmonium', label: 'Harmonium', group: 'Sampled', create: () => tonejsInstrument('harmonium', { release: 0.4, volume: -10 }) },
    { id: 'guitar-electric', label: 'Electric guitar', group: 'Sampled', create: () => tonejsInstrument('guitar-electric', { release: 0.8, volume: -8 }) },
    { id: 'guitar-nylon', label: 'Nylon guitar', group: 'Sampled', create: () => tonejsInstrument('guitar-nylon', { release: 1, volume: -8 }) },
    { id: 'harp',     label: 'Harp',     group: 'Sampled', create: () => tonejsInstrument('harp',     { release: 1.5, volume: -6 }) },
    { id: 'xylophone', label: 'Xylophone', group: 'Sampled', create: () => tonejsInstrument('xylophone', { release: 0.6, volume: -8 }) },
    { id: 'saxophone', label: 'Saxophone', group: 'Sampled', create: () => tonejsInstrument('saxophone', { release: 0.3, volume: -8 }) },
    { id: 'french-horn', label: 'French horn', group: 'Sampled', create: () => tonejsInstrument('french-horn', { release: 0.5, volume: -6 }) },
    { id: 'trombone', label: 'Trombone', group: 'Sampled', create: () => tonejsInstrument('trombone', { release: 0.4, volume: -6 }) },
    { id: 'tuba',     label: 'Tuba',     group: 'Sampled', create: () => tonejsInstrument('tuba',     { release: 0.4, volume: -4 }) },
    { id: 'bassoon',  label: 'Bassoon',  group: 'Sampled', create: () => tonejsInstrument('bassoon',  { release: 0.4, volume: -6 }) },
    { id: 'contrabass', label: 'Contrabass', group: 'Sampled', create: () => tonejsInstrument('contrabass', { release: 0.5, volume: -4 }) },
    { id: 'drums', label: 'Drum kit', group: 'Drums', create: () => new DrumKit() },
    { id: 'white-noise', label: 'White noise', group: 'Noise', create: () => new NoiseInstrument('white', { volume: -14 }) },
    { id: 'pink-noise',  label: 'Pink noise',  group: 'Noise', create: () => new NoiseInstrument('pink', { volume: -8 }) },
];

export function createInstrument(id) {
    const def = INSTRUMENTS.find(d => d.id === id);
    if (!def) throw new Error(`Unknown instrument: ${id}`);
    return def.create();
}
