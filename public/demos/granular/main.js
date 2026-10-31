import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { GranularSource, GRAIN_SOURCES } from '../../lib/audio/granular.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addRange, addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const grains = new GranularSource();
grains.output.connect(master.input);
new Scope(document.getElementById('canvas'), grains.output, { mode: 'both' });

// Empty unless a recording is loading or failed.
const status = document.getElementById('status');
const watch = ready => {
    status.textContent = 'Loading samples…';
    ready.then(() => { status.textContent = ''; },
               () => { status.textContent = 'The samples could not be loaded.'; });
};
watch(grains.ready);

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Sound',
    options: GRAIN_SOURCES.map(({ id, label }) => ({ value: id, label })),
    value: GRAIN_SOURCES[0].id,
    onChange: id => watch(grains.setSource(id)),
});
addRange(controls, {
    label: 'Rate', min: 0.05, max: 2, step: 0.01, value: 1, scale: 'log',
    onChange: v => { grains.rate = v; },
});
addRange(controls, {
    label: 'Pitch', min: -1200, max: 1200, step: 1, value: 0,
    onChange: v => { grains.detune = v; },
});
addRange(controls, {
    label: 'Grain', min: 0.01, max: 0.5, step: 0.001, value: grains.grainSize, unit: 's', scale: 'log',
    onChange: v => { grains.grainSize = v; },
});
addRange(controls, {
    label: 'Overlap', min: 0.005, max: 0.2, step: 0.001, value: grains.overlap, unit: 's', scale: 'log',
    onChange: v => { grains.overlap = v; },
});
unwrap(controls);

const reverse = document.getElementById('reverse');
reverse.addEventListener('click', () => {
    grains.reverse = !grains.reverse;
    reverse.classList.toggle('active', grains.reverse);
});

wirePlayButton(document.getElementById('play'), grains, startAudio);
