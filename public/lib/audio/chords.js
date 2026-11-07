import * as Tone from 'tone';
import { FEEL_PATTERNS, HAMMER } from './rhythm.js';

/**
 * Chords, chord progressions, and a player for them.
 *
 * A chord is written as a symbol: a root (C, F♯, B♭ …), a quality from QUALITIES
 * (`m7`, `maj7`, `7`, `m7♭5` …), optional tensions in parentheses (`G7(♭9)`,
 * `Cmaj7(♯11)`), and an optional bass note after a slash (`D♭/F`). Flats and sharps
 * may be written ♭/♯ or b/#. `parseChord` turns a symbol into pitch classes;
 * `voiceProgression` turns a list of chords into MIDI notes that move smoothly.
 *
 * A progression is `{ id, label, tempo, loop?, chords, melody?, riff?, comp?, voicing?, bassLow?, drums?, sounds? }`:
 *   - `chords`: `[{ symbol, beats, roman?, fn?, bass?, notes? }]`. `roman` is the Roman
 *     numeral shown under the chord, `fn` its function (T, SD, D, SDm). `bass` (MIDI)
 *     places the bass note itself, outside the usual range (see bassLow). `notes`
 *     (MIDI numbers) voices a chord by hand instead, for chords that are not
 *     stacks of thirds (quartal chords, chords from a twelve-tone row).
 *   - `melody`: `[{ midi, beats }]` played over the chords (`midi: null` is a rest).
 *   - `riff`: `[[semitones, beats], …]`, a bass riff played up from each chord's bass
 *     note in place of the held bass, repeated through the chord.
 *   - `comp`: `[[part, beats], …]`, a rhythm for the chords in place of holding them,
 *     repeated through each chord: `'bass'` plays the bass note, `'upper'` the notes
 *     above it, `'all'` both, and `null` rests (see compHits).
 *   - `voicing`: `'open'` spreads each chord's notes at their own intervals above the
 *     root, so tensions sit above the chord tones (see voiceProgression).
 *   - `bassLow`: the lowest bass note (MIDI); the bass of every chord falls in the
 *     octave from it. Defaults to E2 (40).
 *   - `drums`: a rhythm pattern (see rhythm.js), looped along with the chords.
 *   - `sounds`: `{ chords, melody }`, instrument ids from INSTRUMENTS (default piano),
 *     for the demo to create.
 */

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Semitones above the root for each quality. */
export const QUALITIES = {
    '':      [0, 4, 7],
    'm':     [0, 3, 7],
    'dim':   [0, 3, 6],
    'aug':   [0, 4, 8],
    'sus2':  [0, 2, 7],
    'sus4':  [0, 5, 7],
    '6':     [0, 4, 7, 9],
    'm6':    [0, 3, 7, 9],
    'maj7':  [0, 4, 7, 11],
    '7':     [0, 4, 7, 10],
    'm7':    [0, 3, 7, 10],
    'm7b5':  [0, 3, 6, 10],
    'dim7':  [0, 3, 6, 9],
    'mMaj7': [0, 3, 7, 11],
    '7sus4': [0, 5, 7, 10],
    '7#5':   [0, 4, 8, 10],
    'maj7#5': [0, 4, 8, 11],
    'maj9':  [0, 4, 7, 11, 14],
    '9':     [0, 4, 7, 10, 14],
    'm9':    [0, 3, 7, 10, 14],
    'm11':   [0, 3, 7, 10, 14, 17],
    '13':    [0, 4, 7, 10, 14, 21],
    'maj13': [0, 4, 7, 11, 14, 21],
    '6/9':   [0, 4, 7, 9, 14],
    '7alt':  [0, 4, 10, 13, 15, 20],
};

/** Semitones above the root for tensions written in parentheses. */
const TENSIONS = { 'b9': 13, '9': 14, '#9': 15, '11': 17, '#11': 18, 'b13': 20, '13': 21 };

const ascii = s => s.replace(/♭/g, 'b').replace(/♯/g, '#');

function parsePitchClass(name) {
    const letter = name[0], accidental = ascii(name.slice(1));
    if (!(letter in LETTER_PC)) throw new Error(`Bad note name: ${name}`);
    return (LETTER_PC[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) + 12) % 12;
}

/**
 * Parses a chord symbol into `{ symbol, root, bass, intervals }`: the root and bass
 * as pitch classes (0 = C) and the chord tones as semitones above the root (which may
 * pass the octave for tensions).
 */
