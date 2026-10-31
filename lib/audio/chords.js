import * as Tone from 'tone';

/**
 * Chords, chord progressions, and a player for them.
 *
 * A chord is written as a symbol: a root (C, F♯, B♭ …), a quality from QUALITIES
 * (`m7`, `maj7`, `7`, `m7♭5` …), optional tensions in parentheses (`G7(♭9)`,
 * `Cmaj7(♯11)`), and an optional bass note after a slash (`D♭/F`). Flats and sharps
 * may be written ♭/♯ or b/#. `parseChord` turns a symbol into pitch classes;
 * `voiceProgression` turns a list of chords into MIDI notes that move smoothly.
 *
 * A progression is `{ id, label, tempo, loop?, chords, melody? }`:
 *   - `chords`: `[{ symbol, beats, roman?, fn?, notes? }]`. `roman` is the Roman
 *     numeral shown under the chord, `fn` its function (T, SD, D, SDm). `notes`
 *     (MIDI numbers) voices a chord by hand instead, for chords that are not
 *     stacks of thirds (quartal chords, chords from a twelve-tone row).
 *   - `melody`: `[{ midi, beats }]` played over the chords (`midi: null` is a rest).
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
 * The notes above the bass, as pitch classes: every chord tone, except that the root
 * is left to the bass in chords of four or more tones (when the bass is the root), and
 * the fifth is left out of chords with five or more (it adds the least) and of chords
 * with a raised fifth or flat 13th, which would rub against it.
 */
function upperPitchClasses({ root, bass, intervals }) {
    let ivs = intervals;
    if (ivs.length >= 4 && bass === root) ivs = ivs.filter(i => i !== 0);
    if (ivs.length >= 5 || ivs.includes(8) || ivs.includes(20)) ivs = ivs.filter(i => i !== 7);
    return [...new Set(ivs.map(i => (root + i) % 12))];
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
 * they sound under. Returns `{ bass, upper, notes }` per chord, in MIDI numbers.
 * Chords with hand-written `notes` keep them.
 */
export function voiceProgression(chords, melody = []) {
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
        const bass = BASS_LOW + ((parsed.bass - BASS_LOW) % 12 + 12) % 12;
        const options = candidates(upperPitchClasses(parsed), UPPER_LOW)
            .filter(v => v[0] >= UPPER_LOW - 2 && v[0] > bass + 2);
        const fits = options.filter(v => v[v.length - 1] < ceilings[i] - 1);
        const pool = fits.length ? fits : options;
        const upper = pool.reduce((best, v) => motion(v, previous) < motion(best, previous) ? v : best);
        previous = upper;
        return { bass, upper, notes: [bass, ...upper] };
    });
}

// ── Progressions ─────────────────────────────────────────────────────────────

/** Chords of `beats` each from `[symbol, roman, fn]` triples (roman and fn optional). */
function chords(beats, list) {
    return list.map(([symbol, roman = '', fn = '']) => ({ symbol, beats, roman, fn }));
}

/** A melody from `[note, beats]` pairs, note names with octaves (`'C5'`) or null for rests. */
function melody(list) {
    return list.map(([name, beats]) => ({ midi: name === null ? null : Tone.Frequency(name).toMidi(), beats }));
}

const C = 60;   // C4, for hand-voiced chords

