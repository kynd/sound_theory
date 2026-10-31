import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { WHITE_KEY_MODES, parseNote, rootMidi } from '../../lib/audio/scales.js';
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
// White keys from C4; the bass root sounds an octave or more below them, in octave 3.
const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 60, octaves: 2, whiteOnly: true, onNoteOn: play, onNoteOff: release,
});
// The root in the bass, twice a second, until stopped.
const drone = new Sequence(instrument, { step: 0.5, gate: 0.9, loop: true, velocity: 0.7 });

function useMode(id) {
    const mode = WHITE_KEY_MODES.find(m => m.id === id);
    drone.notes = [rootMidi(mode, 3)];
    view.update(mode);
    keyboard.setRoot(parseNote(mode.root).semitones);
}

const modeControls = document.getElementById('mode-controls');
addSelect(modeControls, {
    label: 'Mode',
    options: WHITE_KEY_MODES.map(({ id, label }) => ({ value: id, label })),
    value: WHITE_KEY_MODES[0].id,
    onChange: useMode,
});
unwrap(modeControls);

useMode(WHITE_KEY_MODES[0].id);
wirePlayButton(document.getElementById('play'), drone, startAudio);
