import * as Tone from 'tone';
import { DRUM_NOTES } from './instruments.js';

/**
 * Rhythm patterns and a step sequencer that plays them on a drum kit.
 *
 * A pattern is one cycle (usually a bar) of equal steps:
 *
 *   {
 *     id, label,
 *     stepsPerBeat,   // steps in one beat; the tempo counts beats per minute
 *     groups,         // steps per beat group, in order, summing to the step count
 *                     // ([4, 4, 4, 4] for 4/4 in sixteenths, [2, 2, 3] for 7/8)
 *     tempo,          // a suitable tempo in beats per minute
 *     tracks: [{ id, label, midi, steps, offset?, gain? }],
 *   }
 *
 * Each track's `steps` holds one velocity per step, 0–1, where 0 is silence. A track
 * may be moved off the grid by `offset` seconds (negative is early) and scaled by
 * `gain`. Patterns are written as strings, one character per step: `X` is a full hit,
 * `x` a soft one (half velocity), and `-` a rest.
 */

/** The drum tracks a pattern can use, top to bottom: high sounds first. */
export const DRUM_TRACKS = [
    { id: 'hat',   label: 'Hat',   midi: DRUM_NOTES.hat },
    { id: 'rim',   label: 'Rim',   midi: DRUM_NOTES.rim },
    { id: 'snare', label: 'Snare', midi: DRUM_NOTES.snare },
    { id: 'kick',  label: 'Kick',  midi: DRUM_NOTES.kick },
];

/** Velocities of a full and a soft hit. */
export const FULL = 1;
export const SOFT = 0.5;

const VELOCITY = { X: FULL, x: SOFT, '-': 0 };

/** Parses `X`, `x`, and `-` into velocities; spaces are ignored (for readability). */
export function parseSteps(text) {
    return [...text.replace(/\s/g, '')].map(c => VELOCITY[c] ?? 0);
}

/**
 * Builds a pattern from strings per track. `trackIds` picks the tracks (in
 * DRUM_TRACKS order); a track without a string is all rests.
 */
export function makePattern({ id, label, stepsPerBeat, groups, tempo, tracks, trackIds = DRUM_TRACKS.map(t => t.id) }) {
    const steps = groups.reduce((a, b) => a + b, 0);
    return {
        id, label, stepsPerBeat, groups, tempo,
        tracks: DRUM_TRACKS.filter(t => trackIds.includes(t.id)).map(t => {
            const parsed = tracks[t.id] ? parseSteps(tracks[t.id]) : [];
            return { ...t, steps: Array.from({ length: steps }, (_, i) => parsed[i] ?? 0) };
        }),
    };
}

/** A copy that can be edited without changing the original. */
export function clonePattern(pattern) {
    return { ...pattern, groups: [...pattern.groups], tracks: pattern.tracks.map(t => ({ ...t, steps: [...t.steps] })) };
}

/**
 * A steady pulse on the rim click: `count` steps of one beat each. With `accent`, every
 * `accent`-th beat (starting with the first) is a full hit and the others are soft, so
 * the pulse falls into cycles of that length; without it every beat is the same.
 */
export function pulsePattern(count, accent = null) {
    const steps = Array.from({ length: count }, (_, i) => !accent ? 0.7 : i % accent === 0 ? FULL : 0.4);
    const groups = accent ? Array(count / accent).fill(accent) : [count];
    return {
        id: 'pulse', label: 'Pulse', stepsPerBeat: 1, groups, tempo: 120,
        tracks: [{ ...DRUM_TRACKS.find(t => t.id === 'rim'), steps }],
    };
}

const quarters = (beats, perBeat) => Array(beats).fill(perBeat);

/** Patterns in common time signatures, in eighth-note steps. */
export const METER_PATTERNS = [
    makePattern({ id: '4-4', label: '4/4', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 100, tracks: {
        hat:   'X x X x X x X x',
        snare: '- - X - - - X -',
        kick:  'X - - - X - - -',
    } }),
    makePattern({ id: '3-4', label: '3/4', stepsPerBeat: 2, groups: quarters(3, 2), tempo: 120, tracks: {
        hat:   'X x X x X x',
        snare: '- - x - x -',
        kick:  'X - - - - -',
    } }),
    makePattern({ id: '6-8', label: '6/8', stepsPerBeat: 3, groups: [3, 3], tempo: 66, tracks: {
        hat:   'X x x X x x',
        snare: '- - - X - -',
        kick:  'X - - - - -',
    } }),
    makePattern({ id: '5-4', label: '5/4', stepsPerBeat: 2, groups: quarters(5, 2), tempo: 160, tracks: {
        hat:   'X x X x X x X x X x',
        snare: '- - - - X - - - X -',
        kick:  'X - - - - - X - - -',
    } }),
    makePattern({ id: '7-8', label: '7/8', stepsPerBeat: 2, groups: [2, 2, 3], tempo: 120, tracks: {
        hat:   'X x X x X x x',
        snare: '- - X - - - -',
        kick:  'X - - - X - -',
    } }),
];

