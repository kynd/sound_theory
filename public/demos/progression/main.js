import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { PROGRESSION_SETS, ProgressionPlayer, progressionSounds, transposeProgression, transposeSymbol, withSevenths } from '../../lib/audio/chords.js';
import { ROOTS, MINOR_ROOTS, parseNote } from '../../lib/audio/scales.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ProgressionView } from '../../lib/demo/ProgressionView.js';
import { ChordChart } from '../../lib/demo/ChordChart.js';
import { addSelect, addReadout, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which progressions to offer: ?set= names a set in PROGRESSION_SETS, and ?example= picks
// one progression from it (with no menu) or several (comma-separated, in that order). ?view=chart shows them as a chord chart
// instead of a piano roll. ?key adds a Key select that moves the progressions to
// another key (?key=minor spells the keys as minor keys), and ?roots the same select
// labeled Root, for chords built on a root rather than progressions in a key. A set
// whose progressions have seventh chords gets a 7th toggle that switches to them, and
// one whose chords name their chord scales shows the scale over the sounding chord.
// A progression with `generate` (a function returning a new melody) gets a New line
// button that replaces its melody; one with `vary` changes on every pass.
// ?play is for playing along: the keyboard sits higher, a Phrase toggle turns the
// written melody off to leave a backing track, and a progression with a `playScale`
// shows only that scale's notes on the keyboard.
const params = new URLSearchParams(location.search);
const SET = PROGRESSION_SETS[params.get('set')] ?? PROGRESSION_SETS.diatonic;
const ONLY = (params.get('example')?.split(',') ?? []).map(id => SET.find(p => p.id === id)).filter(Boolean);
const PROGRESSIONS = ONLY.length ? ONLY : SET;
const movable = params.has('roots') || params.has('key');
const keyNames = params.get('key') === 'minor' ? MINOR_ROOTS : ROOTS;
let progressionId = PROGRESSIONS[0].id, root = PROGRESSIONS[0].key ?? 'C', sevenths = false, phrase = true;
const playAlong = params.has('play');
const View = params.get('view') === 'chart' ? ChordChart : ProgressionView;

const master = new MasterBus();

// Instruments by id and level, created when a progression first asks for them (`sounds`).
const instruments = new Map();
const instrument = ({ id, level = 0 }) => {
    const key = `${id}@${level}`;
    if (!instruments.has(key)) {
        const created = createInstrument(id).connect(master.input);
        created.output.gain.value = 10 ** (level / 20);
        instruments.set(key, created);
    }
    return instruments.get(key);
};
const sounds = PROGRESSIONS.flatMap(p => Object.values(progressionSounds(p)).filter(Boolean));
if (PROGRESSIONS.some(p => p.drums)) sounds.push({ id: 'drums' });

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
Promise.all(sounds.map(sound => instrument(sound).ready)).then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

// Set once the Play button is wired; returns its label to Play when playback ends.
let syncPlay = null;

// What the keyboard shows: the sounding chord, melody note, and riff note.
let chordNotes = [], melodyNote = null, bassNote = null, chord = -1;
const light = () => keyboard.setLit([...chordNotes, melodyNote, bassNote].filter(n => n !== null));

const player = new ProgressionPlayer(instrument({ id: 'piano' }), {
    drums: PROGRESSIONS.some(p => p.drums) ? instrument({ id: 'drums' }) : null,
    onChord: i => {
        chord = i;
        showScale(i);
        view.setChord(i);
        chordNotes = i < 0 ? [] : player.chordNotes(i);
        light();
    },
    // The notes come with each event, so they stay right across a swap (`vary`).
    onMelody: (i, notes) => {
        view.setNote(i);
        melodyNote = i < 0 ? null : notes[0];
        light();
    },
    onHit: (k, notes) => {
        view.setHit(k);
        chordNotes = k < 0 || chord < 0 ? [] : notes;
        light();
    },
    onBass: midi => {
        bassNote = midi < 0 ? null : midi;
        light();
    },
    onEnd: () => syncPlay?.(),
    // A progression with `vary` (a function returning new fields, such as chords and a
    // melody) changes on every pass: the next pass is swapped in as it is scheduled, and
    // the view follows when it starts.
    onLoop: seconds => {
        const base = PROGRESSIONS.find(p => p.id === progressionId);
        if (!base.vary) return;
        Object.assign(base, base.vary());
        player.swap(currentProgression());
        const { progression, voicings } = player;
        setTimeout(() => view.update(progression, voicings), seconds * 1000);
    },
});

// Pressing a chord in the view plays it while held.
const view = new View(document.getElementById('canvas'), {
    onPress: i => {
        startAudio();
        chordNotes = player.voicings[i].notes;
        chordNotes.forEach(midi => player.instrument.noteOn(midi, 0.5));
        showScale(i);
        view.setChord(i);
        light();
    },
    onRelease: i => {
        player.voicings[i].notes.forEach(midi => player.instrument.noteOff(midi));
        chordNotes = [];
        view.setChord(-1);
        showScale(-1);
        light();
    },
});

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: playAlong ? 48 : 36, octaves: playAlong ? 3 : 4,
    onNoteOn: midi => { startAudio(); player.melodyInstrument.noteOn(midi); },
    onNoteOff: midi => player.melodyInstrument.noteOff(midi),
});

