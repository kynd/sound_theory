/**
 * Scales as spelled note names, in twelve-tone equal temperament. A spelling ("E♭",
 * not "D♯") fixes both the pitch and where the note sits on a staff.
 *
 * A note name is a letter, an optional accidental (♯ or ♭), and no octave. A scale
 * lists its notes in ascending order within one octave, starting on its root
 * (`root`, default 'C'): D Dorian is ['D', 'E', 'F', 'G', 'A', 'B', 'C'].
 */

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTALS = { '': 0, '♯': 1, '♭': -1, '𝄪': 2, '𝄫': -2 };
const ACCIDENTAL_NAMES = { 0: '', 1: '♯', [-1]: '♭', 2: '𝄪', [-2]: '𝄫' };

/** The default name of each of the 12 pitch classes, used for notes outside a scale. */
export const PITCH_CLASS_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/** The same with flats, for notes outside a scale in a flat key (F, B♭, E♭ …). */
export const FLAT_PITCH_CLASS_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

/**
 * Names for the 12 pitch classes that suit a scale, for notes outside it: flats when
 * the scale spells more notes with flats than with sharps (C minor, F major), sharps
 * otherwise.
 */
export function pitchClassNames(scale) {
    const count = sign => scale.notes.filter(n => n.includes(sign)).length;
    return count('♭') > count('♯') ? FLAT_PITCH_CLASS_NAMES : PITCH_CLASS_NAMES;
}

/** Splits a note name into its letter, its accidental, and its semitones above C. */
export function parseNote(name) {
    const letter = name[0];
    const accidental = name.slice(1);
    return {
        letter,
        accidental,
        step: LETTERS.indexOf(letter),           // 0 = C … 6 = B, for the staff
        semitones: LETTER_SEMITONES[letter] + ACCIDENTALS[accidental],
    };
}

/**
 * Scales built from C, in menu order. Add new scales to a set here, never in a demo.
 */