export function parseChord(symbol) {
    let body = symbol, bassName = null;
    const slash = symbol.match(/^(.+)\/([A-G][♭♯b#]?)$/);
    if (slash) { body = slash[1]; bassName = slash[2]; }
    const m = body.match(/^([A-G][♭♯b#]?)(.*)$/);
    if (!m) throw new Error(`Bad chord symbol: ${symbol}`);
    const root = parsePitchClass(m[1]);
    let rest = ascii(m[2]), tensions = [];
    const paren = rest.match(/^(.*)\(([^)]*)\)$/);
    if (paren) {
        rest = paren[1];
        tensions = paren[2].split(/[,\s]+/).filter(Boolean).map(t => {
            if (!(t in TENSIONS)) throw new Error(`Bad tension ${t} in ${symbol}`);
            return TENSIONS[t];
        });
    }
    const quality = QUALITIES[rest];
    if (!quality) throw new Error(`Unknown chord quality "${rest}" in ${symbol}`);
    const intervals = [...new Set([...quality, ...tensions])].sort((a, b) => a - b);
    return { symbol, root, bass: bassName ? parsePitchClass(bassName) : root, intervals };
}

// Voicing ranges: the bass from E2 up an octave, the other notes from E3 up.
const BASS_LOW = 40;
const UPPER_LOW = 52;
const UPPER_CENTER = 64;

/**
 * The notes above the bass, as intervals above the root: every chord tone, except that
 * the root is left to the bass in chords of four or more tones (when the bass is the
 * root), and the fifth is left out of chords with five or more (it adds the least) and
 * of chords with a raised fifth or flat 13th, which would rub against it.
 */
function upperIntervals({ root, bass, intervals }) {
    let ivs = intervals;
    if (ivs.length >= 4 && bass === root) ivs = ivs.filter(i => i !== 0);
    if (ivs.length >= 5 || ivs.includes(8) || ivs.includes(20)) ivs = ivs.filter(i => i !== 7);
    return ivs;
}

/** The same notes as pitch classes. */
function upperPitchClasses(parsed) {
    return [...new Set(upperIntervals(parsed).map(i => (parsed.root + i) % 12))];
}

/**
 * An open voicing: the upper notes at their own intervals above the root (the 9th a
 * ninth up, the 13th a thirteenth up) rather than packed into one octave, from the
 * lowest octave that keeps them clear of the bass. Tensions then sit above the chord
 * tones instead of between them.
 */
function openVoicing(parsed, bass) {
    const ivs = [...new Set(upperIntervals(parsed))].sort((a, b) => a - b);
    let root = bass - ((parsed.bass - parsed.root + 12) % 12);
    while (root + ivs[0] < UPPER_LOW - 2 || root + ivs[0] <= bass + 2) root += 12;
    return ivs.map(i => root + i);
}

/** Close-position voicings of pitch classes, each from a different chord tone at the bottom. */
function candidates(pcs, low) {
    const sorted = [...pcs].sort((a, b) => a - b);
    const out = [];
    for (let r = 0; r < sorted.length; r++) {
        const order = [...sorted.slice(r), ...sorted.slice(0, r)];
        for (const octaveLow of [low - 12, low, low + 12]) {
            let prev = octaveLow + ((order[0] - octaveLow) % 12 + 12) % 12;
            const notes = [prev];
            for (const pc of order.slice(1)) {
                prev += ((pc - prev) % 12 + 12) % 12 || 12;
                notes.push(prev);
            }
            out.push(notes);
        }
    }
    return out;
}

/** How far a voicing moves from the previous one: each note to its nearest old note. */
function motion(notes, previous) {
    if (!previous?.length) return notes.reduce((s, n) => s + Math.abs(n - UPPER_CENTER), 0) / notes.length;
    return notes.reduce((s, n) => s + Math.min(...previous.map(p => Math.abs(n - p))), 0);
}

/**
 * Voices a list of chords for piano: the bass note low, the other tones in close
 * position above it, each chord in the inversion that moves least from the one
 * before (smooth voice leading). With a melody, the chords stay below the melody notes
 * they sound under. The bass falls in the octave from `bassLow`. With `open`, every
 * chord takes an open voicing instead (see openVoicing), without voice leading. Returns
 * `{ bass, upper, notes }` per chord, in MIDI numbers. Chords with hand-written
 * `notes` keep them.
 */
export function voiceProgression(chords, melody = [], { bassLow = BASS_LOW, open = false } = {}) {
    // The lowest melody note during each chord, to keep the chord under it.
    const ceilings = [];
    let start = 0;
    for (const chord of chords) {
        const end = start + chord.beats;
        let t = 0, ceiling = Infinity;
        for (const note of melody) {
            if (note.midi !== null && t < end && t + note.beats > start) ceiling = Math.min(ceiling, note.midi);
            t += note.beats;
        }
        ceilings.push(ceiling);
        start = end;
    }

    let previous = null;
    return chords.map((chord, i) => {
        if (chord.notes) {
            if (chord.notes.length) previous = chord.notes.slice(1);
            return { bass: chord.notes[0], upper: chord.notes.slice(1), notes: chord.notes };
        }
        const parsed = parseChord(chord.symbol);
        const bass = chord.bass ?? bassLow + ((parsed.bass - bassLow) % 12 + 12) % 12;
        if (open) {
            const upper = openVoicing(parsed, bass);
            return { bass, upper, notes: [bass, ...upper] };
        }
        const options = candidates(upperPitchClasses(parsed), UPPER_LOW)
            .filter(v => v[0] >= UPPER_LOW - 2 && v[0] > bass + 2);
        const fits = options.filter(v => v[v.length - 1] < ceilings[i] - 1);
        const pool = fits.length ? fits : options;
        const upper = pool.reduce((best, v) => motion(v, previous) < motion(best, previous) ? v : best);
        previous = upper;
        return { bass, upper, notes: [bass, ...upper] };
    });
}

/** How hard each part of a `comp` is played. */
const COMP_VELOCITY = { bass: 0.6, upper: 0.4, all: 0.5 };

/**
 * What each chord of a progression plays, as hits: one list per chord of
 * `{ at, beats, notes, part }`, with `at` in beats from the chord's start. Without a
 * `comp`, a chord is one hit held for its whole length (without its bass when a riff
 * plays the bass). With one, the comp repeats through the chord and is cut at its end.
 */
export function compHits(progression, voicings) {
    const { chords, comp, riff } = progression;
    return chords.map((chord, i) => {
        const v = voicings[i];
        if (!comp) return [{ at: 0, beats: chord.beats, notes: riff && v.notes.length ? v.upper : v.notes, part: 'all' }];
        const hits = [];
        for (let t = 0, k = 0; t < chord.beats - 1e-6; k++) {
            const [part, beats] = comp[k % comp.length];
            const notes = v.notes.length ? { bass: [v.bass], upper: v.upper, all: v.notes }[part] ?? [] : [];
            if (notes.length) hits.push({ at: t, beats: Math.min(beats, chord.beats - t), notes, part });
            t += beats;
        }
        return hits;
    });
}

// ── Progressions ─────────────────────────────────────────────────────────────

/** Chords of `beats` each from `[symbol, roman, fn]` triples (roman and fn optional). */
function chords(beats, list) {
    return list.map(([symbol, roman = '', fn = '']) => ({ symbol, beats, roman, fn }));
}

/** A melody from `[note, beats]` pairs, note names with octaves (`'C5'`, `'Bb4'`, ASCII flats) or null for rests. */
function melody(list) {
    return list.map(([name, beats]) => ({ midi: name === null ? null : Tone.Frequency(name).toMidi(), beats }));
}

const C = 60;   // C4, for hand-voiced chords and bass ranges

/** A comp that strikes the chord on every beat, so the chords keep time. */
const EVERY_BEAT = [['all', 1]];

export const DIATONIC_PROGRESSIONS = [
    // The bass climbs the scale, ending on C4 an octave above where it started.
    { id: 'diatonic-triads', label: 'Diatonic triads', tempo: 100, bassLow: C - 12, chords: [
        ...chords(2, [
            ['C', 'I', 'T'], ['Dm', 'ii', 'SD'], ['Em', 'iii', 'T'], ['F', 'IV', 'SD'],
            ['G', 'V', 'D'], ['Am', 'vi', 'T'], ['Bdim', 'vii°', 'D'],
        ]),
        { symbol: 'C', beats: 2, roman: 'I', fn: 'T', bass: C },
    ] },
    // The progressions strike each chord on every beat, four times.
    { id: 'i-iv-v-i', label: 'I–IV–V–I', tempo: 90, bassLow: C - 12, comp: [['all', 1]], chords: chords(4, [
        ['C', 'I', 'T'], ['F', 'IV', 'SD'], ['G', 'V', 'D'], ['C', 'I', 'T'],
    ]) },
    { id: 'i-vi-iv-v', label: 'I–vi–IV–V', tempo: 90, loop: true, bassLow: C - 12, comp: [['all', 1]], chords: chords(4, [
        ['C', 'I', 'T'], ['Am', 'vi', 'T'], ['F', 'IV', 'SD'], ['G', 'V', 'D'],
    ]) },
];

/** A key's seven triads in order, then the tonic again with its bass an octave up. */
function scaleTriads(list) {
    return [...chords(2, list), { ...chords(2, [list[0]])[0], bass: C }];
}

/**
 * The diatonic triads of C minor in its three forms, natural, harmonic, and melodic,
 * with the bass climbing from C3 to C4 as in the major set.
 */
export const DIATONIC_MINOR_PROGRESSIONS = [
    { id: 'natural-minor-triads', label: 'Natural minor', tempo: 100, bassLow: C - 12, chords: scaleTriads([
        ['Cm', 'i'], ['Ddim', 'ii°'], ['E♭', '♭III'], ['Fm', 'iv'], ['Gm', 'v'], ['A♭', '♭VI'], ['B♭', '♭VII'],
    ]) },
    { id: 'harmonic-minor-triads', label: 'Harmonic minor', tempo: 100, bassLow: C - 12, chords: scaleTriads([
        ['Cm', 'i'], ['Ddim', 'ii°'], ['E♭aug', '♭III+'], ['Fm', 'iv'], ['G', 'V'], ['A♭', '♭VI'], ['Bdim', 'vii°'],
    ]) },
    { id: 'melodic-minor-triads', label: 'Melodic minor', tempo: 100, bassLow: C - 12, chords: scaleTriads([
        ['Cm', 'i'], ['Dm', 'ii'], ['E♭aug', '♭III+'], ['F', 'IV'], ['G', 'V'], ['Adim', 'vi°'], ['Bdim', 'vii°'],
    ]) },
];

/** The dominant in C minor: the natural minor's v, then V7 in common progressions. */
export const MINOR_DOMINANT_PROGRESSIONS = [
    { id: 'i-iv-v-i', label: 'i–iv–v–i', chords: chords(4, [
        ['Cm', 'i'], ['Fm', 'iv'], ['Gm', 'v'], ['Cm', 'i'],
    ]) },
    { id: 'i-iv-v7-i', label: 'i–iv–V7–i', chords: chords(4, [
        ['Cm', 'i'], ['Fm', 'iv'], ['G7', 'V7'], ['Cm', 'i'],
    ]) },
    { id: 'i-v7', label: 'i–V7', chords: chords(4, [
        ['Cm', 'i'], ['G7', 'V7'], ['Cm', 'i'], ['G7', 'V7'],
    ]) },
    { id: 'minor-ii-v-i', label: 'i7–iv7–iiø7–V7', chords: chords(4, [
        ['Cm7', 'i7'], ['Fm7', 'iv7'], ['Dm7♭5', 'iiø7'], ['G7', 'V7'],
    ]) },
].map(p => ({ ...p, tempo: 96, loop: true, bassLow: C - 12, comp: EVERY_BEAT }));

/**
 * The other chords of C minor in use: natural-minor loops with ♭VI, ♭VII, and ♭III,
 * the Dorian IV from melodic minor, the line cliché, and the diminished seventh.
 */
export const MINOR_COLOR_PROGRESSIONS = [
    { id: 'i-bvii-bvi-bvii', label: 'i–♭VII–♭VI–♭VII', tempo: 104, chords: chords(4, [
        ['Cm', 'i'], ['B♭', '♭VII'], ['A♭', '♭VI'], ['B♭', '♭VII'],
    ]) },
    { id: 'i-bvi-biii-bvii', label: 'i–♭VI–♭III–♭VII', tempo: 96, chords: chords(4, [
        ['Cm', 'i'], ['A♭', '♭VI'], ['E♭', '♭III'], ['B♭', '♭VII'],
    ]) },
    { id: 'i-iv-dorian', label: 'i7–IV7', tempo: 112, chords: chords(4, [
        ['Cm7', 'i7'], ['F7', 'IV7'], ['Cm7', 'i7'], ['F7', 'IV7'],
    ]) },
    { id: 'line-cliche', label: 'Line cliché', tempo: 84, chords: chords(4, [
        ['Cm', 'i'], ['CmMaj7', 'i(maj7)'], ['Cm7', 'i7'], ['Cm6', 'i6'],
    ]) },
    { id: 'i-viidim7-i', label: 'i–vii°7–i', tempo: 84, chords: chords(4, [
        ['Cm', 'i'], ['Fm', 'iv'], ['Bdim7', 'vii°7'], ['Cm', 'i'],
    ]) },
].map(p => ({ ...p, loop: true, bassLow: C - 12, comp: EVERY_BEAT }));

// ── Chord scales ──

/** The major, melodic minor (jazz minor), and harmonic minor scales, in semitones from the root. */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MELODIC_MINOR_STEPS = [0, 2, 3, 5, 7, 9, 11];
const HARMONIC_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 11];

/** Mode `k` (0 for the scale itself) of a scale, in semitones from its own root. */
function mode(steps, k) {
    return steps.map((_, i) => (steps[(i + k) % 7] - steps[k] + 12) % 12);
}

/**
 * Chords, each with its chord scale run up an octave over it in eighth notes as the
 * melody, from the chord's root in octave 4: `[symbol, roman, steps, beats = 4]`. With
 * `steps` null the chord is held with no run.
 */
function chordScaleRuns(list) {
    const melody = [];
    const chordList = list.map(([symbol, roman, steps, beats = 4]) => {
        if (steps) {
            const root = C + parseChord(symbol).root;
            [...steps, 12].forEach(s => melody.push({ midi: root + s, beats: 0.5 }));
            if (beats > 4) melody.push({ midi: null, beats: beats - 4 });
        } else {
            melody.push({ midi: null, beats });
        }
        return { symbol, beats, roman };
    });
    return { chords: chordList, melody };
}

/** The seven chord scales of C melodic minor and of C harmonic minor, each mode over its seventh chord. */
export const MINOR_MODE_PROGRESSIONS = [
    { id: 'melodic-minor-modes', label: 'Melodic minor modes', ...chordScaleRuns([
        ['CmMaj7', 'I'], ['Dm7', 'II'], ['E♭maj7♯5', 'III'], ['F7(♯11)', 'IV'],
        ['G7(♭13)', 'V'], ['Am7♭5', 'VI'], ['B7alt', 'VII'],
    ].map(([symbol, roman], k) => [symbol, roman, mode(MELODIC_MINOR_STEPS, k)])) },
    { id: 'harmonic-minor-modes', label: 'Harmonic minor modes', ...chordScaleRuns([
        ['CmMaj7', 'I'], ['Dm7♭5', 'II'], ['E♭maj7♯5', 'III'], ['Fm7(♯11)', 'IV'],
        ['G7(♭9, ♭13)', 'V'], ['A♭maj7(♯9)', 'VI'], ['Bdim7', 'VII'],
    ].map(([symbol, roman], k) => [symbol, roman, mode(HARMONIC_MINOR_STEPS, k)])) },
].map(p => ({ ...p, tempo: 96 }));

/**
 * Those chord scales in use: a minor ii–V–i with each system, a tritone substitute, and
 * chords borrowed into C major.
 */
export const MINOR_CHORD_SCALE_PROGRESSIONS = [
    { id: 'ii-v-i-altered', label: 'ii–V–i, altered', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', mode(MELODIC_MINOR_STEPS, 5)],
        ['G7alt', 'V7alt', mode(MELODIC_MINOR_STEPS, 6)],
        ['Cm6', 'i6', MELODIC_MINOR_STEPS, 8],
    ]) },
    { id: 'ii-v-i-harmonic', label: 'ii–V–i, harmonic', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', mode(HARMONIC_MINOR_STEPS, 1)],
        ['G7(♭9, ♭13)', 'V7', mode(HARMONIC_MINOR_STEPS, 4)],
        ['CmMaj7', 'i(maj7)', HARMONIC_MINOR_STEPS, 8],
    ]) },
    { id: 'tritone-substitute', label: 'Tritone substitute', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', mode(MELODIC_MINOR_STEPS, 5)],
        ['D♭7(♯11)', 'subV7', mode(MELODIC_MINOR_STEPS, 3)],
        ['Cm6', 'i6', MELODIC_MINOR_STEPS, 8],
    ]) },
    { id: 'borrowed-in-major', label: 'Borrowed in C major', ...chordScaleRuns([
        ['Cmaj7', 'Imaj7', MAJOR_STEPS],
        ['A♭maj7', '♭VImaj7', mode(HARMONIC_MINOR_STEPS, 5)],
        ['Fm6', 'iv6', MELODIC_MINOR_STEPS],
        ['B♭7(♯11)', '♭VII7', mode(MELODIC_MINOR_STEPS, 3)],
        ['Cmaj7', 'Imaj7', MAJOR_STEPS, 8],
    ]) },
].map(p => ({ ...p, tempo: 96 }));

