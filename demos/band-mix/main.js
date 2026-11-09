// The small band of the jazz demos, with an instrument, a volume, and an on/off toggle
// for each part (melody, backing, bass), over a few of the jazz examples.
import * as Tone from 'tone';
import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { INSTRUMENTS, createInstrument } from '../../lib/audio/instruments.js';
import { PROGRESSION_SETS, ProgressionPlayer, BAND_SOUNDS } from '../../lib/audio/chords.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { ProgressionView } from '../../lib/demo/ProgressionView.js';
import { addSelect, addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const EXAMPLES = [
    ['two-five-phrases', 'mixolydian', 'ii–V–I phrase'],
    ['chord-tones', 'enclosures', 'Turnaround, enclosures'],
    ['pentatonic', 'blues-minor', 'Blues, minor pentatonic'],
    ['modal', 'so-what', 'So What'],
    ['walking-bass', 'chord-tones', 'Walking bass'],
].map(([set, id, label]) => ({ ...PROGRESSION_SETS[set].find(p => p.id === id), label, key: id + set }));

const PITCHED = INSTRUMENTS.filter(d => !['Drums', 'Noise'].includes(d.group));
const master = new MasterBus();
const status = document.getElementById('status');

// One part: an instrument through its own volume, which can be muted.
function part(name, id, db = 0) {
    const volume = new Tone.Volume(db).connect(master.input);
    const p = { name, id, db, volume, instrument: null, on: true };
    p.use = next => {
        p.instrument?.dispose();
        p.id = next;
        p.instrument = createInstrument(next).connect(volume);
        status.textContent = 'Loading samples…';
        p.instrument.ready.then(() => { status.textContent = ''; }, () => { status.textContent = 'Could not load.'; });
        return p.instrument;
    };
    p.use(id);
    return p;
}
const levels = BAND_SOUNDS.levels ?? {};
const parts = {
    melody: part('Melody', BAND_SOUNDS.melody, levels.melody),
    backing: part('Backing', BAND_SOUNDS.chords, levels.chords),
    bass: part('Bass', BAND_SOUNDS.bass, levels.bass),
};
const drums = createInstrument('drums').connect(master.input);

let chordNotes = [], melodyNote = null, bassNote = null;
const light = () => keyboard.setLit([...chordNotes, melodyNote, bassNote].filter(n => n !== null));
const view = new ProgressionView(document.getElementById('canvas'));
const player = new ProgressionPlayer(parts.backing.instrument, {
    melodyInstrument: parts.melody.instrument, bassInstrument: parts.bass.instrument, drums,
    onChord: i => { view.setChord(i); chordNotes = i < 0 ? [] : player.chordNotes(i); light(); },
    onHit: k => { view.setHit(k); light(); },
    onMelody: i => { view.setNote(i); melodyNote = i < 0 ? null : player.progression.melody[i].midi; light(); },
    onBass: (i, notes) => { bassNote = i === -1 ? null : notes[0]; view.setBass(i); light(); },
});
const keyboard = new Keyboard(document.getElementById('keyboard'), {
    low: 36, octaves: 4,
    onNoteOn: midi => { startAudio(); parts.melody.instrument.noteOn(midi); },
    onNoteOff: midi => parts.melody.instrument.noteOff(midi),
});

let example = EXAMPLES[0];
function refresh(wasPlaying = player.playing) {
    player.instrument = parts.backing.instrument;
    // The walking bass example plays its line on the bass part.
    const bassLine = example.sounds?.melody === BAND_SOUNDS.bass;
    player.melodyInstrument = bassLine ? parts.bass.instrument : parts.melody.instrument;
    player.bassInstrument = bassLine ? null : parts.bass.instrument;
    player.setProgression(example);
    view.update(player.progression, player.voicings);
    if (wasPlaying) { startAudio(); player.start(); syncPlay?.(); }
}

const controls = document.getElementById('controls');
addSelect(controls, {
    label: 'Example', value: example.key,
    options: EXAMPLES.map(e => ({ value: e.key, label: e.label })),
    onChange: k => { example = EXAMPLES.find(e => e.key === k); refresh(); },
});
for (const p of Object.values(parts)) {
    const divider = document.createElement('div');
    divider.className = 'dp-divider';
    controls.append(divider);
    addSelect(controls, {
        label: p.name, value: p.id,
        options: PITCHED.map(({ id, label, group }) => ({ value: id, label, group })),
        // Stop first, so the player releases its notes before the old instrument goes.
        onChange: id => { const was = player.playing; player.stop(); p.use(id); refresh(was); },
    });
    addRange(controls, {
        label: 'Volume', min: -24, max: 12, step: 1, value: p.db, unit: 'dB',
        onChange: v => { p.volume.volume.value = v; },
    });
    const toggle = document.createElement('button');
    toggle.className = 'dp-toggle active';
    toggle.textContent = `${p.name} on`;
    toggle.addEventListener('click', () => {
        p.on = !p.on;
        p.volume.mute = !p.on;
        toggle.classList.toggle('active', p.on);
        toggle.textContent = `${p.name} ${p.on ? 'on' : 'off'}`;
    });
    controls.append(toggle);
}
unwrap(controls);

refresh();
const syncPlay = wirePlayButton(document.getElementById('play'), player, startAudio);
