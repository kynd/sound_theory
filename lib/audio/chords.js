import * as Tone from 'tone';
import { FEEL_PATTERNS, STYLE_PATTERNS, HAMMER, LOFI_BEAT, pulsePattern } from './rhythm.js';
import { parseNote, transposeNote, PITCH_CLASS_NAMES, FLAT_PITCH_CLASS_NAMES } from './scales.js';

/**
 * Chords, chord progressions, and a player for them.
 *
 * A chord is written as a symbol: a root (C, F♯, B♭ …), a quality from QUALITIES
 * (`m7`, `maj7`, `7`, `m7♭5` …), optional tensions in parentheses (`G7(♭9)`,
 * `Cmaj7(♯11)`), and an optional bass note after a slash (`D♭/F`). Flats and sharps
 * may be written ♭/♯ or b/#. `parseChord` turns a symbol into pitch classes;
 * `voiceProgression` turns a list of chords into MIDI notes that move smoothly.
 *
 * A progression is `{ id, label, tempo, key?, loop?, chords, sevenths?, melody?, playScale?, riff?, comp?, voicing?, bassLow?, drums?, sounds? }`:
 *   - `chords`: `[{ symbol, beats, roman?, fn?, bass?, notes?, tied? }]`. `roman` is the Roman
 *     numeral shown under the chord, `fn` its function (T, SD, D, SDm). `bass` (MIDI)
 *     places the bass note itself, outside the usual range (see bassLow). `notes`
 *     (MIDI numbers) voices a chord by hand instead, for chords that are not
 *     stacks of thirds (quartal chords, chords from a twelve-tone row). A `tied`
 *     chord holds the previous one on instead of striking again, so the label under a
 *     sustained chord can change (the triads of a triad pair). `alt` (MIDI) is a second
 *     hand voicing, taken by every other strike of a comp.
 *   - `melody`: `[{ midi, beats, velocity?, gate? }]` played over the chords (`midi:
 *     null` is a rest); `velocity` (0–1) sets a note's loudness and `gate` the share of
 *     its length that sounds (articulation).
 *   - `riff`: `[[semitones, beats], …]`, a bass riff played up from each chord's bass
 *     note in place of the held bass, repeated through the chord.
 *   - `comp`: `[[part, beats], …]`, a rhythm for the chords in place of holding them,
 *     repeated through each chord: `'bass'` plays the bass note, `'upper'` the notes
 *     above it, `'all'` both, and `null` rests (see compHits).
 *   - `sevenths`: the same progression with seventh chords, in the form of `chords`,
 *     for a demo that offers both (see withSevenths).
 *   - `playScale`: note names (in `key`) a player can improvise with over it; a
 *     play-along demo shows only these on its keyboard, the first as the root.
 *   - `key`: the root it is written on, for moving it to another key (default C).
 *   - `voicing`: `'open'` spreads each chord's notes at their own intervals above the
 *     root, so tensions sit above the chord tones; `'rootless'` uses jazz piano's
 *     rootless voicings with added 9ths and 13ths (see voiceProgression).
 *   - `bassLow`: the lowest bass note (MIDI); the bass of every chord falls in the
 *     octave from it. Defaults to E2 (40).
 *   - `drums`: a rhythm pattern (see rhythm.js), looped along with the chords.
 *   - `sounds`: `{ chords, melody, bass? }`, instrument ids from INSTRUMENTS (default
 *     piano), for the demo to create. With `bass`, the riff, or else each chord's bass
 *     note, is played on that instrument.
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
 * The notes a jazz pianist would play above the bass, as pitch classes: the root left
 * to the bass, and the color the style expects added. A plain seventh chord gets its
 * 9th (and a dominant its 13th in place of the 5th), the rootless voicings pianists use
 * when a bassist plays the root: 3–5–7–9 for major and minor sevenths, 3–13–7–9 for a
 * dominant. Sixth chords take the 9th too. Chords with written tensions keep them, the
 * 5th dropped once there are more than four notes; diminished and half-diminished
 * chords keep all four tones; triads stay triads.
 */
