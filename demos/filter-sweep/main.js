import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { GestureSynth, cutoffAt, resonanceAt } from '../../lib/audio/gesture.js';
import { XYPad } from '../../lib/demo/XYPad.js';
import { addSelect, addReadout, unwrap } from '../../lib/demo/controls.js';

// Press and drag on the pad to sound an A2 (110 Hz): left to right is the filter's
// cutoff (100 Hz to 8000 Hz), bottom to top its resonance (0.5 to 15).
const NOTE = 45;

const master = new MasterBus();
const synth = new GestureSynth().connect(master.input);
synth.setPitch(NOTE, 0);

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Wave',
    options: ['sawtooth', 'square', 'triangle'].map(v => ({ value: v, label: v })),
    value: 'sawtooth',
    onChange: v => { synth.type = v; },
});
const showCutoff = addReadout(controls, { label: 'Cutoff' });
const showResonance = addReadout(controls, { label: 'Resonance' });
unwrap(controls);

const move = (x, y) => {
    const hz = cutoffAt(x), q = resonanceAt(y);
    synth.setCutoff(hz);
    synth.setResonance(q);
    showCutoff(`${Math.round(hz)}`);
    showResonance(q.toFixed(1));
};
new XYPad(document.getElementById('canvas'), {
    // Not awaited: the gate must open before a quick release can close it.
    onStart: (x, y) => { startAudio(); move(x, y); synth.start(); },
    onMove: move,
    onEnd: () => synth.stop(),
});
