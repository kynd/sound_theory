import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { PhasePlayer, PHASE_LOOP } from '../../lib/audio/rhythm.js';
import { CycleView } from '../../lib/demo/CycleView.js';
import { addRange, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

const master = new MasterBus();
// One piano per voice, one on each side.
const pianos = [createInstrument('piano'), createInstrument('piano')];

// Empty unless something is loading or failed.
const status = document.getElementById('status');
status.textContent = 'Loading samples…';
Promise.all(pianos.map(p => p.ready)).then(
    () => { status.textContent = ''; },
    () => { status.textContent = 'The samples could not be loaded.'; });

// Both voices as rings of the same loop: the first outside, the second inside.
const steps = [-1, -1];
const view = new CycleView(document.getElementById('canvas'));
view.update({ tracks: [0, 1].map(() => ({ steps: PHASE_LOOP.map(() => 1) })) });

const player = new PhasePlayer(pianos, {
    notes: PHASE_LOOP, step: 0.15, drift: 1,
    onStep: (voice, i) => {
        if (voice < 0) steps.fill(-1); else steps[voice] = i;
        view.setStep([...steps]);
    },
});
player.output.connect(master.input);

const controls = document.getElementById('controls');
addRange(controls, {
    label: 'Drift', min: 0, max: 3, step: 0.1, value: player.drift,
    onChange: v => { player.drift = v; },
});
unwrap(controls);

wirePlayButton(document.getElementById('play'), player, startAudio);
