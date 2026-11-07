import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { GestureSynth, ContourPlayer, PENTATONIC_PCS, pitchAt } from '../../lib/audio/gesture.js';
import { DrawPad } from '../../lib/demo/DrawPad.js';
import { addSelect, addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// The drawn line is played left to right in a loop: height is pitch (C3 to C6),
// snapped to the pentatonic scale or free; gaps are silent.
const master = new MasterBus();
const effects = new EffectChain(['delay', 'reverb']).connect(master.input);
effects.set('reverb', 'mix', 0.25);
const synth = new GestureSynth({ type: 'triangle', resonance: 1 }).connect(effects.input);
synth.setCutoff(3000);
let pcs = PENTATONIC_PCS;

const pad = new DrawPad(document.getElementById('canvas'));
const player = new ContourPlayer(synth, {
    sample: x => pad.sample(x),
    pitch: y => pitchAt(y, { low: 48, high: 84, pcs }),
    duration: 4,
    onPosition: x => pad.setPlayhead(x),
});
// A first line to play: a few rising and falling phrases with gaps between them.
pad.fill(x => (x % 0.25 < 0.2 ? 0.5 + 0.3 * Math.sin(x * Math.PI * 4) : null));

document.getElementById('clear').addEventListener('click', () => pad.clear());
const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Pitch',
    options: [{ value: 'pentatonic', label: 'Pentatonic' }, { value: 'free', label: 'Free' }],
    value: 'pentatonic',
    onChange: v => { pcs = v === 'free' ? null : PENTATONIC_PCS; },
});
addRange(controls, {
    label: 'Length', min: 1, max: 10, step: 0.5, value: 4, unit: 's',
    onChange: v => { player.duration = v; },
});
unwrap(controls);
wirePlayButton(document.getElementById('play'), player, startAudio);
