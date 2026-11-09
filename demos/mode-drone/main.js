import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { ROOTS, majorKeyModes, parseNote, rootMidi } from '../../lib/audio/scales.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ScaleView } from '../../lib/demo/ScaleView.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
const instrument = createInstrument('piano').connect(master.input);

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
instrument.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

const play = midi => { startAudio(); instrument.noteOn(midi); view.setSounding(midi); };
const release = midi => { instrument.noteOff(midi); view.setSounding(null); };

const view = new ScaleView(document.getElementById('canvas'), { onNoteOn: play, onNoteOff: release });
// The notes of the key from C4 (the white keys in C); the bass root sounds an octave or
// more below them, in octave 3.
const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 60, octaves: 2, whiteOnly: true, onNoteOn: play, onNoteOff: release,
});
// The root in the bass, twice a second, until stopped.
const drone = new Sequence(instrument, { step: 0.5, gate: 0.9, loop: true, velocity: 0.7 });

// The seven modes of the chosen major key, and which one is playing.
let modes = majorKeyModes('C'), modeId = modes[0].id;

function useMode() {
    const mode = modes.find(m => m.id === modeId);
    drone.notes = [rootMidi(mode, 3)];
    view.update(mode);
    keyboard.setRoot(((parseNote(mode.root).semitones % 12) + 12) % 12);
}

function useKey(key) {
    modes = majorKeyModes(key);
    [...modeSelect.options].forEach((option, i) => { option.textContent = modes[i].label; });
    // The keyboard shows the key's seven notes, named as the key spells them.
    const names = [];
    for (const name of modes[0].notes) names[((parseNote(name).semitones % 12) + 12) % 12] = name;
    keyboard.setScale(Object.keys(names).map(Number), names);
    useMode();
}

const modeControls = document.getElementById('mode-controls');
const modeSelect = addSelect(modeControls, {
    label: 'Mode',
    options: modes.map(({ id, label }) => ({ value: id, label })),
    value: modeId,
    onChange: id => { modeId = id; useMode(); },
});
addSelect(modeControls, {
    label: 'Key',
    options: ROOTS.map(name => ({ value: name, label: name })),
    value: 'C',
    onChange: useKey,
});
unwrap(modeControls);

useKey('C');
wirePlayButton(document.getElementById('play'), drone, startAudio);
