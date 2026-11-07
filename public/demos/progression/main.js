import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { PROGRESSION_SETS, ProgressionPlayer, transposeProgression } from '../../lib/audio/chords.js';
import { ROOTS, MINOR_ROOTS } from '../../lib/audio/scales.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ProgressionView } from '../../lib/demo/ProgressionView.js';
import { ChordChart } from '../../lib/demo/ChordChart.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which progressions to offer: ?set= names a set in PROGRESSION_SETS, and ?example= picks
// one progression from it (with no menu). ?view=chart shows them as a chord chart
// instead of a piano roll. ?key adds a Key select that moves the progressions to
// another key (?key=minor spells the keys as minor keys), and ?roots the same select
// labeled Root, for chords built on a root rather than progressions in a key.
const params = new URLSearchParams(location.search);
const SET = PROGRESSION_SETS[params.get('set')] ?? PROGRESSION_SETS.diatonic;
const ONLY = SET.filter(p => p.id === params.get('example'));
const PROGRESSIONS = ONLY.length ? ONLY : SET;
const movable = params.has('roots') || params.has('key');
const keyNames = params.get('key') === 'minor' ? MINOR_ROOTS : ROOTS;
let progressionId = PROGRESSIONS[0].id, root = PROGRESSIONS[0].key ?? 'C';
const View = params.get('view') === 'chart' ? ChordChart : ProgressionView;

const master = new MasterBus();

// Instruments by id, created when a progression first asks for them (`sounds`).
const instruments = new Map();
const instrument = id => {
    if (!instruments.has(id)) instruments.set(id, createInstrument(id).connect(master.input));
    return instruments.get(id);
};
const sounds = PROGRESSIONS.flatMap(p => [p.sounds?.chords ?? 'piano', p.sounds?.melody ?? p.sounds?.chords ?? 'piano']);
if (PROGRESSIONS.some(p => p.drums)) sounds.push('drums');

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
Promise.all([...new Set(sounds)].map(id => instrument(id).ready)).then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

// Set once the Play button is wired; returns its label to Play when playback ends.
let syncPlay = null;

// What the keyboard shows: the sounding chord, melody note, and riff note.
let chordNotes = [], melodyNote = null, bassNote = null, chord = -1;
const light = () => keyboard.setLit([...chordNotes, melodyNote, bassNote].filter(n => n !== null));

const player = new ProgressionPlayer(instrument('piano'), {
    drums: PROGRESSIONS.some(p => p.drums) ? instrument('drums') : null,
    onChord: i => {
        chord = i;
        view.setChord(i);
        chordNotes = i < 0 ? [] : player.chordNotes(i);
        light();
    },
    onMelody: i => {
        view.setNote(i);
        melodyNote = i < 0 ? null : player.progression.melody[i].midi;
        light();
    },
    onHit: k => {
        view.setHit(k);
        chordNotes = k < 0 || chord < 0 ? [] : player.hits[chord][k].notes;
        light();
    },
    onBass: midi => {
        bassNote = midi < 0 ? null : midi;
        light();
    },
    onEnd: () => syncPlay?.(),
});

// Pressing a chord in the view plays it while held.
const view = new View(document.getElementById('canvas'), {
    onPress: i => {
        startAudio();
        chordNotes = player.voicings[i].notes;
        chordNotes.forEach(midi => player.instrument.noteOn(midi, 0.5));
        view.setChord(i);
        light();
    },
    onRelease: i => {
        player.voicings[i].notes.forEach(midi => player.instrument.noteOff(midi));
        chordNotes = [];
        view.setChord(-1);
        light();
    },
});

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 36, octaves: 4,
    onNoteOn: midi => { startAudio(); player.instrument.noteOn(midi); },
    onNoteOff: midi => player.instrument.noteOff(midi),
});

function useProgression() {
    const progression = transposeProgression(PROGRESSIONS.find(p => p.id === progressionId), root);
    player.instrument = instrument(progression.sounds?.chords ?? 'piano');
    player.melodyInstrument = instrument(progression.sounds?.melody ?? progression.sounds?.chords ?? 'piano');
    player.setProgression(progression);
    view.update(player.progression, player.voicings);
    chordNotes = []; melodyNote = null; bassNote = null;
    light();
    syncPlay?.();
}

const controls = document.getElementById('controls');
if (PROGRESSIONS.length > 1) {
    addSelect(controls, {
        label: 'Example',
        options: PROGRESSIONS.map(({ id, label }) => ({ value: id, label })),
        value: progressionId,
        onChange: id => { progressionId = id; useProgression(); },
    });
}
if (movable) {
    addSelect(controls, {
        label: params.has('key') ? 'Key' : 'Root',
        options: keyNames.map(name => ({ value: name, label: name })),
        value: root,
        onChange: name => { root = name; useProgression(); },
    });
}
unwrap(controls);

useProgression();
syncPlay = wirePlayButton(document.getElementById('play'), player, startAudio);
