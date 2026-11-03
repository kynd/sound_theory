import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, BACKBEAT, clonePattern, humanize } from '../../lib/audio/rhythm.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const pattern = clonePattern(BACKBEAT);
const snare = pattern.tracks.find(t => t.id === 'snare');

// The grid, with the beats counted above it; each hit can be dragged up to 40 ms
// off the beat.
const grid = new StepGrid(document.getElementById('grid'), { count: true, shift: 0.04 });
const sequencer = new StepSequencer(drums, {
    pattern, tempo: pattern.tempo,
    onStep: i => grid.setStep(i),
});
const redraw = () => grid.update(pattern, sequencer.stepDuration);

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

// Every hit at a random time and loudness.
document.getElementById('randomize').addEventListener('click', () => { humanize(pattern); redraw(); });

redraw();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
