import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { MalletSynth } from '../../lib/audio/instruments.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { StepSequencer, notePartsPattern, randomCells, resizeCells, cycleLength } from '../../lib/audio/rhythm.js';
import { findScale, scaleLadder } from '../../lib/audio/scales.js';
import { PolyGrid } from '../../lib/demo/PolyGrid.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Two parts on the C major pentatonic, High from C5 and Low from C4, five notes each
// (high to low), in one 2.4-second cycle. Each part has twice its number of columns,
// so 5 against 4 is ten columns over eight. ?high=5&low=4 sets where the sliders start.
const params = new URLSearchParams(location.search);
const MAX = 9;
const SCALE = findScale('major-pentatonic');
const ROWS = 5;
const parts = [
    { count: Number(params.get('high') ?? 5), rows: scaleLadder(SCALE, ROWS, 5).reverse() },
    { count: Number(params.get('low') ?? 4), rows: scaleLadder(SCALE, ROWS, 4).reverse() },
];
const fill = part => { part.cells = randomCells(ROWS, 2 * part.count); };
parts.forEach(fill);
// A pattern to start from at 5 against 4: High climbs the scale from C5, a note on each
// of its pulses, while Low repeats D4 on each of its own.
const empty = part => part.cells.forEach(row => row.fill(0));
if (parts[0].count === 5 && parts[1].count === 4) {
    parts.forEach(empty);
    for (let k = 0; k < 5; k++) parts[0].cells[ROWS - 1 - k][2 * k] = 1;
    for (let k = 0; k < 4; k++) parts[1].cells[ROWS - 2][2 * k] = 1;
}

const master = new MasterBus();
const effects = new EffectChain(['reverb']).connect(master.input);
effects.set('reverb', 'mix', 0.25);
const instrument = new MalletSynth().connect(effects.input);

let steps = 1;
const grid = new PolyGrid(document.getElementById('grid'), { onEdit: () => usePattern() });
const sequencer = new StepSequencer(instrument, { onStep: i => grid.setPhase(i < 0 ? -1 : i / steps) });

// A new pattern from the cells, swapped in while playing: the step count changes with
// the parts' column counts, so the sequencer starts the cycle again only when it does.
function usePattern() {
    const pattern = notePartsPattern(parts);
    const restart = sequencer.playing && cycleLength(pattern) !== steps;
    steps = cycleLength(pattern);
    sequencer.pattern = pattern;
    sequencer.tempo = pattern.tempo;
    if (restart) sequencer.start();
    grid.update(parts);
}

document.getElementById('random').addEventListener('click', () => { parts.forEach(fill); usePattern(); });
document.getElementById('clear').addEventListener('click', () => {
    parts.forEach(empty);
    usePattern();
});
const controls = document.getElementById('controls');
['High', 'Low'].forEach((label, p) => addRange(controls, {
    label, min: 1, max: MAX, step: 1, value: parts[p].count,
    // The part keeps its notes: the last columns are cut off, or empty ones added.
    onChange: v => { parts[p].count = v; parts[p].cells = resizeCells(parts[p].cells, 2 * v); usePattern(); },
}));
unwrap(controls);

usePattern();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
