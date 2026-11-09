import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { Chord } from '../../lib/audio/additive.js';
import { SIMPLE_RATIOS } from '../../lib/audio/tuning.js';
import { BeatView } from '../../lib/demo/BeatView.js';
import { addRange, addSelect, setRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Two sine waves, the lower fixed at 220 Hz and the upper at a ratio to it: chosen
// from the whole-number ratios, or anywhere between 1 and 2 with the slider. The plot
// draws eight cycles of the lower wave, the upper one at the same ratio, and their sum.
const BASE = 220;
const CYCLES = 8;
const OTHER = 'other';

const key = ([p, q]) => `${p}:${q}`;
let ratio = 3 / 2;

const master = new MasterBus();
const chord = new Chord([BASE, BASE * ratio], { partials: [1], amplitude: 0.3 }).connect(master.input);
const view = new BeatView(document.getElementById('canvas'), { seconds: 1 });

function apply(value) {
    ratio = value;
    chord.frequencies = [BASE, BASE * ratio];
    view.setWaves(CYCLES, CYCLES * ratio);
}

const controls = document.getElementById('controls');
const select = addSelect(controls, {
    label: 'Ratio',
    options: [...SIMPLE_RATIOS.map(r => ({ value: key(r), label: key(r) })), { value: OTHER, label: 'Other' }],
    value: '3:2',
    onChange: value => {
        if (value === OTHER) return;
        const [p, q] = value.split(':').map(Number);
        setRange(slider, p / q);
        apply(p / q);
    },
});
const slider = addRange(controls, {
    label: 'Upper', min: 1, max: 2, step: 0.001, value: ratio, scale: 'log',
    onChange: v => {
        // A slider value that rounds to a whole-number ratio plays it exactly.
        const exact = SIMPLE_RATIOS.find(([p, q]) => Math.abs(p / q - v) < 0.0005);
        select.value = exact ? key(exact) : OTHER;
        apply(exact ? exact[0] / exact[1] : v);
    },
});
unwrap(controls);

apply(ratio);
wirePlayButton(document.getElementById('play'), chord, startAudio);
