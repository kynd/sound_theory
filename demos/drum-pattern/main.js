import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, PATTERN_SETS, clonePattern } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { StepGrid } from '../../lib/demo/StepGrid.js';
import { addRange, addSelect, setRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which patterns to offer: ?set=meters (default) or feels.
const PATTERNS = PATTERN_SETS[new URLSearchParams(location.search).get('set')] ?? PATTERN_SETS.meters;

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const ring = new CycleView(document.getElementById('canvas'));
const grid = new StepGrid(document.getElementById('grid'), { onEdit: () => ring.draw() });
const sequencer = new StepSequencer(drums, {
    onStep: i => { ring.setStep(i); grid.setStep(i); },
});

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Pattern',
    options: PATTERNS.map(({ id, label }) => ({ value: id, label })),
    value: PATTERNS[0].id,
    onChange: usePattern,
});
const tempo = addRange(controls, {
    label: 'Tempo', min: 40, max: 240, step: 1, value: PATTERNS[0].tempo,
    onChange: v => { sequencer.tempo = v; },
});
unwrap(controls);

// Each choice starts from a fresh copy, so edits are kept only until the next choice.
function usePattern(id) {
    const pattern = clonePattern(PATTERNS.find(p => p.id === id));
    sequencer.pattern = pattern;
    sequencer.tempo = pattern.tempo;
    setRange(tempo, pattern.tempo);
    ring.update(pattern);
    grid.update(pattern);
}

usePattern(PATTERNS[0].id);
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
