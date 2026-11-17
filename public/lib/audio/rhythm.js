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
 *     beatsPerBar?,   // for a pattern longer than a bar: beat groups in one bar
 *     tempo,          // a suitable tempo in beats per minute
 *     tracks: [{ id, label, midi, steps, offset?, offsets?, gain? }],
 *   }
 *
 * Each track's `steps` holds one velocity per step, 0–1, where 0 is silence. Tracks are
 * usually as long as the pattern; a shorter track loops on its own length, so tracks of
 * different lengths make a polymeter, and the pattern lasts until they meet again (the
 * least common multiple of their lengths, `cycleLength`). A track
 * may be moved off the grid by `offset` seconds (negative is early) and scaled by
 * `gain`; `offsets`, one per step, moves single hits on top of that. Patterns are written as strings, one character per step: `X` is a full hit,
 * `x` a soft one (half velocity), and `-` a rest.
 */

/** The drum tracks a pattern can use, top to bottom: high sounds first. */
export const DRUM_TRACKS = [
    { id: 'hat',   label: 'Hat',   midi: DRUM_NOTES.hat },
    { id: 'rim',   label: 'Rim',   midi: DRUM_NOTES.rim },
    { id: 'snare', label: 'Snare', midi: DRUM_NOTES.snare },
    { id: 'kick',  label: 'Kick',  midi: DRUM_NOTES.kick },
];

/**
 * Pieces of the kit a pattern can add by naming them in `trackIds` (clap, open hi-hat, tom).
 * They are not in DRUM_TRACKS, so the patterns that do not use them keep four rows.
 */