export const CHORD_TYPE_PROGRESSIONS = [
    { id: 'triad-types', label: 'Chord types', tempo: 80, chords: chords(2, [
        ['C'], ['Cm'], ['Cdim'], ['Caug'], ['Csus2'], ['Csus4'],
    ]) },
    { id: 'suspensions', label: 'Suspensions', tempo: 80, chords: chords(2, [
        ['Csus4', 'Isus4'], ['C', 'I'], ['Gsus4', 'Vsus4'], ['G', 'V'], ['Csus2', 'Isus2'], ['C', 'I'],
    ]) },
    { id: 'passing-diminished', label: 'Passing diminished', tempo: 90, chords: chords(2, [
        ['C', 'I'], ['C♯dim', '♯i°'], ['Dm', 'ii'], ['D♯dim', '♯ii°'], ['Em', 'iii'], ['F', 'IV'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'augmented-line', label: 'Augmented line', tempo: 90, chords: chords(2, [
        ['C', 'I'], ['Caug', 'I+'], ['C6', 'I6'], ['C7', 'I7'], ['F', 'IV'], ['Fm', 'iv'], ['C', 'I'],
    ]) },
];

export const SEVENTH_PROGRESSIONS = [
    { id: 'seventh-types', label: 'Seventh chords', tempo: 80, chords: chords(2, [
        ['Cmaj7'], ['C7'], ['Cm7'], ['Cm7♭5'], ['Cdim7'], ['CmMaj7'],
    ]) },
    { id: 'diatonic-sevenths', label: 'Diatonic sevenths', tempo: 100, chords: chords(2, [
        ['Cmaj7', 'Imaj7', 'T'], ['Dm7', 'ii7', 'SD'], ['Em7', 'iii7', 'T'], ['Fmaj7', 'IVmaj7', 'SD'],
        ['G7', 'V7', 'D'], ['Am7', 'vi7', 'T'], ['Bm7♭5', 'viiø7', 'D'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    // The tensions take open voicings, so the added notes sit above the chord instead
    // of crowding into it.
    { id: 'major-tensions', label: 'Tensions on Cmaj7', tempo: 80, voicing: 'open', chords: chords(2, [
        ['Cmaj7', '1 3 5 7'], ['Cmaj9', '+9'], ['Cmaj7(♯11)', '+♯11'], ['Cmaj13', '+9 13'], ['C6/9', '6 9'],
    ]) },
    { id: 'dominant-tensions', label: 'Tensions on G7', tempo: 80, voicing: 'open', chords: [
        ...chords(2, [
            ['G7', '1 3 5 ♭7'], ['G9', '+9'], ['G13', '+9 13'], ['G7(♭9)', '+♭9'],
            ['G7(♯9)', '+♯9'], ['G7(♭13)', '+♭13'], ['G7alt', 'alt'],
        ]),
        { symbol: 'Cmaj7', beats: 4, roman: 'Imaj7', fn: '' },
    ] },
    { id: 'ii-v-i-tensions', label: 'ii–V–I with tensions', tempo: 80, voicing: 'open', comp: EVERY_BEAT, chords: chords(4, [
        ['Dm7', 'ii7', 'SD'], ['G7', 'V7', 'D'], ['Cmaj7', 'Imaj7', 'T'],
        ['Dm9', 'ii9', 'SD'], ['G13', 'V13', 'D'], ['Cmaj9', 'Imaj9', 'T'],
    ]) },
];

export const FUNCTIONAL_PROGRESSIONS = [
    { id: 't-sd-d-t', label: 'T–SD–D–T', tempo: 90, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Fmaj7', 'IV', 'SD'], ['G7', 'V', 'D'], ['Cmaj7', 'I', 'T'],
    ]) },
    { id: 'ii-v-i', label: 'ii–V–I', tempo: 90, chords: chords(4, [
        ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D'], ['Cmaj7', 'I', 'T'], ['Cmaj7', 'I', 'T'],
    ]) },
    { id: 'turnaround', label: 'I–vi–ii–V', tempo: 100, loop: true, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Am7', 'vi', 'T'], ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D'],
    ]) },
    { id: 'circle', label: 'iii–vi–ii–V–I', tempo: 100, chords: [
        ...chords(4, [['Em7', 'iii', 'T'], ['Am7', 'vi', 'T'], ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D']]),
        { symbol: 'Cmaj7', beats: 8, roman: 'I', fn: 'T' },
    ] },
    { id: 'substitutes', label: 'Substitutes', tempo: 90, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Em7', 'iii', 'T'], ['Dm7', 'ii', 'SD'], ['Bm7♭5', 'viiø', 'D'], ['Am7', 'vi', 'T'],
    ]) },
    { id: 'pop', label: 'I–V–vi–IV', tempo: 90, loop: true, chords: chords(4, [
        ['C', 'I', 'T'], ['G', 'V', 'D'], ['Am', 'vi', 'T'], ['F', 'IV', 'SD'],
    ]) },
];

export const RESOLUTION_PROGRESSIONS = [
    { id: 'v-i', label: 'V7–I', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['G7', 'V7', 'D'], ['Cmaj7', 'I', 'T'],
    ]) },
    { id: 'secondary-dominants', label: 'Secondary dominants', tempo: 90, chords: chords(4, [
        ['Cmaj7', 'I'], ['A7', 'V7/ii'], ['Dm7', 'ii'], ['D7', 'V7/V'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'tritone-substitute', label: 'Tritone substitute', tempo: 80, chords: chords(4, [
        ['Dm7', 'ii'], ['D♭7', '♭II7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'half-step', label: 'Half step', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'I'], ['D♭maj7', '♭IImaj7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'chromatic-mediants', label: 'Chromatic mediants', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'I'], ['A♭maj7', '♭VImaj7'], ['Cmaj7', 'I'], ['Emaj7', 'IIImaj7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'plagal', label: 'Plagal', tempo: 80, chords: chords(4, [
        ['C', 'I'], ['F', 'IV'], ['C', 'I'], ['Fm', 'iv'], ['C', 'I'],
    ]) },
    { id: 'suspension', label: 'Suspension', tempo: 80, chords: chords(4, [
        ['G7sus4', 'V7sus4'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'deceptive', label: 'Deceptive', tempo: 80, chords: chords(4, [
        ['Dm7', 'ii'], ['G7', 'V7'], ['Am7', 'vi'], ['Dm7', 'ii'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
];

export const SUBDOMINANT_MINOR_PROGRESSIONS = [
    { id: 'iv-iv-i', label: 'IV–iv–I', tempo: 80, chords: chords(4, [
        ['C', 'I', 'T'], ['F', 'IV', 'SD'], ['Fm', 'iv', 'SDm'], ['C', 'I', 'T'],
    ]) },
    { id: 'iv6', label: 'IVmaj7–iv6', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'Imaj7', 'T'], ['Fmaj7', 'IVmaj7', 'SD'], ['Fm6', 'iv6', 'SDm'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'backdoor', label: 'Backdoor', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'Imaj7', 'T'], ['Fm7', 'iv7', 'SDm'], ['B♭7', '♭VII7', 'SDm'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'half-diminished', label: 'iiø–V–I', tempo: 80, chords: chords(4, [
        ['Dm7♭5', 'iiø7', 'SDm'], ['G7', 'V7', 'D'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'flat-six-flat-seven', label: '♭VI–♭VII–I', tempo: 90, chords: chords(4, [
        ['C', 'I', 'T'], ['A♭', '♭VI', 'SDm'], ['B♭', '♭VII', 'SDm'], ['C', 'I', 'T'],
    ]) },
    { id: 'major-third', label: 'I–III–IV–iv', tempo: 90, loop: true, chords: chords(4, [
        ['C', 'I', 'T'], ['E', 'III', ''], ['F', 'IV', 'SD'], ['Fm', 'iv', 'SDm'],
    ]) },
    { id: 'neapolitan', label: 'Neapolitan', tempo: 80, chords: chords(4, [
        ['Cm', 'i', 'T'], ['D♭/F', '♭II6', 'SDm'], ['G7', 'V7', 'D'], ['Cm', 'i', 'T'],
    ]) },
];

/** Stacked fourths with a third on top, as in modal jazz, from a bass note. */
const quartal = bass => [bass - 12, bass, bass + 5, bass + 10, bass + 15, bass + 19];

// A twelve-tone row (every pitch class once) and its four three-note groups as chords.
const ROW = [0, 11, 7, 8, 3, 1, 2, 10, 6, 5, 4, 9];

export const NON_FUNCTIONAL_PROGRESSIONS = [
    { id: 'dorian-vamp', label: 'Dorian vamp', tempo: 100, loop: true, chords: chords(4, [
        ['Dm9', 'i'], ['G13', 'IV'], ['Dm9', 'i'], ['G13', 'IV'],
    ]) },
    { id: 'quartal', label: 'Quartal chords', tempo: 100, loop: true, chords: [
        { symbol: 'Dm11', beats: 6, roman: 'D', notes: quartal(50) },
        { symbol: 'Em11', beats: 2, roman: 'E', notes: quartal(52) },
        { symbol: 'Dm11', beats: 6, roman: 'D', notes: quartal(50) },
        { symbol: 'C♯m11', beats: 2, roman: 'C♯', notes: quartal(49) },
    ] },
    { id: 'planing', label: 'Planing', tempo: 80, chords: chords(2, [
        ['C', 'C'], ['D', 'D'], ['E', 'E'], ['F♯', 'F♯'], ['E', 'E'], ['D', 'D'], ['C', 'C'],
    ]) },
    { id: 'constant-structure', label: 'Constant structure', tempo: 80, chords: chords(4, [
        ['Cmaj7', 'C'], ['A♭maj7', 'A♭'], ['Emaj7', 'E'], ['Cmaj7', 'C'],
    ]) },
    { id: 'pedal', label: 'Pedal point', tempo: 80, loop: true, chords: chords(4, [
        ['C', 'C'], ['D/C', 'D/C'], ['B♭/C', 'B♭/C'], ['C', 'C'],
    ]) },
    { id: 'parallel-melody', label: 'Following the melody', tempo: 70, chords: chords(4, [
        ['Cmaj7', '3rd'], ['B♭maj7', '3rd'], ['A♭maj7', '3rd'], ['Gmaj7', '3rd'],
    ]), melody: melody([['E5', 4], ['D5', 4], ['C5', 4], ['B4', 4]]) },
    // The row as a line, then its four groups of three as chords.
    { id: 'tone-row', label: 'Twelve-tone row', tempo: 100, chords: [
        { symbol: '', beats: 12, notes: [] },
        ...[0, 3, 6, 9].map(i => ({
            symbol: '', beats: 3, notes: [C - 12 + ROW[i], C + ROW[i + 1], C + ROW[i + 2]],
        })),
    ], melody: [...ROW.map(pc => ({ midi: C + 12 + pc, beats: 1 })), { midi: null, beats: 12 }] },
];

/** "Twinkle, Twinkle, Little Star" (a traditional melody), for reharmonization. */
const TWINKLE = melody([
    ['C5', 1], ['C5', 1], ['G5', 1], ['G5', 1], ['A5', 1], ['A5', 1], ['G5', 2],
    ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['D5', 1], ['D5', 1], ['C5', 2],
]);

export const REHARMONIZATION_PROGRESSIONS = [
    { id: 'original', label: 'Original', tempo: 96, melody: TWINKLE, chords: chords(2, [
        ['C', 'I'], ['C', 'I'], ['F', 'IV'], ['C', 'I'], ['F', 'IV'], ['C', 'I'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'diatonic-substitutes', label: 'Diatonic substitutes', tempo: 96, melody: TWINKLE, chords: chords(2, [
        ['C', 'I'], ['Am', 'vi'], ['F', 'IV'], ['Em', 'iii'], ['Dm', 'ii'], ['Am', 'vi'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'secondary-dominants', label: 'Secondary dominants', tempo: 96, melody: TWINKLE, chords: [
        ...chords(2, [
            ['Cmaj7', 'I'], ['C7', 'V7/IV'], ['Fmaj7', 'IV'], ['Em7', 'iii'], ['Dm7', 'ii'], ['A7', 'V7/ii'],
        ]),
        ...chords(1, [['Dm7', 'ii'], ['G7', 'V7']]),
        ...chords(2, [['Cmaj7', 'I']]),
    ] },
    { id: 'tritone-substitutes', label: 'Tritone substitutes', tempo: 96, melody: TWINKLE, chords: chords(2, [
        ['Cmaj7', 'I'], ['C7', 'V7/IV'], ['Fmaj7', 'IV'], ['E♭7', '♭III7'],
        ['Dm7', 'ii'], ['A♭7', '♭VI7'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'subdominant-minor', label: 'Subdominant minor', tempo: 96, melody: TWINKLE, chords: chords(2, [
        ['Cmaj7', 'I'], ['Am7', 'vi'], ['Fmaj7', 'IV'], ['Fm7', 'iv'],
        ['Dm7♭5', 'iiø'], ['Cmaj7/E', 'I'], ['B♭7', '♭VII7'], ['Cmaj7', 'I'],
    ]) },
];

/**
 * Well-known progressions, one per section of the Chord Progressions page, in C (or A
 * minor) so they can be compared: one chord a bar unless the progression moves faster,
 * each struck on every beat, with the bass from C3.
 */
export const COMMON_PROGRESSIONS = [
    { id: 'i-iv-v-i', label: 'I–IV–V–I', tempo: 112, chords: chords(4, [
        ['C', 'I'], ['F', 'IV'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'i-v-vi-iv', label: 'I–V–vi–IV', tempo: 96, chords: chords(4, [
        ['C', 'I'], ['G', 'V'], ['Am', 'vi'], ['F', 'IV'],
    ]) },
    { id: 'i-vi-iv-v', label: 'I–vi–IV–V', tempo: 88, chords: chords(4, [
        ['C', 'I'], ['Am', 'vi'], ['F', 'IV'], ['G', 'V'],
    ]) },
    { id: 'vi-iv-i-v', label: 'vi–IV–I–V', tempo: 96, chords: chords(4, [
        ['Am', 'vi'], ['F', 'IV'], ['C', 'I'], ['G', 'V'],
    ]) },
    { id: 'iv-v-iii-vi', label: 'IV–V–iii–vi', tempo: 100, chords: chords(4, [
        ['F', 'IV'], ['G', 'V'], ['Em', 'iii'], ['Am', 'vi'],
    ]) },
    { id: 'canon', label: 'I–V–vi–iii–IV–I–IV–V', tempo: 84, chords: chords(2, [
        ['C', 'I'], ['G', 'V'], ['Am', 'vi'], ['Em', 'iii'], ['F', 'IV'], ['C', 'I'], ['F', 'IV'], ['G', 'V'],
    ]) },
    { id: 'ii-v-i', label: 'ii–V–I', tempo: 120, chords: chords(4, [
        ['Dm7', 'ii7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7'], ['Cmaj7', 'Imaj7'],
    ]) },
    { id: 'i-vi-ii-v', label: 'I–vi–ii–V', tempo: 120, chords: chords(2, [
        ['C', 'I'], ['Am', 'vi'], ['Dm', 'ii'], ['G', 'V'],
    ]) },
    { id: 'i-bvii-iv-i', label: 'I–♭VII–IV–I', tempo: 112, chords: chords(4, [
        ['C', 'I'], ['B♭', '♭VII'], ['F', 'IV'], ['C', 'I'],
    ]) },
    { id: 'andalusian', label: 'i–♭VII–♭VI–V', tempo: 100, chords: chords(4, [
        ['Am', 'i'], ['G', '♭VII'], ['F', '♭VI'], ['E', 'V'],
    ]) },
].map(p => ({ ...p, loop: true, bassLow: C - 12, comp: EVERY_BEAT }));

/**
 * A work song's call and response over a hammer falling on every downbeat: a leader
 * sings a two-bar phrase between the strokes, and the group answers in octaves.
 */
const CALL = melody([
    [null, 1], ['G4', 1], ['Bb4', 1], ['C5', 1],
    ['Bb4', 0.5], ['G4', 0.5], ['Eb4', 1], ['C4', 1], [null, 1],
    [null, 8],
]);
const RESPONSE = [['C5', 1], ['Bb4', 0.5], ['G4', 0.5], ['Bb4', 1], ['G4', 1], ['Eb4', 1], ['C4', 2]];

export const WORK_SONG_PROGRESSIONS = [
    { id: 'call-and-response', label: 'Call and response', tempo: 76, loop: true,
        sounds: { chords: 'cello', melody: 'cello' }, drums: HAMMER, melody: CALL,
        chords: [
            { symbol: '', beats: 9, notes: [] },
            ...RESPONSE.map(([name, beats]) => {
                const midi = Tone.Frequency(name).toMidi();
                return { symbol: '', beats, notes: [midi - 12, midi] };
            }),
        ] },
];

/** The twelve-bar blues in C, I7 IV7 V7, one bar each. */
const TWELVE_BAR = [
    ['C7', 'I7'], ['C7', 'I7'], ['C7', 'I7'], ['C7', 'I7'],
    ['F7', 'IV7'], ['F7', 'IV7'], ['C7', 'I7'], ['C7', 'I7'],
    ['G7', 'V7'], ['F7', 'IV7'], ['C7', 'I7'], ['G7', 'V7'],
];
const SHUFFLE = FEEL_PATTERNS.find(p => p.id === 'shuffle');
const third = 1 / 3;

export const BLUES_PROGRESSIONS = [
    { id: 'twelve-bar', label: 'Twelve-bar blues', tempo: 112, loop: true, drums: SHUFFLE,
        // The boogie bass: up the chord to the sixth and flat seventh and back, in
        // shuffled eighths (long, short).
        riff: [[0, 2 * third], [4, third], [7, 2 * third], [9, third], [10, 2 * third], [9, third], [7, 2 * third], [4, third]],
        chords: chords(4, TWELVE_BAR) },
];

export const JAZZ_BLUES_PROGRESSIONS = [
    { id: 'basic-blues', label: 'Basic blues', tempo: 132, loop: true, chords: chords(4, TWELVE_BAR) },
    { id: 'jazz-blues', label: 'Jazz blues', tempo: 132, loop: true, chords: [
        ...chords(4, [['C7', 'I7'], ['F7', 'IV7'], ['C7', 'I7']]),
        ...chords(2, [['Gm7', 'ii7/IV'], ['C7', 'V7/IV']]),
        ...chords(4, [['F7', 'IV7'], ['F♯dim7', '♯iv°7'], ['C7', 'I7'], ['A7', 'V7/ii'], ['Dm7', 'ii7'], ['G7', 'V7']]),
        ...chords(2, [['C7', 'I7'], ['A7', 'V7/ii'], ['Dm7', 'ii7'], ['G7', 'V7']]),
    ] },
    { id: 'bird-blues', label: 'Bird blues', tempo: 132, loop: true, chords: [
        ...chords(4, [['Cmaj7', 'Imaj7']]),
        ...chords(2, [
            ['Bm7♭5', 'iiø/vi'], ['E7', 'V7/vi'], ['Am7', 'vi7'], ['D7', 'V7/V'], ['Gm7', 'ii7/IV'], ['C7', 'V7/IV'],
        ]),
        ...chords(4, [['F7', 'IV7']]),
        ...chords(2, [
            ['Fm7', 'iv7'], ['B♭7', '♭VII7'], ['Em7', 'iii7'], ['A7', 'V7/ii'], ['E♭m7', '♭iii7'], ['A♭7', '♭VI7'],
        ]),
        ...chords(4, [['Dm7', 'ii7'], ['G7', 'V7']]),
        ...chords(2, [['Cmaj7', 'Imaj7'], ['A7', 'V7/ii'], ['Dm7', 'ii7'], ['G7', 'V7']]),
    ] },
];

/**
 * The first eight bars of "Edelweiss" (Richard Rodgers, 1959), a waltz in 3/4, in C:
 * a melody of long notes that leaves most beats unplayed.
 */
const EDELWEISS = melody([
    ['E4', 2], ['G4', 1], ['D5', 3], ['C5', 2], ['G4', 1], ['F4', 3],
    ['E4', 2], ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['A4', 3], ['G4', 3],
]);
const EDELWEISS_CHORDS = chords(3, [['C'], ['G7'], ['C'], ['F'], ['C'], ['Am'], ['D7'], ['G7']]);

export const WALTZ_PROGRESSIONS = [
    { id: 'melody-alone', label: 'Melody alone', tempo: 108, loop: true, melody: EDELWEISS,
        chords: EDELWEISS_CHORDS.map(() => ({ symbol: '', beats: 3, notes: [] })) },
    { id: 'oom-pah-pah', label: 'Oom-pah-pah', tempo: 108, loop: true, melody: EDELWEISS, chords: EDELWEISS_CHORDS,
        comp: [['bass', 1], ['upper', 1], ['upper', 1]] },
    { id: 'chord-on-one', label: 'Chord on 1', tempo: 108, loop: true, melody: EDELWEISS, chords: EDELWEISS_CHORDS,
        comp: [['all', 3]] },
];

/** Named sets of progressions, for a demo that takes the set as a URL parameter. */
export const PROGRESSION_SETS = {
    diatonic: DIATONIC_PROGRESSIONS,
    'diatonic-minor': DIATONIC_MINOR_PROGRESSIONS,
    'minor-dominant': MINOR_DOMINANT_PROGRESSIONS,
    'minor-colors': MINOR_COLOR_PROGRESSIONS,
    'minor-modes': MINOR_MODE_PROGRESSIONS,
    'minor-chord-scales': MINOR_CHORD_SCALE_PROGRESSIONS,
    types: CHORD_TYPE_PROGRESSIONS,
    sevenths: SEVENTH_PROGRESSIONS,
    functional: FUNCTIONAL_PROGRESSIONS,
    resolution: RESOLUTION_PROGRESSIONS,
    'subdominant-minor': SUBDOMINANT_MINOR_PROGRESSIONS,
    'non-functional': NON_FUNCTIONAL_PROGRESSIONS,
    reharmonization: REHARMONIZATION_PROGRESSIONS,
    'work-song': WORK_SONG_PROGRESSIONS,
    blues: BLUES_PROGRESSIONS,
    'jazz-blues': JAZZ_BLUES_PROGRESSIONS,
    waltz: WALTZ_PROGRESSIONS,
    common: COMMON_PROGRESSIONS,
};

// ── Player ───────────────────────────────────────────────────────────────────

const AHEAD = 0.15;   // seconds of notes scheduled ahead
const TICK_MS = 25;

/**
 * Plays a progression (chords, melody, bass riff, comp, and drums), scheduled ahead on
 * the audio clock so the parts stay together. `onChord(i)` and `onMelody(i)` are called
 * as chord or melody note `i` starts, `onBass(midi)` as each riff note starts,
 * `onHit(k)` as hit `k` of the current chord's comp starts (see `hits`), and each with
 * -1 when playback stops. A progression with `loop` repeats until stopped; others
 * stop at the end. Same start/stop/playing contract as a continuous source, so it works
 * with wirePlayButton; `onEnd` is called when it stops by itself.
 *
 * Chords and the riff play on `instrument`, the melody on `melodyInstrument`, and the
 * progression's drums on `drums`; each can be changed between progressions.
 */
export class ProgressionPlayer {
    /**
     * @param {object} instrument  anything with noteOn(midi, velocity, time) and noteOff(midi, time).
     * @param {object} [opts]
     * @param {object} [opts.melodyInstrument]  defaults to `instrument`.
     * @param {object} [opts.drums]             a drum kit, for progressions with `drums`.
     */
    constructor(instrument, { melodyInstrument = instrument, drums = null,
        onChord = () => {}, onMelody = () => {}, onBass = () => {}, onHit = () => {}, onEnd = () => {} } = {}) {
        this.instrument = instrument;
        this.melodyInstrument = melodyInstrument;
        this.drums = drums;
        this.onChord = onChord;
        this.onMelody = onMelody;
        this.onBass = onBass;
        this.onHit = onHit;
        this.onEnd = onEnd;
        this.progression = null;
        this.voicings = [];
        this.hits = [];
        this._timer = null;
        this._draws = new Set();
        this._sounding = new Set();   // { instrument, midi, off }, for stop()
    }

    /** Sets the progression and voices it. */
    setProgression(progression) {
        this.stop();
        this.progression = progression;
        this.voicings = voiceProgression(progression.chords, progression.melody ?? [],
            { bassLow: progression.bassLow, open: progression.voicing === 'open' });
        this.hits = compHits(progression, this.voicings);
    }

    /**
     * The notes chord `i` holds: without its bass when a riff plays the bass, and none
     * with a comp, whose hits are reported one by one instead.
     */
    chordNotes(i) {
        return this.progression.comp ? [] : this.hits[i][0].notes;
    }

    get playing() { return this._timer !== null; }

    start() {
        this.stop();
        this._events = this._timeline();
        this._index = 0;
        this._origin = Tone.immediate() + 0.05;
        this._timer = setInterval(() => this._schedule(), TICK_MS);
        this._schedule();
    }

    stop() {
        if (this._timer === null) return;
        this._halt();
        this._notify();
    }

    _notify() {
        this.onChord(-1);
        this.onMelody(-1);
        this.onBass(-1);
        this.onHit(-1);
    }

    _halt() {
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        const now = Tone.immediate();
        for (const { instrument, midi } of this._sounding) instrument.noteOff(midi, now);
        this._sounding.clear();
    }

    /**
     * Every note of one pass, in time order:
     * `{ at, beats, notes, velocity, instrument, kind, index }`.
     */
    _timeline() {
        const { chords, melody = [], riff, comp, drums } = this.progression;
        const events = [];
        let at = 0;
        chords.forEach((chord, i) => {
            events.push({ at, beats: chord.beats, notes: this.chordNotes(i), velocity: riff ? 0.35 : 0.5,
                instrument: this.instrument, kind: 'chord', index: i });
            // A comp's hits, each reported with its index within the chord.
            if (comp) {
                this.hits[i].forEach((hit, k) => events.push({ at: at + hit.at, beats: hit.beats, notes: hit.notes,
                    velocity: COMP_VELOCITY[hit.part], instrument: this.instrument, kind: 'hit', index: k }));
            }
            // The riff from the chord's bass, restarted at each chord and cut at its end.
            if (riff && this.voicings[i].notes.length) {
                for (let t = 0, k = 0; t < chord.beats - 1e-6; k++) {
                    const [semitones, beats] = riff[k % riff.length];
                    const midi = this.voicings[i].bass + semitones;
                    const length = Math.min(beats, chord.beats - t);
                    events.push({ at: at + t, beats: length, notes: [midi], velocity: 0.7,
                        instrument: this.instrument, kind: 'bass', index: midi });
                    t += beats;
                }
            }
            at += chord.beats;
        });
        const length = at;
        at = 0;
        melody.forEach((note, i) => {
            if (note.midi !== null) {
                events.push({ at, beats: note.beats, notes: [note.midi], velocity: 0.8,
                    instrument: this.melodyInstrument, kind: 'melody', index: i });
            }
            at += note.beats;
        });
        this._length = Math.max(length, at);
        // The drum pattern, repeated through the progression.
        if (drums && this.drums) {
            const steps = drums.tracks[0].steps.length;
            const cycle = steps / drums.stepsPerBeat;
            for (let start = 0; start < this._length - 1e-6; start += cycle) {
                for (const track of drums.tracks) {
                    track.steps.forEach((velocity, k) => {
                        if (velocity > 0) {
                            events.push({ at: start + k / drums.stepsPerBeat, beats: 0, notes: [track.midi],
                                velocity: velocity * (track.gain ?? 1) * 0.7, instrument: this.drums, kind: 'drum' });
                        }
                    });
                }
            }
        }
        return events.sort((a, b) => a.at - b.at);
    }

    _schedule() {
        const now = Tone.immediate();
        const beat = 60 / this.progression.tempo;
        while (true) {
            if (this._index >= this._events.length) {
                const end = this._origin + this._length * beat;
                if (this.progression.loop) {
                    this._origin = end;
                    this._index = 0;
                    continue;
                }
                if (now >= end) {
                    this._halt();
                    this._notify();
                    this.onEnd();
                }
                return;
            }
            const event = this._events[this._index];
            const time = this._origin + event.at * beat;
            if (time > now + AHEAD) return;
            this._index++;
            if (event.kind === 'drum') {
                event.notes.forEach(midi => event.instrument.noteOn(midi, event.velocity, time));
                continue;
            }
            const off = time + event.beats * beat * 0.95;
            for (const midi of event.notes) {
                event.instrument.noteOn(midi, event.velocity, time);
                event.instrument.noteOff(midi, off);
                this._sounding.add({ instrument: event.instrument, midi, off });
            }
            // Forget notes that have ended, so the set stays small while looping.
            for (const entry of this._sounding) if (entry.off < now) this._sounding.delete(entry);
            const callback = { chord: this.onChord, melody: this.onMelody, bass: this.onBass, hit: this.onHit }[event.kind];
            const draw = setTimeout(() => { this._draws.delete(draw); callback(event.index); },
                Math.max(0, (time - now) * 1000));
            this._draws.add(draw);
        }
    }
}
