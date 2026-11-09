import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { INSTRUMENTS, createInstrument } from '../../lib/audio/instruments.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addSelect, addRange, unwrap } from '../../lib/demo/controls.js';

const master = new MasterBus();
const bus = master.input;
new Scope(document.getElementById('canvas'), bus, { mode: 'both' });

// Empty unless something is loading or failed; the page text explains how to play.
const status = document.getElementById('status');
let instrument = null;

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 48, octaves: 2,
    // Not awaited: the note must be scheduled before its noteOff can arrive.
    onNoteOn: midi => { startAudio(); instrument.noteOn(midi); },
    onNoteOff: midi => instrument.noteOff(midi),
});

async function useInstrument(id) {
    keyboard.releaseAll();
    instrument?.dispose();
    const next = createInstrument(id).connect(bus);
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

// Recorded and synthesized instruments, and noise: sounds whose spectra are worth
// comparing. The plain waveforms have their own demos on the page.
const GROUPS = ['Sampled', 'Drums', 'Noise'];
const soundControls = document.getElementById('sound-controls');
addSelect(soundControls, {
    label: 'Preset',
    options: INSTRUMENTS.filter(d => GROUPS.includes(d.group))
        .map(({ id, label, group }) => ({ value: id, label, group })),
    value: 'piano',
    onChange: useInstrument,
});
addRange(soundControls, {
    label: 'Volume', min: -40, max: 0, step: 1, value: master.volume, unit: 'dB',
    onChange: v => { master.volume = v; },
});

unwrap(soundControls);

useInstrument('piano');
