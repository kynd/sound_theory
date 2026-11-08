import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { MalletSynth } from '../../lib/audio/instruments.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { StepSequencer, pitchedPattern } from '../../lib/audio/rhythm.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { addSelect, addRange, unwrap } from '../../lib/demo/controls.js';
import { TOY_SCALES, findScale, scaleLadder } from '../../lib/audio/scales.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Eleven rows of a scale going up from C4 (two octaves of the pentatonic it starts
// with), high to low, over sixteen eighth notes.
const ROWS = 11;
const ladder = scale => scaleLadder(scale, ROWS, 4).reverse();
const NOTES = ladder(TOY_SCALES[0]);

const master = new MasterBus();
const effects = new EffectChain(['delay', 'reverb']).connect(master.input);
effects.set('delay', 'mix', 0.2);
effects.set('reverb', 'mix', 0.3);
const instrument = new MalletSynth().connect(effects.input);
const pattern = pitchedPattern(NOTES, { steps: 16, stepsPerBeat: 2, tempo: 100 });

const grid = new StepGrid(document.getElementById('grid'), { paint: true });
const sequencer = new StepSequencer(instrument, {
    pattern, tempo: pattern.tempo,
    onStep: i => grid.setStep(i),
});
const redraw = () => grid.update(pattern, sequencer.stepDuration);

// A polyrhythm to start from: a low figure every four steps (C4, G4) against a high
// one every three (E5, D5), so the two meet in a different place each time.
const ROW = Object.fromEntries(NOTES.map(({ label }, i) => [label, i]));
for (let i = 0; i < 16; i++) {
    if (i % 4 === 0) pattern.tracks[ROW.C4].steps[i] = 1;
    if (i % 4 === 2) pattern.tracks[ROW.G4].steps[i] = 0.7;
    if (i % 3 === 0) pattern.tracks[ROW.E5].steps[i] = 0.9;
    if (i % 3 === 1) pattern.tracks[ROW.D5].steps[i] = 0.6;
}

document.getElementById('clear').addEventListener('click', () => {
    pattern.tracks.forEach(t => t.steps.fill(0));
    redraw();
});
// One note on about half the steps, at a random pitch and loudness.
document.getElementById('random').addEventListener('click', () => {
    pattern.tracks.forEach(t => t.steps.fill(0));
    for (let i = 0; i < 16; i++) {
        if (Math.random() < 0.55) pattern.tracks[Math.floor(Math.random() * NOTES.length)].steps[i] = 0.5 + Math.random() * 0.5;
    }
    redraw();
});
const controls = document.getElementById('controls');
// A new scale re-pitches the rows; the pattern stays where it is.
addSelect(controls, {
    label: 'Scale',
    options: TOY_SCALES.map(({ id, label }) => ({ value: id, label })),
    value: TOY_SCALES[0].id,
    onChange: id => {
        ladder(findScale(id)).forEach(({ label, midi }, i) => Object.assign(pattern.tracks[i], { label, midi }));
        redraw();
    },
});
addRange(controls, {
    label: 'Tempo', min: 60, max: 180, step: 1, value: pattern.tempo,
    onChange: v => { sequencer.tempo = v; redraw(); },
});
unwrap(controls);
redraw();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
