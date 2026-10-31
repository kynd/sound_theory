import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { INSTRUMENTS, createInstrument } from '../../lib/audio/instruments.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addSelect, addRange, addEffectControls, unwrap } from '../../lib/demo/controls.js';

const master = new MasterBus();
const effects = new EffectChain().connect(master.input);
const scope = new Scope(document.getElementById('canvas'), effects.output);

// Empty unless something is loading or failed; the page text explains how to play.
const status = document.getElementById('status');
let instrument = null;

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 60, octaves: 2,
    // Not awaited: the note must be scheduled before its noteOff can arrive.
    onNoteOn: midi => { startAudio(); instrument.noteOn(midi); },
    onNoteOff: midi => instrument.noteOff(midi),
});

async function useInstrument(id) {
    keyboard.releaseAll();
    instrument?.dispose();
    const next = createInstrument(id).connect(effects.input);
    instrument = next;
    keyboard.setPads(next.pads);
    status.textContent = 'Loading samples…';
    try {
        await next.ready;
        if (instrument === next) status.textContent = '';
    } catch {
        if (instrument === next) status.textContent = 'The samples could not be loaded.';
    }
}

const soundControls = document.getElementById('sound-controls');
addSelect(soundControls, {
    label: 'Preset',
    options: INSTRUMENTS.map(({ id, label, group }) => ({ value: id, label, group })),
    value: 'sine',
    onChange: useInstrument,
});
addRange(soundControls, {
    label: 'Volume', min: -40, max: 0, step: 1, value: master.volume, unit: 'dB',
    onChange: v => { master.volume = v; },
});
const effectControls = document.getElementById('effect-controls');
addEffectControls(effectControls, effects);
unwrap(soundControls);
unwrap(effectControls);

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
        scope.mode = button.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b === button));
    });
});

useInstrument('sine');
