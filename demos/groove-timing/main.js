import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, BACKBEAT, clonePattern, humanize } from '../../lib/audio/rhythm.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const pattern = clonePattern(BACKBEAT);

// The grid, with the beats counted above it; each hit can be dragged up to 40 ms
// off the beat.
const grid = new StepGrid(document.getElementById('grid'), { count: true, shift: 0.04 });
const sequencer = new StepSequencer(drums, {
    pattern, tempo: pattern.tempo,
    onStep: i => grid.setStep(i),
});
const redraw = () => grid.update(pattern, sequencer.stepDuration);

// Every hit at a random time and loudness.
document.getElementById('randomize').addEventListener('click', () => { humanize(pattern); redraw(); });

redraw();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
