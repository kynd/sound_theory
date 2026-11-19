import { startAudio, MasterBus } from '../../lib/audio/AudioEngine.js';
import { SpectralPlayer } from '../../lib/audio/spectral.js';
import { EffectChain } from '../../lib/audio/effects.js';
import { PaintGrid } from '../../lib/demo/PaintGrid.js';
import { addRange, addEffectControls, unwrap } from '../../lib/demo/controls.js';
import { wirePlayButton } from '../../lib/demo/panel.js';

// Paint sine waves on a grid: rows are frequencies from 60 Hz to 6 kHz (low at the
// bottom), columns are moments, played left to right in a loop.
const COLS = 48, ROWS = 32;
const grid = Array.from({ length: COLS }, () => Array(ROWS).fill(0));

// A starting picture: a rising sweep, a held band of close frequencies, a falling
// pair, and scattered points.
for (let c = 0; c < 14; c++) grid[c][4 + Math.round(c * 1.6)] = 1;
for (let c = 16; c < 28; c++) for (let r = 12; r < 16; r++) grid[c][r] = 1;
for (let c = 30; c < 40; c++) { grid[c][26 - (c - 30)] = 1; grid[c][20 - (c - 30)] = 1; }
[[41, 28], [42, 6], [43, 18], [44, 24], [45, 3], [46, 14], [47, 30]].forEach(([c, r]) => { grid[c][r] = 1; });

const master = new MasterBus();
const chain = new EffectChain(['delay', 'reverb']);
chain.connect(master.input);
const view = new PaintGrid(document.getElementById('canvas'), grid);
const player = new SpectralPlayer(grid, { duration: 8, onColumn: i => view.setColumn(i) });
player.output.connect(chain.input);

const controls = document.getElementById('controls');
const clear = document.createElement('button');
clear.className = 'dp-btn';
clear.textContent = 'Clear';
clear.addEventListener('click', () => { grid.forEach(col => col.fill(0)); view.draw(); });
controls.append(clear);
addRange(controls, {
    label: 'Length', min: 2, max: 30, step: 1, value: player.duration, unit: 's',
    onChange: v => { player.duration = v; },
});
const divider = document.createElement('div');
divider.className = 'dp-divider';
controls.append(divider);
addEffectControls(controls, chain, { collapsed: true });
unwrap(controls);

wirePlayButton(document.getElementById('play'), player, startAudio);