/** Shows only a progression's `playScale` on the keyboard, its first note as the root. */
function useKeyboardScale(scale) {
    if (!scale) { keyboard.setScale(null); keyboard.setRoot(null); return; }
    const pcOf = name => ((parseNote(name).semitones % 12) + 12) % 12;
    const names = {};
    for (const name of scale) names[pcOf(name)] = name;
    keyboard.setScale(Object.keys(names).map(Number), names);
    keyboard.setRoot(pcOf(scale[0]));
}

/** The chosen progression, in the chosen key, with sevenths and melody as toggled. */
function currentProgression() {
    const base = PROGRESSIONS.find(p => p.id === progressionId);
    // The Key select names the first example's key; others written in another key (A
    // minor beside C major) move by the same interval.
    const firstKey = PROGRESSIONS[0].key ?? 'C';
    const target = transposeSymbol(base.key ?? 'C', firstKey, root);
    const moved = transposeProgression(sevenths ? withSevenths(base) : base, target);
    if (playAlong) useKeyboardScale(moved.playScale);
    return phrase ? moved : { ...moved, melody: [] };
}

function useProgression() {
    const progression = currentProgression();
    const parts = progressionSounds(progression);
    player.instrument = instrument(parts.chords);
    player.melodyInstrument = instrument(parts.melody);
    player.bassInstrument = parts.bass ? instrument(parts.bass) : null;
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
// The chord scale over the sounding chord, named from the chord's root ("G altered").
let showScale = () => {};
if (PROGRESSIONS.some(p => p.chords.some(c => c.scale))) {
    const setScale = addReadout(controls, { label: 'Scale' });
    showScale = i => {
        const c = i >= 0 ? player.progression.chords[i] : null;
        setScale(c?.scale ? `${c.scaleRoot ?? c.symbol.match(/^[A-G][♭♯]?/)[0]} ${c.scale}` : '');
    };
}
if (PROGRESSIONS.some(p => p.sevenths)) {
    const toggle = document.createElement('button');
    toggle.className = 'dp-toggle';
    toggle.textContent = '7th';
    toggle.addEventListener('click', () => {
        sevenths = !sevenths;
        toggle.classList.toggle('active', sevenths);
        useProgression();
    });
    const divider = document.createElement('div');
    divider.className = 'dp-divider';
    controls.append(divider, toggle);
}
if (PROGRESSIONS.some(p => p.generate)) {
    const button = document.createElement('button');
    button.className = 'dp-btn';
    button.textContent = 'New line';
    button.addEventListener('click', () => {
        const base = PROGRESSIONS.find(p => p.id === progressionId);
        if (!base.generate) return;
        const wasPlaying = player.playing;
        base.melody = base.generate();
        useProgression();
        if (wasPlaying) { startAudio(); player.start(); syncPlay?.(); }
    });
    const divider = document.createElement('div');
    divider.className = 'dp-divider';
    controls.append(divider, button);
}
if (playAlong && PROGRESSIONS.some(p => p.melody?.length)) {
    const toggle = document.createElement('button');
    toggle.className = 'dp-toggle active';
    toggle.textContent = 'Phrase';
    toggle.addEventListener('click', () => {
        phrase = !phrase;
        toggle.classList.toggle('active', phrase);
        useProgression();
    });
    const divider = document.createElement('div');
    divider.className = 'dp-divider';
    controls.append(divider, toggle);
}
unwrap(controls);

useProgression();
syncPlay = wirePlayButton(document.getElementById('play'), player, startAudio);