export const DIATONIC_PROGRESSIONS = [
    { id: 'diatonic-triads', label: 'Diatonic triads', tempo: 100, chords: chords(2, [
        ['C', 'I', 'T'], ['Dm', 'ii', 'SD'], ['Em', 'iii', 'T'], ['F', 'IV', 'SD'],
        ['G', 'V', 'D'], ['Am', 'vi', 'T'], ['Bdim', 'vii°', 'D'], ['C', 'I', 'T'],
    ]) },
    { id: 'i-iv-v-i', label: 'I–IV–V–I', tempo: 90, chords: chords(4, [
        ['C', 'I', 'T'], ['F', 'IV', 'SD'], ['G', 'V', 'D'], ['C', 'I', 'T'],
    ]) },
    { id: 'i-vi-iv-v', label: 'I–vi–IV–V', tempo: 90, loop: true, chords: chords(4, [
        ['C', 'I', 'T'], ['Am', 'vi', 'T'], ['F', 'IV', 'SD'], ['G', 'V', 'D'],
    ]) },
];

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
    { id: 'major-tensions', label: 'Tensions on Cmaj7', tempo: 80, chords: chords(2, [
        ['Cmaj7', '1 3 5 7'], ['Cmaj9', '+9'], ['Cmaj7(♯11)', '+♯11'], ['Cmaj13', '+9 13'], ['C6/9', '6 9'],
    ]) },
    { id: 'dominant-tensions', label: 'Tensions on G7', tempo: 80, chords: [
        ...chords(2, [
            ['G7', '1 3 5 ♭7'], ['G9', '+9'], ['G13', '+9 13'], ['G7(♭9)', '+♭9'],
            ['G7(♯9)', '+♯9'], ['G7(♭13)', '+♭13'], ['G7alt', 'alt'],
        ]),
        { symbol: 'Cmaj7', beats: 4, roman: 'Imaj7', fn: '' },
    ] },
    { id: 'ii-v-i-tensions', label: 'ii–V–I with tensions', tempo: 80, chords: chords(4, [
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

/** Named sets of progressions, for a demo that takes the set as a URL parameter. */
export const PROGRESSION_SETS = {
    diatonic: DIATONIC_PROGRESSIONS,
    types: CHORD_TYPE_PROGRESSIONS,
    sevenths: SEVENTH_PROGRESSIONS,
    functional: FUNCTIONAL_PROGRESSIONS,
    resolution: RESOLUTION_PROGRESSIONS,
    'subdominant-minor': SUBDOMINANT_MINOR_PROGRESSIONS,
    'non-functional': NON_FUNCTIONAL_PROGRESSIONS,
    reharmonization: REHARMONIZATION_PROGRESSIONS,
};

// ── Player ───────────────────────────────────────────────────────────────────

const AHEAD = 0.15;   // seconds of notes scheduled ahead
const TICK_MS = 25;

/**
 * Plays a progression (chords and melody) on an instrument, scheduled ahead on the
 * audio clock so chords and melody stay together. `onChord(i)` and `onMelody(i)` are
 * called as chord or melody note `i` starts, and with -1 when playback stops. A
 * progression with `loop` repeats until stopped; others stop at the end. Same
 * start/stop/playing contract as a continuous source, so it works with
 * wirePlayButton; `onEnd` is called when it stops by itself.
 */
export class ProgressionPlayer {
    /**
     * @param {object} instrument  anything with noteOn(midi, velocity, time) and noteOff(midi, time).
     */
    constructor(instrument, { onChord = () => {}, onMelody = () => {}, onEnd = () => {} } = {}) {
        this.instrument = instrument;
        this.onChord = onChord;
        this.onMelody = onMelody;
        this.onEnd = onEnd;
        this.progression = null;
        this.voicings = [];
        this._timer = null;
        this._draws = new Set();
        this._sounding = new Map();   // midi → off time, for stop()
    }

    /** Sets the progression and voices it. */
    setProgression(progression) {
        this.stop();
        this.progression = progression;
        this.voicings = voiceProgression(progression.chords, progression.melody ?? []);
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
        this.onChord(-1);
        this.onMelody(-1);
    }

    _halt() {
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        const now = Tone.immediate();
        for (const midi of this._sounding.keys()) this.instrument.noteOff(midi, now);
        this._sounding.clear();
    }

    /** Every note of one pass, in time order: `{ at, beats, notes, velocity, kind, index }`. */
    _timeline() {
        const { chords, melody = [] } = this.progression;
        const events = [];
        let at = 0;
        chords.forEach((chord, i) => {
            events.push({ at, beats: chord.beats, notes: this.voicings[i].notes, velocity: 0.5, kind: 'chord', index: i });
            at += chord.beats;
        });
        const length = at;
        at = 0;
        melody.forEach((note, i) => {
            if (note.midi !== null) events.push({ at, beats: note.beats, notes: [note.midi], velocity: 0.8, kind: 'melody', index: i });
            at += note.beats;
        });
        this._length = Math.max(length, at);
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
                    this.onChord(-1);
                    this.onMelody(-1);
                    this.onEnd();
                }
                return;
            }
            const event = this._events[this._index];
            const time = this._origin + event.at * beat;
            if (time > now + AHEAD) return;
            const off = time + event.beats * beat * 0.95;
            for (const midi of event.notes) {
                this.instrument.noteOn(midi, event.velocity, time);
                this.instrument.noteOff(midi, off);
                this._sounding.set(midi, off);
            }
            const callback = event.kind === 'chord' ? this.onChord : this.onMelody;
            const draw = setTimeout(() => { this._draws.delete(draw); callback(event.index); },
                Math.max(0, (time - now) * 1000));
            this._draws.add(draw);
            this._index++;
        }
    }
}
