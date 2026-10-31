/**
 * Tuning math: intervals as pure ratios and as equal-tempered steps, cents, the
 * harmonics two notes share, and Pythagorean stacks of fifths. Frequencies are in Hz
 * and factors are frequency ratios (upper / lower).
 */

/**
 * The common intervals, smallest-number ratio first. `ratio` is [p, q] with
 * upper / lower = p / q; `semitones` is the same interval in twelve-tone equal
 * temperament.
 */
export const INTERVALS = [
    { id: 'octave',      label: 'Octave',      ratio: [2, 1], semitones: 12 },
    { id: 'fifth',       label: 'Fifth',       ratio: [3, 2], semitones: 7 },
    { id: 'fourth',      label: 'Fourth',      ratio: [4, 3], semitones: 5 },
    { id: 'major-sixth', label: 'Major sixth', ratio: [5, 3], semitones: 9 },
    { id: 'major-third', label: 'Major third', ratio: [5, 4], semitones: 4 },
    { id: 'minor-third', label: 'Minor third', ratio: [6, 5], semitones: 3 },
    { id: 'minor-sixth', label: 'Minor sixth', ratio: [8, 5], semitones: 8 },
];

/** The frequency factor of an interval, `'pure'` (its ratio) or `'equal'` (2^(semitones/12)). */
export function intervalFactor(interval, system) {
    const [p, q] = interval.ratio;
    return system === 'pure' ? p / q : Math.pow(2, interval.semitones / 12);
}

/** The size of a frequency factor in cents (1200 per octave). */
export function cents(factor) {
    return 1200 * Math.log2(factor);
}

/**
 * The first pair of harmonics that coincide when the interval is pure: harmonic
 * `lower` of the lower note and harmonic `upper` of the upper note (for 5:4, the 5th
 * and the 4th). In any other tuning of the interval they differ, and `beat` is how
 * many times per second they beat against each other.
 */
export function meetingHarmonics(interval, system, base) {
    const [p, q] = interval.ratio;
    const lowerHz = p * base;
    const upperHz = q * base * intervalFactor(interval, system);
    return { lower: p, upper: q, lowerHz, upperHz, beat: Math.abs(lowerHz - upperHz) };
}

/**
 * Note names reached by stacking pure fifths up from C. The 13th entry, B♯, is
 * twelve fifths up and lands a Pythagorean comma above C.
 */
export const FIFTH_NAMES = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];

/**
 * The notes from stacking `n` fifths on a starting note, each folded into the octave
 * above the start (divided by 2 until it is below 2). `system` is `'pure'` (×3/2, the
 * Pythagorean fifth) or `'equal'` (×2^(7/12), seven equal-tempered semitones). Twelve
 * pure fifths overshoot the start by a Pythagorean comma; twelve equal ones land on it.
 * Returns n + 1 entries: `{ index, name, factor, cents }`, the start first.
 */
export function stackFifths(n, system = 'pure') {
    const fifth = system === 'equal' ? Math.pow(2, 7 / 12) : 3 / 2;
    return Array.from({ length: n + 1 }, (_, k) => {
        let factor = Math.pow(fifth, k);
        while (factor >= 2 - 1e-9) factor /= 2;
        return { index: k, name: FIFTH_NAMES[k] ?? `${k}`, factor, cents: cents(factor) };
    });
}
