import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { SCALE_SETS, ROOTS, findScale, scaleRun, transposeScale } from '../../lib/audio/scales.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { ScaleView } from '../../lib/demo/ScaleView.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Which scales to offer: ?set= names a set in SCALE_SETS (default `scales`), offered in
// a select; ?scale= names one scale, shown with no select. ?roots adds a Root select
// that moves the scale to another starting note.
const params = new URLSearchParams(location.search);
const movable = params.has('roots');
const single = findScale(params.get('scale'));
const SCALES = single ? [single] : SCALE_SETS[params.get('set')] ?? SCALE_SETS.scales;

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
    // Scales keep their own root unless the Root select moves them.
    const scale = movable && root !== (base.root ?? 'C') ? transposeScale(base, root) : base;
    sequence.notes = scaleRun(scale).map(n => n.midi);
    view.update(scale);
}

const scaleControls = document.getElementById('scale-controls');
if (SCALES.length > 1) {
    addSelect(scaleControls, {
        label: 'Scale',
        options: SCALES.map(({ id, label }) => ({ value: id, label })),
        value: scaleId,
        onChange: id => { scaleId = id; useScale(); },
    });
}
if (movable) {
    addSelect(scaleControls, {
        label: 'Root',
        options: ROOTS.map(name => ({ value: name, label: name })),
        value: root,
        onChange: name => { root = name; useScale(); },
    });
}
unwrap(scaleControls);

useScale();
const syncPlay = wirePlayButton(document.getElementById('play'), sequence, startAudio);
