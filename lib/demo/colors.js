/**
 * The demo color palette, sampled from a flower illustration (a birthday card):
 * near-black lettering and flat flower and leaf colors, on a bright paper.
 *
 * `paper` is the background, brighter than the card's. `white` is for wells that sit
 * on the paper: white keys, slider tracks, idle buttons, selects. Text is `ink`,
 * or `white` on red, green, and other dark fills. `green` marks the main controls (play buttons, active toggles, sliders
 * that are not part of a series), and `red` draws the main wave of a plot. The rest
 * are accents for everything else: a series, a spectrum, played keys.
 *
 * demo-ui.css mirrors these values as CSS custom properties. Change both together.
 */
export const COLORS = {
    paper:     '#fbf8f5',
    white:     '#ffffff',
    ink:       '#111111',

    red:       '#f05829',
    pink:      '#e75c9f',
    yellow:    '#febf28',
    butter:    '#fdd77e',
    green:     '#3a9548',
    darkGreen: '#17592d',
};

/**
 * The accents in the order a demo should use them for a series of things (voices,
 * notes, harmonics), ordered so that neighbors contrast. Red is left out, since it is
 * reserved for the main wave drawn over the series. Green, the main control color,
 * comes last so it appears only in longer series; an odd count of five keeps every
 * other item (the odd harmonics of a square wave) from repeating after two colors.
 */
export const ACCENTS = [
    COLORS.pink, COLORS.yellow, COLORS.darkGreen, COLORS.butter, COLORS.green,
];

/** The accent for the i-th item of a series, cycling through ACCENTS. */
export function accent(i) {
    return ACCENTS[((i % ACCENTS.length) + ACCENTS.length) % ACCENTS.length];
}
