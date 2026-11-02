import { startAudio, audioNow, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, pulsePattern } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { PulseView } from '../../lib/demo/PulseView.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// ?accent=off plays an even pulse with no Accent slider, scrolling by instead of
// going around a ring, since it has no cycle.
const accented = new URLSearchParams(location.search).get('accent') !== 'off';

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const canvas = document.getElementById('canvas');
const sequencer = new StepSequencer(drums, { tempo: 120 });

let view;
if (accented) {
    // The first beat of each cycle is another sound, drawn in another color.
    view = new CycleView(canvas, { oneRing: true });
    sequencer.onStep = i => view.setStep(i);
} else {
    view = new PulseView(canvas, { now: audioNow });
    sequencer.onSchedule = (i, time) => view.addBeat(time, sequencer.pattern.tracks[0].steps[i]);
    sequencer.onStep = i => { if (i < 0) view.stop(); };
}

function usePattern(accent) {
    sequencer.pattern = accent ? pulsePattern(accent, accent) : pulsePattern(1);
    if (accented) view.update(sequencer.pattern, sequencer.stepDuration);
    else view.update(sequencer.stepDuration, sequencer.pattern.tracks[0].steps[0]);
}

const controls = document.getElementById('controls');
addRange(controls, {
    label: 'Tempo', min: 40, max: 240, step: 1, value: sequencer.tempo,
    onChange: v => { sequencer.tempo = v; if (!accented) view.update(sequencer.stepDuration); },
});
if (accented) {
    addRange(controls, { label: 'Accent', min: 2, max: 7, step: 1, value: 4, onChange: usePattern });
}
unwrap(controls);

usePattern(accented ? 4 : null);
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
