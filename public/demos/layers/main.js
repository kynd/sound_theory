import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { LayeredHit } from '../../lib/audio/instruments.js';
import { Keyboard } from '../../lib/demo/Keyboard.js';
import { Scope } from '../../lib/demo/Scope.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { accent } from '../../lib/demo/colors.js';

// One impact from four layers, each with its own level. The Mix pad (A, or the space
// bar) plays them together; the pads after it (S, D, F, G) play one layer alone. The
// scope shows what is sounding.
const master = new MasterBus();
const hit = new LayeredHit().connect(master.input);
new Scope(document.getElementById('canvas'), hit.output);

const keyboard = new Keyboard(document.getElementById('keyboard'), {
    onNoteOn: midi => { startAudio(); hit.noteOn(midi); },
    onNoteOff: () => {},
});
keyboard.setPads(hit.pads);

const controls = document.getElementById('controls');
hit.layers.forEach((layer, i) => addRange(controls, {
    label: layer.label, min: 0, max: 1, step: 0.01, value: 1, color: accent(i),
    onChange: v => { layer.gain.gain.value = v; },
}));
unwrap(controls);
