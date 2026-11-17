import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { Sequence } from '../../lib/audio/sequence.js';
import { ChordCircle } from '../../lib/demo/ChordCircle.js';
import { addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// The seven triads of C major on the circle of twelve notes: Play steps through them
// (C4 up to C5), and Chord shows and plays one. Major, minor, and diminished each take
// their own color (ChordCircle's qualities, in this order).
const QUALITIES = ['major', 'minor', 'diminished'];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const degree = k => 60 + MAJOR[k % 7] + 12 * Math.floor(k / 7);
const TRIADS = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C'].map((symbol, i) => ({
    symbol,
    notes: [degree(i), degree(i + 2), degree(i + 4)],
    quality: QUALITIES.indexOf(symbol.endsWith('dim') ? 'diminished' : symbol.endsWith('m') ? 'minor' : 'major'),
}));

const master = new MasterBus();
const instrument = createInstrument('piano').connect(master.input);

const status = document.getElementById('status');
status.textContent = 'Loading samples…';
instrument.ready.then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

const view = new ChordCircle(document.getElementById('canvas'));

const sequence = new Sequence(instrument, {
    step: 1.2, gate: 0.9,
    onStep: i => { if (i >= 0) show(i); },
    onEnd: () => syncPlay?.(),
});
sequence.notes = TRIADS.map(t => t.notes);

const controls = document.getElementById('chord-controls');
// The last C (an octave up) is the same chord on the circle, so the menu has seven.
const select = addSelect(controls, {
    label: 'Chord',
    options: TRIADS.slice(0, 7).map((t, i) => ({ value: String(i), label: t.symbol })),
    value: '0',
    onChange: value => {
        sequence.stop();
        syncPlay?.();
        const triad = TRIADS[Number(value)];
        show(Number(value));
        startAudio();
        for (const m of triad.notes) instrument.noteOn(m, 0.8);
        setTimeout(() => triad.notes.forEach(m => instrument.noteOff(m)), 1000);
    },
});
unwrap(controls);

function show(i) {
    view.update(TRIADS[i]);
    select.value = String(i % 7);
}

show(0);
const syncPlay = wirePlayButton(document.getElementById('play'), sequence, startAudio);
