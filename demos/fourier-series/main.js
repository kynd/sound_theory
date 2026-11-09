import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { AdditiveOscillator, harmonicSeries } from '../../lib/audio/additive.js';
import { PartialsView } from '../../lib/demo/PartialsView.js';
import { addRange, addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// A classic waveform built from the first terms of its Fourier series. `?shape=`
// (square, sawtooth, triangle) picks the starting shape for each section of the page.
const FUNDAMENTAL = 220;
const MAX_HARMONICS = 64;
const SHAPES = ['square', 'sawtooth', 'triangle'];

const params = new URLSearchParams(location.search);
let shape = SHAPES.includes(params.get('shape')) ? params.get('shape') : 'square';
let harmonics = 1;

const master = new MasterBus();
const tone = new AdditiveOscillator({ frequency: FUNDAMENTAL, amplitude: 0.5 }).connect(master.input);
const view = new PartialsView(document.getElementById('canvas'), { spectrum: true });

// Always MAX_HARMONICS entries, zero above the slider, so the spectrum's bars keep
// their places as harmonics are added.
function update() {
    const partials = harmonicSeries(shape, MAX_HARMONICS).map((a, i) => i < harmonics ? a : 0);
    tone.partials = partials;
    view.update(partials);
}

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Shape', value: shape,
    options: SHAPES.map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
    onChange: value => { shape = value; update(); },
});
addRange(controls, {
    label: 'Harmonics', min: 1, max: MAX_HARMONICS, step: 1, value: harmonics,
    onChange: n => { harmonics = n; update(); },
});
unwrap(controls);

update();
wirePlayButton(document.getElementById('play'), tone, startAudio);
