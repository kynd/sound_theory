import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { AdditiveOscillator } from '../../lib/audio/additive.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const tone = new AdditiveOscillator({ frequency: 220, partials: [1], amplitude: 0.6 }).connect(master.input);
new Scope(document.getElementById('canvas'), tone.output, { mode: 'wave' });

const controls = document.getElementById('controls');
// step: 1 snaps the slider to whole hertz, so the value shown is the frequency played.
addRange(controls, {
    label: 'Frequency', min: 40, max: 2000, step: 1, value: tone.frequency, scale: 'log', unit: 'Hz',
    onChange: hz => { tone.frequency = hz; },
});
addRange(controls, {
    label: 'Amplitude', min: 0, max: 1, step: 0.01, value: tone.amplitude,
    onChange: a => { tone.amplitude = a; },
});
unwrap(controls);

wirePlayButton(document.getElementById('play'), tone, startAudio);
