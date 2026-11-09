import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { Chord, harmonicSeries } from '../../lib/audio/additive.js';
import { INTERVALS, intervalFactor, meetingHarmonics } from '../../lib/audio/tuning.js';
import { BeatView } from '../../lib/demo/BeatView.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const BASE = 220;
// Rich in harmonics, so the harmonics that meet are loud enough to beat.
const PARTIALS = harmonicSeries('sawtooth', 8);

let interval = INTERVALS.find(i => i.id === 'major-third');
let system = 'pure';

const master = new MasterBus();
const chord = new Chord([BASE, BASE], { partials: PARTIALS, amplitude: 0.25 }).connect(master.input);
const view = new BeatView(document.getElementById('canvas'));
const systemButtons = document.querySelectorAll('[data-system]');

function refresh() {
    chord.frequencies = [BASE, BASE * intervalFactor(interval, system)];
    view.update(meetingHarmonics(interval, system, BASE).beat);
    systemButtons.forEach(b => b.classList.toggle('active', b.dataset.system === system));
}

const intervalControls = document.getElementById('interval-controls');
addSelect(intervalControls, {
    label: 'Interval',
    options: INTERVALS.map(({ id, label }) => ({ value: id, label })),
    value: interval.id,
    onChange: id => { interval = INTERVALS.find(i => i.id === id); refresh(); },
});
unwrap(intervalControls);

systemButtons.forEach(button => button.addEventListener('click', () => {
    system = button.dataset.system;
    refresh();
}));

refresh();
wirePlayButton(document.getElementById('play'), chord, startAudio);