export const SCALES = [
    { id: 'major',           label: 'Major',           notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
    { id: 'minor',           label: 'Minor',           notes: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
    { id: 'in',              label: 'In',              notes: ['C', 'D♭', 'F', 'G', 'A♭'] },
    { id: 'ryukyu',          label: 'Ryukyu',          notes: ['C', 'E', 'F', 'G', 'B'] },
    { id: 'hijaz',           label: 'Hijaz',           notes: ['C', 'D♭', 'E', 'F', 'G', 'A♭', 'B♭'] },
    { id: 'hungarian-minor', label: 'Hungarian minor', notes: ['C', 'D', 'E♭', 'F♯', 'G', 'A♭', 'B'] },
];

/** The seven church modes, all on C, in their traditional order. */
export const MODES = [
    { id: 'ionian',     label: 'Ionian',     notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
    { id: 'dorian',     label: 'Dorian',     notes: ['C', 'D', 'E♭', 'F', 'G', 'A', 'B♭'] },
    { id: 'phrygian',   label: 'Phrygian',   notes: ['C', 'D♭', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
    { id: 'lydian',     label: 'Lydian',     notes: ['C', 'D', 'E', 'F♯', 'G', 'A', 'B'] },
    { id: 'mixolydian', label: 'Mixolydian', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B♭'] },
    { id: 'aeolian',    label: 'Aeolian',    notes: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
    { id: 'locrian',    label: 'Locrian',    notes: ['C', 'D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭'] },
];

/**
 * The same seven modes on the white keys: the C major scale started from each of
 * its notes, so every mode uses the same seven notes and only the root changes.
 */
export const WHITE_KEY_MODES = MODES.map((mode, i) => {
    const root = LETTERS[i];
    const notes = [...LETTERS.slice(i), ...LETTERS.slice(0, i)];
    return { id: `${root.toLowerCase()}-${mode.id}`, label: `${root} ${mode.label}`, root, notes };
});

/**
 * The three forms of the minor scale. The melodic minor has a second list,
 * `descending`, for the way down: the classical form raises the 6th and 7th going up
 * and lowers them again coming down. A scale without `descending` uses the same notes
 * both ways.
 */
export const MINOR_SCALES = [
    { id: 'natural-minor',  label: 'Natural minor',  notes: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
    { id: 'harmonic-minor', label: 'Harmonic minor', notes: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B'] },
    { id: 'melodic-minor',  label: 'Melodic minor',  notes: ['C', 'D', 'E♭', 'F', 'G', 'A', 'B'],
      descending: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
];

/**
 * Other scales common in jazz and pop music, on C. Spellings follow jazz usage where a letter repeats:
 * the diminished and altered scales write ♭9 and ♯9 as D♭ and D♯.
 */
export const OTHER_SCALES = [
    { id: 'major-pentatonic',      label: 'Major pentatonic', notes: ['C', 'D', 'E', 'G', 'A'] },
    { id: 'minor-pentatonic',      label: 'Minor pentatonic', notes: ['C', 'E♭', 'F', 'G', 'B♭'] },
    { id: 'blues',                 label: 'Blues',            notes: ['C', 'E♭', 'F', 'F♯', 'G', 'B♭'] },
    { id: 'whole-tone',            label: 'Whole tone',       notes: ['C', 'D', 'E', 'F♯', 'G♯', 'A♯'] },
    { id: 'diminished-half-whole', label: 'Half-whole',       notes: ['C', 'D♭', 'D♯', 'E', 'F♯', 'G', 'A', 'B♭'] },
    { id: 'diminished-whole-half', label: 'Whole-half',       notes: ['C', 'D', 'E♭', 'F', 'F♯', 'G♯', 'A', 'B'] },
    { id: 'altered',               label: 'Altered',          notes: ['C', 'D♭', 'D♯', 'E', 'F♯', 'G♯', 'B♭'] },
    { id: 'lydian-7th',            label: 'Lydian 7th',       notes: ['C', 'D', 'E', 'F♯', 'G', 'A', 'B♭'] },
];

/**
 * The altered scale on C and the Lydian 7th on G♭, a tritone away: the same seven
 * pitches (both modes of D♭ melodic minor), spelled from different roots.
 */
const LYDIAN_7TH_ON_G_FLAT = {
    id: 'lydian-7th-tritone', label: 'Lydian 7th', root: 'G♭',
    notes: ['G♭', 'A♭', 'B♭', 'C', 'D♭', 'E♭', 'F♭'],
};

/**
 * The four diatonic tetrachords, four notes spanning a perfect fourth, written from C
 * (the lower one) and from G (the upper one): major (W W H), minor (W H W), Phrygian
 * (H W W), and harmonic (H, augmented second, H).
 */
export const TETRACHORDS = [
    { id: 'major',    label: 'Major',    lower: ['C', 'D', 'E', 'F'],   upper: ['G', 'A', 'B', 'C'] },
    { id: 'minor',    label: 'Minor',    lower: ['C', 'D', 'E♭', 'F'],  upper: ['G', 'A', 'B♭', 'C'] },
    { id: 'phrygian', label: 'Phrygian', lower: ['C', 'D♭', 'E♭', 'F'], upper: ['G', 'A♭', 'B♭', 'C'] },
    { id: 'harmonic', label: 'Harmonic', lower: ['C', 'D♭', 'E', 'F'],  upper: ['G', 'A♭', 'B', 'C'] },
];

/** Names of the scales two tetrachords make, by `lower-upper` id; others have no common name. */
const TETRACHORD_SCALE_NAMES = {
    'major-major': 'Major', 'major-minor': 'Mixolydian', 'major-phrygian': 'Mixolydian ♭6',
    'major-harmonic': 'Harmonic major', 'minor-major': 'Melodic minor', 'minor-minor': 'Dorian',
    'minor-phrygian': 'Natural minor', 'minor-harmonic': 'Harmonic minor', 'phrygian-major': 'Neapolitan major',
    'phrygian-minor': 'Dorian ♭2', 'phrygian-phrygian': 'Phrygian', 'phrygian-harmonic': 'Neapolitan minor',
    'harmonic-phrygian': 'Phrygian dominant', 'harmonic-harmonic': 'Double harmonic',
};

/**
 * The seven-note scale on C made by joining a lower tetrachord (C to F) and an upper
 * one (G to C) a whole step apart: `{ id, label, notes }`, the label being the scale's
 * common name or an empty string.
 */
export function joinTetrachords(lowerId, upperId) {
    const lower = TETRACHORDS.find(t => t.id === lowerId), upper = TETRACHORDS.find(t => t.id === upperId);
    const id = `${lowerId}-${upperId}`;
    return { id, label: TETRACHORD_SCALE_NAMES[id] ?? '', notes: [...lower.lower, ...upper.upper.slice(0, 3)] };
}

const other = (...ids) => ids.map(id => OTHER_SCALES.find(s => s.id === id));

/** Named sets of scales, for a demo that takes the set as a URL parameter. */
export const SCALE_SETS = {
    scales: SCALES,
    modes: MODES,
    'white-key-modes': WHITE_KEY_MODES,
    minor: MINOR_SCALES,
    other: OTHER_SCALES,
    pentatonic: other('major-pentatonic', 'minor-pentatonic'),
    diminished: other('diminished-half-whole', 'diminished-whole-half'),
    'altered-lydian': [...other('altered'), LYDIAN_7TH_ON_G_FLAT],
};

/** Finds a scale by its id in any set, or undefined. */
export function findScale(id) {
    for (const set of Object.values(SCALE_SETS)) {
        const scale = set.find(s => s.id === id);
        if (scale) return scale;
    }
}

/** A scale's pitch classes (0 = C … 11 = B), in its own order. */
export function scalePitchClasses(scale) {
    return scale.notes.map(n => ((parseNote(n).semitones % 12) + 12) % 12);
}

/** Roots a scale can be moved to, in the spellings of the usual major keys. */
export const ROOTS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/** Roots for minor scales, in the spellings of the usual minor keys (C♯ minor, not D♭). */
export const MINOR_ROOTS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];

/**
 * Moves a note name by the interval from one root to another, spelled by letter
 * (E moved from C to A♭ is C, not B♯).
 */
export function transposeNote(name, from, to) {
    const a = parseNote(from), b = parseNote(to), note = parseNote(name);
    const letter = LETTERS[((note.step + b.step - a.step) % 7 + 7) % 7];
    const target = note.semitones + b.semitones - a.semitones;
    const offset = (((target - LETTER_SEMITONES[letter]) % 12) + 18) % 12 - 6;
    return letter + ACCIDENTAL_NAMES[offset];
}

/**
 * The same scale on another root: every note moved by the same interval and spelled
 * by letter, so the pattern of steps is kept and each letter still appears in order
 * (In on E is E, F, A, B, C; on A♭ it is A♭, B𝄫, D♭, E♭, F♭).
 */
export function transposeScale(scale, root) {
    return transposeBy(scale, scale.root ?? 'C', root);
}

/** A scale moved by the interval from one note to another (its root moves too). */
export function transposeBy(scale, from, to) {
    const move = name => transposeNote(name, from, to);
    return {
        ...scale,
        root: move(scale.root ?? 'C'),
        notes: scale.notes.map(move),
        ...(scale.descending ? { descending: scale.descending.map(move) } : {}),
    };
}

/**
 * The seven modes of a major key: its scale started from each of its notes, labeled
 * with their roots ("A Dorian" in G major). Ids are by degree, `degree-1` to
 * `degree-7`, the same in every key. In C these are the white-key modes.
 */
export function majorKeyModes(key = 'C') {
    return WHITE_KEY_MODES.map((mode, i) => {
        const moved = transposeBy(mode, 'C', key);
        return { ...moved, id: `degree-${i + 1}`, label: `${moved.root} ${MODES[i].label}` };
    });
}

/** MIDI number of a scale's root in a given octave (C4 = 60). */
export function rootMidi(scale, octave = 4) {
    return 12 * (octave + 1) + parseNote(scale.root ?? 'C').semitones;
}

/**
 * The notes of a scale played up one octave from its root, ending on the root an
 * octave above: `{ name, letter, accidental, midi, position }`. `position` counts
 * staff steps (lines and spaces) from C4, so C4 = 0, E4 = 2, C5 = 7.
 */
export function scaleNotes(scale, octave = 4, { descending = false } = {}) {
    const root = parseNote(scale.root ?? 'C');
    const base = rootMidi(scale, octave);
    const basePosition = root.step + 7 * (octave - 4);
    const names = descending ? scale.descending ?? scale.notes : scale.notes;
    const notes = names.map(name => {
        const { letter, accidental, step, semitones } = parseNote(name);
        const above = ((semitones - root.semitones) % 12 + 12) % 12;
        const steps = ((step - root.step) % 7 + 7) % 7;
        return { name, letter, accidental, midi: base + above, position: basePosition + steps };
    });
    const first = notes[0];
    notes.push({ ...first, midi: base + 12, position: basePosition + 7 });
    return notes;
}

/**
 * The scale played up to the octave and back down, as `scaleNotes` entries: the
 * ascending notes, then the descending ones from the note below the top. The way down
 * uses the scale's `descending` notes where it has them.
 */
export function scaleRun(scale, octave = 4) {
    const up = scaleNotes(scale, octave);
    const down = scaleNotes(scale, octave, { descending: true }).slice(0, -1).reverse();
    return [...up, ...down];
}
