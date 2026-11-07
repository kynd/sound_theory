import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { INSTRUMENTS, SYNTH_ENGINES, SynthEngine, createInstrument } from '../../lib/audio/instruments.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addSelect, addRange, addEffectControls, unwrap } from '../../lib/demo/controls.js';

// What to offer: ?engine= names one synth engine or several (comma-separated, offered
// in a select) with sliders for their parameters; ?presets offers the instrument
// presets instead; ?effects= names the effects in the chain, in signal order.
const params = new URLSearchParams(location.search);
const engineIds = params.get('engine')?.split(',') ?? [];
const effectIds = params.get('effects')?.split(',') ?? [];

const master = new MasterBus();
const effects = new EffectChain(effectIds).connect(master.input);
const scope = new Scope(document.getElementById('canvas'), effects.output);

// Empty unless something is loading or failed.
const status = document.getElementById('status');
let instrument = null;

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 48, octaves: 2,
    // Not awaited: the note must be scheduled before its noteOff can arrive.
    onNoteOn: midi => { startAudio(); instrument.noteOn(midi); },
    onNoteOff: midi => instrument.noteOff(midi),
});

async function use(next) {
    keyboard.releaseAll();
    instrument?.dispose();
    instrument = next.connect(effects.input);
    keyboard.setPads(next.pads);
    status.textContent = 'Loading samples…';
    try {
        await next.ready;
        if (instrument === next) status.textContent = '';
    } catch {
        if (instrument === next) status.textContent = 'The samples could not be loaded.';
    }
}

// The engine's parameters, rebuilt whenever the engine changes.
const engineControls = document.getElementById('engine-controls');
function useEngine(id) {
    const engine = new SynthEngine(id);
    use(engine);
    engineControls.replaceChildren();
    for (const param of engine.def.params) {
        if (param.options) {
            addSelect(engineControls, {
                label: param.label, value: param.value,
                options: param.options.map(value => ({ value, label: value })),
                onChange: v => engine.set(param.key, v),
            });
        } else {
            addRange(engineControls, { ...param, value: engine.get(param.key), onChange: v => engine.set(param.key, v) });
        }
    }
}

const soundControls = document.getElementById('sound-controls');
if (engineIds.length > 1) {
    addSelect(soundControls, {
        label: 'Engine',
        options: engineIds.map(id => ({ value: id, label: SYNTH_ENGINES.find(d => d.id === id).label })),
        value: engineIds[0],
        onChange: useEngine,
    });
}
if (params.has('presets')) {
    addSelect(soundControls, {
        label: 'Preset',
        options: INSTRUMENTS.filter(d => d.group !== 'Drums' && d.group !== 'Noise')
            .map(({ id, label, group }) => ({ value: id, label, group })),
        value: 'guitar',
        onChange: id => use(createInstrument(id)),
    });
}
unwrap(soundControls);
if (!effectIds.length) document.getElementById('effects-divider').remove();
const effectControls = document.getElementById('effect-controls');
addEffectControls(effectControls, effects, { collapsed: effectIds.length > 2 });
unwrap(effectControls);

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
        scope.mode = button.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b === button));
    });
});

if (engineIds.length) useEngine(engineIds[0]);
else use(createInstrument('guitar'));
