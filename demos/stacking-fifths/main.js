import { startAudio, MasterBus, midiToFrequency } from '../../lib/audio/AudioEngine.js';
import { Chord, harmonicSeries } from '../../lib/audio/additive.js';
import { stackFifths } from '../../lib/audio/tuning.js';
import { FifthsRing } from '../../lib/demo/FifthsRing.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const START = midiToFrequency(60);   // C4
// Pure fifths by default; ?tuning=equal stacks equal-tempered fifths instead.
const TUNING = new URLSearchParams(location.search).get('tuning') === 'equal' ? 'equal' : 'pure';

const master = new MasterBus();
// The starting C and the latest note, sounding together.
const chord = new Chord([START, START], { partials: harmonicSeries('sawtooth', 8), amplitude: 0.25 })
    .connect(master.input);
const ring = new FifthsRing(document.getElementById('canvas'));

function refresh(n) {
    const notes = stackFifths(n, TUNING);
    chord.frequencies = [START, START * notes[notes.length - 1].factor];
    ring.update(notes);
}

const controls = document.getElementById('controls');
addRange(controls, {
    label: 'Fifths', min: 0, max: 12, step: 1, value: 0,
    onChange: n => refresh(n),
});
unwrap(controls);

refresh(0);
wirePlayButton(document.getElementById('play'), chord, startAudio);