const EXTRA_TRACKS = [
    { id: 'open',  label: 'Open',  midi: DRUM_NOTES.open },
    { id: 'clap',  label: 'Clap',  midi: DRUM_NOTES.clap },
    { id: 'tom',   label: 'Tom',   midi: DRUM_NOTES.tom },
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
 * Builds a pattern from strings per track. `trackIds` picks the tracks, from DRUM_TRACKS
 * and EXTRA_TRACKS, in the order given; a track without a string is all rests. `gains`
 * gives a track its `gain` by id (`{ tom: 2 }`), for a drum that is too quiet in the mix.
 */
export function makePattern({ id, label, stepsPerBeat, groups, beatsPerBar, tempo, tracks, trackIds = DRUM_TRACKS.map(t => t.id), gains = {} }) {
    const steps = groups.reduce((a, b) => a + b, 0);
    return {
        id, label, stepsPerBeat, groups, tempo,
        ...(beatsPerBar ? { beatsPerBar } : {}),
        tracks: trackIds.map(id => [...DRUM_TRACKS, ...EXTRA_TRACKS].find(t => t.id === id)).map(t => {
            const parsed = tracks[t.id] ? parseSteps(tracks[t.id]) : [];
            return { ...t, steps: Array.from({ length: steps }, (_, i) => parsed[i] ?? 0), ...(gains[t.id] ? { gain: gains[t.id] } : {}) };
        }),
    };
}

/** A copy that can be edited without changing the original. */
export function clonePattern(pattern) {
    return {
        ...pattern, groups: [...pattern.groups],
        tracks: pattern.tracks.map(t => ({ ...t, steps: [...t.steps], ...(t.offsets ? { offsets: [...t.offsets] } : {}) })),
    };
}

/**
 * A steady pulse: `count` steps of one beat each, all at the same velocity. Without
 * `accent` every beat is a rim click. With it, every `accent`-th beat (starting with the
 * first) is a kick instead, so the pulse falls into cycles of that length marked by a
 * change of sound rather than of loudness.
 */
export function pulsePattern(count, accent = null) {
    const VELOCITY = 0.7;
    const first = i => accent && i % accent === 0;
    const groups = accent ? Array(count / accent).fill(accent) : [count];
    const tracks = [{ ...DRUM_TRACKS.find(t => t.id === 'rim'), steps: Array.from({ length: count }, (_, i) => first(i) ? 0 : VELOCITY) }];
    if (accent) {
        tracks.push({ ...DRUM_TRACKS.find(t => t.id === 'kick'), steps: Array.from({ length: count }, (_, i) => first(i) ? VELOCITY : 0) });
    }
    return { id: 'pulse', label: 'Pulse', stepsPerBeat: 1, groups, tempo: 120, tracks };
}

const quarters = (beats, perBeat) => Array(beats).fill(perBeat);

/**
 * Two pulses sharing one cycle, for polyrhythms: `high` evenly spaced rim clicks and
 * `low` evenly spaced kicks in the same span (3 and 2 for three against two). The
 * cycle is cut into as many steps as both need (their least common multiple), a beat
 * is one of the high pulse's notes, and both pulses start together on step 0, which is
 * accented. Returns the pattern and the tempo that makes the cycle last `cycle` seconds.
 */
export function polyrhythmPattern(high, low, { cycle = 2 } = {}) {
    const steps = lcm(high, low);
    const track = (id, count) => ({
        ...DRUM_TRACKS.find(t => t.id === id),
        steps: Array.from({ length: steps }, (_, i) => (i % (steps / count) === 0 ? (i === 0 ? FULL : 0.7) : 0)),
    });
    const pattern = {
        id: `${high}-${low}`, label: `${high} against ${low}`, stepsPerBeat: steps / high,
        groups: Array(high).fill(steps / high), tempo: high * 60 / cycle,
        tracks: [track('rim', high), track('kick', low)],
    };
    return pattern;
}

/**
 * Parts of notes that divide one cycle into different numbers of columns, for a
 * polyrhythm of melodies. A part is `{ rows: [{ label, midi }], cells }`, with
 * `cells[row][col]` on (1) or off (0); its columns are spread evenly over the cycle
 * (`cycle` seconds). The pattern's steps are the least common multiple of the parts'
 * column counts, with one track per row of every part, sounding on the steps where
 * its part's columns start; the first column of every part is louder. Step `i` falls
 * in column `Math.floor(i * cols / steps)` of a part with `cols` columns.
 */
export function notePartsPattern(parts, { cycle = 2.4 } = {}) {
    const steps = parts.reduce((n, part) => lcm(n, part.cells[0].length), 1);
    const tracks = parts.flatMap(({ rows, cells }) => rows.map(({ label, midi }, r) => {
        const cols = cells[r].length, every = steps / cols;
        return {
            id: label, label, midi,
            steps: Array.from({ length: steps }, (_, i) => (i % every || !cells[r][i / every] ? 0 : (i === 0 ? FULL : 0.7))),
        };
    }));
    return { id: 'note-parts', label: 'Note parts', stepsPerBeat: steps, groups: [steps], tempo: 60 / cycle, tracks };
}

/**
 * A part's cells (`cells[row][col]`, see notePartsPattern) with `cols` columns, keeping
 * its notes: fewer columns cut off the last ones, more add empty columns at the end.
 */
export function resizeCells(cells, cols) {
    return cells.map(row => Array.from({ length: cols }, (_, c) => row[c] ?? 0));
}

/**
 * A part's cells (`cells[row][col]`, see notePartsPattern) with random notes: about
 * `density` of the columns get one note at a random row, the first column always.
 */
export function randomCells(rows, cols, { density = 0.6 } = {}) {
    const cells = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let c = 0; c < cols; c++) {
        if (c === 0 || Math.random() < density) cells[Math.floor(Math.random() * rows)][c] = 1;
    }
    return cells;
}

/**
 * Two loops of different lengths over one pulse, for polymeters: a loop of `top` steps
 * over a loop of `bottom` steps, one note per step, each loop accenting its own first
 * note. The loops start together and meet again after their least common multiple of
 * steps (8 and 5 meet every 40), which is the pattern's length. A step lasts `step`
 * seconds.
 *
 * `sounds` gives each loop 'drums' or 'notes'. On drums, the top loop is rim clicks and
 * the bottom one kicks. As notes, a loop climbs the C major scale from C, one note per
 * step (C, D, E, …), from C4 on top and C3 below; such a track has `voice: 'notes'`,
 * a pitch per step in `notes`, and the note names in `names`.
 */
