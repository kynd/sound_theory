import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { AdditiveOscillator, harmonicSeries } from '../../lib/audio/additive.js';
import { PartialsView } from '../../lib/demo/PartialsView.js';
import { COLORS } from '../../lib/demo/colors.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const FUNDAMENTAL = 220;
const HARMONICS = 8;

const master = new MasterBus();
const tone = new AdditiveOscillator({
    frequency: FUNDAMENTAL, partials: harmonicSeries('sine', HARMONICS), amplitude: 0.5,
}).connect(master.input);
const view = new PartialsView(document.getElementById('canvas'));

// One slider per harmonic, labeled with its frequency.
const harmonicControls = document.getElementById('harmonic-controls');
tone.partials.forEach((amplitude, k) => addRange(harmonicControls, {
    label: `${FUNDAMENTAL * (k + 1)} Hz`, min: 0, max: 1, step: 0.01, value: amplitude,
    color: COLORS.yellow,
    onChange: a => { tone.setPartial(k, a); view.update(tone.partials); },
}));
unwrap(harmonicControls);

view.update(tone.partials);
wirePlayButton(document.getElementById('play'), tone, startAudio);
