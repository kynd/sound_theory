import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, BACKBEAT, clonePattern } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const pattern = clonePattern(BACKBEAT);
const snare = pattern.tracks.find(t => t.id === 'snare');

const ring = new CycleView(document.getElementById('canvas'));
const grid = new StepGrid(document.getElementById('grid'), { onEdit: () => ring.draw() });
const sequencer = new StepSequencer(drums, {
    pattern, tempo: pattern.tempo,
    onStep: i => { ring.setStep(i); grid.setStep(i); },
});
const redraw = () => {
    ring.update(pattern, sequencer.stepDuration);
    grid.update(pattern, sequencer.stepDuration);
};

// The snare on beats 2 and 4: earlier or later than the grid, and louder or softer.
const controls = document.getElementById('controls');
addRange(controls, {
    label: 'Timing', min: -0.04, max: 0.04, step: 0.001, unit: 's', value: 0,
    onChange: v => { snare.offset = v; redraw(); },
});
addRange(controls, {
    label: 'Volume', min: -18, max: 6, step: 1, unit: 'dB', value: 0,
    onChange: db => { snare.gain = Math.pow(10, db / 20); redraw(); },
});
unwrap(controls);

redraw();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