/**
 * Patterns with different subdivisions and feels. The straight ones are in sixteenth
 * notes; the shuffle and swing in eighth-note triplets (three steps a beat); the bossa
 * nova in eighth notes over two bars.
 */
export const FEEL_PATTERNS = [
    makePattern({ id: 'quarters', label: 'Quarter notes', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 100, tracks: {
        hat:   'X - - - X - - - X - - - X - - -',
        snare: '- - - - X - - - - - - - X - - -',
        kick:  'X - - - - - - - X - - - - - - -',
    } }),
    makePattern({ id: 'eighths', label: 'Eighth notes', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 100, tracks: {
        hat:   'X - x - X - x - X - x - X - x -',
        snare: '- - - - X - - - - - - - X - - -',
        kick:  'X - - - - - - - X - - - - - - -',
    } }),
    makePattern({ id: 'sixteenths', label: 'Sixteenth notes', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 100, tracks: {
        hat:   'X x x x X x x x X x x x X x x x',
        snare: '- - - - X - - - - - - - X - - -',
        kick:  'X - - - - - - - X - - - - - - -',
    } }),
    makePattern({ id: 'funk', label: 'Funk', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 96, tracks: {
        hat:   'X x X x X x X x X x X x X x X x',
        snare: '- - - - X - - x - x - - X - - x',
        kick:  'X - X - - - - - - - X X - - - -',
    } }),
    makePattern({ id: 'shuffle', label: 'Shuffle', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 100, tracks: {
        hat:   'X - x X - x X - x X - x',
        snare: '- - - X - - - - - X - -',
        kick:  'X - - - - - X - x - - -',
    } }),
    makePattern({ id: 'swing', label: 'Swing', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 140, tracks: {
        hat:   'X - - X - x X - - X - x',
        rim:   '- - - X - - - - - X - -',
        kick:  'x - - x - - x - - x - -',
    } }),
    makePattern({ id: 'bossa-nova', label: 'Bossa nova', stepsPerBeat: 2, groups: quarters(8, 2), tempo: 130, tracks: {
        hat:   'X x X x X x X x X x X x X x X x',
        rim:   'X - - X - - X - - - X - - X - -',
        kick:  'X - - x X - - x X - - x X - - x',
    } }),
];

/**
 * The simple rock beat used to hear timing and loudness: snare on beats 2 and 4. The
 * snare is written soft so a demo can raise its gain up to a full hit.
 */
export const BACKBEAT = makePattern({
    id: 'backbeat', label: 'Backbeat', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 92,
    trackIds: ['hat', 'snare', 'kick'],
    tracks: {
        hat:   'x x x x x x x x',
        snare: '- - x - - - x -',
        kick:  'X - - - X - - -',
    },
});

/** Named sets of patterns, for a demo that takes the set as a URL parameter. */
export const PATTERN_SETS = { meters: METER_PATTERNS, feels: FEEL_PATTERNS };

// How far ahead notes are scheduled, and how often the scheduler wakes. The lead also
// covers the earliest a track can be moved ahead of the grid (see MAX_EARLY).
const AHEAD = 0.1;
const TICK_MS = 25;
/** The earliest a track's `offset` can move it, in seconds. */
export const MAX_EARLY = 0.1;

/**
 * Plays a pattern in a loop on an instrument (a DrumKit), step by step, until stopped.
 * Notes are scheduled a little ahead on the audio clock, so they land exactly on time
 * (or exactly `offset` off it) however busy the page is; `onStep(i)` is called as step
 * `i` sounds, for drawing, and with -1 when stopped. Changing `pattern` or `tempo`
 * while playing takes effect from the next step. Same start/stop/playing contract as a
 * continuous source, so it works with wirePlayButton.
 */
