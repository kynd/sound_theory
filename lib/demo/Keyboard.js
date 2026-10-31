import { midiToNote } from '../audio/AudioEngine.js';

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
// The home row plays white keys and the row above plays black keys, starting at
// the lowest C on screen: A = C, W = C#, S = D, … K = C an octave up, ; = E.
const COMPUTER_KEYS = 'awsedftgyhujkolp;';
// As pads, the home row plays the pads from the left: A = first pad, S = second, ….
const PAD_KEYS = 'asdfghjkl;';

const isWhite = midi => WHITE_PCS.has(((midi % 12) + 12) % 12);

/**
 * The on-screen input for an instrument, shaped to the sound: a piano keyboard for
 * pitched instruments, or a row of pads for sounds without pitch (one pad per drum,
 * a single pad for noise). It is played with a pointer (drag to glide across keys or
 * pads) or the computer keyboard (on keys, Z and X shift the octave). It only reports
 * notes as MIDI numbers through `onNoteOn` and `onNoteOff`; what they sound like is
 * up to the caller.
 *
 * The same note held from two sources (a key and a pointer) sounds once and stops
 * when the last source lets go.
 */
export class Keyboard {
    /**
     * @param {HTMLElement} container  a `.dp-keyboard` element.
     * @param {object} [opts]
     * @param {number} [opts.low]      MIDI number of the lowest key, a C.
     * @param {number} [opts.octaves]  octaves shown; a top C is added.
     * @param {boolean} [opts.whiteOnly]  white keys only, each labeled with its letter
     *                  (for music on the white keys, such as the church modes). The
     *                  home row plays them from the lowest: A = C, S = D, ….
     */
    constructor(container, { low = 60, octaves = 2, whiteOnly = false, onNoteOn = () => {}, onNoteOff = () => {} } = {}) {
        this.el = container;
        this.low = low;
        this.octaves = octaves;
        this.whiteOnly = whiteOnly;
        this.rootPc = null;
        this.onNoteOn = onNoteOn;
        this.onNoteOff = onNoteOff;
        this.pads = null;
        this._held = new Map();    // source id → midi
        this._counts = new Map();  // midi → number of sources holding it
        this._build();
        this._wirePointer();
        this._wireKeys();
    }

    get high() { return this.low + this.octaves * 12; }

    /**
     * Switches to pads (`[{ label, midi }]`, one per sound, e.g. an instrument's
     * `pads`) or back to piano keys (null). Pass an instrument's `pads` whenever the
     * instrument changes.
     */
    setPads(pads) {
        this.releaseAll();
        this.pads = pads && pads.length ? pads : null;
        this._build();
    }

    /**
     * Marks every key of one pitch class (0 = C) as the root, or none with null, so
     * the home note stays visible while playing.
     */
    setRoot(pc) {
        this.rootPc = pc;
        this._keys.forEach((key, midi) => key.classList.toggle('root', pc !== null && ((midi % 12) + 12) % 12 === pc));
    }

    /**
     * Lights keys for notes played from elsewhere (a chord from a progression), in the
     * same yellow as pressed keys, or none with an empty list. Keys outside the range
     * are ignored.
     */
    setLit(midis) {
        this._lit = new Set(midis);
        this._keys.forEach((key, midi) => key.classList.toggle('lit', this._lit.has(midi)));
    }

    shiftOctave(delta) {
        if (this.pads) return;
        const low = Math.max(12, Math.min(96, this.low + delta * 12));
        if (low === this.low) return;
        this.releaseAll();
        this.low = low;
        this._build();
    }

    releaseAll() {
        for (const source of [...this._held.keys()]) this._release(source);
    }

