import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { SCALE_SETS, ROOTS, MINOR_ROOTS, findScale, majorKeyModes, scaleRun, transposeBy } from '../../lib/audio/scales.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { ScaleView } from '../../lib/demo/ScaleView.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which scales to offer: ?set= names a set in SCALE_SETS (default `scales`), offered in
// a select; ?scale= names one scale, shown with no select. ?roots adds a Root select
// that moves the scale to another starting note; ?roots=minor makes it a Key select
// with the spellings of minor keys, for minor scales. ?keys offers the seven modes of a
// major key, with a Key select that picks the key.
const params = new URLSearchParams(location.search);
const movable = params.has('roots');
const minorRoots = params.get('roots') === 'minor';
const keyed = params.has('keys');
const single = findScale(params.get('scale'));
let SCALES = keyed ? majorKeyModes('C') : single ? [single] : SCALE_SETS[params.get('set')] ?? SCALE_SETS.scales;

const master = new MasterBus();
const instrument = createInstrument('piano').connect(master.input);

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
instrument.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

const view = new ScaleView(document.getElementById('canvas'), {
    onNoteOn: midi => { startAudio(); instrument.noteOn(midi); },
    onNoteOff: midi => instrument.noteOff(midi),
});

// Up the scale to the octave and back down.
const sequence = new Sequence(instrument, {
    onStep: (i, midi) => view.setSounding(midi, i < 0 ? null : i),
    onEnd: () => syncPlay?.(),
});

let scaleId = SCALES[0].id, root = 'C';

function useScale() {
    sequence.stop();
    const base = SCALES.find(s => s.id === scaleId);
    // The Root select moves every scale of the set by the interval from C to the chosen
    // root, so a scale written on another root (the Lydian 7th a tritone above the
    // altered scale) keeps its distance. Without it, scales keep their own roots.
    const scale = movable && root !== 'C' ? transposeBy(base, 'C', root) : base;
    sequence.notes = scaleRun(scale).map(n => n.midi);
    view.update(scale);
}

const scaleControls = document.getElementById('scale-controls');
let scaleSelect = null;
if (SCALES.length > 1) {
    scaleSelect = addSelect(scaleControls, {
        label: 'Scale',
        options: SCALES.map(({ id, label }) => ({ value: id, label })),
        value: scaleId,
        onChange: id => { scaleId = id; useScale(); },
    });
}
if (movable) {
    addSelect(scaleControls, {
        label: minorRoots ? 'Key' : 'Root',
        options: (minorRoots ? MINOR_ROOTS : ROOTS).map(name => ({ value: name, label: name })),
        value: root,
        onChange: name => { root = name; useScale(); },
    });
}
if (keyed) {
    addSelect(scaleControls, {
        label: 'Key',
        options: ROOTS.map(name => ({ value: name, label: name })),
        value: 'C',
        onChange: key => {
            // The same degrees in the new key, with their names ("A Dorian" in G).
            SCALES = majorKeyModes(key);
            [...scaleSelect.options].forEach((option, i) => { option.textContent = SCALES[i].label; });
            useScale();
        },
    });
}
unwrap(scaleControls);

useScale();
const syncPlay = wirePlayButton(document.getElementById('play'), sequence, startAudio);
