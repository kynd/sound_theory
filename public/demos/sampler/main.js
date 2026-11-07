import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { SAMPLE_SOURCES, loadSample, MicRecorder, SliceLooper } from '../../lib/audio/sampler.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { SampleView } from '../../lib/demo/SampleView.js';
import { addRange, addSelect, addEffectControls, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// A recording (a file or the microphone) played slice by slice through effects.
// Without parameters it is a sampler: speed, direction, fades, and chopping. With
// ?mode=skip it stutters and jumps through many short slices, like a skipping CD.
const skip = new URLSearchParams(location.search).get('mode') === 'skip';
const MAX_RECORDING = 10;   // seconds

const master = new MasterBus();
const chain = new EffectChain(skip ? ['filter', 'delay', 'reverb'] : ['distortion', 'filter', 'delay', 'reverb']);
chain.connect(master.input);
const view = new SampleView(document.getElementById('canvas'));
const looper = new SliceLooper(skip
    ? { slices: 32, repeat: 0.5, jump: 0.3, reverse: 0.1, spread: 0.5, attack: 0.002, release: 0.004 }
    : { slices: 1 });
looper.output.connect(chain.input);
looper.onSlice = (i, reversed) => view.setSlice(i, reversed);

// Empty unless something is loading, recording, or failed.
const status = document.getElementById('status');
const buffers = new Map();
let recorded = null;

function useBuffer(buffer) {
    looper.setBuffer(buffer);
    view.update(buffer, looper.slices);
}

function useSource(id) {
    if (id === 'recording') { useBuffer(recorded); return; }
    if (!buffers.has(id)) buffers.set(id, loadSample(id));
    status.textContent = 'Loading samples…';
    buffers.get(id).then(buffer => { status.textContent = ''; useBuffer(buffer); },
        () => { status.textContent = 'The samples could not be loaded.'; });
}

const controls = document.getElementById('controls');
const options = SAMPLE_SOURCES.map(({ id, label }) => ({ value: id, label }));
const select = addSelect(controls, {
    label: 'Sound', options, value: SAMPLE_SOURCES[skip ? 1 : 0].id, onChange: useSource,
});

// Record: press to start, press again (or wait ten seconds) to stop. The recording
// becomes "Recording" in the Sound menu.
const mic = new MicRecorder();
const record = document.createElement('button');
record.className = 'dp-toggle dp-record';
record.textContent = 'Record';
let timeout = null;
async function stopRecording() {
    clearTimeout(timeout);
    record.classList.remove('active');
    record.textContent = 'Record';
    status.textContent = '';
    recorded = await mic.stop();
    if (![...select.options].some(o => o.value === 'recording')) {
        const option = document.createElement('option');
        option.value = 'recording';
        option.textContent = 'Recording';
        select.append(option);
    }
    select.value = 'recording';
    useSource('recording');
}
record.addEventListener('click', async () => {
    if (mic.recording) { stopRecording(); return; }
    startAudio();
    try {
        await mic.start();
    } catch {
        status.textContent = 'The microphone is not available.';
        return;
    }
    record.classList.add('active');
    record.textContent = 'Stop recording';
    status.textContent = 'Recording…';
    timeout = setTimeout(stopRecording, MAX_RECORDING * 1000);
});
controls.append(record);
const divider = () => { const d = document.createElement('div'); d.className = 'dp-divider'; controls.append(d); };
divider();

const slider = (label, key, opts) => addRange(controls, {
    label, value: looper[key], ...opts,
    onChange: v => { looper[key] = v; if (key === 'slices') view.update(looper.buffer, v); },
});
if (skip) {
    slider('Slices', 'slices', { min: 4, max: 64, step: 1 });
    slider('Repeat', 'repeat', { min: 0, max: 0.95, step: 0.01 });
    slider('Jump', 'jump', { min: 0, max: 1, step: 0.01 });
    slider('Reverse', 'reverse', { min: 0, max: 1, step: 0.01 });
    slider('Speed', 'rate', { min: 0.25, max: 4, step: 0.01, scale: 'log' });
    slider('Spread', 'spread', { min: 0, max: 1, step: 0.01 });
} else {
    slider('Speed', 'rate', { min: 0.25, max: 4, step: 0.01, scale: 'log' });
    slider('Attack', 'attack', { min: 0.001, max: 2, step: 0.001, unit: 's', scale: 'log' });
    slider('Release', 'release', { min: 0.001, max: 2, step: 0.001, unit: 's', scale: 'log' });
    slider('Slices', 'slices', { min: 1, max: 16, step: 1 });
    const toggle = (label, key) => {
        const button = document.createElement('button');
        button.className = 'dp-toggle';
        button.textContent = label;
        button.addEventListener('click', () => {
            looper[key] = looper[key] ? 0 : 1;
            button.classList.toggle('active', Boolean(looper[key]));
        });
        controls.append(button);
    };
    divider();
    toggle('Reverse', 'reverse');
    toggle('Shuffle', 'jump');
}
divider();
addEffectControls(controls, chain, { collapsed: true });
unwrap(controls);

useSource(select.value);
wirePlayButton(document.getElementById('play'), looper, startAudio);
