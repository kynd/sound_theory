import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { MalletSynth } from '../../lib/audio/instruments.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { StepSequencer, pitchedPattern } from '../../lib/audio/rhythm.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Two octaves of the C major pentatonic, high to low, over sixteen eighth notes.
const NOTES = [['C6', 84], ['A5', 81], ['G5', 79], ['E5', 76], ['D5', 74], ['C5', 72],
    ['A4', 69], ['G4', 67], ['E4', 64], ['D4', 62], ['C4', 60]].map(([label, midi]) => ({ label, midi }));

const master = new MasterBus();
const effects = new EffectChain(['delay', 'reverb']).connect(master.input);
effects.set('delay', 'mix', 0.2);
effects.set('reverb', 'mix', 0.3);
const instrument = new MalletSynth().connect(effects.input);
const pattern = pitchedPattern(NOTES, { steps: 16, stepsPerBeat: 2, tempo: 100 });

const grid = new StepGrid(document.getElementById('grid'), { count: true });
const sequencer = new StepSequencer(instrument, {
    pattern, tempo: pattern.tempo,
    onStep: i => grid.setStep(i),
});
const redraw = () => grid.update(pattern, sequencer.stepDuration);

// A rising and falling figure to start from.
[10, 8, 7, 5, 4, 5, 7, 8].forEach((row, i) => { pattern.tracks[row].steps[i * 2] = 1; });

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
addRange(controls, {
    label: 'Tempo', min: 60, max: 180, step: 1, value: pattern.tempo,
    onChange: v => { sequencer.tempo = v; redraw(); },
});
unwrap(controls);
redraw();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
