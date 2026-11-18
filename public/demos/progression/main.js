import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { EffectChain, EFFECTS } from '../../lib/audio/effects.js';
import { PROGRESSION_SETS, ProgressionPlayer, progressionSounds, transposeProgression, transposeSymbol, withSevenths, withoutTensions, withSwing } from '../../lib/audio/chords.js';
import { ROOTS, MINOR_ROOTS, parseNote } from '../../lib/audio/scales.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ProgressionView } from '../../lib/demo/ProgressionView.js';
import { ChordChart } from '../../lib/demo/ChordChart.js';
import { GrooveView } from '../../lib/demo/GrooveView.js';
import { addSelect, addReadout, addBeatSplit, addRange, addCheckbox, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which progressions to offer: ?set= names a set in PROGRESSION_SETS, and ?example= picks
// one progression from it (with no menu) or several (comma-separated, in that order). ?view=chart shows them as a chord chart
// instead of a piano roll, and ?view=groove the timing of every part (chords, bass, and
// each drum) as short strokes. ?key adds a Key select that moves the progressions to
// another key (?key=minor spells the keys as minor keys), and ?roots the same select
// labeled Root, for chords built on a root rather than progressions in a key. A set
// whose progressions have seventh chords gets a 7th toggle that switches to them, and
// one whose chords name their chord scales shows the scale over the sounding chord.
// A progression with `generate` (a function returning a new melody) gets a New line
// button that replaces its melody; one with `vary` changes on every pass. A set whose
// progressions are written in even eighths (`swing`) gets a Swing control for the timing
// of each pair. ?tempo adds a Tempo slider (BPM), which also changes the tempo while
// playing and keeps its value when another example is chosen.
// ?play is for playing along: the keyboard sits higher, a Phrase toggle turns the
// written melody off to leave a backing track, and a progression with a `playScale`
// shows only that scale's notes on the keyboard.
const params = new URLSearchParams(location.search);
const SET = PROGRESSION_SETS[params.get('set')] ?? PROGRESSION_SETS.diatonic;
const ONLY = (params.get('example')?.split(',') ?? []).map(id => SET.find(p => p.id === id)).filter(Boolean);
const PROGRESSIONS = ONLY.length ? ONLY : SET;
const movable = params.has('roots') || params.has('key');
const keyNames = params.get('key') === 'minor' ? MINOR_ROOTS : ROOTS;
let progressionId = PROGRESSIONS[0].id, root = PROGRESSIONS[0].key ?? 'C', sevenths = false, tensions = true, phrase = true;
// Where each pair of eighth notes falls, for a progression written in even eighths
// (`swing`, see withSwing); the Swing control moves it, and choosing an example resets it.
let swing = PROGRESSIONS[0].swing ?? null;
// The Tempo slider's value (?tempo), or null to play each progression at its own tempo.
let tempo = params.has('tempo') ? PROGRESSIONS[0].tempo : null;
const playAlong = params.has('play');
const View = { chart: ChordChart, groove: GrooveView }[params.get('view')] ?? ProgressionView;

const master = new MasterBus();

// A progression with `effects` ({ id: { key: value } }) plays through a lo-fi chain
// (bit crusher, filter, vibrato), set from it; the others leave the chain transparent.
// The chain exists only when one of the progressions on offer asks for it.
const FX_IDS = ['bitcrush', 'filter', 'vibrato'];
const fx = PROGRESSIONS.some(p => p.effects) ? new EffectChain(FX_IDS) : null;
fx?.output.connect(master.input);
const destination = fx ? fx.input : master.input;
// Likewise `drumEffects` for the drums alone, before they join the rest: compressed,
// saturated, crushed, filtered, and put in a small room, so they sound less raw.
const DRUM_FX_IDS = ['compressor', 'distortion', 'bitcrush', 'filter', 'reverb'];
const drumFx = PROGRESSIONS.some(p => p.drumEffects) ? new EffectChain(DRUM_FX_IDS) : null;
drumFx?.output.connect(destination);
const setChain = (chain, ids, settings = {}) => {
    if (!chain) return;
    for (const id of ids) {
        for (const param of EFFECTS.find(d => d.id === id).params) {
            chain.set(id, param.key, settings[id]?.[param.key] ?? param.value);
        }
    }
};
// And `chordEffects` for the chord instrument alone: wah-wahed, distorted (an overdriven
// guitar amp), crushed, filtered, widened, wobbled like worn tape, echoed, and given some
// room, as the progression sets them. The bass stays clean.
const CHORD_FX_IDS = ['autowah', 'distortion', 'bitcrush', 'filter', 'chorus', 'vibrato', 'delay', 'reverb'];
const chordFx = PROGRESSIONS.some(p => p.chordEffects) ? new EffectChain(CHORD_FX_IDS) : null;
chordFx?.output.connect(destination);
// And `melodyEffects` for the melody instrument alone, with a delay for echoes.
const MELODY_FX_IDS = ['bitcrush', 'filter', 'chorus', 'vibrato', 'delay', 'reverb'];
const melodyFx = PROGRESSIONS.some(p => p.melodyEffects) ? new EffectChain(MELODY_FX_IDS) : null;
melodyFx?.output.connect(destination);
function useEffects(progression) {
    setChain(fx, FX_IDS, progression.effects);
    setChain(drumFx, DRUM_FX_IDS, progression.drumEffects);
    setChain(chordFx, CHORD_FX_IDS, progression.chordEffects);
    setChain(melodyFx, MELODY_FX_IDS, progression.melodyEffects);
}

// Instruments by id, level, and part, created when a progression first asks for them
// (`sounds`). The chord and melody parts each get their own instance when there is a
// chain for them, so they can go through it; the drums go through the drum chain.
const instruments = new Map();
const partChains = { chords: chordFx, melody: melodyFx };
const instrument = ({ id, level = 0, part = '' }) => {
    const chain = partChains[part] ?? null;
    const key = `${id}@${level}${chain ? '@' + part : ''}`;
    if (!instruments.has(key)) {
        const to = chain ? chain.input : id === 'drums' && drumFx ? drumFx.input : destination;
        const created = createInstrument(id).connect(to);
        created.output.gain.value = 10 ** (level / 20);
        instruments.set(key, created);
    }
    return instruments.get(key);
};
const sounds = PROGRESSIONS.flatMap(p => Object.entries(progressionSounds(p))
    .filter(([, sound]) => sound).map(([part, sound]) => ({ ...sound, part })));
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
    // i is the riff note (drawn in the view), or -2 for a chord's held bass.
    onBass: (i, notes) => {
        bassNote = i === -1 ? null : notes[0];
        view.setBass?.(i);
        light();
    },
    onEnd: () => syncPlay?.(),
    // A progression with `vary` (a function returning new fields, such as chords and a
    // melody) changes on every pass: the next pass is swapped in as it is scheduled, and
    // the view follows when it starts.
    onLoop: seconds => {
        const base = PROGRESSIONS.find(p => p.id === progressionId);
        if (!base.vary) return;
        // A new object, not the old one changed in place: the view still draws the old
        // one (it may be the very same object) until the new pass starts.
        PROGRESSIONS[PROGRESSIONS.indexOf(base)] = { ...base, ...base.vary() };
        player.swap(currentProgression());
        const { progression, voicings } = player;
        setTimeout(() => view.update(progression, voicings), seconds * 1000);
    },
});

