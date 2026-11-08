import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { GestureSynth, ContourPlayer, SNAP_SCALES, pitchAt } from '../../lib/audio/gesture.js';
import { findScale, scalePitchClasses } from '../../lib/audio/scales.js';
import { DrawPad } from '../../lib/demo/DrawPad.js';
import { addSelect, addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// The drawn line is played left to right in a loop: height is pitch (C3 to C6),
// snapped to a scale or free; gaps are silent.
const master = new MasterBus();
const effects = new EffectChain(['delay', 'reverb']).connect(master.input);
effects.set('reverb', 'mix', 0.25);
const synth = new GestureSynth({ type: 'triangle', resonance: 1 }).connect(effects.input);
synth.setCutoff(3000);
let pcs = scalePitchClasses(SNAP_SCALES[0]);

const pad = new DrawPad(document.getElementById('canvas'));
const player = new ContourPlayer(synth, {
    sample: x => pad.sample(x),
    pitch: y => pitchAt(y, { low: 48, high: 84, pcs }),
    duration: 4,
    onPosition: x => pad.setPlayhead(x),
});
// A first line to play: one unbroken sine wave, rising and falling twice.
pad.fill(x => 0.5 + 0.3 * Math.sin(x * Math.PI * 4));

document.getElementById('clear').addEventListener('click', () => pad.clear());
const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Pitch',
    options: [...SNAP_SCALES.map(({ id, label }) => ({ value: id, label })), { value: 'free', label: 'Free' }],
    value: SNAP_SCALES[0].id,
    onChange: v => { pcs = v === 'free' ? null : scalePitchClasses(findScale(v)); },
});
addRange(controls, {
    label: 'Length', min: 1, max: 10, step: 0.5, value: 4, unit: 's',
    onChange: v => { player.duration = v; },
});
unwrap(controls);
wirePlayButton(document.getElementById('play'), player, startAudio);
