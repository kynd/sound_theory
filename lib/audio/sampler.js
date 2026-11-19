import * as Tone from 'tone';
import { sampleUrl } from './instruments.js';

/**
 * Sampling: a recording, from a file or the microphone, cut into equal slices and
 * played back slice by slice in a loop. Each slice can be sped up or slowed down
 * (which moves its pitch too), played backward, faded in and out, and placed left or
 * right; the order can step forward, repeat a slice, or jump anywhere. With one slice
 * and no jumps it simply loops the recording; with many short slices, repeats, and
 * jumps it stutters and skips like a damaged CD, the sound of Oval.
 */

const TONE_AUDIO = 'https://tonejs.github.io/audio/';

/** Recordings to sample, in menu order (hosted with Tone.js's examples). */
export const SAMPLE_SOURCES = [
    { id: 'chords',    label: 'Chords',     url: `${TONE_AUDIO}loop/chords.mp3` },
    { id: 'breakbeat', label: 'Drum break', url: `${TONE_AUDIO}drum-samples/breakbeat.mp3` },
    { id: 'voice',     label: 'Voice',      url: `${TONE_AUDIO}berklee/femalevoices_aa2_A3.mp3` },
    { id: 'guitar',    label: 'Guitar',     url: `${TONE_AUDIO}berklee/guitar_chord1.mp3` },
    { id: 'gong',      label: 'Gong',       url: `${TONE_AUDIO}berklee/gong_1.mp3` },
    { id: 'piano',     label: 'Piano note', url: sampleUrl('piano', 'C4.mp3') },
];

/** Loads a recording from SAMPLE_SOURCES by id. */
export function loadSample(id) {
    const { url } = SAMPLE_SOURCES.find(s => s.id === id);
    return new Promise((resolve, reject) => {
        const buffer = new Tone.ToneAudioBuffer(url, () => resolve(buffer), reject);
    });
}

/**
 * Records from the microphone. `start()` asks for the microphone (inside a user
 * gesture) and starts recording; `stop()` resolves to the recording as a
 * ToneAudioBuffer, with the silence before the first sound cut off and the level
 * raised so the loudest point is near full scale.
 */
export class MicRecorder {
    get recording() { return Boolean(this._recorder); }

    async start() {
        this._mic = new Tone.UserMedia();
        await this._mic.open();
        this._recorder = new Tone.Recorder();
        this._mic.connect(this._recorder);
        this._recorder.start();
    }

    async stop() {
        const blob = await this._recorder.stop();
        this._mic.close();
        this._mic.dispose();
        this._recorder.dispose();
        this._recorder = null;
        const data = await blob.arrayBuffer();
        const audio = await Tone.getContext().rawContext.decodeAudioData(data);
        return new Tone.ToneAudioBuffer(trimAndNormalize(audio));
    }
}

