import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, pulsePattern } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// ?accent=off plays an even pulse with no Accent slider.
const accented = new URLSearchParams(location.search).get('accent') !== 'off';
// Without accents the ring shows this many beats.
const EVEN_COUNT = 8;

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const view = new CycleView(document.getElementById('canvas'));
const sequencer = new StepSequencer(drums, { tempo: 120, onStep: i => view.setStep(i) });

function usePattern(accent) {
    sequencer.pattern = accent ? pulsePattern(accent, accent) : pulsePattern(EVEN_COUNT);
    view.update(sequencer.pattern, sequencer.stepDuration);
}

const controls = document.getElementById('controls');
addRange(controls, {
    label: 'Tempo', min: 40, max: 240, step: 1, value: sequencer.tempo,
    onChange: v => { sequencer.tempo = v; },
});
if (accented) {
    addRange(controls, { label: 'Accent', min: 2, max: 7, step: 1, value: 4, onChange: usePattern });
}
unwrap(controls);

usePattern(accented ? 4 : null);
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
