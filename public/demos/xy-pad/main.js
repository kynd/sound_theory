import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { GestureSynth, PENTATONIC_PCS, pitchAt, cutoffAt } from '../../lib/audio/gesture.js';
import { XYPad } from '../../lib/demo/XYPad.js';
import { addSelect, addEffectControls, unwrap } from '../../lib/demo/controls.js';

// Drag on the pad: left to right is pitch (C3 to C6), bottom to top the filter cutoff.
const LOW = 48, HIGH = 84;
const master = new MasterBus();
const effects = new EffectChain(['delay', 'reverb']).connect(master.input);
const synth = new GestureSynth().connect(effects.input);
let pcs = PENTATONIC_PCS;

const play = (x, y) => {
    synth.setPitch(pitchAt(x, { low: LOW, high: HIGH, pcs }));
    synth.setCutoff(cutoffAt(y));
};
const pad = new XYPad(document.getElementById('canvas'), {
    onStart: (x, y) => { startAudio(); play(x, y); synth.start(); },
    onMove: play,
    onEnd: () => synth.stop(),
});
// Ticks along the bottom where the snapped notes fall.
const showMarks = () => pad.setMarks(pcs
    ? Array.from({ length: HIGH - LOW + 1 }, (_, i) => LOW + i).filter(m => pcs.includes(m % 12)).map(m => (m - LOW) / (HIGH - LOW))
    : []);

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Pitch',
    options: [{ value: 'pentatonic', label: 'Pentatonic' }, { value: 'free', label: 'Free' }],
    value: 'pentatonic',
    onChange: v => { pcs = v === 'free' ? null : PENTATONIC_PCS; showMarks(); },
});
addSelect(controls, {
    label: 'Wave',
    options: ['sawtooth', 'square', 'triangle'].map(v => ({ value: v, label: v })),
    value: 'sawtooth',
    onChange: v => { synth.type = v; },
});
const divider = document.createElement('hr');
divider.className = 'dp-divider';
controls.append(divider);
addEffectControls(controls, effects);
unwrap(controls);
showMarks();