export function polymeterPattern(top, bottom, { step = 0.25, sounds = ['drums', 'drums'] } = {}) {
    const SOFT_COUNT = 0.4;
    const MAJOR = [0, 2, 4, 5, 7, 9, 11];
    const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const steps = count => Array.from({ length: count }, (_, i) => (i === 0 ? FULL : SOFT_COUNT));
    const track = (count, sound, drum, low) => (sound === 'notes'
        ? {
            id: `notes-${drum}`, label: 'Notes', voice: 'notes', steps: steps(count),
            notes: Array.from({ length: count }, (_, i) => low + 12 * Math.floor(i / 7) + MAJOR[i % 7]),
            names: Array.from({ length: count }, (_, i) => LETTERS[i % 7]),
        }
        : { ...DRUM_TRACKS.find(t => t.id === drum), steps: steps(count) });
    const length = lcm(top, bottom);
    return {
        id: `${top}-${bottom}-meter`, label: `${top} over ${bottom}`, stepsPerBeat: 1,
        groups: Array(length / top).fill(top), tempo: 60 / step,
        tracks: [track(top, sounds[0], 'rim', 60), track(bottom, sounds[1], 'kick', 48)],
    };
}

/** The steps before every track of a pattern starts again together. */
export function cycleLength(pattern) {
    return pattern.tracks.reduce((length, track) => lcm(length, track.steps.length), 1);
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => a * b / gcd(a, b);

/** Patterns in common time signatures, in eighth-note steps (thirds of a beat in the shuffle). */
export const METER_PATTERNS = [
    makePattern({ id: '4-4', label: '4/4', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 100, tracks: {
        hat:   'X x X x X x X x',
        snare: '- - X - - - X -',
        kick:  'X - - - X - - -',
    } }),
    // The same beat as a shuffle: three steps a beat, played on the first and third.
    makePattern({ id: '4-4-shuffle', label: '4/4 shuffle', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 100, tracks: {
        hat:   'X - x X - x X - x X - x',
        snare: '- - - X - - - - - X - -',
        kick:  'X - - - - - X - - - - -',
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
 * notes; the shuffle in eighth-note triplets (three steps a beat); the bossa
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
    makePattern({ id: 'bossa-nova', label: 'Bossa nova', stepsPerBeat: 2, groups: quarters(8, 2), beatsPerBar: 4, tempo: 130, tracks: {
        hat:   'X x X x X x X x X x X x X x X x',
        rim:   'X - - X - - X - - - X - - X - -',
        kick:  'X - - x X - - x X - - x X - - x',
    } }),
];

/**
 * Drum patterns for styles, played under the backings on Syncopation and Anticipation
 * and Rhythm Patterns. The four tracks stand in for the style's own instruments: the
 * hat for a shaker or cymbal, the rim for a clave, bell, or cross-stick, the kick for
 * a bass drum or surdo.
 *
 *   - rock: eighths on the hat, the backbeat on 2 and 4, kick on 1, 3, and the "and" of 3.
 *   - one-drop: reggae's one drop, kick and cross-stick together on beat 3 only, the hat
 *     leaning on the off-beats; beat 1 is left empty.
 *   - samba: in sixteenths, a shaker pushing the last sixteenth of each beat, a
 *     tamborim-like rim figure, and the surdo's low beat strongest on 2 and 4.
 *   - son-clave: the 3-2 son clave on the rim over two bars, the kick on beat 4 as a
 *     conga's open tone would be.
 *   - bell-12-8: the standard bell pattern of West African and Afro-Cuban music, seven
 *     strokes in twelve, over a soft kick on the four beats.
 *   - boom-bap: hip-hop's kick and snare, the kick landing just before beat 3.
 */
export const STYLE_PATTERNS = [
    makePattern({ id: 'rock', label: 'Rock', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 120, tracks: {
        hat:   'X x X x X x X x',
        snare: '- - X - - - X -',
        kick:  'X - - - X X - -',
    } }),
    makePattern({ id: 'one-drop', label: 'One drop', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 76, tracks: {
        hat:   'x X x X x X x X',
        rim:   '- - - - X - - -',
        kick:  '- - - - X - - -',
    } }),
    makePattern({ id: 'samba', label: 'Samba', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 100, tracks: {
        hat:   'x x x X x x x X x x x X x x x X',
        rim:   'X - X - - X - X - X - - X - X -',
        kick:  'x - - - X - - x x - - - X - - x',
    } }),
    makePattern({ id: 'son-clave', label: 'Son clave', stepsPerBeat: 2, groups: quarters(8, 2), beatsPerBar: 4, tempo: 150, tracks: {
        hat:   'x x x x x x x x x x x x x x x x',
        rim:   'X - - X - - X - - - X - X - - -',
        kick:  '- - - - - - X - - - - - - - X -',
    } }),
    makePattern({ id: 'bell-12-8', label: '12/8 bell', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 100, tracks: {
        rim:   'X - X - X X - X - X - X',
        kick:  'x - - x - - x - - x - -',
    } }),
    makePattern({ id: 'boom-bap', label: 'Boom bap', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 88, tracks: {
        hat:   'X - x - X - x - X - x - X - x -',
        snare: '- - - - X - - - - - - - X - - -',
        kick:  'X - - - - - - x - - X - - - - -',
    } }),
    // Motown: the snare on every beat, a clap (for the tambourine) on 2 and 4.
    makePattern({ id: 'motown', label: 'Motown', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 120,
        trackIds: ['hat', 'clap', 'snare', 'kick'], tracks: {
        hat:   'X x X x X x X x',
        clap:  '- - X - - - X -',
        snare: 'X - X - X - X -',
        kick:  'X - - X X - - -',
    } }),
    // Disco: four on the floor, the open hi-hat on every "and," a clap on 2 and 4.
    makePattern({ id: 'disco', label: 'Disco', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 120,
        trackIds: ['hat', 'open', 'clap', 'kick'], tracks: {
        hat:   'X x - x X x - x X x - x X x - x',
        open:  '- - X - - - X - - - X - - - X -',
        clap:  '- - - - X - - - - - - - X - - -',
        kick:  'X - - - X - - - X - - - X - - -',
    } }),
    // Ska: fast, the hi-hat on every offbeat, the snare on 2 and 4.
    makePattern({ id: 'ska', label: 'Ska', stepsPerBeat: 2, groups: quarters(4, 2), tempo: 160, tracks: {
        hat:   '- X - X - X - X',
        snare: '- - X - - - X -',
        kick:  'X - - - X - - -',
    } }),
    // Dembow (reggaeton): four on the floor under a 3+3+2 snare, the "boom-ch-boom-chick."
    makePattern({ id: 'dembow', label: 'Dembow', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 95, tracks: {
        hat:   'x - x - x - x - x - x - x - x -',
        snare: '- - - X - - X - - - - X - - X -',
        kick:  'X - - - X - - - X - - - X - - -',
    } }),
    // Trap: half time, the clap on beat 3, hi-hats in sixteenths rolling at the end.
    makePattern({ id: 'trap', label: 'Trap', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 140,
        trackIds: ['hat', 'clap', 'kick'], tracks: {
        hat:   'X x X x X x X x X x X x X X X X',
        clap:  '- - - - - - - - X - - - - - - -',
        kick:  'X - - - - - - X - - X - - - - -',
    } }),
];

/**
 * Two bars of six eighth notes, the first grouped 3 + 3 (6/8), the second 2 + 2 + 2
 * (3/4): the alternation of the Mexican huapango and other Latin American music, and of
 * Bernstein's "America." The rim marks the start of every group, the kick each bar,
 * and the hi-hat fills the eighths between.
 */
export const SIX_EIGHT_THREE_FOUR = makePattern({ id: '6-8-3-4', label: '6/8 + 3/4', stepsPerBeat: 2, groups: [3, 3, 2, 2, 2], tempo: 168, tracks: {
    hat:   '- x x - x x - x - x - x',
    rim:   'X - - X - - X - X - X -',
    kick:  'X - - - - - X - - - - -',
} });

/**
 * Four against three in a 12/8 groove, two bars: the hi-hat (as a ride, with a triplet
 * skip before each beat) and soft kicks keep the four dotted-quarter beats, while
 * strong strokes every four eighth notes, three to a bar, move around the kit (kick,
 * snare, rim click), with soft snare ghost notes between.
 */
export const FOUR_AGAINST_THREE_GROOVE = makePattern({ id: '4-3-groove', label: '4 against 3', stepsPerBeat: 3, groups: [3, 3, 3, 3, 3, 3, 3, 3], beatsPerBar: 4, tempo: 100,
    trackIds: ['hat', 'rim', 'snare', 'kick'], tracks: {
    hat:   'X - x X - x X - x X - x   X - x X - x X - x X - x',
    rim:   '- - - - - - - - X - - -   - - - - - - - - X - - -',
    snare: '- - - - X - - x - - - -   - - - - X - - - - - x -',
    kick:  'X - - x - - x - - x - -   X - - x - - x - - x - -',
} });

/**
 * Afro-Cuban 6/8, as in bembé: two bars of six eighth notes with both groupings at once.
 * The rim plays the standard bell pattern (seven strokes in twelve), the kick the
 * dotted quarters (3 + 3 in each bar), and the tom, standing in for a conga, the
 * quarters (2 + 2 + 2), three against two in every bar.
 */
export const AFRO_CUBAN_SIX_EIGHT = makePattern({ id: 'afro-cuban-6-8', label: 'Afro-Cuban 6/8', stepsPerBeat: 2, groups: [3, 3, 3, 3], tempo: 168,
    trackIds: ['rim', 'tom', 'kick'], tracks: {
    rim:   'X - X - X X - X - X - X',
    tom:   'X - x - x - X - x - x -',
    kick:  'X - - X - - X - - X - -',
} });

/**
 * Subdivisions played and implied, in pairs: a sixteenth-note beat and a shuffle, each
 * first with the hi-hat filling every subdivision, then with the hi-hat on the beats
 * only and the same few kicks and ghost notes, which fall on the subdivision and keep
 * it felt. The two implied patterns differ only in where those few notes fall.
 */
export const IMPLIED_PATTERNS = [
    makePattern({ id: 'sixteenths', label: 'Sixteenths', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 92, tracks: {
        hat:   'X x x x X x x x X x x x X x x x',
        snare: '- - - - X - - - - - - - X - - x',
        kick:  'X - - - - - - x - - X - - - - -',
    } }),
    makePattern({ id: 'sixteenths-implied', label: 'Sixteenths, implied', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 92, tracks: {
        hat:   'X - - - X - - - X - - - X - - -',
        snare: '- - - - X - - - - - - - X - - x',
        kick:  'X - - - - - - x - - X - - - - -',
    } }),
    makePattern({ id: 'shuffle', label: 'Shuffle', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 92, tracks: {
        hat:   'X - x X - x X - x X - x',
        snare: '- - - X - - - - - X - x',
        kick:  'X - - - - x X - - - - -',
    } }),
    makePattern({ id: 'shuffle-implied', label: 'Shuffle, implied', stepsPerBeat: 3, groups: quarters(4, 3), tempo: 92, tracks: {
        hat:   'X - - X - - X - - X - -',
        snare: '- - - X - - - - - X - x',
        kick:  'X - - - - x X - - - - -',
    } }),
];

/**
 * A hammer falling on every downbeat, as in a work song: a low thud with a ring of
 * metal, then three beats of space for the singing.
 */
export const HAMMER = makePattern({
    id: 'hammer', label: 'Hammer', stepsPerBeat: 1, groups: [4], tempo: 76,
    trackIds: ['rim', 'kick'],
    tracks: { rim: 'X - - -', kick: 'X - - -' },
});

/**
 * The simplest rock beat, used to hear timing and loudness: kick on beats 1 and 3,
 * snare on 2 and 4, one step a beat.
 */
export const BACKBEAT = makePattern({
    id: 'backbeat', label: 'Backbeat', stepsPerBeat: 1, groups: quarters(4, 1), tempo: 92,
    trackIds: ['snare', 'kick'],
    tracks: {
        snare: '- X - X',
        kick:  'X - X -',
    },
});

/**
 * Plays a pattern the way a person might: moves every hit by a random amount up to
 * `timing` seconds either way (into its track's `offsets`, rounded to whole
 * milliseconds) and gives it a random velocity from `minVelocity` up to a full hit,
 * mostly near the top (the distance down from a full hit is a random number squared,
 * so fewer than one hit in five falls below half). Rests stay rests. Changes the
 * pattern in place.
 */
export function humanize(pattern, { timing = 0.03, minVelocity = 0.25 } = {}) {
    for (const track of pattern.tracks) {
        track.offsets = track.steps.map(v => v > 0 ? Math.round((Math.random() * 2 - 1) * timing * 1000) / 1000 : 0);
        track.steps = track.steps.map(v => v > 0 ? Math.round((FULL - (FULL - minVelocity) * Math.random() ** 2) * 100) / 100 : 0);
    }
}

/**
 * An empty grid of pitched notes for a step sequencer: one track per note (`{ label,
 * midi }`, listed high to low), `steps` steps of `1 / stepsPerBeat` beat each.
 */
export function pitchedPattern(notes, { steps = 16, stepsPerBeat = 2, tempo = 110 } = {}) {
    return {
        id: 'notes', label: 'Notes', stepsPerBeat, tempo,
        groups: Array(steps / stepsPerBeat).fill(stepsPerBeat), beatsPerBar: 4,
        tracks: notes.map(({ label, midi }) => ({ id: label, label, midi, steps: Array(steps).fill(0) })),
    };
}

/** Named sets of patterns, for a demo that takes the set as a URL parameter. */
/**
 * A laid-back lo-fi hip-hop beat: sixteenth-note hi-hats, accented on the eighths and
 * soft in between, a kick on 1 and the "and" of 3, and the snare on 2 and 4. Not in a
 * menu of its own; the backings on the syncopation page use it.
 */
export const LOFI_BEAT = makePattern({ id: 'lofi', label: 'Lo-fi', stepsPerBeat: 4, groups: quarters(4, 4), tempo: 80, tracks: {
    hat:   'X x X x X x X x X x X x X x X x',
    snare: '- - - - X - - - - - - - X - - -',
    kick:  'X - - - - - - - - - X - - - - -',
} });

export const PATTERN_SETS = { meters: METER_PATTERNS, feels: FEEL_PATTERNS, implied: IMPLIED_PATTERNS, styles: STYLE_PATTERNS };

// How far ahead notes are scheduled, and how often the scheduler wakes. The lead also
// covers the earliest a track can be moved ahead of the grid (see MAX_EARLY).
const AHEAD = 0.1;
const TICK_MS = 25;
/** The earliest a track's `offset` and a hit's `offsets` together can move it, in seconds. */
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
     * @param {Function} [opts.onSchedule]  (i, time): step `i` will sound at `time`
     *                                      on the audio clock; called ahead of it.
     * @param {object}   [opts.voices]      instruments by name, for tracks with a
     *                                      `voice` (pitched, with noteOn and noteOff).
     */
    constructor(instrument, { pattern = null, tempo = 100, onStep = () => {}, onSchedule = () => {}, voices = {} } = {}) {
        this.instrument = instrument;
        this.voices = voices;
        this.pattern = pattern;
        this.tempo = tempo;
        this.onStep = onStep;
        this.onSchedule = onSchedule;
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
            const i = this._step % cycleLength(pattern);
            for (const track of pattern.tracks) {
                // A shorter track loops on its own length (a polymeter).
                const j = i % track.steps.length;
                const velocity = track.steps[j] * (track.gain ?? 1);
                const offset = (track.offset ?? 0) + (track.offsets?.[j] ?? 0);
                if (velocity <= 0) continue;
                // A track with a `voice` plays its own instrument, a pitch per step
                // (`notes`), held for most of the step.
                const instrument = track.voice ? this.voices[track.voice] : this.instrument;
                const midi = track.notes?.[j] ?? track.midi;
                const time = this._next + offset;
                instrument.noteOn(midi, velocity, time);
                if (track.voice) instrument.noteOff(midi, time + 0.9 * this.stepDuration);
            }
            this.onSchedule(i, this._next);
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