    _build() {
        this.el.replaceChildren();
        this._keys = new Map();
        this.el.classList.toggle('pads', !!this.pads);
        if (this.pads) {
            for (const { label, midi } of this.pads) {
                const pad = document.createElement('div');
                pad.className = 'dp-key pad';
                pad.dataset.midi = midi;
                pad.textContent = label;
                this.el.append(pad);
                this._keys.set(midi, pad);
            }
            return;
        }
        let whites = 0;
        for (let m = this.low; m <= this.high; m++) if (isWhite(m)) whites++;
        const ww = 100 / whites;
        this._whiteMidis = [];

        let whiteIndex = 0;
        for (let m = this.low; m <= this.high; m++) {
            const key = document.createElement('div');
            const pc = ((m % 12) + 12) % 12;
            key.dataset.midi = m;
            if (!isWhite(m) && this.whiteOnly) continue;
            if (isWhite(m)) {
                this._whiteMidis.push(m);
                key.className = 'dp-key white';
                key.style.left = `${whiteIndex * ww}%`;
                key.style.width = `${ww}%`;
                whiteIndex++;
            } else {
                key.className = 'dp-key black';
                key.style.left = `${(whiteIndex - 0.3) * ww}%`;
                key.style.width = `${ww * 0.6}%`;
            }
            // Octave names on the Cs, which are white keys, so the text stays black.
            // With white keys only, every key gets its letter.
            if (pc === 0) key.textContent = midiToNote(m);
            else if (this.whiteOnly) key.textContent = midiToNote(m).replace(/\d+$/, '');
            if (this.rootPc !== null && pc === this.rootPc) key.classList.add('root');
            if (this._counts.get(m)) key.classList.add('active');
            if (this._lit?.has(m)) key.classList.add('lit');
            this.el.append(key);
            this._keys.set(m, key);
        }
    }

    _press(source, midi) {
        if (this._held.get(source) === midi) return;
        if (this._held.has(source)) this._release(source);
        this._held.set(source, midi);
        const count = (this._counts.get(midi) ?? 0) + 1;
        this._counts.set(midi, count);
        if (count === 1) {
            this._keys.get(midi)?.classList.add('active');
            this.onNoteOn(midi);
        }
    }

    _release(source) {
        const midi = this._held.get(source);
        if (midi === undefined) return;
        this._held.delete(source);
        const count = (this._counts.get(midi) ?? 1) - 1;
        if (count > 0) { this._counts.set(midi, count); return; }
        this._counts.delete(midi);
        this._keys.get(midi)?.classList.remove('active');
        this.onNoteOff(midi);
    }

    _keyAt(x, y) {
        const key = document.elementFromPoint(x, y)?.closest('.dp-key');
        return key && this.el.contains(key) ? Number(key.dataset.midi) : null;
    }

    _wirePointer() {
        this.el.addEventListener('pointerdown', e => {
            const midi = this._keyAt(e.clientX, e.clientY);
            if (midi === null) return;
            e.preventDefault();
            this.el.setPointerCapture(e.pointerId);
            this._press(`pointer:${e.pointerId}`, midi);
        });
        this.el.addEventListener('pointermove', e => {
            const source = `pointer:${e.pointerId}`;
            if (!this._held.has(source)) return;
            const midi = this._keyAt(e.clientX, e.clientY);
            if (midi === null) this._release(source);
            else this._press(source, midi);
        });
        const up = e => this._release(`pointer:${e.pointerId}`);
        this.el.addEventListener('pointerup', up);
        this.el.addEventListener('pointercancel', up);
    }

    _wireKeys() {
        const ignore = e => e.metaKey || e.ctrlKey || e.altKey ||
            e.target.closest?.('input, select, textarea, [contenteditable]');
        window.addEventListener('keydown', e => {
            if (e.repeat || ignore(e)) return;
            const k = e.key.toLowerCase();
            if (k === 'z') { this.shiftOctave(-1); return; }
            if (k === 'x') { this.shiftOctave(1); return; }
            if (this.pads) {
                // A single pad answers to every pad key and the space bar.
                const i = this.pads.length === 1 && (PAD_KEYS.includes(k) || k === ' ') ? 0 : PAD_KEYS.indexOf(k);
                if (i >= 0 && i < this.pads.length) {
                    e.preventDefault();
                    this._press(`key:${k}`, this.pads[i].midi);
                }
                return;
            }
            if (this.whiteOnly) {
                const i = PAD_KEYS.indexOf(k);
                if (i >= 0 && i < this._whiteMidis.length) this._press(`key:${k}`, this._whiteMidis[i]);
                return;
            }
            const offset = COMPUTER_KEYS.indexOf(k);
            if (offset >= 0) this._press(`key:${k}`, this.low + offset);
        });
        window.addEventListener('keyup', e => this._release(`key:${e.key.toLowerCase()}`));
        window.addEventListener('blur', () => this.releaseAll());
    }
}