export class StepSequencer {
    /**
     * @param {object}   instrument  anything with noteOn(midi, velocity, time).
     * @param {object}   [opts]
     * @param {object}   [opts.pattern]
     * @param {number}   [opts.tempo]   beats per minute.
     * @param {Function} [opts.onStep]
     */
    constructor(instrument, { pattern = null, tempo = 100, onStep = () => {} } = {}) {
        this.instrument = instrument;
        this.pattern = pattern;
        this.tempo = tempo;
        this.onStep = onStep;
        this._timer = null;
        this._draws = new Set();
    }

    get playing() { return this._timer !== null; }

    /** Seconds from one step to the next at the current tempo. */
    get stepDuration() { return 60 / this.tempo / this.pattern.stepsPerBeat; }

    start() {
        this.stop();
        this._step = 0;
        this._next = Tone.immediate() + MAX_EARLY + 0.02;
        this._timer = setInterval(() => this._schedule(), TICK_MS);
        this._schedule();
    }

    stop() {
        if (this._timer === null) return;
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        this.onStep(-1);
    }

    _schedule() {
        const now = Tone.immediate();
        // Steps are taken MAX_EARLY ahead of the usual lead, so a track moved early
        // still lands in the future.
        while (this._next < now + AHEAD + MAX_EARLY) {
            const { pattern } = this;
            const i = this._step % pattern.tracks[0].steps.length;
            for (const track of pattern.tracks) {
                const velocity = track.steps[i] * (track.gain ?? 1);
                if (velocity > 0) this.instrument.noteOn(track.midi, velocity, this._next + (track.offset ?? 0));
            }
            const draw = setTimeout(() => { this._draws.delete(draw); this.onStep(i); },
                Math.max(0, (this._next - now) * 1000));
            this._draws.add(draw);
            this._next += this.stepDuration;
            this._step = i + 1;
        }
    }
}

/**
 * Two voices playing the same loop of notes, the second a little faster, so they
 * drift out of phase and back in, as in Steve Reich's phase music. Each voice plays
 * its own instrument, panned to its own side. `drift` is how much faster the second
 * voice is, in percent (0 is unison). `onStep(voice, i)` is called as each voice plays
 * note `i` of the loop, and with (-1, -1) when stopped. Same start/stop/playing
 * contract as a continuous source.
 */
export class PhasePlayer {
    /**
     * @param {object[]} instruments  two instruments, not connected elsewhere.
     * @param {object}   [opts]
     * @param {number[]} [opts.notes]  the loop, as MIDI numbers.
     * @param {number}   [opts.step]   seconds per note for the first voice.
     * @param {number}   [opts.drift]  percent.
     */
    constructor(instruments, { notes = [], step = 0.15, drift = 0, onStep = () => {} } = {}) {
        this.output = new Tone.Gain();
        this.instruments = instruments;
        instruments.forEach((inst, v) => {
            const panner = new Tone.Panner(v === 0 ? -0.5 : 0.5).connect(this.output);
            inst.output.connect(panner);
        });
        this.notes = notes;
        this.step = step;
        this.drift = drift;
        this.onStep = onStep;
        this._timer = null;
        this._draws = new Set();
    }

    get playing() { return this._timer !== null; }

    start() {
        this.stop();
        const t0 = Tone.immediate() + 0.05;
        this._voices = this.instruments.map(() => ({ next: t0, i: 0 }));
        this._timer = setInterval(() => this._schedule(), TICK_MS);
        this._schedule();
    }

    stop() {
        if (this._timer === null) return;
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        this.instruments.forEach(inst => inst.releaseAll());
        this.onStep(-1, -1);
    }

    _schedule() {
        const now = Tone.immediate();
        this._voices.forEach((voice, v) => {
            const duration = v === 0 ? this.step : this.step / (1 + this.drift / 100);
            while (voice.next < now + AHEAD) {
                const midi = this.notes[voice.i];
                this.instruments[v].noteOn(midi, 0.6, voice.next);
                this.instruments[v].noteOff(midi, voice.next + duration * 0.9);
                const i = voice.i;
                const draw = setTimeout(() => { this._draws.delete(draw); this.onStep(v, i); },
                    Math.max(0, (voice.next - now) * 1000));
                this._draws.add(draw);
                voice.next += duration;
                voice.i = (voice.i + 1) % this.notes.length;
            }
        });
    }
}

/** An original twelve-note loop for the phasing demo. */
export const PHASE_LOOP = [62, 65, 69, 72, 67, 65, 62, 72, 69, 65, 67, 72];