function rootlessPitchClasses(parsed) {
    const COLOR = {
        '0,4,7,11': [4, 7, 11, 14], '0,3,7,10': [3, 7, 10, 14], '0,4,7,10': [4, 9, 10, 14],
        '0,4,7,9': [4, 7, 9, 14], '0,3,7,9': [3, 7, 9, 14], '0,3,7,11': [3, 7, 11, 14],
        '0,5,7,10': [5, 7, 10, 14], '0,3,6,10': [0, 3, 6, 10], '0,3,6,9': [0, 3, 6, 9],
    };
    const ivs = parsed.intervals;
    let upper = COLOR[ivs.join(',')];
    if (!upper) {
        upper = ivs.length >= 4 ? ivs.filter(i => i !== 0) : ivs;
        if (upper.length > 4) upper = upper.filter(i => i !== 7);
    }
    return [...new Set(upper.map(i => (parsed.root + i) % 12))];
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

/** Whether two voicings are the same notes. */
const same = (a, b) => !!a && !!b && a.length === b.length && a.every((n, i) => n === b[i]);

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
 * chord takes an open voicing instead (see openVoicing), without voice leading. With
 * `rootless`, chords take the rootless voicings of jazz piano (see rootlessPitchClasses)
 * in close position between D3 and D5, moving as little as possible, and sit where a
 * pianist comping under a soloist would rather than under the melody. Returns
 * `{ bass, upper, notes }` per chord, in MIDI numbers. Chords with hand-written
 * `notes` keep them.
 */
export function voiceProgression(chords, melody = [], { bassLow = BASS_LOW, open = false, rootless = false } = {}) {
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
            const alt = chord.alt ? { bass: chord.alt[0], upper: chord.alt.slice(1), notes: chord.alt } : null;
            return { bass: chord.notes[0], upper: chord.notes.slice(1), notes: chord.notes, ...(alt ? { alt } : {}) };
        }
        const parsed = parseChord(chord.symbol);
        const bass = chord.bass ?? bassLow + ((parsed.bass - bassLow) % 12 + 12) % 12;
        if (open) {
            const upper = openVoicing(parsed, bass);
            return { bass, upper, notes: [bass, ...upper] };
        }
        if (rootless) {
            const all = candidates(rootlessPitchClasses(parsed), 55).filter(v => v[0] > bass + 2);
            const inRange = all.filter(v => v[0] >= 50 && v[v.length - 1] <= 74);
            const options = (inRange.length ? inRange : all)
                .sort((a, b) => motion(a, previous) - motion(b, previous));
            // The nearest voicing, and the nearest different one as an alternate. The same
            // chord again in a row takes the other one, as a pianist would.
            let [upper, other = upper] = options;
            if (i > 0 && chords[i - 1].symbol === chord.symbol && same(upper, previous)) [upper, other] = [other, upper];
            previous = upper;
            return { bass, upper, notes: [bass, ...upper], alt: { bass, upper: other, notes: [bass, ...other] } };
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
 * plays the bass). With one, the comp repeats through the chord and is cut at its end,
 * every other hit taking the chord's alternate voicing (`alt`) when it has one.
 */
export function compHits(progression, voicings) {
    const { chords, comp, riff } = progression;
    return chords.map((chord, i) => {
        const v = voicings[i];
        // A chord may carry its own comp (and riff), for a bar that differs from the rest.
        const pattern = chord.comp ?? comp;
        if (!pattern) return [{ at: 0, beats: chord.beats, notes: (chord.riff ?? riff) && v.notes.length ? v.upper : v.notes, part: 'all' }];
        const hits = [];
        for (let t = 0, k = 0; t < chord.beats - 1e-6; k++) {
            const [part, beats] = pattern[k % pattern.length];
            // A chord struck again takes its alternate voicing every other time, the way a
            // pianist moves between two voicings rather than repeating one.
            const w = v.alt && k % 2 ? v.alt : v;
            const notes = w.notes.length ? { bass: [w.bass], upper: w.upper, all: w.notes }[part] ?? [] : [];
            if (notes.length) hits.push({ at: t, beats: Math.min(beats, chord.beats - t), notes, part });
            t += beats;
        }
        return hits;
    });
}

/**
 * The notes of a progression's bass riff: `[{ at, beats, midi }]`, in beats from the
 * start. Each chord's riff (its own `riff`, or the progression's) is played up from its
 * bass note, restarted at the chord and cut at its end. Empty without a riff.
 */
export function riffNotes(progression, voicings) {
    const notes = [];
    let at = 0;
    progression.chords.forEach((chord, i) => {
        const riff = chord.riff ?? progression.riff;
        if (riff && voicings[i]?.notes.length) {
            for (let t = 0, k = 0; t < chord.beats - 1e-6; k++) {
                const [semitones, beats] = riff[k % riff.length];
                notes.push({ at: at + t, beats: Math.min(beats, chord.beats - t), midi: voicings[i].bass + semitones });
                t += beats;
            }
        }
        at += chord.beats;
    });
    return notes;
}

/**
 * A note name moved by the interval from `from` to `to` (both note names), spelled by
 * letter as the new key would spell it; a double sharp or flat becomes the plain note.
 */
function transposeName(name, from, to) {
    const moved = transposeNote(name.replace('#', '♯').replace(/^([A-G])b/, '$1♭'), from, to);
    if (!/𝄪|𝄫/.test(moved)) return moved;
    const pc = ((parseNote(moved).semitones % 12) + 12) % 12;
    return (moved.includes('𝄪') ? PITCH_CLASS_NAMES : FLAT_PITCH_CLASS_NAMES)[pc];
}

/** A chord symbol moved from root `from` to root `to`: its root and slash bass. */
export function transposeSymbol(symbol, from, to) {
    if (!symbol) return symbol;
    const slash = symbol.match(/^(.+)\/([A-G][♭♯b#]?)$/);
    const body = slash ? slash[1] : symbol;
    const [, root, rest] = body.match(/^([A-G][♭♯b#]?)(.*)$/);
    return transposeName(root, from, to) + rest + (slash ? '/' + transposeName(slash[2], from, to) : '');
}

/**
 * A progression moved from its key (`progression.key`, C by default) to another root
 * (a note name): chord symbols respelled,
 * and the bass range, hand-voiced notes, placed basses, and the melody moved by the
 * interval (up to a tritone up, otherwise down), so the whole progression keeps its
 * shape and register. Roman numerals stay as they are.
 */
export function transposeProgression(progression, root) {
    const from = progression.key ?? 'C';
    const up = ((parseNote(root).semitones - parseNote(from).semitones) % 12 + 12) % 12;
    if (!up) return progression;
    const semitones = up > 6 ? up - 12 : up;
    return {
        ...progression,
        bassLow: (progression.bassLow ?? BASS_LOW) + semitones,
        chords: progression.chords.map(chord => ({
            ...chord,
            symbol: transposeSymbol(chord.symbol, from, root),
            ...(chord.scaleRoot ? { scaleRoot: transposeName(chord.scaleRoot, from, root) } : {}),
            ...(chord.bass !== undefined ? { bass: chord.bass + semitones } : {}),
            ...(chord.notes ? { notes: chord.notes.map(n => n + semitones) } : {}),
            ...(chord.alt ? { alt: chord.alt.map(n => n + semitones) } : {}),
        })),
        ...(progression.melody ? {
            melody: progression.melody.map(n => ({ ...n, midi: n.midi === null ? null : n.midi + semitones })),
        } : {}),
        ...(progression.playScale ? { playScale: progression.playScale.map(n => transposeName(n, from, root)) } : {}),
    };
}

/** The progression with its seventh chords in place of its triads, when it has them. */
export function withSevenths(progression) {
    return progression.sevenths ? { ...progression, chords: progression.sevenths } : progression;
}

// ── Progressions ─────────────────────────────────────────────────────────────

/** Chords of `beats` each from `[symbol, roman, fn]` triples (roman and fn optional). */
function chords(beats, list) {
    return list.map(([symbol, roman = '', fn = '']) => ({ symbol, beats, roman, fn }));
}

/** A melody from `[note, beats]` pairs, note names with octaves (`'C5'`, `'Bb4'`, ASCII flats) or null for rests. */
function melody(list) {
    return list.map(([name, beats, options]) =>
        ({ midi: name === null ? null : Tone.Frequency(name).toMidi(), beats, ...options }));
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
    { id: 'i-iv-v-i', label: 'I–IV–V–I', tempo: 135, bassLow: C - 12, comp: [['all', 1]], chords: chords(4, [
        ['C', 'I', 'T'], ['F', 'IV', 'SD'], ['G', 'V', 'D'], ['C', 'I', 'T'],
    ]) },
    { id: 'i-vi-iv-v', label: 'I–vi–IV–V', tempo: 135, loop: true, bassLow: C - 12, comp: [['all', 1]], chords: chords(4, [
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
    ]), sevenths: scaleTriads([
        ['Cm7', 'i7'], ['Dm7♭5', 'iiø7'], ['E♭maj7', '♭IIImaj7'], ['Fm7', 'iv7'], ['Gm7', 'v7'], ['A♭maj7', '♭VImaj7'], ['B♭7', '♭VII7'],
    ]) },
    { id: 'harmonic-minor-triads', label: 'Harmonic minor', tempo: 100, bassLow: C - 12, chords: scaleTriads([
        ['Cm', 'i'], ['Ddim', 'ii°'], ['E♭aug', '♭III+'], ['Fm', 'iv'], ['G', 'V'], ['A♭', '♭VI'], ['Bdim', 'vii°'],
    ]), sevenths: scaleTriads([
        ['CmMaj7', 'i(maj7)'], ['Dm7♭5', 'iiø7'], ['E♭maj7♯5', '♭III+maj7'], ['Fm7', 'iv7'], ['G7', 'V7'], ['A♭maj7', '♭VImaj7'], ['Bdim7', 'vii°7'],
    ]) },
    { id: 'melodic-minor-triads', label: 'Melodic minor', tempo: 100, bassLow: C - 12, chords: scaleTriads([
        ['Cm', 'i'], ['Dm', 'ii'], ['E♭aug', '♭III+'], ['F', 'IV'], ['G', 'V'], ['Adim', 'vi°'], ['Bdim', 'vii°'],
    ]), sevenths: scaleTriads([
        ['CmMaj7', 'i(maj7)'], ['Dm7', 'ii7'], ['E♭maj7♯5', '♭III+maj7'], ['F7', 'IV7'], ['G7', 'V7'], ['Am7♭5', 'viø7'], ['Bm7♭5', 'viiø7'],
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
].map(p => ({ ...p, tempo: 144, loop: true, bassLow: C - 12, comp: EVERY_BEAT }));

/**
 * The other chords of C minor in use: natural-minor loops with ♭VI, ♭VII, and ♭III,
 * the Dorian IV from melodic minor, the line cliché, and the diminished seventh.
 */
export const MINOR_COLOR_PROGRESSIONS = [
    { id: 'i-bvii-bvi-bvii', label: 'i–♭VII–♭VI–♭VII', tempo: 156, chords: chords(4, [
        ['Cm', 'i'], ['B♭', '♭VII'], ['A♭', '♭VI'], ['B♭', '♭VII'],
    ]) },
    { id: 'i-bvi-biii-bvii', label: 'i–♭VI–♭III–♭VII', tempo: 144, chords: chords(4, [
        ['Cm', 'i'], ['A♭', '♭VI'], ['E♭', '♭III'], ['B♭', '♭VII'],
    ]) },
    { id: 'i-iv-dorian', label: 'i7–IV7', tempo: 168, chords: chords(4, [
        ['Cm7', 'i7'], ['F7', 'IV7'], ['Cm7', 'i7'], ['F7', 'IV7'],
    ]) },
    { id: 'line-cliche', label: 'Line cliché', tempo: 126, chords: chords(4, [
        ['Cm', 'i'], ['CmMaj7', 'i(maj7)'], ['Cm7', 'i7'], ['Cm6', 'i6'],
    ]) },
    { id: 'i-viidim7-i', label: 'i–vii°7–i', tempo: 126, chords: chords(4, [
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

/** The three scale systems with the names of their modes, in order from the first degree. */
const MAJOR = { steps: MAJOR_STEPS, names: ['major'] };
const MELODIC_MINOR = { steps: MELODIC_MINOR_STEPS, names: [
    'melodic minor', 'Dorian ♭2', 'Lydian augmented', 'Lydian dominant', 'Mixolydian ♭6', 'Locrian ♮2', 'altered',
] };
const HARMONIC_MINOR = { steps: HARMONIC_MINOR_STEPS, names: [
    'harmonic minor', 'Locrian ♮6', 'Ionian ♯5', 'Dorian ♯4', 'Phrygian dominant', 'Lydian ♯2', 'Ultralocrian',
] };

/** The major scale's modes by their church-mode names, and scales outside the three systems. */
const MAJOR_MODES = { steps: MAJOR_STEPS, names: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'] };
const HALF_WHOLE = { steps: [0, 1, 3, 4, 6, 7, 9, 10], name: 'half-whole diminished' };
const WHOLE_HALF = { steps: [0, 2, 3, 5, 6, 8, 9, 11], name: 'whole-half diminished' };
const WHOLE_TONE = { steps: [0, 2, 4, 6, 8, 10], name: 'whole tone' };

/** Mode `k` of a system as a chord scale: `{ steps, name }`. */
function chordScale(system, k = 0) {
    return { steps: mode(system.steps, k), name: system.names[k] };
}

/**
 * Chords, each with its chord scale (from chordScale) run up an octave over it in
 * eighth notes as the melody, from the chord's root in octave 4: `[symbol, roman,
 * scale, beats = 4]`. Each chord keeps the scale's name as `scale`, for a demo to show.
 */
function chordScaleRuns(list) {
    const melody = [];
    const chordList = list.map(([symbol, roman, scale, beats = 4]) => {
        const root = C + parseChord(symbol).root;
        // Eight eighth notes up the scale: an octave of a seven-note scale, or as far as
        // eight notes reach in a scale of six or eight.
        [...scale.steps, ...scale.steps.map(s => s + 12)].slice(0, 8)
            .forEach(s => melody.push({ midi: root + s, beats: 0.5 }));
        if (beats > 4) melody.push({ midi: null, beats: beats - 4 });
        return { symbol, beats, roman, scale: scale.name };
    });
    return { chords: chordList, melody };
}

/** The seven chord scales of C melodic minor and of C harmonic minor, each mode over its seventh chord. */
export const MINOR_MODE_PROGRESSIONS = [
    { id: 'melodic-minor-modes', label: 'Melodic minor modes', ...chordScaleRuns([
        ['CmMaj7', 'I'], ['Dm7', 'II'], ['E♭maj7♯5', 'III'], ['F7(♯11)', 'IV'],
        ['G7(♭13)', 'V'], ['Am7♭5', 'VI'], ['B7alt', 'VII'],
    ].map(([symbol, roman], k) => [symbol, roman, chordScale(MELODIC_MINOR, k)])) },
    { id: 'harmonic-minor-modes', label: 'Harmonic minor modes', ...chordScaleRuns([
        ['CmMaj7', 'I'], ['Dm7♭5', 'II'], ['E♭maj7♯5', 'III'], ['Fm7(♯11)', 'IV'],
        ['G7(♭9, ♭13)', 'V'], ['A♭maj7(♯9)', 'VI'], ['Bdim7', 'VII'],
    ].map(([symbol, roman], k) => [symbol, roman, chordScale(HARMONIC_MINOR, k)])) },
].map(p => ({ ...p, tempo: 96 }));

/**
 * Those chord scales in use: a minor ii–V–i with each system, a tritone substitute, and
 * chords borrowed into C major.
 */
export const MINOR_CHORD_SCALE_PROGRESSIONS = [
    { id: 'ii-v-i-altered', label: 'ii–V–i, altered', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', chordScale(MELODIC_MINOR, 5)],
        ['G7alt', 'V7alt', chordScale(MELODIC_MINOR, 6)],
        ['Cm6', 'i6', chordScale(MELODIC_MINOR), 8],
    ]) },
    { id: 'ii-v-i-harmonic', label: 'ii–V–i, harmonic', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', chordScale(HARMONIC_MINOR, 1)],
        ['G7(♭9, ♭13)', 'V7', chordScale(HARMONIC_MINOR, 4)],
        ['CmMaj7', 'i(maj7)', chordScale(HARMONIC_MINOR), 8],
    ]) },
    { id: 'tritone-substitute', label: 'Tritone substitute', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', chordScale(MELODIC_MINOR, 5)],
        ['D♭7(♯11)', 'subV7', chordScale(MELODIC_MINOR, 3)],
        ['Cm6', 'i6', chordScale(MELODIC_MINOR), 8],
    ]) },
    { id: 'borrowed-in-major', label: 'Borrowed in C major', ...chordScaleRuns([
        ['Cmaj7', 'Imaj7', chordScale(MAJOR)],
        ['A♭maj7', '♭VImaj7', chordScale(HARMONIC_MINOR, 5)],
        ['Fm6', 'iv6', chordScale(MELODIC_MINOR)],
        ['B♭7(♯11)', '♭VII7', chordScale(MELODIC_MINOR, 3)],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR), 8],
    ]) },
].map(p => ({ ...p, tempo: 96 }));

export const CHORD_TYPE_PROGRESSIONS = [
    { id: 'triad-types', label: 'Chord types', tempo: 80, bassLow: C - 12, chords: chords(2, [
        ['C'], ['Cm'], ['Cdim'], ['Caug'], ['Csus2'], ['Csus4'],
    ]) },
    { id: 'suspensions', label: 'Suspensions', tempo: 80, bassLow: C - 12, chords: chords(2, [
        ['Csus4', 'Isus4'], ['C', 'I'], ['Gsus4', 'Vsus4'], ['G', 'V'], ['Csus2', 'Isus2'], ['C', 'I'],
    ]) },
    { id: 'passing-diminished', label: 'Passing diminished', tempo: 90, bassLow: C - 12, chords: chords(2, [
        ['C', 'I'], ['C♯dim', '♯i°'], ['Dm', 'ii'], ['D♯dim', '♯ii°'], ['Em', 'iii'], ['F', 'IV'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'augmented-line', label: 'Augmented line', tempo: 90, bassLow: C - 12, chords: chords(2, [
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
    // Sixth chords beside the triad and the major seventh; Am7 has the notes of C6 over A.
    { id: 'sixth-chords', label: 'Sixth chords', tempo: 80, chords: chords(2, [
        ['C', 'I'], ['C6', 'I6'], ['Cmaj7', 'Imaj7'], ['Am7', 'vi7'], ['Cm6', 'i6'], ['C6/9', 'I6/9'],
    ]) },
    { id: 'ii-v-i6', label: 'ii–V–I6', tempo: 135, chords: chords(4, [
        ['Dm7', 'ii7'], ['G7', 'V7'], ['C6', 'I6'], ['C6', 'I6'],
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
    { id: 'ii-v-i-tensions', label: 'ii–V–I with tensions', tempo: 120, voicing: 'open', comp: EVERY_BEAT, chords: chords(4, [
        ['Dm7', 'ii7', 'SD'], ['G7', 'V7', 'D'], ['Cmaj7', 'Imaj7', 'T'],
        ['Dm9', 'ii9', 'SD'], ['G13', 'V13', 'D'], ['Cmaj9', 'Imaj9', 'T'],
    ]) },
];

export const FUNCTIONAL_PROGRESSIONS = [
    { id: 't-sd-d-t', label: 'T–SD–D–T', tempo: 135, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Fmaj7', 'IV', 'SD'], ['G7', 'V', 'D'], ['Cmaj7', 'I', 'T'],
    ]) },
    { id: 'ii-v-i', label: 'ii–V–I', tempo: 135, chords: chords(4, [
        ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D'], ['Cmaj7', 'I', 'T'], ['Cmaj7', 'I', 'T'],
    ]) },
    { id: 'turnaround', label: 'I–vi–ii–V', tempo: 150, loop: true, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Am7', 'vi', 'T'], ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D'],
    ]) },
    { id: 'circle', label: 'iii–vi–ii–V–I', tempo: 150, chords: [
        ...chords(4, [['Em7', 'iii', 'T'], ['Am7', 'vi', 'T'], ['Dm7', 'ii', 'SD'], ['G7', 'V', 'D']]),
        { symbol: 'Cmaj7', beats: 8, roman: 'I', fn: 'T' },
    ] },
    { id: 'substitutes', label: 'Substitutes', tempo: 135, chords: chords(4, [
        ['Cmaj7', 'I', 'T'], ['Em7', 'iii', 'T'], ['Dm7', 'ii', 'SD'], ['Bm7♭5', 'viiø', 'D'], ['Am7', 'vi', 'T'],
    ]) },
    { id: 'pop', label: 'I–V–vi–IV', tempo: 135, loop: true, chords: chords(4, [
        ['C', 'I', 'T'], ['G', 'V', 'D'], ['Am', 'vi', 'T'], ['F', 'IV', 'SD'],
    ]) },
];

/**
 * Dominant motion: V and V7 to I, V7 to a minor i, secondary dominants, and a chain of
 * dominants each resolving a fifth down to the next.
 */
export const DOMINANT_MOTION_PROGRESSIONS = [
    { id: 'v-i', label: 'V–I', tempo: 120, chords: chords(4, [
        ['C', 'I'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'v7-i', label: 'V7–I', tempo: 120, chords: chords(4, [
        ['C', 'I'], ['G7', 'V7'], ['C', 'I'],
    ]) },
    { id: 'v7-i-minor', label: 'V7–i', tempo: 120, chords: chords(4, [
        ['Cm', 'i'], ['G7', 'V7'], ['Cm', 'i'],
    ]) },
    { id: 'secondary-dominants', label: 'Secondary dominants', tempo: 135, chords: chords(4, [
        ['Cmaj7', 'I'], ['A7', 'V7/ii'], ['Dm7', 'ii'], ['D7', 'V7/V'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'dominant-chain', label: 'Chain of dominants', tempo: 135, chords: chords(4, [
        ['E7', 'V7/vi'], ['A7', 'V7/ii'], ['D7', 'V7/V'], ['G7', 'V7'], ['C', 'I'],
    ]) },
];

/**
 * The ii–V: to I in major and to i in minor, a ii–V to each chord in turn, and ii–Vs
 * stepping down by whole steps through keys.
 */
export const TWO_FIVE_PROGRESSIONS = [
    { id: 'ii-v-i', label: 'ii–V–I', tempo: 135, chords: chords(4, [
        ['Dm7', 'ii7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7'], ['Cmaj7', 'Imaj7'],
    ]) },
    { id: 'minor-ii-v-i', label: 'Minor ii–V–i', tempo: 135, chords: chords(4, [
        ['Dm7♭5', 'iiø7'], ['G7', 'V7'], ['Cm6', 'i6'], ['Cm6', 'i6'],
    ]) },
    { id: 'ii-v-chain', label: 'ii–V to ii–V', tempo: 120, chords: [
        ...chords(2, [['Em7', 'ii7/ii'], ['A7', 'V7/ii'], ['Dm7', 'ii7'], ['G7', 'V7']]),
        ...chords(8, [['Cmaj7', 'Imaj7']]),
    ] },
    { id: 'descending-ii-v', label: 'Descending ii–Vs', tempo: 120, chords: [
        ...chords(2, [['Dm7', 'ii7'], ['G7', 'V7']]),
        ...chords(4, [['Cmaj7', 'Imaj7']]),
        ...chords(2, [['Cm7', 'ii7/♭VII'], ['F7', 'V7/♭VII']]),
        ...chords(4, [['B♭maj7', '♭VIImaj7']]),
    ] },
];

export const RESOLUTION_PROGRESSIONS = [
    { id: 'tritone-substitute', label: 'Tritone substitute', tempo: 120, chords: chords(4, [
        ['Dm7', 'ii'], ['D♭7', '♭II7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'half-step', label: 'Half step', tempo: 120, chords: chords(4, [
        ['Cmaj7', 'I'], ['D♭maj7', '♭IImaj7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'chromatic-mediants', label: 'Chromatic mediants', tempo: 120, chords: chords(4, [
        ['Cmaj7', 'I'], ['A♭maj7', '♭VImaj7'], ['Cmaj7', 'I'], ['Emaj7', 'IIImaj7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'plagal', label: 'Plagal', tempo: 120, chords: chords(4, [
        ['C', 'I'], ['F', 'IV'], ['C', 'I'], ['Fm', 'iv'], ['C', 'I'],
    ]) },
    { id: 'suspension', label: 'Suspension', tempo: 120, chords: chords(4, [
        ['G7sus4', 'V7sus4'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
    { id: 'deceptive', label: 'Deceptive', tempo: 120, chords: chords(4, [
        ['Dm7', 'ii'], ['G7', 'V7'], ['Am7', 'vi'], ['Dm7', 'ii'], ['G7', 'V7'], ['Cmaj7', 'I'],
    ]) },
];

export const SUBDOMINANT_MINOR_PROGRESSIONS = [
    { id: 'iv-iv-i', label: 'IV–iv–I', tempo: 120, chords: chords(4, [
        ['C', 'I', 'T'], ['F', 'IV', 'SD'], ['Fm', 'iv', 'SDm'], ['C', 'I', 'T'],
    ]) },
    { id: 'iv6', label: 'IVmaj7–iv6', tempo: 120, chords: chords(4, [
        ['Cmaj7', 'Imaj7', 'T'], ['Fmaj7', 'IVmaj7', 'SD'], ['Fm6', 'iv6', 'SDm'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'backdoor', label: 'Backdoor', tempo: 120, chords: chords(4, [
        ['Cmaj7', 'Imaj7', 'T'], ['Fm7', 'iv7', 'SDm'], ['B♭7', '♭VII7', 'SDm'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'half-diminished', label: 'iiø–V–I', tempo: 120, chords: chords(4, [
        ['Dm7♭5', 'iiø7', 'SDm'], ['G7', 'V7', 'D'], ['Cmaj7', 'Imaj7', 'T'],
    ]) },
    { id: 'flat-six-flat-seven', label: '♭VI–♭VII–I', tempo: 135, chords: chords(4, [
        ['C', 'I', 'T'], ['A♭', '♭VI', 'SDm'], ['B♭', '♭VII', 'SDm'], ['C', 'I', 'T'],
    ]) },
    { id: 'major-third', label: 'I–III–IV–iv', tempo: 135, loop: true, chords: chords(4, [
        ['C', 'I', 'T'], ['E', 'III', ''], ['F', 'IV', 'SD'], ['Fm', 'iv', 'SDm'],
    ]) },
    { id: 'neapolitan', label: 'Neapolitan', tempo: 120, chords: chords(4, [
        ['Cm', 'i', 'T'], ['D♭/F', '♭II6', 'SDm'], ['G7', 'V7', 'D'], ['Cm', 'i', 'T'],
    ]) },
];

/** Stacked fourths with a third on top, as in modal jazz, from a bass note. */
const quartal = bass => [bass - 12, bass, bass + 5, bass + 10, bass + 15, bass + 19];

// A twelve-tone row (every pitch class once) and its four three-note groups as chords.
const ROW = [0, 11, 7, 8, 3, 1, 2, 10, 6, 5, 4, 9];

export const NON_FUNCTIONAL_PROGRESSIONS = [
    { id: 'dorian-vamp', label: 'Dorian vamp', tempo: 150, loop: true, chords: chords(4, [
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
    { id: 'constant-structure', label: 'Constant structure', tempo: 120, chords: chords(4, [
        ['Cmaj7', 'C'], ['A♭maj7', 'A♭'], ['Emaj7', 'E'], ['Cmaj7', 'C'],
    ]) },
    { id: 'pedal', label: 'Pedal point', tempo: 120, loop: true, chords: chords(4, [
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
    { id: 'i-iv-v-i', label: 'I–IV–V–I', tempo: 168, chords: chords(4, [
        ['C', 'I'], ['F', 'IV'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'i-v-vi-iv', label: 'I–V–vi–IV', tempo: 144, chords: chords(4, [
        ['C', 'I'], ['G', 'V'], ['Am', 'vi'], ['F', 'IV'],
    ]) },
    { id: 'i-vi-iv-v', label: 'I–vi–IV–V', tempo: 132, chords: chords(4, [
        ['C', 'I'], ['Am', 'vi'], ['F', 'IV'], ['G', 'V'],
    ]) },
    { id: 'vi-iv-i-v', label: 'vi–IV–I–V', tempo: 144, chords: chords(4, [
        ['Am', 'vi'], ['F', 'IV'], ['C', 'I'], ['G', 'V'],
    ]) },
    { id: 'iv-v-iii-vi', label: 'IV–V–iii–vi', tempo: 150, chords: chords(4, [
        ['F', 'IV'], ['G', 'V'], ['Em', 'iii'], ['Am', 'vi'],
    ]) },
    { id: 'canon', label: 'I–V–vi–iii–IV–I–IV–V', tempo: 84, chords: chords(2, [
        ['C', 'I'], ['G', 'V'], ['Am', 'vi'], ['Em', 'iii'], ['F', 'IV'], ['C', 'I'], ['F', 'IV'], ['G', 'V'],
    ]) },
    { id: 'ii-v-i', label: 'ii–V–I', tempo: 180, chords: chords(4, [
        ['Dm7', 'ii7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7'], ['Cmaj7', 'Imaj7'],
    ]) },
    { id: 'i-vi-ii-v', label: 'I–vi–ii–V', tempo: 120, chords: chords(2, [
        ['C', 'I'], ['Am', 'vi'], ['Dm', 'ii'], ['G', 'V'],
    ]) },
    { id: 'i-bvii-iv-i', label: 'I–♭VII–IV–I', tempo: 168, chords: chords(4, [
        ['C', 'I'], ['B♭', '♭VII'], ['F', 'IV'], ['C', 'I'],
    ]) },
    { id: 'andalusian', label: 'i–♭VII–♭VI–V', tempo: 150, key: 'A', chords: chords(4, [
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

/**
 * A blues phrase over two bars of C7, struck once a bar as just its root and 7th, that
 * uses both thirds, in shuffled eighths (long, short). E♭, the blue third, is marked
 * (`mark`): first bent up a semitone to E, as a guitarist bends into the 3rd, then,
 * after a run up the blues scale and back, bent a quarter tone sharp before the phrase
 * lands on C. Played on the Synth lead, which can bend; no bass or drums.
 */
export const BLUE_NOTE_PROGRESSIONS = [
    { id: 'blue-third', label: 'Blue third over C7', tempo: 100, loop: true,
        // Only the root and the 7th (C3, B♭3), so the 3rd is the phrase's own.
        chords: chords(4, [['C7', 'I7'], ['C7', 'I7']]).map(c => ({ ...c, notes: [48, 58] })),
        melody: melody([
            ['Eb4', 1, { mark: true, bend: 1, bendAt: 0.25, bendBeats: 0.15 }],
            ['G4', 2 * third], ['Bb4', third],
            ['C5', 2 * third], ['Bb4', third], ['G4', 2 * third], ['E4', third],
            ['Eb4', 2 * third, { mark: true, bend: 0.5, bendAt: third, bendBeats: 0.15 }], ['C4', 1], [null, 2 + third],
        ]) },
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

// ── Barry Harris's sixth diminished scale ──

/** The major and minor sixth diminished scales on C: the scale with ♯5 added, in semitones. */
const MAJOR_SIXTH_DIMINISHED = [0, 2, 4, 5, 7, 8, 9, 11];
const MINOR_SIXTH_DIMINISHED = [0, 2, 3, 5, 7, 8, 9, 11];

/**
 * A sixth diminished scale harmonized in four-part close position, each note of the
 * scale at the bottom of its chord, up an octave and back down, one chord a beat. The
 * notes alternate between the sixth chord (its inversions) and the diminished seventh
 * chord (all four of them the same notes), so each chord takes the four scale notes
 * from its own, every other one.
 */
function sixthDiminishedChords(steps, sixth) {
    const scale = [...steps, ...steps.map(s => s + 12)];
    const names = ['C', 'D', sixth === 'm6' ? 'E♭' : 'E', 'F', 'G', 'G♯', 'A', 'B'];
    const tonic = sixth === 'm6' ? 'i6' : 'I6';
    const chord = i => {
        const notes = [0, 2, 4, 6].map(k => C - 12 + scale[i + k]);
        const bass = names[i % 8];
        return i % 2
            ? { symbol: `${bass}°7`, beats: 1, roman: 'vii°7', notes }
            : { symbol: i % 8 ? `C${sixth}/${bass}` : `C${sixth}`, beats: 1, roman: tonic, notes };
    };
    const up = Array.from({ length: 9 }, (_, i) => chord(i));
    const down = up.slice(0, 8).reverse();
    return [...up, ...down.slice(0, -1), { ...down.at(-1), beats: 3 }];
}

export const SIXTH_DIMINISHED_PROGRESSIONS = [
    { id: 'major-sixth-diminished', label: 'Major 6th diminished', tempo: 96,
        chords: sixthDiminishedChords(MAJOR_SIXTH_DIMINISHED, '6') },
    { id: 'minor-sixth-diminished', label: 'Minor 6th diminished', tempo: 96,
        chords: sixthDiminishedChords(MINOR_SIXTH_DIMINISHED, 'm6') },
];

/**
 * A two-bar line of eighth notes running down from C6 over a held C6, with a click on
 * every beat: down the major scale, where the chord tones drift off the beats, and down
 * the major sixth diminished scale, where they stay on them.
 */
function eighthNoteLine(steps) {
    const down = [];
    for (let octave = 2; down.length < 16; octave--) {
        for (let i = steps.length - 1; i >= 0 && down.length < 16; i--) {
            const midi = C + octave * 12 + steps[i];
            if (midi <= C + 24) down.push(midi);
        }
    }
    return down.map(midi => ({ midi, beats: 0.5 }));
}

export const BEBOP_LINE_PROGRESSIONS = [
    { id: 'major-scale-line', label: 'Major scale', melody: eighthNoteLine(MAJOR_STEPS) },
    { id: 'sixth-diminished-line', label: '6th diminished scale', melody: eighthNoteLine(MAJOR_SIXTH_DIMINISHED) },
].map(p => ({
    ...p, tempo: 132, loop: true, drums: pulsePattern(4), comp: [['all', 2]],
    chords: [{ symbol: 'C6', beats: 8, roman: 'I6', notes: [C - 12, C - 8, C - 5, C - 3], alt: [C - 12, C - 5, C - 3, C + 2] }],
}));

/**
 * Bebop phrases over a ii–V–I in C, in the manner Barry Harris taught: eighth notes with
 * the chord tones on the beats, the ii heard as its V (one dominant scale for both
 * bars), and the 7th of G7 falling to the 3rd of the tonic. Each is two bars of eighth
 * notes and a held note, over hand-voiced chords low enough to stay clear of the line,
 * with a click on every beat.
 */
const PHRASE_CHORDS = {
    'Dm7': { symbol: 'Dm7', roman: 'ii7', notes: [38, 48, 53, 57] },
    'Dm7♭5': { symbol: 'Dm7♭5', roman: 'iiø7', notes: [38, 48, 53, 56] },
    'G7': { symbol: 'G7', roman: 'V7', notes: [43, 47, 53] },
    'C6': { symbol: 'C6', roman: 'I6', notes: [36, 52, 55, 57] },
    'Cm6': { symbol: 'Cm6', roman: 'i6', notes: [36, 51, 55, 57] },
};

function iiVPhrase(id, label, [ii, v, i], bar1, bar2, landing) {
    return {
        id, label, tempo: 132, loop: true, drums: pulsePattern(4),
        chords: [ii, v, i].map(name => ({ ...PHRASE_CHORDS[name], beats: 4 })),
        melody: [...melody([...bar1, ...bar2].map(n => [n, 0.5])), ...melody([[landing, 4]])],
    };
}

export const BEBOP_II_V_PROGRESSIONS = [
    iiVPhrase('one-scale', 'One scale for ii–V', ['Dm7', 'G7', 'C6'],
        ['G5', 'F#5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4'],
        ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'F#5'], 'G5'),
    iiVPhrase('down-and-up', 'Down and up', ['Dm7', 'G7', 'C6'],
        ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'],
        ['B3', 'C4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'Ab4'], 'G4'),
    iiVPhrase('minor-diminished', 'Minor, diminished', ['Dm7♭5', 'G7', 'Cm6'],
        ['D4', 'F4', 'Ab4', 'B4', 'D5', 'F5', 'Ab5', 'G5'],
        ['F5', 'Eb5', 'D5', 'C5', 'B4', 'Ab4', 'G4', 'F4'], 'Eb4'),
];

// ── Improvisation ──

/** A melody from `[name, beats]` pairs, with `third` for swung eighths (long, short). */
const T = 1 / 3;

/**
 * Pentatonic phrases over simple progressions and the blues, each with the scale a
 * player can use (`playScale`) for playing along.
 */
const SHUFFLE_BLUES = BLUES_PROGRESSIONS[0];
export const PENTATONIC_PROGRESSIONS = [
    { id: 'major-pentatonic', label: 'I–vi–IV–V', tempo: 100, loop: true, bassLow: C - 12,
        playScale: ['C', 'D', 'E', 'G', 'A'],
        chords: chords(4, [['C', 'I'], ['Am', 'vi'], ['F', 'IV'], ['G', 'V']]),
        melody: melody([
            ['E5', 0.5], ['G5', 0.5], ['A5', 1], ['G5', 1], ['E5', 1],
            ['D5', 0.5], ['E5', 0.5], ['C5', 1], ['A4', 2],
            ['C5', 0.5], ['D5', 0.5], ['E5', 1], ['G5', 0.5], ['E5', 0.5], ['D5', 1],
            ['D5', 1], ['C5', 0.5], ['A4', 0.5], ['G4', 2],
        ]) },
    { id: 'minor-pentatonic', label: 'vi–IV–I–V', tempo: 100, loop: true, bassLow: C - 12, key: 'A',
        playScale: ['A', 'C', 'D', 'E', 'G'],
        chords: chords(4, [['Am', 'i'], ['F', '♭VI'], ['C', '♭III'], ['G', '♭VII']]),
        melody: melody([
            ['A4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 1.5], ['D5', 0.5], ['C5', 0.5],
            ['A4', 1], ['C5', 1], ['A4', 0.5], ['G4', 0.5], ['A4', 1],
            ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 2],
            ['D5', 1], ['C5', 0.5], ['A4', 0.5], ['G4', 1], ['A4', 1],
        ]) },
    { ...SHUFFLE_BLUES, id: 'blues-minor', label: 'Blues, minor pentatonic',
        playScale: ['C', 'E♭', 'F', 'G', 'B♭'],
        melody: melody([
            ['G4', 2 * T], ['Bb4', T], ['C5', 1], ['Bb4', 2 * T], ['G4', T], ['Eb4', 1],
            ['C4', 2], [null, 2],
            ['G4', 2 * T], ['Bb4', T], ['C5', 2 * T], ['Eb5', T], ['C5', 1], ['Bb4', 1],
            ['G4', 3], [null, 1],
            ['G4', 2 * T], ['Bb4', T], ['C5', 1], ['Bb4', 2 * T], ['G4', T], ['Eb4', 1],
            ['C4', 2], [null, 2],
            ['G4', 2 * T], ['Bb4', T], ['C5', 2 * T], ['Eb5', T], ['C5', 1], ['Bb4', 1],
            ['G4', 3], [null, 1],
            ['F5', 2 * T], ['Eb5', T], ['C5', 1], ['Bb4', 2 * T], ['G4', T], ['F4', 1],
            ['Eb4', 2 * T], ['F4', T], ['G4', 2], [null, 1],
            ['Bb4', 2 * T], ['G4', T], ['C5', 3],
            [null, 4],
        ]) },
    { ...SHUFFLE_BLUES, id: 'blues-major', label: 'Blues, major pentatonic',
        playScale: ['C', 'D', 'E', 'G', 'A'],
        melody: melody([
            ['E4', 2 * T], ['G4', T], ['A4', 2 * T], ['C5', T], ['A4', 1], ['G4', 1],
            ['E4', 2], [null, 2],
            ['D5', 2 * T], ['C5', T], ['A4', 2 * T], ['G4', T], ['E4', 1], ['D4', 1],
            ['C4', 3], [null, 1],
            ['A4', 2 * T], ['C5', T], ['D5', 2 * T], ['C5', T], ['A4', 1], ['G4', 1],
            ['A4', 2], [null, 2],
            ['E4', 2 * T], ['G4', T], ['A4', 2 * T], ['C5', T], ['A4', 1], ['G4', 1],
            ['C4', 3], [null, 1],
            ['D5', 2 * T], ['C5', T], ['A4', 2 * T], ['G4', T], ['D5', 2],
            ['C5', 2 * T], ['A4', T], ['G4', 2 * T], ['A4', T], ['C5', 2],
            ['E5', 1], ['D5', 2 * T], ['C5', T], ['C5', 2],
            [null, 4],
        ]) },
];

/**
 * Progressions that stay in one key, with phrases from its scale alone (the white keys
 * in C), the chord tones on the beats.
 */
export const DIATONIC_IMPROV_PROGRESSIONS = [
    { id: 'i-vi-ii-v', label: 'I–vi–ii–V', tempo: 120, chords: chords(4, [['C', 'I'], ['Am', 'vi'], ['Dm', 'ii'], ['G', 'V']]),
        melody: melody([
            ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['C5', 1], ['G4', 1],
            ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 1], ['C5', 1],
            ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['A4', 1], ['F4', 1],
            ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['B4', 1],
        ]) },
    { id: 'iii-vi-ii-v-i', label: 'iii–vi–ii–V–I', tempo: 120, chords: chords(4, [
        ['Em', 'iii'], ['Am', 'vi'], ['Dm', 'ii'], ['G', 'V'], ['C', 'I'],
    ]), melody: melody([
        ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['E4', 1],
        ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 1], ['A4', 1],
        ['D5', 0.5], ['E5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 1], ['A4', 1],
        ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F5', 1], ['D5', 1],
        ['E5', 2], ['C5', 2],
    ]) },
    { id: 'a-minor', label: 'i–♭VI–♭III–♭VII', tempo: 120, key: 'A', chords: chords(4, [
        ['Am', 'i'], ['F', '♭VI'], ['C', '♭III'], ['G', '♭VII'],
    ]), melody: melody([
        ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 2],
        ['F5', 0.5], ['E5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 2],
        ['G4', 0.5], ['A4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 2],
        ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['B4', 1],
    ]) },
    { id: 'dorian-vamp', label: 'Dorian vamp', tempo: 120, chords: chords(4, [['Dm7', 'ii7'], ['G7', 'V7']]),
        melody: melody([
            ['D5', 0.5], ['F5', 0.5], ['A5', 0.5], ['G5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 1],
            ['B4', 0.5], ['D5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['B4', 0.5], ['G4', 1],
        ]) },
].map(p => ({ ...p, loop: true, bassLow: C - 12 }));

/** A chord with the name of the scale played over it, for phrases with a Scale readout. */
const over = (symbol, roman, scale, beats = 4, scaleRoot) => ({ symbol, roman, beats, scale, ...(scaleRoot ? { scaleRoot } : {}) });

/**
 * The ii–V–I with the usual pairs of chord scales, each run up over its chord, and
 * phrases that keep one ii and change the scale over V: Mixolydian, altered,
 * half-whole diminished, and harmonic minor (Phrygian dominant) in minor.
 */
export const TWO_FIVE_SCALE_PROGRESSIONS = [
    { id: 'dorian-mixolydian', label: 'Dorian, Mixolydian', ...chordScaleRuns([
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['G7', 'V7', chordScale(MAJOR_MODES, 4)],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'dorian-altered', label: 'Dorian, altered', ...chordScaleRuns([
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['G7alt', 'V7alt', chordScale(MELODIC_MINOR, 6)],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'dorian-half-whole', label: 'Dorian, half-whole', ...chordScaleRuns([
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['G7(♭9)', 'V7(♭9)', HALF_WHOLE],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'dorian-lydian-dominant', label: 'Dorian, Lydian dominant', ...chordScaleRuns([
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['D♭7(♯11)', 'subV7', chordScale(MELODIC_MINOR, 3)],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'locrian-phrygian-dominant', label: 'Locrian, Phrygian dominant', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', chordScale(MAJOR_MODES, 6)], ['G7(♭9, ♭13)', 'V7', chordScale(HARMONIC_MINOR, 4)],
        ['Cm6', 'i6', chordScale(MELODIC_MINOR, 0), 8],
    ]) },
    { id: 'locrian-2-altered', label: 'Locrian ♮2, altered', ...chordScaleRuns([
        ['Dm7♭5', 'iiø7', chordScale(MELODIC_MINOR, 5)], ['G7alt', 'V7alt', chordScale(MELODIC_MINOR, 6)],
        ['Cm6', 'i6', chordScale(MELODIC_MINOR, 0), 8],
    ]) },
].map(p => ({ ...p, tempo: 120 }));

const DORIAN_LINE = [['D5', 0.5], ['E5', 0.5], ['F5', 0.5], ['A5', 0.5], ['C6', 0.5], ['B5', 0.5], ['A5', 0.5], ['G5', 0.5]];

export const TWO_FIVE_PHRASE_PROGRESSIONS = [
    { id: 'mixolydian', label: 'Mixolydian',
        chords: [over('Dm7', 'ii7', 'Dorian'), over('G7', 'V7', 'Mixolydian'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: melody([...DORIAN_LINE,
            ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5],
            ['E4', 4]]) },
    { id: 'altered', label: 'Altered',
        chords: [over('Dm7', 'ii7', 'Dorian'), over('G7alt', 'V7alt', 'altered'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: melody([...DORIAN_LINE,
            ['Ab5', 0.5], ['G5', 0.5], ['F5', 0.5], ['Eb5', 0.5], ['Db5', 0.5], ['B4', 0.5], ['Bb4', 0.5], ['Ab4', 0.5],
            ['G4', 4]]) },
    { id: 'diminished', label: 'Half-whole diminished',
        chords: [over('Dm7', 'ii7', 'Dorian'), over('G7(♭9)', 'V7(♭9)', 'half-whole diminished'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: melody([...DORIAN_LINE,
            ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C#5', 0.5], ['B4', 0.5], ['Bb4', 0.5], ['Ab4', 0.5], ['G4', 0.5],
            ['E4', 4]]) },
    // The diminished seventh a half step above the root of V: A♭°7 (A♭, B, D, F) is G7♭9
    // without its root.
    { id: 'diminished-half-step-up', label: 'Diminished, half step up',
        chords: [over('Dm7', 'ii7', 'Dorian'), over('G7(♭9)', 'V7(♭9)', 'diminished 7th', 4, 'A♭'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: melody([...DORIAN_LINE,
            ['Ab4', 0.5], ['B4', 0.5], ['D5', 0.5], ['F5', 0.5], ['Ab5', 0.5], ['F5', 0.5], ['D5', 0.5], ['B4', 0.5],
            ['C5', 4]]) },
    { id: 'harmonic-minor', label: 'Harmonic minor',
        chords: [over('Dm7♭5', 'iiø7', 'Locrian'), over('G7(♭9, ♭13)', 'V7', 'Phrygian dominant'), over('Cm6', 'i6', 'melodic minor')],
        melody: melody([
            ['D5', 0.5], ['Eb5', 0.5], ['F5', 0.5], ['Ab5', 0.5], ['C6', 0.5], ['Bb5', 0.5], ['Ab5', 0.5], ['G5', 0.5],
            ['F5', 0.5], ['Eb5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['Ab4', 0.5], ['G4', 0.5], ['F4', 0.5],
            ['Eb4', 4]]) },
].map(p => ({ ...p, tempo: 120, loop: true }));

/**
 * Chords outside the plain ii–V and the scales that go with them: Lydian dominant on
 * dominants that do not resolve down a fifth, whole tone on augmented dominants, and
 * the diminished scales on a passing diminished chord and a dominant with a flat 9th.
 */
export const JAZZ_CHORD_SCALE_PROGRESSIONS = [
    { id: 'ii7-lydian-dominant', label: 'II7, scale', ...chordScaleRuns([
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0)], ['D7(♯11)', 'II7', chordScale(MELODIC_MINOR, 3)],
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['G7', 'V7', chordScale(MAJOR_MODES, 4)],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'backdoor-lydian-dominant', label: '♭VII7, scale', ...chordScaleRuns([
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0)], ['Fm7', 'iv7', chordScale(MAJOR_MODES, 1)],
        ['B♭7(♯11)', '♭VII7', chordScale(MELODIC_MINOR, 3)], ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'augmented-whole-tone', label: '7♯5, scale', ...chordScaleRuns([
        ['C6', 'I6', chordScale(MAJOR_MODES, 0)], ['C7♯5', 'V7♯5/IV', WHOLE_TONE],
        ['Fmaj7', 'IVmaj7', chordScale(MAJOR_MODES, 3)], ['G7♯5', 'V7♯5', WHOLE_TONE],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
    { id: 'diminished', label: 'Diminished, scales', ...chordScaleRuns([
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0)], ['C♯dim7', '♯i°7', WHOLE_HALF],
        ['Dm7', 'ii7', chordScale(MAJOR_MODES, 1)], ['G7(♭9)', 'V7(♭9)', HALF_WHOLE],
        ['Cmaj7', 'Imaj7', chordScale(MAJOR_MODES, 0), 8],
    ]) },
].map(p => ({ ...p, tempo: 120 }));

// ── Pentatonics over jazz chords ──

const PENTATONICS = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };

/**
 * Chords, each with a pentatonic scale on its own root (`scaleRoot`, a note name in C)
 * run up over it in eighth notes: `[symbol, roman, scaleRoot, 'major' | 'minor', beats = 4]`.
 * The chord keeps the scale's name and root for the Scale readout.
 */
function pentatonicRuns(list) {
    const melody = [];
    const chordList = list.map(([symbol, roman, scaleRoot, kind, beats = 4]) => {
        const steps = PENTATONICS[kind];
        const root = C + ((parseNote(scaleRoot).semitones % 12) + 12) % 12;
        [...steps, ...steps.map(s => s + 12)].slice(0, 8).forEach(s => melody.push({ midi: root + s, beats: 0.5 }));
        if (beats > 4) melody.push({ midi: null, beats: beats - 4 });
        return { symbol, beats, roman, scale: `${kind} pentatonic`, scaleRoot };
    });
    return { chords: chordList, melody };
}

/**
 * The same, but played vertically: each beat is a triplet of every other note of the
 * pentatonic (C, E, A, then D, G, C, … in C major pentatonic), climbing one step of the
 * scale per beat. The root sits in the octave from F♯3, so the shapes stay in range.
 */
function pentatonicSkips(list) {
    const melodyList = [];
    const chordList = list.map(([symbol, roman, scaleRoot, kind, beats = 4]) => {
        const steps = PENTATONICS[kind];
        const pc = ((parseNote(scaleRoot).semitones % 12) + 12) % 12;
        const root = C + pc - (pc >= 6 ? 12 : 0);
        const ext = [0, 1, 2].flatMap(o => steps.map(s => s + 12 * o));
        for (let k = 0; k < beats; k++) [ext[k], ext[k + 2], ext[k + 4]].forEach(s => melodyList.push({ midi: root + s, beats: 1 / 3 }));
        return { symbol, beats, roman, scale: `${kind} pentatonic`, scaleRoot };
    });
    return { chords: chordList, melody: melodyList };
}

/**
 * Pentatonic scales on other roots over jazz chords: three over each chord type, the
 * modern choices over a ii–V–I, and a pentatonic slipped a half step out and back.
 */
export const MODERN_PENTATONIC_PROGRESSIONS = [
    { id: 'on-maj7', label: 'On Cmaj7', ...pentatonicRuns([
        ['Cmaj7', 'I', 'C', 'major'], ['Cmaj7', 'V', 'G', 'major'], ['Cmaj7', 'vii', 'B', 'minor'],
    ]) },
    { id: 'on-m7', label: 'On Dm7', ...pentatonicRuns([
        ['Dm7', 'i', 'D', 'minor'], ['Dm7', 'v', 'A', 'minor'], ['Dm7', 'ii', 'E', 'minor'],
    ]) },
    { id: 'on-7', label: 'On G7', ...pentatonicRuns([
        ['G7', 'I', 'G', 'major'], ['G7sus4', 'v', 'D', 'minor'], ['G7alt', '♭iii', 'B♭', 'minor'],
        ['Cmaj7', 'vii', 'B', 'minor'],
    ]) },
    { id: 'ii-v-i', label: 'ii–V–I', ...pentatonicRuns([
        ['Dm7', 'ii', 'E', 'minor'], ['G7alt', '♭iii', 'B♭', 'minor'], ['Cmaj7', 'vii', 'B', 'minor', 8],
    ]) },
    { id: 'on-maj7-skips', label: 'On Cmaj7, skipping', ...pentatonicSkips([
        ['Cmaj7', 'I', 'C', 'major', 8],
    ]) },
    { id: 'ii-v-i-skips', label: 'ii–V–I, skipping', ...pentatonicSkips([
        ['Dm7', 'ii', 'E', 'minor'], ['G7alt', '♭iii', 'B♭', 'minor'], ['Cmaj7', 'vii', 'B', 'minor', 8],
    ]) },
    { id: 'side-slip', label: 'Side-slipping', ...pentatonicRuns([
        ['Cm7', 'in', 'C', 'minor'], ['Cm7', 'out', 'C♯', 'minor'], ['Cm7', 'in', 'C', 'minor'], ['Cm7', 'out', 'B', 'minor'],
    ]) },
].map(p => ({ ...p, tempo: 120, loop: true }));

// ── Outlining the changes ──

/** The turnaround Cmaj7–A7–Dm7–G7, one bar each, under the chord-tone lines. */
const TURNAROUND = chords(4, [['Cmaj7', 'Imaj7'], ['A7', 'VI7'], ['Dm7', 'ii7'], ['G7', 'V7']]);
const line = notes => melody(notes.map(n => (Array.isArray(n) ? n : [n, 0.5])));

/**
 * Lines that spell out a turnaround from its chord tones: arpeggios, the guide tones
 * (3rds and 7ths), chord tones on the beats joined by steps, and chord tones on beats 1
 * and 3 reached by enclosures (a note above and a note below the target).
 */
export const CHORD_TONE_PROGRESSIONS = [
    { id: 'arpeggios', label: 'Arpeggios', melody: line([
        ['E4', 1], ['G4', 1], ['B4', 1], ['C5', 1], ['C#5', 1], ['A4', 1], ['G4', 1], ['E4', 1],
        ['F4', 1], ['A4', 1], ['C5', 1], ['D5', 1], ['B4', 1], ['G4', 1], ['F4', 1], ['D4', 1],
    ]) },
    { id: 'guide-tones', label: 'Guide tones', melody: line([
        ['E4', 2], ['B4', 2], ['G4', 2], ['C#5', 2], ['F4', 2], ['C5', 2], ['F4', 2], ['B4', 2],
    ]) },
    { id: 'stepwise', label: 'Joined by steps', melody: line([
        'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4',
        'G4', 'A4', 'C#5', 'D5', 'E5', 'F5', 'E5', 'D5',
        'C5', 'B4', 'A4', 'G4', 'F4', 'A4', 'C5', 'E5',
        'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'D#4',
    ]) },
    { id: 'enclosures', label: 'Enclosures', melody: line([
        'E4', 'G4', 'A4', 'F#4', 'G4', 'B4', 'D5', 'C5',
        'C#5', 'E5', 'F5', 'D#5', 'E5', 'G5', 'Eb5', 'C#5',
        'D5', 'F5', 'Bb4', 'G#4', 'A4', 'F4', 'C5', 'A#4',
        'B4', 'D5', 'G5', 'E5', 'F5', 'D5', 'F4', 'D#4',
    ]) },
].map(p => ({ ...p, tempo: 120, loop: true, chords: TURNAROUND }));

// ── Idioms ──

const CMAJ7_MID = [36, 47, 52, 55];
const CMAJ9_ALT = [36, 52, 55, 59, 62];

/**
 * Common jazz idioms in short phrases: the three enclosures of C (one bar each, the
 * label naming the notes that close in on C), chord tones approached from a half step
 * below, "the lick" answered by the 3-to-♭9 arpeggio over V7, the blues move from the
 * minor to the major 3rd, and anticipation (the next chord's note sounding on the "and"
 * of 4).
 */
export const IDIOM_PROGRESSIONS = [
    { id: 'enclosures', label: 'Enclosures',
        chords: [
            { symbol: 'Cmaj7', roman: 'Imaj7', beats: 4, notes: CMAJ7_MID, alt: CMAJ9_ALT },
            { symbol: '', roman: 'D–B–C', beats: 4, notes: CMAJ7_MID, alt: CMAJ9_ALT },
            { symbol: '', roman: 'D♭–B–C', beats: 4, notes: CMAJ7_MID, alt: CMAJ9_ALT },
            { symbol: '', roman: 'D–D♭–B–C', beats: 4, notes: CMAJ7_MID, alt: CMAJ9_ALT },
        ],
        comp: [['all', 2]],
        melody: line([
            [null, 3], 'D5', 'B4',
            ['C5', 2], [null, 1], 'Db5', 'B4',
            ['C5', 2], [null, 0.5], 'D5', 'Db5', 'B4',
            ['C5', 4],
        ]) },
    { id: 'approach', label: 'Approach from below',
        chords: chords(4, [['Dm7', 'ii7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7']]),
        melody: line([
            ['F4', 1], ['A4', 1], ['C5', 1], [null, 0.5], 'A#4',
            ['B4', 1], ['D5', 1], ['F5', 1], [null, 0.5], 'D#5',
            ['E5', 4],
        ]) },
    { id: 'lick', label: 'The lick, 3 to ♭9',
        chords: chords(4, [['Dm7', 'ii7'], ['G7(♭9)', 'V7(♭9)'], ['Cmaj7', 'Imaj7']]),
        melody: line([
            'D5', 'E5', 'F5', 'G5', ['E5', 1], 'C5', 'D5',
            'B4', 'D5', 'F5', 'Ab5', 'G5', 'E5', 'D5', 'F5',
            ['E5', 4],
        ]) },
    { id: 'blue-third', label: 'Minor to major 3rd',
        chords: chords(4, [['C7', 'I7'], ['F7', 'IV7']]),
        melody: line([
            'Eb4', 'E4', 'G4', 'A4', ['C5', 1], ['A4', 1],
            'A4', 'C5', 'Eb5', 'D5', ['C5', 1], ['A4', 1],
        ]) },
    { id: 'anticipation', label: 'Anticipation',
        chords: chords(4, [['Dm7', 'ii7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7']]),
        melody: line([
            ['D5', 1], ['F5', 1], ['A5', 1], [null, 0.5], ['B5', 2.5],
            'G5', 'F5', [null, 0.5], ['E5', 4.5],
        ]) },
    // Longer lines that mix arpeggios, the ♭9, and guide tones, each bar ending in an
    // enclosure of the next chord's 3rd (or root), so every chord change lands on a
    // chord tone approached from above and below.
    { id: 'long-ii-v-i', label: 'ii–V–I, enclosing each 3rd',
        chords: [...chords(4, [['Dm7', 'ii7'], ['G7(♭9)', 'V7(♭9)']]), ...chords(8, [['Cmaj7', 'Imaj7']])],
        melody: line([
            'G4', 'E4', 'F4', 'A4', 'C5', 'E5', 'C5', 'A#4',
            'B4', 'D5', 'F5', 'Ab5', 'G5', 'D5', 'F5', 'D#5',
            ['E5', 1], 'G5', 'B5', ['A5', 1], 'G5', 'E5',
            'D5', 'Db5', 'B4', ['C5', 2.5],
        ]) },
    { id: 'long-turnaround', label: 'Turnaround, enclosing each 3rd',
        chords: chords(4, [['Cmaj7', 'Imaj7'], ['A7(♭9)', 'V7(♭9)/ii'], ['Dm7', 'ii7'], ['G7(♭9)', 'V7(♭9)']]),
        melody: line([
            'E5', 'G5', 'B5', 'G5', 'E5', 'B4', 'D5', 'C5',
            'C#5', 'E5', 'G5', 'Bb5', 'A5', 'G5', 'Gb5', 'E5',
            'F5', 'A5', 'C6', 'A5', 'F5', 'D5', 'C5', 'A#4',
            'B4', 'D5', 'F5', 'A5', 'Ab5', 'G5', 'F5', 'D#5',
        ]) },
    { id: 'long-minor', label: 'Minor ii–V–i',
        chords: [...chords(4, [['Dm7♭5', 'iiø7'], ['G7alt', 'V7alt']]), ...chords(8, [['Cm6', 'i6']])],
        melody: line([
            'D5', 'F5', 'Ab5', 'C6', 'Ab5', 'F5', 'C5', 'A#4',
            'B4', 'D5', 'F5', 'Ab5', 'Bb5', 'Ab5', 'F5', 'D5',
            ['Eb5', 1], 'G5', 'A5', ['C6', 1], 'A5', 'G5',
            'D5', 'B4', ['C5', 3],
        ]) },
].map(p => ({ ...p, tempo: 120, loop: true }));

// ── Playing outside ──

const DM7_LOW = [38, 48, 53, 57];
const DM9_ALT = [38, 53, 57, 60, 64];

/**
 * Going outside the harmony and back: a D Dorian line over Dm7 slipped up a half step
 * to E♭ Dorian for a bar, and a G7 bar played as the ii–V a tritone away (A♭m7–D♭7)
 * before resolving to C.
 */
// The backing strikes its chord every two beats, so the harmony stays in the ear while
// the line goes out.
const EVERY_TWO_BEATS = [['all', 2]];

export const OUTSIDE_PROGRESSIONS = [
    { id: 'side-step', label: 'Side-stepping', tempo: 120, loop: true, comp: EVERY_TWO_BEATS,
        chords: [
            { symbol: 'Dm7', roman: 'in', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'out', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'in', beats: 8, notes: DM7_LOW, alt: DM9_ALT },
        ],
        melody: line([
            'D5', 'E5', 'F5', 'A5', 'G5', 'F5', 'E5', 'C5',
            'Eb5', 'F5', 'Gb5', 'Bb5', 'Ab5', 'Gb5', 'F5', 'Db5',
            'D5', 'E5', 'F5', 'A5', 'C6', 'A5', 'G5', 'E5', ['D5', 4],
        ]) },
    { id: 'tritone-ii-v', label: 'ii–V a tritone away', tempo: 120, loop: true, comp: EVERY_TWO_BEATS,
        chords: [
            { symbol: 'Dm7', roman: 'ii7', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: 'G7', roman: 'A♭m7', beats: 2, notes: [43, 53, 59] }, { symbol: '', roman: 'D♭7', beats: 2, notes: [43, 53, 59, 64] },
            { symbol: 'Cmaj7', roman: 'Imaj7', beats: 4, notes: [36, 47, 52, 55] },
        ],
        melody: line([
            'D5', 'E5', 'F5', 'A5', 'C6', 'B5', 'A5', 'G5',
            'Gb5', 'Eb5', 'Cb5', 'Ab4', 'F5', 'Eb5', 'Db5', 'Cb5',
            ['C5', 4],
        ]) },
    // One four-note cell (up a minor 3rd, down a half step, up a fourth) moved up by
    // whole steps until it is far out, then down by minor thirds back into D Dorian,
    // landing on F, the 3rd of Dm7. The labels name the note each cell starts on.
    { id: 'sequence', label: 'Motivic sequence', tempo: 120, loop: true, comp: EVERY_TWO_BEATS,
        chords: [
            { symbol: 'Dm7', roman: 'D, E', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'F♯, G♯', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'F, D', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'in', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
        ],
        melody: line([
            'D5', 'F5', 'E5', 'A5', 'E5', 'G5', 'F#5', 'B5',
            'F#5', 'A5', 'G#5', 'C#6', 'G#5', 'B5', 'A#5', 'D#6',
            'F5', 'Ab5', 'G5', 'C6', 'D5', 'F5', 'E5', 'A5',
            ['F5', 2], [null, 2],
        ]) },
    // Over a vamp on Dm7, the line plays a turnaround that is not there, F♯m7–B7–Em7–A7
    // (iii–VI–ii–V of D), one arpeggio a bar, and lands on D on beat 1 of bar 5; the
    // rest is D Dorian. The labels name the imagined chords.
    { id: 'imposed-turnaround', label: 'A turnaround over a vamp', tempo: 132, loop: true, comp: EVERY_TWO_BEATS,
        chords: [
            { symbol: 'Dm7', roman: 'F♯m7', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'B7', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'Em7', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'A7', beats: 4, notes: DM7_LOW, alt: DM9_ALT },
            { symbol: '', roman: 'in', beats: 16, notes: DM7_LOW, alt: DM9_ALT },
        ],
        melody: line([
            'F#4', 'A4', 'C#5', 'E5', 'D5', 'C#5', 'A4', 'C#5',
            'D#5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'D#5', 'B4',
            'E5', 'G5', 'B5', 'D6', 'B5', 'G5', 'E5', 'D5',
            'A4', 'C#5', 'E5', 'G5', 'Bb5', 'G5', 'E5', 'C#5',
            ['D5', 2], 'F5', 'E5', 'D5', 'C5',
            'A4', 'C5', 'D5', 'F5', 'A5', 'G5', 'F5', 'D5',
            'E5', 'F5', 'A5', 'C6', 'B5', 'A5', 'G5', 'E5',
            ['D5', 2], [null, 2],
        ]) },
    // Over C7, dominant arpeggios on C, E♭, F♯, and A, a minor third apart, all inside
    // C half-whole diminished, then the resolution to F.
    { id: 'minor-third-cycle', label: 'A cycle of minor thirds', tempo: 120, loop: true, comp: EVERY_TWO_BEATS,
        chords: [
            { symbol: 'C7', roman: 'C7, E♭7', beats: 4 }, { symbol: '', roman: 'F♯7, A7', beats: 4, tied: true },
            { symbol: 'Fmaj7', roman: 'Imaj7', beats: 8 },
        ].map(c => ({ ...c, notes: c.symbol === 'Fmaj7' ? [41, 57, 60, 64] : [36, 52, 58, 62] })),
        melody: line([
            'C5', 'E5', 'G5', 'Bb5', 'Eb5', 'G5', 'Bb5', 'Db6',
            'F#4', 'A#4', 'C#5', 'E5', 'A4', 'C#5', 'E5', 'G5',
            ['F5', 1], 'E5', 'C5', ['A4', 1], 'C5', 'E5', ['F5', 4],
        ]) },
];

// ── Fourths ──

/**
 * Lines built from stacked fourths: three-note fourth shapes walked up D Dorian over
 * Dm7 (one of them, F–B, an augmented fourth), and one fourth shape moved in parallel
 * by half steps, out of the key and back in.
 */
const FOURTH_SHAPES_DORIAN = [
    ['D4', 'G4', 'C5'], ['E4', 'A4', 'D5'], ['F4', 'B4', 'E5'], ['G4', 'C5', 'F5'],
    ['A4', 'D5', 'G5'], ['B4', 'E5', 'A5'], ['C5', 'F5', 'B5'], ['D5', 'G5', 'C6'],
];
export const FOURTHS_PROGRESSIONS = [
    { id: 'dorian-fourths', label: 'Fourths in Dorian', tempo: 108, loop: true, comp: EVERY_TWO_BEATS,
        chords: chords(8, [['Dm7', 'i7']]),
        melody: melody(FOURTH_SHAPES_DORIAN.flatMap((shape, i) => (i % 2 ? [...shape].reverse() : shape).map(n => [n, 1 / 3]))) },
    { id: 'parallel-fourths', label: 'Parallel fourths', tempo: 108, loop: true, comp: EVERY_TWO_BEATS,
        chords: chords(8, [['Dm7', 'i7']]),
        melody: melody([
            ['D4', 1 / 3], ['G4', 1 / 3], ['C5', 1 / 3], ['Eb4', 1 / 3], ['Ab4', 1 / 3], ['Db5', 1 / 3],
            ['E4', 1 / 3], ['A4', 1 / 3], ['D5', 1 / 3], ['F4', 1 / 3], ['Bb4', 1 / 3], ['Eb5', 1 / 3],
            ['F#4', 1 / 3], ['B4', 1 / 3], ['E5', 1 / 3], ['F4', 1 / 3], ['Bb4', 1 / 3], ['Eb5', 1 / 3],
            ['E4', 1 / 3], ['A4', 1 / 3], ['D5', 1 / 3], ['A4', 1 / 3], ['D5', 1 / 3], ['G5', 1 / 3],
        ]) },
];

// ── Coltrane changes ──

/**
 * Chords with Coltrane's 1-2-3-5 pattern over each (the root, 2nd, 3rd, and 5th of the
 * chord, in eighth notes from the root in octave 4): `[symbol, roman, beats]`.
 */
function digitalPattern(list) {
    const melodyList = [];
    const chordList = list.map(([symbol, roman, beats = 2]) => {
        const parsed = parseChord(symbol);
        const root = C + parsed.root;
        const third = parsed.intervals.includes(3) ? 3 : 4;
        [0, 2, third, 7].forEach(s => melodyList.push({ midi: root + s, beats: 0.5 }));
        if (beats > 2) melodyList.push({ midi: null, beats: beats - 2 });
        return { symbol, roman, beats };
    });
    return { chords: chordList, melody: melodyList };
}

/**
 * The plain ii–V–I and Coltrane's substitution for it (dominants that pass through keys
 * a major third apart before reaching I), and the cycle of three keys a major third
 * apart at the start of "Giant Steps", each chord with the 1-2-3-5 pattern.
 */
export const COLTRANE_PROGRESSIONS = [
    { id: 'ii-v-i', label: 'ii–V–I', ...digitalPattern([
        ['Dm7', 'ii7', 4], ['G7', 'V7', 4], ['Cmaj7', 'Imaj7', 8],
    ]) },
    { id: 'coltrane-substitution', label: 'Coltrane substitution', ...digitalPattern([
        ['Dm7', 'ii7'], ['E♭7', 'V7/♭VI'], ['A♭maj7', '♭VImaj7'], ['B7', 'V7/III'],
        ['Emaj7', 'IIImaj7'], ['G7', 'V7'], ['Cmaj7', 'Imaj7', 4],
    ]) },
    // How the "Giant Steps" changes are built, step by step: the three tonics alone, then
    // each led into by its V7 (the first half of the tune), then by a ii–V (the second).
    { id: 'three-tonics', label: 'Three tonics', key: 'B', ...digitalPattern([
        ['Bmaj7', 'I', 4], ['Gmaj7', '♭VI', 4], ['E♭maj7', 'III', 4],
    ]) },
    { id: 'ii-v-cycle', label: 'With ii–Vs', key: 'B', ...digitalPattern([
        ['E♭maj7', 'III', 4], ['Am7', 'ii7/♭VI'], ['D7', 'V7/♭VI'], ['Gmaj7', '♭VI', 4],
        ['C♯m7', 'ii7'], ['F♯7', 'V7'], ['Bmaj7', 'I', 4], ['Fm7', 'ii7/III'], ['B♭7', 'V7/III'],
    ]) },
    { id: 'three-keys', label: 'With dominants', key: 'B', ...digitalPattern([
        ['Bmaj7', 'I'], ['D7', 'V7/♭VI'], ['Gmaj7', '♭VI'], ['B♭7', 'V7/III'],
        ['E♭maj7', 'III'], ['F♯7', 'V7'], ['Bmaj7', 'I', 4],
    ]) },
].map(p => ({ ...p, tempo: 132, loop: true }));

// ── Triads inside scales ──

/**
 * Triads found inside a scale, played as a phrase over one sustained chord: each beat
 * is one triad as a triplet, climbing through the triads (and, for a pair, their first
 * inversions) and coming back down in reverse. `triads` are `[label, [three MIDI notes]]` in root
 * position; the label (the triad's root counted from the chord's root) shows under
 * each beat. The chord is struck every two beats, alternating between the given
 * `voicings`. After the phrase, an optional resolution chord with one held note.
 */
function triadPhrase(id, label, symbol, voicings, triads, resolve) {
    // Two triads climb through their first inversions too; more climb in root position.
    const up = triads.length > 2 ? triads : [...triads, ...triads.map(([name, [a, b, c]]) => [name, [b, c, a + 12]])];
    const beats = [...up, ...[...up].reverse().map(([name, t]) => [name, [...t].reverse()])];
    // The chord is struck every two beats, alternating between two voicings; the beats
    // between are tied, so each can still carry its triad's label.
    const chordList = beats.map(([name], i) => ({
        symbol: i ? '' : symbol, roman: name, beats: 1, notes: voicings[(i >> 1) % voicings.length], tied: i % 2 === 1,
    }));
    const melodyList = beats.flatMap(([, t]) => t.map(midi => ({ midi, beats: 1 / 3 })));
    if (resolve) {
        chordList.push({ symbol: resolve.symbol, roman: resolve.roman, beats: 4, notes: resolve.notes });
        melodyList.push({ midi: resolve.note, beats: 4 });
    }
    return { id, label, tempo: 90, loop: true, chords: chordList, melody: melodyList };
}

const CMAJ7_LOW = { symbol: 'Cmaj7', roman: 'Imaj7', notes: [36, 47, 52] };

export const TRIAD_PAIR_PROGRESSIONS = [
    triadPhrase('lydian', 'Lydian: I and II', 'Cmaj7(♯11)', [[36, 47, 52], [36, 52, 59]],
        [['I', [60, 64, 67]], ['II', [62, 66, 69]]]),
    triadPhrase('dorian', 'Dorian: ♭III and IV', 'Dm7', [[38, 48, 53], [38, 53, 60]],
        [['♭III', [65, 69, 72]], ['IV', [67, 71, 74]]]),
    triadPhrase('melodic-minor', 'Melodic minor: IV and V', 'CmMaj7', [[36, 47, 51], [36, 51, 59]],
        [['IV', [65, 69, 72]], ['V', [67, 71, 74]]]),
    triadPhrase('altered', 'Altered: ♭V and ♭VI', 'G7alt', [[43, 53, 59], [43, 47, 53]],
        [['♭V', [61, 65, 68]], ['♭VI', [63, 67, 70]]], { ...CMAJ7_LOW, note: 60 }),
    triadPhrase('half-whole', 'Half-whole: I, ♭III, ♭V, VI', 'G7(♭9)', [[43, 53, 59], [43, 47, 53]],
        [['I', [67, 71, 74]], ['♭III', [70, 74, 77]], ['♭V', [73, 77, 80]], ['VI', [76, 80, 83]]],
        { ...CMAJ7_LOW, note: 64 }),
];

// ── Phrases over jazz chords and with modern pentatonics ──

/**
 * Written phrases rather than scale runs: a line through Cmaj7–D7(♯11)–Dm7–G7 that
 * stresses the ♯11 (G♯) of the II7 and leans it into A; a line through a passing
 * diminished chord and a G7(♭9) played as a diminished arpeggio; and a ii–V–I built
 * from the modern pentatonic choices in short rhythmic cells. Chords name their scales
 * for the Scale readout.
 */
export const JAZZ_PHRASE_PROGRESSIONS = [
    { id: 'ii7-phrase', label: 'II7, phrase',
        chords: [over('Cmaj7', 'Imaj7', 'Ionian'), over('D7(♯11)', 'II7', 'Lydian dominant'),
            over('Dm7', 'ii7', 'Dorian'), over('G7', 'V7', 'Mixolydian'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: line([
            'G4', 'C5', 'E5', 'G5', ['B5', 1], ['A5', 1],
            'A5', 'G#5', 'F#5', 'E5', 'D5', 'C5', 'A4', 'G#4',
            'A4', 'C5', 'F5', 'E5', 'D5', 'C5', 'A4', 'C5',
            'B4', 'D5', 'F5', 'A5', 'G5', 'F5', 'D5', 'F5',
            ['E5', 4],
        ]) },
    { id: 'augmented-phrase', label: '7♯5, phrase',
        chords: [over('C6', 'I6', 'Ionian'), over('C7♯5', 'V7♯5/IV', 'whole tone'), over('Fmaj7', 'IVmaj7', 'Lydian')],
        melody: line([
            'E5', 'D5', 'C5', 'A4', 'G4', 'A4', ['C5', 1],
            'C5', 'D5', 'E5', 'F#5', 'G#5', 'E5', 'C5', 'G#4',
            ['A4', 1], ['C5', 1], ['E5', 1], ['F5', 1],
        ]) },
    { id: 'diminished-phrase', label: 'Diminished, phrase',
        chords: [over('Cmaj7', 'Imaj7', 'Ionian'), over('C♯dim7', '♯i°7', 'whole-half diminished'),
            over('Dm7', 'ii7', 'Dorian'), over('G7(♭9)', 'V7(♭9)', 'half-whole diminished'), over('Cmaj7', 'Imaj7', 'Ionian')],
        melody: line([
            ['E5', 1], ['C5', 1], ['G4', 1], 'B4', 'C5',
            'C#5', 'E5', 'G5', 'Bb5', 'A5', 'G5', 'E5', 'C#5',
            'D5', 'E5', 'F5', 'A5', 'C6', 'A5', 'G5', 'F5',
            'B4', 'D5', 'F5', 'Ab5', 'G5', 'E5', 'C#5', 'Ab4',
            ['G4', 4],
        ]) },
].map(p => ({ ...p, tempo: 120, loop: true }));

export const MODERN_PENTATONIC_PHRASES = [
    { id: 'ii-v-i-cells', label: 'ii–V–I phrase', tempo: 120, loop: true,
        chords: [over('Dm7', 'ii', 'minor pentatonic', 4, 'E'), over('G7alt', '♭iii', 'minor pentatonic', 4, 'B♭'),
            over('Cmaj7', 'vii', 'minor pentatonic', 8, 'B')],
        melody: line([
            'B5', 'A5', ['E5', 1], 'D5', 'E5', ['G5', 1],
            'Ab5', 'F5', ['Eb5', 1], 'Db5', 'Bb4', ['Ab4', 1],
            'B4', 'D5', 'E5', 'F#5', ['A5', 1], ['B5', 1],
            'F#5', 'E5', 'D5', 'B4', ['E5', 2],
        ]) },
];

// ── Modal jazz ──

/** The "So What" voicing: three fourths and a major third (E, A, D, G, B) over a D bass. */
const SO_WHAT = [38, 52, 57, 62, 67, 71];
const up = (notes, n) => notes.map(m => m + n);

/**
 * Voicings in fourths that stay in D Dorian, over the D bass, for the comping to move
 * between: the So What voicing on E and its neighbor a step down on D (E–A–D–G–B to
 * D–G–C–F–A, the two chords of the tune's "so what" answer), and fourth stacks on C and
 * G. `next` lists where each can step to.
 */
const SO_WHAT_VOICINGS = {
    E: { notes: SO_WHAT, next: ['D', 'G', 'D'] },
    D: { notes: [38, 50, 55, 60, 65, 69], next: ['E', 'E', 'C'] },
    C: { notes: [38, 48, 53, 59, 64, 69], next: ['D', 'E'] },
    G: { notes: [38, 55, 60, 65, 69, 74], next: ['E', 'D'] },
};
const pick = list => list[Math.floor(Math.random() * list.length)];

/** Bar rhythms for the comping: the chord struck once or twice, durations in beats. */
const SO_WHAT_BAR_RHYTHMS = [[4], [1.5, 2.5], [2, 2], [2.5, 1.5], [3, 1]];

/**
 * One section of comping, `bars` long: each bar strikes the chord once or twice in a
 * rhythm from SO_WHAT_BAR_RHYTHMS, and each strike moves by step through
 * SO_WHAT_VOICINGS from the So What voicing, sometimes keeping the voicing. Only the
 * first chord carries the symbol.
 */
function soWhatComping(symbol, bars, semitones) {
    let at = 'E';
    const durations = Array.from({ length: bars }, () => pick(SO_WHAT_BAR_RHYTHMS)).flat();
    return durations.map((beats, k) => {
        if (k > 0 && Math.random() < 0.75) at = pick(SO_WHAT_VOICINGS[at].next);
        return { ...over(k ? '' : symbol, k ? '' : 'i7', 'Dorian', beats), scaleRoot: semitones ? 'E♭' : 'D',
            notes: up(SO_WHAT_VOICINGS[at].notes, semitones) };
    });
}

/**
 * The notes of D Dorian a line in fourths can start on: from A, B, D, and E, three
 * perfect fourths up stay in the mode (A–D–G–C, B–E–A–D, D–G–C–F, E–A–D–G).
 */
const FOURTHS_STARTS = [57, 59, 62, 64, 69, 71];

/**
 * A line in fourths, `bars` long: every four eighth notes it climbs a stack of perfect
 * fourths and then jumps to another starting note (never the same one), with now and
 * then two beats of rest for a breath, but never two in a row and never at the start.
 */
function fourthsLine(bars) {
    const notes = [];
    let last = null, rested = true;
    for (let k = 0; k < bars * 2; k++) {
        if (!rested && Math.random() < 0.2) {
            notes.push({ midi: null, beats: 2 });
            rested = true;
            continue;
        }
        const start = pick(FOURTHS_STARTS.filter(m => m !== last));
        for (let i = 0; i < 4; i++) notes.push({ midi: start + 5 * i, beats: 0.5 });
        last = start;
        rested = false;
    }
    return notes;
}

/**
 * A new So What chorus, shortened (four bars of D Dorian, two of E♭ Dorian, two of D):
 * a line in fourths, moved up a half step over E♭, over comping that strikes once or
 * twice a bar and moves through the fourth voicings, all chosen at random.
 */
function soWhatChorus() {
    const shift = (notes, n) => notes.map(note => ({ ...note, midi: note.midi === null ? null : note.midi + n }));
    return {
        chords: [...soWhatComping('Dm7', 4, 0), ...soWhatComping('E♭m7', 2, 1), ...soWhatComping('Dm7', 2, 0)],
        melody: [...fourthsLine(4), ...shift(fourthsLine(2), 1), ...fourthsLine(2)],
    };
}

/**
 * Modal jazz: a shortened form of "So What" (D Dorian, a half step up to E♭ Dorian, and
 * back) with a new chorus on every pass (`vary`); fourth voicings moving in parallel
 * through D Dorian over a held D, as McCoy Tyner comped; and suspended chords that
 * drift by unusual intervals without resolving.
 */
export const MODAL_PROGRESSIONS = [
    { id: 'so-what', label: 'Dorian, a half step up', tempo: 132, loop: true,
        ...soWhatChorus(), vary: soWhatChorus },
    { id: 'fourths-comping', label: 'Fourths over a pedal', tempo: 120, loop: true,
        chords: [
            ['E–A–D', [50, 52, 57, 62]], ['F–B–E', [50, 53, 59, 64]], ['G–C–F', [50, 55, 60, 65]],
            ['A–D–G', [50, 57, 62, 67]], ['G–C–F', [50, 55, 60, 65]], ['F–B–E', [50, 53, 59, 64]],
        ].map(([roman, notes], i) => ({ symbol: i ? '' : 'Dm7', roman, beats: 2, notes, scale: 'Dorian', scaleRoot: 'D' })) },
    { id: 'sus-chords', label: 'Suspended chords', tempo: 108, loop: true, comp: [['all', 2]],
        chords: chords(4, [['D7sus4', 'sus'], ['F7sus4', 'sus'], ['D7sus4', 'sus'], ['B♭7sus4', 'sus']]) },
];

/**
 * The jazz and improvisation examples sound like a small band: a piano comps (with
 * rootless voicings where the chords are not voiced by hand, as a pianist would under a
 * soloist), a synth bass plays the bass notes or riff, and an AM synth, raised 8 dB to
 * sit over the piano, plays the line.
 */
export const BAND_SOUNDS = { chords: 'piano', melody: 'am', bass: 'synth-bass', levels: { melody: 8 } };

// ── Syncopation and anticipation ──

const STYLE = id => STYLE_PATTERNS.find(p => p.id === id);
const FEEL = id => FEEL_PATTERNS.find(p => p.id === id);
/**
 * A gospel-style I–I7–IV–iv in C for the backings, hand-voiced: a walking bass (C, E,
 * F, F) under four close notes with ninths, one or two of them moving a half step at
 * each change (B to B♭ into C9, B♭ to A and D to C into Fmaj9, E to E♭ and A to A♭
 * into the minor iv, Fm9, the gospel "amen" color).
 */
const GOSPEL = [
    { symbol: 'Cmaj9',  roman: 'Imaj9',   notes: [36, 52, 55, 59, 62] },
    { symbol: 'C9/E',   roman: 'I9',      notes: [40, 52, 55, 58, 62] },
    { symbol: 'Fmaj9',  roman: 'IVmaj9',  notes: [41, 52, 55, 57, 60] },
    { symbol: 'Fm9',    roman: 'iv9',     notes: [41, 51, 55, 56, 60] },
].map(chord => ({ ...chord, beats: 4 }));
/**
 * Settings for the progression demo's effect chain (bit crusher, filter, vibrato) that
 * make a backing sound lo-fi: a little bit-crushed grit, the highs rolled off, and a
 * slow tape wobble.
 */
const LOFI_EFFECTS = {
    bitcrush: { bits: 6, mix: 0.25 },
    filter: { cutoff: 2800, resonance: 0.7 },
    vibrato: { rate: 0.5, depth: 0.12, mix: 1 },
};
const LOFI = { tempo: 80, drums: LOFI_BEAT, effects: LOFI_EFFECTS };

/**
 * A notes-and-beats melody where an `!` before the note name accents it (the syncopated
 * notes): accented notes play louder than the rest.
 */
// A name starting with '!' is a moved note (syncopated or anticipated): accented, and
// marked (`mark`) so the piano roll draws it in its own color.
const accented = list => list.map(([name, beats]) => {
    const accent = name?.startsWith('!');
    const midi = name === null ? null : Tone.Frequency(accent ? name.slice(1) : name).toMidi();
    return { midi, beats, velocity: accent ? 0.95 : 0.65, ...(accent ? { mark: true } : {}) };
});

/**
 * One short melody over C–Am–F–G, three ways with the same notes: on the beat (each
 * note on a beat), syncopated (notes starting on the "and" and held across the next
 * beat, accented), and anticipated (the note for each new bar arriving on the "and" of
 * 4 before it, tied over); then anticipated with the chords anticipated too (each change
 * on the "and" of 4). Backings: chords struck on every beat, in the Charleston rhythm (1
 * and the "and" of 2), and pushed (the "and" of 4 anticipating the next chord); a bossa
 * nova (nylon guitar in the bossa clave over two bars, the bass on 1 and 3 with the
 * fifth before 3) and a samba (a syncopated guitar figure in sixteenths over a bass that
 * leans on beat 2 like the surdo).
 */
const BOSSA_RIFF = [[0, 1.5], [7, 0.5], [7, 2]];
const BOSSA_COMP = [['upper', 1.5], ['upper', 1.5], ['upper', 2], ['upper', 1.5], ['upper', 1.5]];
/**
 * A chord that starts half a beat early: one short stroke (and its bass note) on the
 * "and" of 4, then the usual pattern from the bar line. `comp` and `riff` are the
 * style's patterns, the riff repeated `repeats` times to fill the chord.
 */
const earlyChord = (chord, beats, comp, riff, repeats) => ({ ...chord, beats,
    comp: [['upper', 0.5], ...comp], riff: [[0, 0.5], ...Array(repeats).fill(riff).flat()] });
// The bossa nova's two-bar guitar pattern, split for chords a bar long: the first bar
// (three strokes) and the second (two, after a beat's rest).
const BOSSA_BAR_1 = [['upper', 1.5], ['upper', 1.5], ['upper', 1]];
const BOSSA_BAR_2 = [[null, 1], ['upper', 1.5], ['upper', 1.5]];
const SAMBA_RIFF = [[0, 0.75], [0, 0.25], [-5, 1]];
const SAMBA_COMP = [['upper', 0.75], ['upper', 0.75], ['upper', 0.75], ['upper', 0.5], ['upper', 0.75], ['upper', 0.5]];
/**
 * The first eight bars of the chorus of "Honeysuckle Rose" (Thomas "Fats" Waller,
 * 1929; public domain in the US since 2025), in F, from the 1929 Santly Bros. sheet
 * music. The sheet writes uneven eighths as a dotted eighth and a sixteenth; they are
 * played swung (two thirds and one third of a beat). The harmony is simplified from
 * the piano part, the ii–V vamp then the tonic, and voiced the way a jazz pianist might:
 * a low root and three notes below the melody, with tensions and without the 5th
 * (Gm9: F, A, B♭; C13: E, A, B♭; F6/9: D, G, A), so only one note moves between Gm9
 * and C13. The last bar is a turnaround, Am11–D7(♭9), back to Gm9 as it loops. A click
 * on every beat keeps time.
 *
 * As written, every long note lands on a beat. The other versions move the long notes
 * ("bee," "jealousy," "me," "knows," "Rose"), accented and marked:
 *   - syncopated: each comes in late, after a short rest on its beat, on the swung
 *     "and" (the last third of the beat), and is held across the next beat;
 *   - anticipated: each comes early, on the swung "and" before its beat (before beat 3
 *     in the middle of a bar, before the bar line at the start of one), and is held
 *     into it; the pickup notes before it tighten into triplets;
 *   - pushed: the same, with the chord changes at the bar lines early too.
 */
const HONEYSUCKLE_VOICINGS = {
    Gm9:    { symbol: 'Gm9',   roman: 'ii9',  notes: [43, 53, 57, 58] },
    C13:    { symbol: 'C13',   roman: 'V13',  notes: [36, 52, 57, 58] },
    'F6/9': { symbol: 'F6/9',  roman: 'I6/9', notes: [41, 50, 55, 57] },
    // The last bar turns back to Gm9: Am11 without its 5th (E), which would rub against
    // the melody's held F, then D7(♭9), whose E♭ and C step down to Gm9's D and B♭.
    Am11:      { symbol: 'Am11',    roman: 'iii11',       notes: [45, 55, 60, 62] },
    'D7(♭9)':  { symbol: 'D7(♭9)', roman: 'V7(♭9)/ii', notes: [38, 54, 60, 63] },
};
const vamp = (beats, names) => names.map(name => ({ ...HONEYSUCKLE_VOICINGS[name], beats }));
const HONEYSUCKLE_CHORDS = [
    ...vamp(2, ['Gm9', 'C13', 'Gm9', 'C13', 'Gm9', 'C13', 'Gm9', 'C13']),
    ...vamp(4, ['F6/9']),
    ...vamp(2, ['Gm9', 'C13']),
    ...vamp(4, ['F6/9']),
    ...vamp(2, ['Am11', 'D7(♭9)']),
];
// Each chord that starts on a bar line comes a swung eighth early.
const pushBarLines = list => {
    let at = 0;
    const starts = list.map(c => { const s = at; at += c.beats; return s; });
    return list.map((chord, i) => {
        const early = i > 0 && starts[i] % 4 === 0 ? third : 0;
        const late = i + 1 < list.length && starts[i + 1] % 4 === 0 ? third : 0;
        return { ...chord, beats: chord.beats + early - late };
    });
};
const riff = (long, { tight = false } = {}) => [
    ['C5', 2 * third], ['Bb4', third], ...(tight ? [['D4', third], ['F4', third], [`!${long}`, 2 + third]]
        : [['D4', 2 * third], ['F4', third], [long, 2]]),
];
const HONEYSUCKLE_WRITTEN = accented([
    ...riff('A4'), ...riff('A4'),
    ['C5', 2 * third], ['Bb4', third], ['D4', 2 * third], ['F4', third], ['A4', 1], ['A4', 1],
    ['A4', 2], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    ['F4', 1], ['F4', 1], ['F4', 4], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    ['F4', 5], [null, 3],
]);
const HONEYSUCKLE_SYNCOPATED = accented([
    ['C5', 2 * third], ['Bb4', third], ['D4', 2 * third], ['F4', third], [null, 2 * third], ['!A4', 1 + third],
    ['C5', 2 * third], ['Bb4', third], ['D4', 2 * third], ['F4', third], [null, 2 * third], ['!A4', 1 + third],
    ['C5', 2 * third], ['Bb4', third], ['D4', 2 * third], ['F4', third], ['A4', 1], ['A4', 1],
    [null, 2 * third], ['!A4', 1 + third], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    ['F4', 1], ['F4', 1], [null, 2 * third], ['!F4', 3 + third], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    [null, 2 * third], ['!F4', 4 + third], [null, 3],
]);
// Syncopated 2: every two-beat stretch with notes starts a triplet late. Of its six
// triplet slots, the first is a rest, the first note takes the next two, and the quick
// notes after it one slot each, so the figure starts on a weak slot with the beat left
// empty. Over Gm9 in bars 1–3 the riff becomes a rest, C, B♭, F, and G, a step up into
// "bee" (A), which stays on beat 3. Notes held longer keep their length, less the rest.
// Over F6/9 only the first note ("good-," "Rose") comes a triplet late; bars 4 and 6
// ("me, I don't blame them," "knows" and the figure into "Rose") stay as written.
const delayedRiff = [[null, third], ['!C5', 2 * third], ['Bb4', third], ['F4', third], ['G4', third]];
const HONEYSUCKLE_SYNCOPATED_2 = accented([
    ...delayedRiff, ['A4', 2],
    ...delayedRiff, ['A4', 2],
    ...delayedRiff, ['A4', 1], ['A4', 1],
    ['A4', 2], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    [null, third], ['!F4', 2 * third], ['F4', 1], ['F4', 4], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    [null, third], ['!F4', 4 + 2 * third], [null, 3],
]);
const HONEYSUCKLE_ANTICIPATED = accented([
    ...riff('A4', { tight: true }), ...riff('A4', { tight: true }),
    ['C5', 2 * third], ['Bb4', third], ['D4', 2 * third], ['F4', third], ['A4', 1], ['A4', 2 * third],
    ['!A4', 2 + third], ['A4', 2 * third], ['G4', third], ['F4', 2 * third], ['D4', third],
    ['F4', 1], ['F4', 2 * third], ['!F4', 4 + third], ['A4', 2 * third], ['G4', third], ['F4', third], ['D4', third],
    ['!F4', 5 + third], [null, 3],
]);
const HONEYSUCKLE = { key: 'F', tempo: 120, bar: 4, drums: pulsePattern(4), chords: HONEYSUCKLE_CHORDS };

export const SYNCOPATION_PROGRESSIONS = [
    { id: 'honeysuckle-written', label: 'As written', ...HONEYSUCKLE, melody: HONEYSUCKLE_WRITTEN },
    { id: 'honeysuckle-syncopated', label: 'Syncopated', ...HONEYSUCKLE, melody: HONEYSUCKLE_SYNCOPATED },
    { id: 'honeysuckle-syncopated-2', label: 'Syncopated 2', ...HONEYSUCKLE, melody: HONEYSUCKLE_SYNCOPATED_2 },
    { id: 'honeysuckle-anticipated', label: 'Anticipated', ...HONEYSUCKLE, melody: HONEYSUCKLE_ANTICIPATED },
    { id: 'honeysuckle-pushed', label: 'Anticipated, chords too', ...HONEYSUCKLE, melody: HONEYSUCKLE_ANTICIPATED,
        chords: pushBarLines(HONEYSUCKLE_CHORDS) },
    { id: 'comp-on-beat', label: 'Chords on the beat', ...LOFI,
        comp: [['all', 1]], chords: GOSPEL },
    { id: 'comp-charleston', label: 'Charleston', ...LOFI,
        comp: [['all', 1.5], ['all', 2.5]], chords: GOSPEL },
    { id: 'comp-pushed', label: 'Pushed', ...LOFI,
        comp: [['all', 3.5], ['all', 0.5]], chords: GOSPEL.map((chord, i) => ({ ...chord, beats: i === 0 ? 3.5 : i === 3 ? 4.5 : 4 })) },
    // A common bossa nova progression in F, a bar or two to each chord. The changes into
    // G9 and Gm9 come half a beat early, on the "and" of 4 at the end of bars 2 and 4:
    // the chord before is cut short, and the anticipated chord starts with a short
    // stroke (and bass note) before falling back into the pattern.
    { id: 'bossa-nova', label: 'Bossa nova', key: 'F', tempo: 130, bar: 4, drums: FEEL('bossa-nova'),
        sounds: BAND_SOUNDS,
        riff: BOSSA_RIFF, comp: BOSSA_COMP,
        chords: [
            { ...chords(8, [['F6', 'I6']])[0], beats: 7.5 },
            earlyChord(chords(8, [['G9', 'II9']])[0], 8, BOSSA_COMP, BOSSA_RIFF, 2),
            earlyChord(chords(4, [['Gm9', 'ii9']])[0], 4.5, BOSSA_BAR_1, BOSSA_RIFF, 1),
            { ...chords(4, [['C7alt', 'V7alt']])[0], comp: BOSSA_BAR_2 },
            { ...chords(4, [['F6', 'I6']])[0], comp: BOSSA_BAR_1 },
            { ...chords(4, [['C7alt', 'V7alt']])[0], comp: BOSSA_BAR_2 },
        ] },
    // A common samba progression in A: two bars of A6, two of Am9. The change into Am9
    // comes half a beat early, on the guitar's stroke on the "and" of 4 at the end of bar 2.
    { id: 'samba', label: 'Samba', key: 'A', tempo: 100, bar: 4, drums: STYLE('samba'),
        sounds: BAND_SOUNDS,
        riff: SAMBA_RIFF, comp: SAMBA_COMP,
        chords: [
            { ...chords(8, [['A6', 'I6']])[0], beats: 7.5 },
            earlyChord(chords(8, [['Am9', 'i9']])[0], 8.5, [...SAMBA_COMP, ...SAMBA_COMP], SAMBA_RIFF, 4),
        ] },
].map(p => ({ tempo: 100, loop: true, ...p }));

// ── Rhythm patterns ──

/**
 * Grooves of a few styles, each a backing of chords, bass, and drums: rock (eighth-note
 * chords and bass under a backbeat), funk (sixteenth-note stabs on one chord over a
 * bass that jumps octaves), reggae (the one drop, the guitar skank on 2 and 4, a bass
 * that leaves space), salsa (a piano montuno answering the son clave over a tumbao
 * bass, which skips beat 1 and anticipates each chord on beat 4), a 12/8 groove (the
 * bell pattern, chords and bass crossing its four beats), and hip-hop (a boom-bap beat
 * under lazy electric piano chords).
 */
export const STYLE_PROGRESSIONS = [
    { id: 'rock', label: 'Rock', tempo: 120, drums: STYLE('rock'),
        sounds: { chords: 'guitar-electric', bass: 'bass' },
        riff: [[0, 0.5]], comp: [['upper', 0.5]],
        chords: chords(4, [['C', 'I'], ['G', 'V'], ['Am', 'vi'], ['F', 'IV']]) },
    { id: 'funk', label: 'Funk', tempo: 96, drums: FEEL('funk'),
        sounds: { chords: 'guitar-electric', bass: 'synth-bass' },
        riff: [[0, 0.75], [12, 0.25], [0, 0.5], [10, 0.5], [0, 0.75], [7, 0.25], [10, 0.5], [12, 0.5]],
        comp: [[null, 0.5], ['upper', 0.25], [null, 0.5], ['upper', 0.25], [null, 0.25], ['upper', 0.25],
            [null, 0.5], ['upper', 0.25], [null, 0.5], ['upper', 0.25], [null, 0.25], ['upper', 0.25]],
        chords: chords(4, [['C9', 'I9'], ['C9', 'I9'], ['F9', 'IV9'], ['C9', 'I9']]) },
    { id: 'reggae', label: 'Reggae', tempo: 76, drums: STYLE('one-drop'),
        sounds: { chords: 'organ', bass: 'bass' },
        riff: [[0, 1.5], [0, 0.5], [7, 1], [10, 0.5], [12, 0.5]],
        comp: [[null, 1], ['upper', 0.5], [null, 1.5], ['upper', 0.5], [null, 0.5]],
        chords: chords(4, [['Am', 'i'], ['D', 'IV'], ['Am', 'i'], ['D', 'IV']]) },
    { id: 'salsa', label: 'Salsa', tempo: 150, drums: STYLE('son-clave'),
        sounds: { chords: 'piano', melody: 'bass' },
        comp: [['upper', 1], ['upper', 0.5], ['upper', 1], ['upper', 0.5], ['upper', 1]],
        chords: chords(4, [['C', 'I'], ['F', 'IV'], ['G', 'V'], ['F', 'IV']]),
        // The tumbao: nothing on 1, the fifth on the "and" of 2, the next chord's root on 4.
        melody: [[null, 1.5], [43, 1.5], [41, 1], [null, 1.5], [48, 1.5], [43, 1],
            [null, 1.5], [50, 1.5], [41, 1], [null, 1.5], [48, 1.5], [36, 1]].map(([midi, beats]) => ({ midi, beats })) },
    { id: 'twelve-eight', label: '12/8', tempo: 100, drums: STYLE('bell-12-8'),
        sounds: { chords: 'piano', bass: 'bass' },
        riff: [[0, 1], [7, 1], [0, 2 / 3], [12, 1 / 3], [10, 1]],
        comp: [['upper', 4 / 3], ['upper', 2 / 3], ['upper', 1], [null, 1]],
        chords: chords(4, [['Am7', 'i7'], ['Am7', 'i7'], ['G', '♭VII'], ['Am7', 'i7']]) },
    { id: 'hip-hop', label: 'Hip-hop', tempo: 88, drums: STYLE('boom-bap'),
        sounds: { chords: 'epiano', bass: 'synth-bass' },
        riff: [[0, 1.5], [0, 0.5], [-2, 1], [-5, 1]],
        comp: [['upper', 1.5], ['upper', 2.5]],
        chords: chords(4, [['Cm9', 'i9'], ['Fm9', 'iv9'], ['A♭maj7', '♭VImaj7'], ['G7(♭9)', 'V7(♭9)']]) },
].map(p => ({ loop: true, ...p }));

// ── J-pop progressions ──

/**
 * Progressions common in Japanese pop, with their Japanese names: the royal road
 * (王道進行, IVmaj7–V7–iii7–vi7) and its longer form with a secondary dominant; the
 * Komuro progression (小室進行, vi–IV–V–I); the Canon progression (カノン進行); the
 * Marusa progression (丸サ進行, IVmaj7–III7–vi7–v7–I7); a line cliché (a minor chord
 * whose top or bass voice falls by half steps); borrowed chords (IV–iv–I and ♭VI–♭VII–I);
 * a dense, chromatic progression in the spirit of aiko; and a last chorus a whole step
 * up. Struck on every eighth note with the bass on the beat, over an eighth-note beat.
 */
const POP_COMP = [['all', 1], ['upper', 0.5], ['upper', 0.5], ['bass', 0.5], ['upper', 0.5], ['upper', 1]];
export const JPOP_PROGRESSIONS = [
    { id: 'royal-road', label: '王道進行', chords: chords(4, [
        ['Fmaj7', 'IVmaj7'], ['G7', 'V7'], ['Em7', 'iii7'], ['Am7', 'vi7'],
    ]) },
    { id: 'royal-road-long', label: '王道進行, longer', chords: [
        ...chords(4, [['Fmaj7', 'IVmaj7'], ['G7', 'V7'], ['Em7', 'iii7'], ['A7', 'V7/ii']]),
        ...chords(4, [['Dm7', 'ii7'], ['G7', 'V7']]), ...chords(8, [['C', 'I']]),
    ] },
    { id: 'komuro', label: '小室進行', chords: chords(4, [
        ['Am', 'vi'], ['F', 'IV'], ['G', 'V'], ['C', 'I'],
    ]) },
    { id: 'canon', label: 'カノン進行', chords: chords(2, [
        ['C', 'I'], ['G/B', 'V⁶'], ['Am', 'vi'], ['Em/G', 'iii⁶'], ['F', 'IV'], ['C/E', 'I⁶'], ['F', 'IV'], ['G', 'V'],
    ]) },
    { id: 'marusa', label: '丸サ進行', chords: [
        ...chords(4, [['Fmaj7', 'IVmaj7'], ['E7', 'V7/vi'], ['Am7', 'vi7']]),
        ...chords(2, [['Gm7', 'v7'], ['C7', 'I7']]),
    ] },
    { id: 'cliche', label: 'Line cliché', chords: [
        ...chords(4, [['Am', 'vi'], ['AmMaj7/G♯', 'vi(maj7)'], ['Am7/G', 'vi7'], ['Am6/F♯', 'vi6']]),
        ...chords(4, [['Fmaj7', 'IVmaj7'], ['Fm6', 'iv6'], ['C/E', 'I⁶'], ['G7sus4', 'V7sus4']]),
    ] },
    { id: 'borrowed', label: 'Borrowed chords', chords: [
        ...chords(4, [['F', 'IV'], ['Fm', 'iv'], ['C', 'I'], ['C', 'I']]),
        ...chords(4, [['A♭', '♭VI'], ['B♭', '♭VII'], ['C', 'I'], ['C', 'I']]),
    ] },
    { id: 'chromatic', label: 'Chromatic, in the spirit of aiko', chords: [
        ...chords(4, [['Fmaj7', 'IVmaj7']]),
        ...chords(2, [['E7', 'V7/vi'], ['E♭dim7', '♭iii°7']]),
        ...chords(4, [['Dm7', 'ii7']]),
        ...chords(2, [['F♯m7♭5', '♯ivø7'], ['B7', 'V7/iii']]),
        ...chords(2, [['Em7', 'iii7'], ['A7', 'V7/ii']]),
        ...chords(2, [['E♭maj7', '♭IIImaj7'], ['A♭7', '♭VI7']]),
        ...chords(2, [['Dm7', 'ii7'], ['G7sus4', 'V7sus4']]), ...chords(4, [['Cmaj7', 'Imaj7']]),
    ] },
    { id: 'key-change', label: 'Last chorus up a step', chords: [
        ...chords(4, [['Fmaj7', 'IVmaj7'], ['G7', 'V7'], ['Em7', 'iii7'], ['Am7', 'vi7']]),
        ...chords(4, [['Fmaj7', 'IVmaj7'], ['G7', 'V7'], ['C', 'I']]), ...chords(4, [['A7', 'V7/II']]),
        ...chords(4, [['Gmaj7', 'IVmaj7'], ['A7', 'V7'], ['F♯m7', 'iii7'], ['Bm7', 'vi7']]),
        ...chords(4, [['Gmaj7', 'IVmaj7'], ['A7', 'V7'], ['D', 'I'], ['D', 'I']]),
    ] },
].map(p => ({ tempo: 132, loop: true, comp: POP_COMP, drums: FEEL('eighths'), ...p }));

// ── Music beyond the West, minimal music ──

/** A drone held under a melody: `notes` (MIDI) for `beats`, with no chord symbol. */
const drone = (notes, beats, label = '') => ({ symbol: '', roman: label, beats, notes });

/**
 * Melodies from traditions outside Western harmony, approximated in twelve-tone equal
 * temperament: a raga-like phrase in the scale of Raga Bhairav (C D♭ E F G A♭ B) over a
 * tanpura-like drone of C and G, unfolding slowly from low to high as an ālāp does; a
 * phrase in maqam Hijaz (C D♭ E F G A♭ B♭) over a drone on C; and gamelan-style
 * interlocking, two parts on a five-note scale (C D E G A, in place of slendro) whose
 * notes fall between each other's to make one fast line, over a slow gong tone.
 */
export const WORLD_PROGRESSIONS = [
    { id: 'raga', label: 'Raga Bhairav, over a drone', tempo: 72, loop: true,
        sounds: { chords: 'harmonium', melody: 'flute' },
        chords: [drone([36, 43, 48], 16, 'Sa–Pa'), drone([36, 43, 48], 16, 'Sa–Pa')],
        melody: line([['C5', 2], ['Db5', 1], ['C5', 1], ['B4', 1.5], 'C5', ['Db5', 2],
            ['E5', 1], ['F5', 1], ['E5', 1], ['Db5', 1], ['C5', 2], [null, 2],
            ['E5', 1], ['F5', 1], ['G5', 2], ['Ab5', 1], ['G5', 1], ['F5', 1], ['E5', 1],
            ['Db5', 1], ['E5', 1], ['F5', 0.5], ['E5', 0.5], ['Db5', 1], ['C5', 4]]) },
    { id: 'hijaz', label: 'Maqam Hijaz, over a drone', tempo: 96, loop: true,
        sounds: { chords: 'cello', melody: 'guitar-nylon' },
        chords: [drone([36, 48], 16, 'C'), drone([36, 48], 16, 'C')],
        melody: line(['G4', 'Ab4', 'G4', 'F4', ['E4', 1], ['Db4', 1], ['C4', 2], ['E4', 1], ['F4', 1],
            'G4', 'Ab4', 'Bb4', 'Ab4', ['G4', 1], ['F4', 1], ['E4', 2], [null, 2],
            'C5', 'Bb4', 'Ab4', 'G4', ['Ab4', 1], 'G4', 'F4', ['E4', 1], 'F4', 'E4', ['Db4', 1], 'E4', 'Db4',
            ['C4', 4], [null, 4]]) },
    { id: 'gamelan', label: 'Interlocking, gamelan style', tempo: 100, loop: true,
        sounds: { chords: 'cello', melody: 'xylophone' },
        chords: [drone([36], 8, 'gong'), drone([43], 8), drone([36], 8, 'gong'), drone([38], 8)],
        // Two parts, the first on the beats and the second between them, written as the
        // one line they make together.
        melody: line([
            'E5', 'G5', 'D5', 'E5', 'G5', 'A5', 'E5', 'G5', 'A5', 'C6', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5',
            'D5', 'E5', 'C5', 'D5', 'E5', 'G5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'A5',
            'G5', 'A5', 'E5', 'G5', 'A5', 'C6', 'G5', 'A5', 'C6', 'D6', 'A5', 'C6', 'D6', 'C6', 'A5', 'G5',
            'E5', 'G5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'D5', 'C5', 'A4', 'C5', 'D5', 'E5', 'D5', 'C5',
        ]) },
];

/**
 * Philip Glass's additive process on five notes (C D E F G in eighth notes): the
 * figure grows by one note each time it repeats (1, 1 2, 1 2 3, …), twice each, and
 * then shrinks back, over a held C.
 */
const ADDITIVE = (() => {
    const notes = [60, 62, 64, 65, 67].map(m => m + 12);
    const lengths = [1, 2, 3, 4, 5, 4, 3, 2];
    const out = [];
    for (const n of lengths) for (let r = 0; r < 2; r++) notes.slice(0, n).forEach(midi => out.push({ midi, beats: 0.5 }));
    return out;
})();
export const MINIMAL_PROGRESSIONS = [
    { id: 'additive', label: 'Additive process', tempo: 160, loop: true,
        sounds: { chords: 'organ-synth', melody: 'organ-synth' },
        chords: [drone([48, 55], ADDITIVE.reduce((a, n) => a + n.beats, 0), 'C')],
        melody: ADDITIVE },
];

// ── Song analysis: Stella by Starlight ──

/** Chord scales by name, as semitones above the chord's root. */
const SCALE_STEPS = {
    'Ionian':            [0, 2, 4, 5, 7, 9, 11],
    'Lydian':            [0, 2, 4, 6, 7, 9, 11],
    'Dorian':            [0, 2, 3, 5, 7, 9, 10],
    'Mixolydian':        [0, 2, 4, 5, 7, 9, 10],
    'Locrian':           [0, 1, 3, 5, 6, 8, 10],
    'Locrian ♮2':        [0, 2, 3, 5, 6, 8, 10],
    'Phrygian dominant': [0, 1, 4, 5, 7, 8, 10],
    'altered':           [0, 1, 3, 4, 6, 8, 10],
    'Lydian dominant':   [0, 2, 4, 6, 7, 9, 10],
    'whole tone':        [0, 2, 4, 6, 8, 10],
};

/**
 * Chords with a chord scale each, `[symbol, roman, scale name, beats]`, and a melody
 * that runs the scale in eighth notes from the chord's root (in octave 4): up, and
 * back down when the chord lasts longer than a bar. For comparing interpretations of
 * the same chords, which differ in their Roman numerals and in the scale chosen.
 */
function scaleLines(list) {
    const melody = [];
    const chordList = list.map(([symbol, roman, scale, beats = 4]) => {
        const root = C + parseChord(symbol).root;
        const steps = SCALE_STEPS[scale];
        const up = [...steps, ...steps.map(s => s + 12)].slice(0, 8);
        const line = beats > 4 ? [...up, ...up.slice(0, -1).reverse(), up[0]] : up.slice(0, beats * 2);
        line.slice(0, beats * 2).forEach(s => melody.push({ midi: root + s, beats: 0.5 }));
        for (let n = line.length; n < beats * 2; n++) melody.push({ midi: null, beats: 0.5 });
        return { symbol, beats, roman, scale: `${scale}` };
    });
    return { chords: chordList, melody };
}

/**
 * "Stella by Starlight" (Victor Young, 1944), the chord changes only, in B♭, in four
 * eight-bar sections, each read two ways. Section A: a chain of ii–Vs heard in passing
 * keys, or everything heard from B♭ with the borrowed chords from B♭ minor. Section A′:
 * D minor and F major tonicized, with B♭m7–E♭7 as a backdoor ii–V into F or as a ii–V
 * of A♭ that goes elsewhere. Section B: G7♯5 as an altered secondary dominant and
 * A♭7 as a backdoor dominant, or G7♯5 as whole tone and A♭7 as subdominant minor.
 * Section C: descending minor ii–Vs, in harmonic minor or in melodic minor sounds.
 */
export const STELLA_PROGRESSIONS = [
    { id: 'a-chain', label: 'ii–Vs in passing keys', ...scaleLines([
        ['Em7♭5', 'iiø7/iii', 'Locrian'], ['A7(♭9)', 'V7/iii', 'Phrygian dominant'],
        ['Cm7', 'ii7', 'Dorian'], ['F7', 'V7', 'Mixolydian'],
        ['Fm7', 'ii7/IV', 'Dorian'], ['B♭7', 'V7/IV', 'Mixolydian'],
        ['E♭maj7', 'IVmaj7', 'Lydian'], ['A♭7', '♭VII7', 'Lydian dominant'],
    ]) },
    { id: 'a-home', label: 'All from B♭', ...scaleLines([
        ['Em7♭5', '♯ivø7', 'Locrian'], ['A7(♭9)', 'VII7', 'altered'],
        ['Cm7', 'ii7', 'Dorian'], ['F7', 'V7', 'Mixolydian'],
        ['Fm7', 'v7', 'Dorian'], ['B♭7', 'I7', 'Mixolydian'],
        ['E♭maj7', 'IVmaj7', 'Lydian'], ['A♭7', '♭VII7', 'Mixolydian'],
    ]) },
    { id: 'a2-backdoor', label: 'Backdoor into F', ...scaleLines([
        ['B♭maj7', 'Imaj7', 'Ionian'],
        ['Em7♭5', 'iiø7/iii', 'Locrian', 2], ['A7(♭9)', 'V7/iii', 'Phrygian dominant', 2],
        ['Dm7', 'iii7', 'Dorian'],
        ['B♭m7', 'iv7/V', 'Dorian', 2], ['E♭7', '♭VII7/V', 'Lydian dominant', 2],
        ['Fmaj7', 'Vmaj7', 'Ionian'],
        ['Em7♭5', 'iiø7/iii', 'Locrian', 2], ['A7(♭9)', 'V7/iii', 'Phrygian dominant', 2],
        ['Am7♭5', 'iiø7/ii', 'Locrian'], ['D7(♭9)', 'V7/ii', 'Phrygian dominant'],
    ]) },
    { id: 'a2-deceptive', label: 'ii–V of A♭, deceived', ...scaleLines([
        ['B♭maj7', 'Imaj7', 'Ionian'],
        ['Em7♭5', 'iiø7/iii', 'Locrian', 2], ['A7(♭9)', 'V7/iii', 'Phrygian dominant', 2],
        ['Dm7', 'iii7', 'Dorian'],
        ['B♭m7', 'ii7/♭VII', 'Dorian', 2], ['E♭7', 'V7/♭VII', 'Mixolydian', 2],
        ['Fmaj7', 'Vmaj7', 'Lydian'],
        ['Em7♭5', 'iiø7/iii', 'Locrian', 2], ['A7(♭9)', 'V7/iii', 'altered', 2],
        ['Am7♭5', 'iiø7/ii', 'Locrian'], ['D7(♭9)', 'V7/ii', 'altered'],
    ]) },
    { id: 'b-backdoor', label: 'Altered and backdoor', ...scaleLines([
        ['G7♯5', 'V7/ii', 'altered', 8], ['Cm7', 'ii7', 'Dorian', 8],
        ['A♭7', '♭VII7', 'Lydian dominant', 8], ['B♭maj7', 'Imaj7', 'Ionian', 8],
    ]) },
    { id: 'b-borrowed', label: 'Whole tone and borrowed', ...scaleLines([
        ['G7♯5', 'V7/ii', 'whole tone', 8], ['Cm7', 'ii7', 'Dorian', 8],
        ['A♭7', '♭VII7', 'Mixolydian', 8], ['B♭maj7', 'Imaj7', 'Lydian', 8],
    ]) },
    { id: 'c-harmonic', label: 'Minor ii–Vs, harmonic minor', ...scaleLines([
        ['Em7♭5', 'iiø7/iii', 'Locrian'], ['A7(♭9)', 'V7/iii', 'Phrygian dominant'],
        ['Dm7♭5', 'iiø7/ii', 'Locrian'], ['G7(♭9)', 'V7/ii', 'Phrygian dominant'],
        ['Cm7♭5', 'iiø7', 'Locrian'], ['F7(♭9)', 'V7', 'Phrygian dominant'],
        ['B♭maj7', 'Imaj7', 'Ionian', 8],
    ]) },
    { id: 'c-melodic', label: 'Minor ii–Vs, melodic minor', ...scaleLines([
        ['Em7♭5', 'iiø7/iii', 'Locrian ♮2'], ['A7(♭9)', 'V7/iii', 'altered'],
        ['Dm7♭5', 'iiø7/ii', 'Locrian ♮2'], ['G7(♭9)', 'V7/ii', 'altered'],
        ['Cm7♭5', 'iiø7', 'Locrian ♮2'], ['F7(♭9)', 'V7', 'altered'],
        ['B♭maj7', 'Imaj7', 'Ionian', 8],
    ]) },
].map(p => ({ key: 'B♭', tempo: 144, loop: true, ...p }));

// ── Walking bass ──

/**
 * Walking bass lines over the turnaround Cmaj7–A7–Dm7–G7, written as the melody (MIDI,
 * C3 = 48, played an octave lower on the band's bass) under the band's piano voicings kept above them and struck in a Charleston rhythm (on
 * 1 and the "and" of 2): roots and fifths in half notes (a two feel), chord tones with
 * a chromatic approach from above on beat 4, scale steps, and each bar starting a step
 * above the root and sliding down by half steps to it.
 */
const WALK_CHORDS = [
    { symbol: 'Cmaj7', roman: 'Imaj7', beats: 4, notes: [64, 67, 71, 74] },
    { symbol: 'A7', roman: 'VI7', beats: 4, notes: [61, 66, 67, 71] },
    { symbol: 'Dm7', roman: 'ii7', beats: 4, notes: [65, 69, 72, 76] },
    { symbol: 'G7', roman: 'V7', beats: 4, notes: [65, 69, 71, 76] },
];
const walk = (id, label, notes, beats = 1) => ({
    id, label, tempo: 132, loop: true, comp: [['all', 1.5], ['all', 2.5]], chords: WALK_CHORDS,
    sounds: { chords: BAND_SOUNDS.chords, melody: BAND_SOUNDS.bass },
    // Written at the bass's notated pitch; the bass sounds an octave lower.
    melody: notes.map(midi => ({ midi: midi - 12, beats })),
});
/**
 * A walking line made at random from the ideas above, one bar per chord: each bar picks
 * a shape for its first three beats (chord tones up, scale steps up, chord tones down
 * from the root, or a step above sliding down to the root) and a lead-in on beat 4 (a
 * half step above or below the next root, its fifth, or a scale step). Each note takes
 * the octave nearest the one before, kept between E2 and A3 (written; the bass sounds an
 * octave lower). It only shows how the ideas combine; it makes no musical choices.
 */
export function randomWalkingLine(chords) {
    const roots = chords.map(c => parseChord(c.symbol));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const near = (pc, from) => {
        let m = from - 6 + (((pc - (from - 6)) % 12) + 12) % 12;
        while (m < 40) m += 12;
        while (m > 57) m -= 12;
        return m;
    };
    let last = 48;
    const line = [];
    roots.forEach((chord, i) => {
        const r = chord.root, third = chord.intervals.includes(3) ? 3 : 4;
        const next = roots[(i + 1) % roots.length].root;
        const shape = pick([
            [0, third, 7],          // chord tones up
            [0, 2, third],          // scale steps up
            [0, -5, third - 12],    // root, fifth and third below
            [2, 1, 0],              // a step above, sliding down
        ]);
        const notes = shape.map(s => r + s);
        notes.forEach(pc => { last = near(pc, last); line.push(last); });
        last = near(pick([next + 1, next - 1, next + 7, next + 2]), last);
        line.push(last);
    });
    return line.map(midi => ({ midi: midi - 12, beats: 1 }));
}

export const WALKING_BASS_PROGRESSIONS = [
    walk('two-feel', 'Roots and fifths', [48, 43, 45, 40, 50, 45, 43, 50], 2),
    walk('chord-tones', 'Chord tones', [48, 52, 55, 46, 45, 49, 52, 51, 50, 53, 57, 56, 43, 47, 50, 49]),
    walk('scale-steps', 'Scale steps', [48, 50, 52, 55, 57, 55, 53, 52, 50, 52, 53, 54, 55, 53, 52, 50]),
    walk('from-above', 'From above', [50, 49, 48, 46, 47, 46, 45, 51, 52, 51, 50, 46, 45, 44, 43, 49]),
    // A new random line each time `generate` is called (the demo's New line button).
    { ...walk('random', 'Random mix', []), generate: () => randomWalkingLine(WALK_CHORDS) },
];
WALKING_BASS_PROGRESSIONS.at(-1).melody = randomWalkingLine(WALK_CHORDS);

// ── Articulation ──

/**
 * The same notes played in different ways: a melody (`[name, beats]` pairs) given a
 * style that sets each note's length (`gate`) and loudness (`velocity`), and for
 * swing, the timing of each pair of eighth notes.
 *
 *   - legato: every note held to the next, at one level.
 *   - staccato: every note cut short.
 *   - accents: the notes on beats 1 and 3 loud, the others soft.
 *   - swell: a crescendo to the middle of the phrase and a decrescendo after.
 *   - straight: even eighth notes, at one level.
 *   - swing: each pair of eighths played long–short (2/3 and 1/3 of a beat), the
 *     off-beat accented and slightly short, as horn players often phrase it.
 */
function articulate(list, style) {
    const notes = melody(list);
    let at = 0;
    return notes.map((note, i) => {
        const beat = at % 1 < 1e-6, strong = beat && Math.round(at) % 2 === 0;
        at += note.beats;
        const swell = 0.25 + 0.7 * Math.sin(Math.PI * i / Math.max(1, notes.length - 1));
        switch (style) {
            case 'legato': return { ...note, gate: 1, velocity: 0.7 };
            case 'staccato': return { ...note, gate: 0.3, velocity: 0.75 };
            case 'accents': return { ...note, gate: 0.9, velocity: strong ? 0.95 : 0.45 };
            case 'swell': return { ...note, gate: 0.95, velocity: swell };
            case 'swing': {
                const eighth = Math.abs(note.beats - 0.5) < 1e-6;
                if (!eighth) return { ...note, gate: 0.95, velocity: 0.75 };
                return beat
                    ? { ...note, beats: 2 / 3, gate: 1, velocity: 0.6 }
                    : { ...note, beats: 1 / 3, gate: 0.8, velocity: 0.95 };
            }
            default: return { ...note, gate: 0.95, velocity: 0.75 };
        }
    });
}

/** "Ode to Joy" (Beethoven, 1824): the first four bars, over C and G. */
const ODE = [
    ['E5', 1], ['E5', 1], ['F5', 1], ['G5', 1], ['G5', 1], ['F5', 1], ['E5', 1], ['D5', 1],
    ['C5', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['E5', 1.5], ['D5', 0.5], ['D5', 2],
];
const ODE_CHORDS = chords(4, [['C', 'I'], ['G', 'V'], ['C', 'I'], ['G', 'V']]);
/** An eighth-note line over C and G. */
const EIGHTHS = [
    'C5', 'D5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'F5', 'E5', 'D5', 'B4', 'G4', 'A4', 'B4', 'D5',
    'E5', 'D5', 'C5', 'A4', 'G4', 'A4', 'C5', 'D5', 'E5', 'D5', 'B4', 'G4', 'F4', 'G4', 'B4', 'D5',
].map(n => [n, 0.5]);
const EIGHTH_CHORDS = chords(4, [['C', 'I'], ['G', 'V'], ['C', 'I'], ['G', 'V']]);

export const ARTICULATION_PROGRESSIONS = [
    ...[['legato', 'Legato'], ['staccato', 'Staccato'], ['accents', 'Accents'], ['swell', 'Swell']]
        .map(([style, label]) => ({ id: `ode-${style}`, label, tempo: 100, chords: ODE_CHORDS, melody: articulate(ODE, style) })),
    ...[['straight', 'Straight'], ['swing', 'Swing']]
        .map(([style, label]) => ({ id: `line-${style}`, label, tempo: 132, chords: EIGHTH_CHORDS, melody: articulate(EIGHTHS, style) })),
].map(p => ({ ...p, loop: true }));

// ── Voicing ──

/** Hand-voiced chords: `[symbol, label, notes]`, the label shown under the chord. */
const voiced = (beats, list) => list.map(([symbol, roman, notes]) => ({ symbol, roman, beats, notes }));

/**
 * One chord voiced in different ways: rotated (inversions), close against open,
 * clustered in seconds against spread out, and with notes left out (the power chord,
 * shells, a rootless voicing). C3 is 48.
 */
export const VOICING_PROGRESSIONS = [
    { id: 'inversions', label: 'Inversions', chords: voiced(2, [
        ['C', 'root', [48, 52, 55]], ['C/E', '1st', [52, 55, 60]], ['C/G', '2nd', [55, 60, 64]],
        ['Cmaj7', 'root', [48, 52, 55, 59]], ['Cmaj7/E', '1st', [52, 55, 59, 60]],
        ['Cmaj7/G', '2nd', [55, 59, 60, 64]], ['Cmaj7/B', '3rd', [59, 60, 64, 67]],
    ]) },
    { id: 'close-open', label: 'Close and open', chords: voiced(4, [
        ['Cmaj7', 'close', [48, 52, 55, 59]], ['Cmaj7', 'drop 2', [48, 55, 59, 64]],
        ['Cmaj7', 'open', [36, 55, 64, 71]], ['Cmaj7', 'wide', [36, 52, 67, 83]],
    ]) },
    { id: 'cluster-spread', label: 'Cluster and spread', chords: voiced(4, [
        ['Cmaj9', 'thirds', [48, 52, 55, 59, 62]], ['Cmaj9', 'cluster', [48, 59, 60, 62, 64]],
        ['Cmaj9', 'low', [36, 40, 43, 47, 50]], ['Cmaj9', 'spread', [36, 55, 64, 71, 74]],
    ]) },
    { id: 'omitting', label: 'Leaving notes out', chords: voiced(4, [
        ['C7', 'all', [48, 52, 55, 58]], ['C5', 'power', [48, 55, 60]],
        ['C7', 'shell 3–7', [36, 52, 58]], ['C7', 'shell 7–3', [36, 58, 64]],
        ['C9', 'rootless', [52, 55, 58, 62]],
    ]) },
].map(p => ({ ...p, tempo: 90 }));

// ── Upper structure triads ──

/**
 * A major triad over the shell of G7 (G, F, B: the root, 7th, and 3rd), named by the
 * triad's root counted from G, then resolved to Cmaj9. Each triad adds a different set
 * of tensions: II the 9th, ♯11, and 13th; ♭III the ♯9; ♭V the ♭9 and ♯11; VI the 13th
 * and ♭9; ♭VI the ♭13 and ♯9.
 */
const G7_SHELL = [43, 53, 59];
const CMAJ9 = [48, 52, 59, 62, 67];
const ust = (id, label, symbol, roman, triad) => ({
    id, label, tempo: 90, loop: true, chords: voiced(4, [
        ['G7', 'shell', G7_SHELL], [symbol, roman, [...G7_SHELL, ...triad]], ['Cmaj9', 'Imaj9', CMAJ9],
    ]),
});
export const UPPER_STRUCTURE_PROGRESSIONS = [
    ust('ii', 'II: A/G7', 'G13(♯11)', 'A/G7', [69, 73, 76]),
    ust('biii', '♭III: B♭/G7', 'G7(♯9)', 'B♭/G7', [70, 74, 77]),
    ust('bv', '♭V: D♭/G7', 'G7(♭9, ♯11)', 'D♭/G7', [61, 65, 68]),
    ust('vi', 'VI: E/G7', 'G13(♭9)', 'E/G7', [64, 68, 71]),
    ust('bvi', '♭VI: E♭/G7', 'G7(♯5, ♯9)', 'E♭/G7', [63, 67, 70]),
];

/** Named sets of progressions, for a demo that takes the set as a URL parameter. */
const band = list => list.map(p => ({ ...p, sounds: p.sounds ?? BAND_SOUNDS }));

/**
 * What a progression's parts play on: `{ chords, melody, bass }`, each `{ id, level }`
 * (an instrument id and a level in dB), or null for a bass with no instrument of its
 * own. From the progression's `sounds` (`{ chords, melody, bass?, levels? }`, piano by
 * default, the melody on the chords' instrument unless named).
 */
export function progressionSounds(progression) {
    const sounds = progression.sounds ?? {};
    const levels = sounds.levels ?? {};
    const part = (name, id) => id ? { id, level: levels[name] ?? 0 } : null;
    return {
        chords: part('chords', sounds.chords ?? 'piano'),
        melody: part('melody', sounds.melody ?? sounds.chords ?? 'piano'),
        bass: part('bass', sounds.bass),
    };
}
const rootless = list => band(list).map(p => ({ ...p, voicing: 'rootless' }));

export const PROGRESSION_SETS = {
    diatonic: DIATONIC_PROGRESSIONS,
    'diatonic-minor': DIATONIC_MINOR_PROGRESSIONS,
    'minor-dominant': MINOR_DOMINANT_PROGRESSIONS,
    'minor-colors': MINOR_COLOR_PROGRESSIONS,
    'minor-modes': rootless(MINOR_MODE_PROGRESSIONS),
    'minor-chord-scales': rootless(MINOR_CHORD_SCALE_PROGRESSIONS),
    'sixth-diminished': SIXTH_DIMINISHED_PROGRESSIONS,
    'bebop-lines': band(BEBOP_LINE_PROGRESSIONS),
    'bebop-ii-v': band(BEBOP_II_V_PROGRESSIONS),
    pentatonic: rootless(PENTATONIC_PROGRESSIONS),
    'diatonic-improv': rootless(DIATONIC_IMPROV_PROGRESSIONS),
    'two-five-scales': rootless(TWO_FIVE_SCALE_PROGRESSIONS),
    'two-five-phrases': rootless(TWO_FIVE_PHRASE_PROGRESSIONS),
    'jazz-chord-scales': JAZZ_CHORD_SCALE_PROGRESSIONS,
    'modern-pentatonics': rootless([...MODERN_PENTATONIC_PROGRESSIONS, ...MODERN_PENTATONIC_PHRASES]),
    'jazz-phrases': rootless(JAZZ_PHRASE_PROGRESSIONS),
    'jazz-chords': rootless([...JAZZ_CHORD_SCALE_PROGRESSIONS, ...JAZZ_PHRASE_PROGRESSIONS]),
    'triad-pairs': band(TRIAD_PAIR_PROGRESSIONS),
    'chord-tones': rootless(CHORD_TONE_PROGRESSIONS),
    idioms: rootless(IDIOM_PROGRESSIONS),
    outside: band(OUTSIDE_PROGRESSIONS),
    fourths: rootless(FOURTHS_PROGRESSIONS),
    coltrane: rootless(COLTRANE_PROGRESSIONS),
    modal: band(MODAL_PROGRESSIONS),
    'walking-bass': WALKING_BASS_PROGRESSIONS,
    articulation: ARTICULATION_PROGRESSIONS,
    voicing: VOICING_PROGRESSIONS,
    'upper-structures': UPPER_STRUCTURE_PROGRESSIONS,
    types: CHORD_TYPE_PROGRESSIONS,
    sevenths: SEVENTH_PROGRESSIONS,
    functional: FUNCTIONAL_PROGRESSIONS,
    'dominant-motion': DOMINANT_MOTION_PROGRESSIONS,
    'two-five': TWO_FIVE_PROGRESSIONS,
    resolution: RESOLUTION_PROGRESSIONS,
    'subdominant-minor': SUBDOMINANT_MINOR_PROGRESSIONS,
    'non-functional': NON_FUNCTIONAL_PROGRESSIONS,
    reharmonization: REHARMONIZATION_PROGRESSIONS,
    'work-song': WORK_SONG_PROGRESSIONS,
    syncopation: SYNCOPATION_PROGRESSIONS,
    stella: rootless(STELLA_PROGRESSIONS),
    world: WORLD_PROGRESSIONS,
    minimal: MINIMAL_PROGRESSIONS,
    jpop: JPOP_PROGRESSIONS,
    styles: STYLE_PROGRESSIONS,
    blues: BLUES_PROGRESSIONS.map(p => ({ ...p, sounds: { chords: 'piano', melody: 'piano', bass: 'bass' } })),
    'jazz-blues': JAZZ_BLUES_PROGRESSIONS,
    'blue-notes': BLUE_NOTE_PROGRESSIONS.map(p => ({ ...p, sounds: { chords: 'piano', melody: 'synth-lead' } })),
    waltz: WALTZ_PROGRESSIONS,
    common: COMMON_PROGRESSIONS,
};

// ── Player ───────────────────────────────────────────────────────────────────

const AHEAD = 0.15;   // seconds of notes scheduled ahead
const TICK_MS = 25;

/**
 * Plays a progression (chords, melody, bass riff, comp, and drums), scheduled ahead on
 * the audio clock so the parts stay together. `onChord(i)` and `onMelody(i)` are called
 * as chord or melody note `i` starts, `onBass(i)` as riff note `i` (see riffNotes) starts, or -2
 * for a chord's held bass on its own instrument,
 * `onHit(k)` as hit `k` of the current chord's comp starts (see `hits`), and each with
 * -1 when playback stops; each callback also gets the event's notes, which stay right
 * when a swap changes the progression under notes still sounding. A progression with
 * `loop` repeats until stopped, calling `onLoop(seconds)` as each new pass is scheduled
 * (`seconds` until it starts), where `swap` can change it; others
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
    constructor(instrument, { melodyInstrument = instrument, bassInstrument = null, drums = null,
        onChord = () => {}, onMelody = () => {}, onBass = () => {}, onHit = () => {}, onEnd = () => {}, onLoop = () => {} } = {}) {
        this.instrument = instrument;
        this.melodyInstrument = melodyInstrument;
        this.bassInstrument = bassInstrument;
        this.drums = drums;
        this.onChord = onChord;
        this.onMelody = onMelody;
        this.onBass = onBass;
        this.onHit = onHit;
        this.onEnd = onEnd;
        this.onLoop = onLoop;
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
            { bassLow: progression.bassLow, open: progression.voicing === 'open', rootless: progression.voicing === 'rootless' });
        this.hits = compHits(progression, this.voicings);
    }

    /**
     * Changes the progression without stopping: a pass already under way finishes as it
     * was, and the next pass plays the new one. For `onLoop`.
     */
    swap(progression) {
        this.progression = progression;
        this.voicings = voiceProgression(progression.chords, progression.melody ?? [],
            { bassLow: progression.bassLow, open: progression.voicing === 'open', rootless: progression.voicing === 'rootless' });
        this.hits = compHits(progression, this.voicings);
        if (this.playing) this._events = this._timeline();
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
        let held = null, heldBass = null;   // the last struck chord and bass note, which a tied chord extends
        // With a bass instrument, the bass note of each chord is played on it, held for
        // the chord, and the chord instrument plays only the notes above.
        const riffs = riffNotes(this.progression, this.voicings);
        const bassApart = this.bassInstrument && !riffs.length;
        const withoutBass = (notes, i) => (bassApart ? notes.filter(n => n !== this.voicings[i].bass) : notes);
        chords.forEach((chord, i) => {
            // A tied chord keeps the previous one sounding and only reports itself.
            if (chord.tied && held) {
                held.beats += chord.beats;
                if (heldBass) heldBass.beats += chord.beats;
                events.push({ at, beats: chord.beats, notes: [], velocity: 0, instrument: this.instrument, kind: 'chord', index: i });
                at += chord.beats;
                return;
            }
            held = { at, beats: chord.beats, notes: withoutBass(this.chordNotes(i), i), velocity: riffs.length ? 0.35 : 0.5,
                instrument: this.instrument, kind: 'chord', index: i };
            events.push(held);
            heldBass = null;
            if (bassApart && this.voicings[i].notes.length) {
                const bass = this.voicings[i].bass;
                heldBass = { at, beats: chord.beats, notes: [bass], velocity: 0.75, instrument: this.bassInstrument, kind: 'bass', index: -2 };
                events.push(heldBass);
            }
            // A comp's hits, each reported with its index within the chord.
            if (comp) {
                this.hits[i].forEach((hit, k) => events.push({ at: at + hit.at, beats: hit.beats, notes: withoutBass(hit.notes, i),
                    velocity: COMP_VELOCITY[hit.part], instrument: this.instrument, kind: 'hit', index: k }));
            }
            at += chord.beats;
        });
        // The riff, each note reported by its index in riffNotes.
        riffs.forEach((note, k) => events.push({ at: note.at, beats: note.beats, notes: [note.midi], velocity: 0.7,
            instrument: this.bassInstrument ?? this.instrument, kind: 'bass', index: k }));
        const length = at;
        at = 0;
        melody.forEach((note, i) => {
            // A note may set its own loudness (`velocity`) and the share of its length it
            // sounds for (`gate`: 1 is legato, small is staccato).
            if (note.midi !== null) {
                // A note may also bend (`bend` semitones, fractional for a quarter tone), starting
                // `bendAt` beats in and taking `bendBeats`, on an instrument that can (BendSynth).
                const bend = note.bend ? { to: note.midi + note.bend, at: note.bendAt ?? 0, beats: note.bendBeats ?? 1 / 3 } : null;
                events.push({ at, beats: note.beats * (note.gate ?? 1), notes: [note.midi], velocity: note.velocity ?? 0.8,
                    instrument: this.melodyInstrument, kind: 'melody', index: i, bend });
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
                    // The listener may swap in the next pass, which starts in this many seconds.
                    this.onLoop(Math.max(0, end - now));
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
                if (event.bend) event.instrument.bend(midi, event.bend.to, time + event.bend.at * beat, event.bend.beats * beat);
                event.instrument.noteOff(midi, off);
                this._sounding.add({ instrument: event.instrument, midi, off });
            }
            // Forget notes that have ended, so the set stays small while looping.
            for (const entry of this._sounding) if (entry.off < now) this._sounding.delete(entry);
            const callback = { chord: this.onChord, melody: this.onMelody, bass: this.onBass, hit: this.onHit }[event.kind];
            const draw = setTimeout(() => { this._draws.delete(draw); callback(event.index, event.notes); },
                Math.max(0, (time - now) * 1000));
            this._draws.add(draw);
        }
    }
}
