import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { GENERA } from '../../lib/audio/scales.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { TetrachordView } from '../../lib/demo/TetrachordView.js';
import { addRange, addSelect, setRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// A tetrachord from B3 to E4, its outer notes fixed and its two inner notes movable:
// a genus sets them, and the Lower and Upper sliders move them anywhere between, in
// cents above B. Play runs it down from E to B, the Greek way, and back up. Notes
// between the keys are played as fractional MIDI numbers.
const LOW = 59;   // B3
const OTHER = 'other';
let cents = [...GENERA[0].cents];

const master = new MasterBus();
const instrument = createInstrument('harp').connect(master.input);

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
instrument.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

const midiOf = i => LOW + cents[i] / 100;
const view = new TetrachordView(document.getElementById('canvas'), {
    names: ['B', 'C', 'C♯', 'D', 'D♯', 'E'],
    onNoteOn: i => { startAudio(); instrument.noteOn(midiOf(i)); },
    onNoteOff: i => instrument.noteOff(midiOf(i)),
});

// Down from the top note to the bottom and back up.
const ORDER = [3, 2, 1, 0, 1, 2, 3];
const sequence = new Sequence(instrument, {
    step: 0.5,
    onStep: i => view.setSounding(i < 0 ? null : ORDER[i]),
});

function apply() {
    sequence.notes = ORDER.map(midiOf);
    view.update(cents);
    const genus = GENERA.find(g => g.cents.every((c, i) => c === cents[i]));
    select.value = genus ? genus.id : OTHER;
}

const controls = document.getElementById('controls');
const select = addSelect(controls, {
    label: 'Genus',
    options: [...GENERA.map(({ id, label }) => ({ value: id, label })), { value: OTHER, label: 'Other' }],
    value: GENERA[0].id,
    onChange: id => {
        if (id === OTHER) return;
        cents = [...GENERA.find(g => g.id === id).cents];
        setRange(lower, cents[1]);
        setRange(upper, cents[2]);
        apply();
    },
});
// The inner notes, in cents above B. They never cross: moving one past the other
// takes the other with it.
const lower = addRange(controls, {
    label: 'Lower', min: 10, max: 250, step: 1, value: cents[1],
    onChange: v => {
        cents[1] = v;
        if (cents[2] < v) { cents[2] = v; setRange(upper, v); }
        apply();
    },
});
const upper = addRange(controls, {
    label: 'Upper', min: 10, max: 450, step: 1, value: cents[2],
    onChange: v => {
        cents[2] = v;
        if (cents[1] > v) { cents[1] = v; setRange(lower, v); }
        apply();
    },
});
unwrap(controls);

apply();
wirePlayButton(document.getElementById('play'), sequence, startAudio);
