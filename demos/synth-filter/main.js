import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { SynthEngine, HeldNote } from '../../lib/audio/instruments.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addEngineControls, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// The oscillator and filter of a subtractive synth, on one held A3 (220 Hz).
const NOTE = 57;

const master = new MasterBus();
const engine = new SynthEngine('filter').connect(master.input);
new Scope(document.getElementById('canvas'), engine.output, { mode: 'both' });

const controls = document.getElementById('controls');
addEngineControls(controls, engine);
unwrap(controls);

wirePlayButton(document.getElementById('play'), new HeldNote(engine, NOTE), startAudio);
