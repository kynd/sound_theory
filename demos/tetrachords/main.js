import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { TETRACHORDS, joinTetrachords, scaleRun } from '../../lib/audio/scales.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { ScaleView } from '../../lib/demo/ScaleView.js';
import { addSelect, addReadout, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// A scale from two tetrachords: Lower (C to F) and Upper (G to C), a whole step apart,
// named in the Scale readout when the scale has a common name.
const master = new MasterBus();
const instrument = createInstrument('piano').connect(master.input);

const status = document.getElementById('status');
status.textContent = 'Loading samples…';
instrument.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

const view = new ScaleView(document.getElementById('canvas'), {
    onNoteOn: midi => { startAudio(); instrument.noteOn(midi); },
    onNoteOff: midi => instrument.noteOff(midi),
});
const sequence = new Sequence(instrument, {
    onStep: (i, midi) => view.setSounding(midi, i < 0 ? null : i),
    onEnd: () => syncPlay?.(),
});

let lower = 'major', upper = 'major';
const controls = document.getElementById('scale-controls');
const options = TETRACHORDS.map(({ id, label }) => ({ value: id, label }));
addSelect(controls, { label: 'Lower', options, value: lower, onChange: id => { lower = id; useScale(); } });
addSelect(controls, { label: 'Upper', options, value: upper, onChange: id => { upper = id; useScale(); } });
const showName = addReadout(controls, { label: 'Scale' });
unwrap(controls);

function useScale() {
    sequence.stop();
    const scale = joinTetrachords(lower, upper);
    sequence.notes = scaleRun(scale).map(n => n.midi);
    view.update(scale);
    showName(scale.label);
    syncPlay?.();
}

let syncPlay = null;
useScale();
syncPlay = wirePlayButton(document.getElementById('play'), sequence, startAudio);
