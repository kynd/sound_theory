import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, polyrhythmPattern } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Two pulses in one two-second cycle: High (rim clicks, the outer ring) and Low (kicks,
// the inner ring). ?high=3&low=2 sets where the sliders start.
const params = new URLSearchParams(location.search);
let high = Number(params.get('high') ?? 3), low = Number(params.get('low') ?? 2);

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const view = new CycleView(document.getElementById('canvas'));
const sequencer = new StepSequencer(drums, { onStep: i => view.setStep(i) });

function usePattern() {
    const pattern = polyrhythmPattern(high, low);
    const wasPlaying = sequencer.playing;
    sequencer.stop();
    sequencer.pattern = pattern;
    sequencer.tempo = pattern.tempo;
    view.update(pattern, sequencer.stepDuration);
    if (wasPlaying) sequencer.start();
}

const controls = document.getElementById('controls');
addRange(controls, { label: 'High', min: 1, max: 9, step: 1, value: high, onChange: v => { high = v; usePattern(); } });
addRange(controls, { label: 'Low', min: 1, max: 9, step: 1, value: low, onChange: v => { low = v; usePattern(); } });
unwrap(controls);

usePattern();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