// Pressing a chord in the view plays it while held.
// ?bars=4 shows four bars (of 4/4) at a time in the piano roll, turning the page as it plays.
const view = new View(document.getElementById('canvas'), {
    pageBeats: params.has('bars') ? 4 * Number(params.get('bars')) : null,
    // For a view that follows playback itself (?view=groove).
    position: () => player.position(),
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
    const swung = base.swing ? withSwing(base, swing ?? base.swing) : base;
    const colored = tensions ? swung : withoutTensions(swung);
    const moved = transposeProgression(sevenths ? withSevenths(colored) : colored, target);
    if (playAlong) useKeyboardScale(moved.playScale);
    const timed = tempo ? { ...moved, tempo } : moved;
    return phrase ? timed : { ...timed, melody: [] };
}

function useProgression() {
    const progression = currentProgression();
    const parts = progressionSounds(progression);
    player.instrument = instrument({ ...parts.chords, part: 'chords' });
    player.melodyInstrument = instrument({ ...parts.melody, part: 'melody' });
    player.bassInstrument = parts.bass ? instrument(parts.bass) : null;
    useEffects(progression);
    player.setProgression(progression);
    view.update(player.progression, player.voicings);
    chordNotes = []; melodyNote = null; bassNote = null;
    light();
    syncPlay?.();
}

const controls = document.getElementById('controls');
// With a Swing control, the menu also has Custom, which it shows once a handle is
// dragged: the chosen example keeps playing, at the dragged timing.
const hasSwing = PROGRESSIONS.some(p => p.swing);
let exampleSelect = null;
if (PROGRESSIONS.length > 1) {
    exampleSelect = addSelect(controls, {
        label: 'Example',
        options: [...PROGRESSIONS.map(({ id, label }) => ({ value: id, label })),
            ...(hasSwing ? [{ value: 'custom', label: 'Custom' }] : [])],
        value: progressionId,
        onChange: id => {
            if (id === 'custom') return;
            progressionId = id;
            const { swing: timing } = PROGRESSIONS.find(p => p.id === id);
            if (timing) { swing = { ...timing }; swingSplit?.set(swing.first, swing.second); }
            useProgression();
        },
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
// The Swing control: one beat, with handles for where the two eighth notes of each pair
// fall (the first at or after the beat). Moving them while playing changes the timing at
// once, without restarting, and turns the Example menu to Custom.
let swingSplit = null;
if (hasSwing) {
    swingSplit = addBeatSplit(controls, {
        label: 'Swing', first: swing.first, second: swing.second,
        onChange: (first, second) => {
            swing = { first, second };
            if (exampleSelect) exampleSelect.value = 'custom';
            if (!player.playing) { useProgression(); return; }
            player.swap(currentProgression());
            view.update(player.progression, player.voicings);
        },
    });
}
if (tempo) {
    addRange(controls, {
        label: 'Tempo', min: 60, max: 280, step: 1, value: tempo,
        onChange: v => { tempo = v; player.setTempo(v); },
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
        if (!player.playing) { useProgression(); return; }
        player.swap(currentProgression());
        view.update(player.progression, player.voicings);
    });
    const divider = document.createElement('div');
    divider.className = 'dp-divider';
    controls.append(divider, toggle);
}
// A progression with `plain` chords (its chords without tensions) gets a Tensions
// checkbox, on by default; off, it plays the plain seventh chords.
if (PROGRESSIONS.some(p => p.plain)) {
    addCheckbox(controls, {
        label: 'Tensions', checked: true,
        onChange: on => {
            tensions = on;
            // While playing, the chords change from where playback is, without stopping.
            if (!player.playing) { useProgression(); return; }
            player.swap(currentProgression());
            view.update(player.progression, player.voicings);
        },
    });
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
