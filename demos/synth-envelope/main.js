import * as Tone from 'tone';
import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { SynthEngine } from '../../lib/audio/instruments.js';
import { EnvelopeView } from '../../lib/demo/EnvelopeView.js';
import { addEngineControls, unwrap } from '../../lib/demo/controls.js';

// The amplitude envelope of a subtractive synth: each press of Play sounds one A3
// (220 Hz), held for HOLD seconds and then released.
const NOTE = 57;
const HOLD = 1.5;
const SPAN = HOLD + 2;   // the longest release (2 s) fits

const master = new MasterBus();
const engine = new SynthEngine('envelope').connect(master.input);
const view = new EnvelopeView(document.getElementById('canvas'), { hold: HOLD, span: SPAN });
const envelope = () => ({
    attack: engine.get('attack'), decay: engine.get('decay'),
    sustain: engine.get('sustain'), release: engine.get('release'),
});

const controls = document.getElementById('controls');
addEngineControls(controls, engine, { onChange: () => view.update(envelope()) });
unwrap(controls);
view.update(envelope());

// The release is timed here rather than scheduled ahead, so pressing Play again
// before it can cancel it instead of cutting the new note short.
let releaseTimer = null;
document.getElementById('play').addEventListener('click', () => {
    startAudio();
    clearTimeout(releaseTimer);
    engine.releaseAll();
    const now = Tone.now();
    engine.noteOn(NOTE, 0.8, now);
    releaseTimer = setTimeout(() => engine.noteOff(NOTE), HOLD * 1000);
    view.play(now);
});
