import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { createInstrument } from '../../lib/audio/instruments.js';
import { StepSequencer, polymeterPattern } from '../../lib/audio/rhythm.js';
import { LoopView } from '../../lib/demo/LoopView.js';
import { addRange, addSelect, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Two loops over one pulse (a polymeter), drawn as rows of equal squares, one per step:
// Top and Bottom each choose Notes (C, D, E, … on the electric piano) or Drums (rim
// clicks on top, kicks below), and Steps sets each loop's length. ?top=3&bottom=4 sets
// where the sliders start; the top loop starts as notes and the bottom one as drums.
const params = new URLSearchParams(location.search);
const MAX = 9;
const parts = [
    { label: 'Top', steps: Number(params.get('top') ?? 3), sound: 'notes' },
    { label: 'Bottom', steps: Number(params.get('bottom') ?? 4), sound: 'drums' },
];

const master = new MasterBus();
const drums = createInstrument('drums').connect(master.input);
const notes = createInstrument('epiano').connect(master.input);
const view = new LoopView(document.getElementById('canvas'), { maxSteps: MAX });
const sequencer = new StepSequencer(drums, { voices: { notes }, onStep: i => view.setStep(i) });

function usePattern() {
    const pattern = polymeterPattern(parts[0].steps, parts[1].steps, { sounds: parts.map(p => p.sound) });
    const wasPlaying = sequencer.playing;
    sequencer.stop();
    sequencer.pattern = pattern;
    sequencer.tempo = pattern.tempo;
    view.update(pattern);
    if (wasPlaying) sequencer.start();
}

const controls = document.getElementById('controls');
parts.forEach((part, i) => {
    if (i > 0) controls.append(Object.assign(document.createElement('div'), { className: 'dp-divider' }));
    addSelect(controls, {
        label: part.label,
        options: [{ value: 'notes', label: 'Notes' }, { value: 'drums', label: 'Drums' }],
        value: part.sound,
        onChange: v => { part.sound = v; usePattern(); },
    });
    addRange(controls, {
        label: 'Steps', min: 1, max: MAX, step: 1, value: part.steps,
        onChange: v => { part.steps = v; usePattern(); },
    });
});
unwrap(controls);

usePattern();
wirePlayButton(document.getElementById('play'), sequencer, startAudio);
