import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { PROGRESSION_SETS, ProgressionPlayer } from '../../lib/audio/chords.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ProgressionView } from '../../lib/demo/ProgressionView.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which progressions to offer: ?set= names a set in PROGRESSION_SETS.
const PROGRESSIONS = PROGRESSION_SETS[new URLSearchParams(location.search).get('set')] ?? PROGRESSION_SETS.diatonic;

const master = new MasterBus();
const piano = createInstrument('piano').connect(master.input);

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
piano.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

// Set once the Play button is wired; returns its label to Play when playback ends.
let syncPlay = null;

// What the keyboard shows: the sounding chord and melody note.
let chordNotes = [], melodyNote = null;
const light = () => keyboard.setLit(melodyNote === null ? chordNotes : [...chordNotes, melodyNote]);

const player = new ProgressionPlayer(piano, {
    onChord: i => {
        view.setChord(i);
        chordNotes = i < 0 ? [] : player.voicings[i].notes;
        light();
    },
    onMelody: i => {
        view.setNote(i);
        melodyNote = i < 0 ? null : player.progression.melody[i].midi;
        light();
    },
    onEnd: () => syncPlay?.(),
});

// Pressing a chord in the roll plays it while held.
const view = new ProgressionView(document.getElementById('canvas'), {
    onPress: i => {
        startAudio();
        chordNotes = player.voicings[i].notes;
        chordNotes.forEach(midi => piano.noteOn(midi, 0.5));
        view.setChord(i);
        light();
    },
    onRelease: i => {
        player.voicings[i].notes.forEach(midi => piano.noteOff(midi));
        chordNotes = [];
        view.setChord(-1);
        light();
    },
});

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 36, octaves: 4,
    onNoteOn: midi => { startAudio(); piano.noteOn(midi); },
    onNoteOff: midi => piano.noteOff(midi),
});

function useProgression(id) {
    player.setProgression(PROGRESSIONS.find(p => p.id === id));
    view.update(player.progression, player.voicings);
    chordNotes = []; melodyNote = null;
    light();
    syncPlay?.();
}

const controls = document.getElementById('controls');
if (PROGRESSIONS.length > 1) {
    addSelect(controls, {
        label: 'Example',
        options: PROGRESSIONS.map(({ id, label }) => ({ value: id, label })),
        value: PROGRESSIONS[0].id,
        onChange: useProgression,
    });
}
unwrap(controls);

useProgression(PROGRESSIONS[0].id);
syncPlay = wirePlayButton(document.getElementById('play'), player, startAudio);