/** A copy of an AudioBuffer starting at its first sound, peaking at 0.9. */
function trimAndNormalize(audio, threshold = 0.02) {
    const channels = [...Array(audio.numberOfChannels)].map((_, c) => audio.getChannelData(c));
    let first = 0, peak = 0;
    while (first < audio.length && channels.every(d => Math.abs(d[first]) < threshold)) first++;
    for (const d of channels) for (let i = first; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    const length = Math.max(1, audio.length - first);
    const out = new AudioBuffer({ numberOfChannels: audio.numberOfChannels, length, sampleRate: audio.sampleRate });
    const gain = peak > 0 ? 0.9 / peak : 1;
    channels.forEach((d, c) => out.getChannelData(c).set(d.subarray(first, first + length).map(v => v * gain)));
    return out;
}

const LOOKAHEAD = 0.1;   // seconds of slices scheduled ahead
const TICK_MS = 25;

/**
 * Plays a recording slice by slice in a loop, with the start/stop/playing contract of
 * a continuous source. Settings, all changeable while playing:
 *
 *   - `slices`: how many equal slices the recording is cut into (1 plays it whole).
 *   - `repeat`: the chance (0–1) that the next slice is the same one again.
 *   - `jump`: the chance (0–1) that it is any slice at random instead of the next.
 *   - `reverse`: the chance (0–1) that a slice plays backward (1 reverses them all).
 *   - `rate`: playback speed; pitch moves with it (2 is an octave up and twice as fast).
 *   - `attack`, `release`: fade in and out of each slice, in seconds.
 *   - `spread`: how far left and right (0–1) each slice may be placed at random.
 *
 * `onSlice(i, reversed)` reports each slice as it sounds, and -1 when stopped.
 */
export class SliceLooper {
    constructor({ slices = 1, repeat = 0, jump = 0, reverse = 0, rate = 1, attack = 0.005, release = 0.01, spread = 0,
        onSlice = () => {} } = {}) {
        Object.assign(this, { slices, repeat, jump, reverse, rate, attack, release, spread, onSlice });
        this.output = new Tone.Gain();
        this._panner = new Tone.Panner().connect(this.output);
        this.buffer = null;
        this._reversed = null;
        this._timer = null;
        this._sources = new Set();
        this._draws = new Set();
    }

    /** Sets the recording (a loaded ToneAudioBuffer); playback continues with it. */
    setBuffer(buffer) {
        this.buffer = buffer;
        // A reversed copy (reversing a ToneAudioBuffer turns its own samples around).
        const audio = buffer.get();
        const copy = new AudioBuffer({ numberOfChannels: audio.numberOfChannels, length: audio.length, sampleRate: audio.sampleRate });
        for (let c = 0; c < audio.numberOfChannels; c++) copy.getChannelData(c).set(audio.getChannelData(c).slice().reverse());
        this._reversed = new Tone.ToneAudioBuffer(copy);
        this._index = -1;
    }

    get playing() { return this._timer !== null; }

    start() {
        this.stop();
        this._index = -1;
        this._next = Tone.immediate() + 0.05;
        this._timer = setInterval(() => this._schedule(), TICK_MS);
        this._schedule();
    }

    stop() {
        if (this._timer === null) return;
        clearInterval(this._timer);
        this._timer = null;
        this._draws.forEach(clearTimeout);
        this._draws.clear();
        const now = Tone.immediate();
        this._sources.forEach(source => source.stop(now + 0.02));
        this._sources.clear();
        this.onSlice(-1);
    }

    _pick() {
        const n = Math.max(1, Math.round(this.slices));
        if (this._index >= 0 && Math.random() < this.repeat) return this._index % n;
        if (Math.random() < this.jump) return Math.floor(Math.random() * n);
        return (this._index + 1) % n;
    }

    _schedule() {
        if (!this.buffer?.loaded) return;
        const now = Tone.immediate();
        while (this._next < now + LOOKAHEAD) {
            const n = Math.max(1, Math.round(this.slices));
            const i = this._index = this._pick();
            const length = this.buffer.duration / n;
            const reversed = Math.random() < this.reverse;
            const offset = reversed ? this.buffer.duration - (i + 1) * length : i * length;
            const seconds = length / this.rate;
            const time = Math.max(this._next, now);
            const source = new Tone.ToneBufferSource({
                url: reversed ? this._reversed : this.buffer, playbackRate: this.rate,
                fadeIn: Math.min(this.attack, seconds / 2), fadeOut: Math.min(this.release, seconds / 2),
                curve: 'linear',
            }).connect(this._panner);
            this._panner.pan.setValueAtTime((Math.random() * 2 - 1) * this.spread, time);
            source.start(time, offset, length);
            source.onended = () => { this._sources.delete(source); source.dispose(); };
            this._sources.add(source);
            const draw = setTimeout(() => { this._draws.delete(draw); this.onSlice(i, reversed); },
                Math.max(0, (time - now) * 1000));
            this._draws.add(draw);
            this._next = time + seconds;
        }
    }

    dispose() {
        this.stop();
        this._panner.dispose();
        this.output.dispose();
    }
}
