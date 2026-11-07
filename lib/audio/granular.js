import * as Tone from 'tone';
import { sampleUrl } from './instruments.js';

/**
 * Granular synthesis: a recording cut into short, overlapping grains, played in a
 * loop. Because each grain keeps its own pitch, the speed through the recording
 * (`rate`) and the pitch (`detune`) are independent: a note can be stretched into a
 * still cloud, or shifted in pitch without speeding up.
 */

const LOOP_SECONDS = 2;

/** Recordings to play, in menu order: single notes from the sampled instruments. */
export const GRAIN_SOURCES = [
    { id: 'piano',   label: 'Piano',   url: sampleUrl('piano', 'C4.mp3') },
    { id: 'cello',   label: 'Cello',   url: sampleUrl('cello', 'G2.mp3') },
    { id: 'flute',   label: 'Flute',   url: sampleUrl('flute', 'A4.mp3') },
    { id: 'trumpet', label: 'Trumpet', url: sampleUrl('trumpet', 'C4.mp3') },
];

/**
 * A looping granular player with the start/stop/playing contract of a continuous
 * source. `ready` resolves when the current recording has loaded.
 */
export class GranularSource {
    constructor({ source = GRAIN_SOURCES[0].id, grainSize = 0.1, overlap = 0.05 } = {}) {
        this.output = new Tone.Gain(1.5);
        this.player = new Tone.GrainPlayer({ loop: true, grainSize, overlap }).connect(this.output);
        this._playing = false;
        this.setSource(source);
    }

    /** Loads a recording from GRAIN_SOURCES by id; playback continues once it has loaded. */
    setSource(id) {
        const { url } = GRAIN_SOURCES.find(s => s.id === id);
        const wasPlaying = this._playing;
        if (wasPlaying) this.player.stop();
        this.ready = new Promise((resolve, reject) => {
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                // Loop the first two seconds, the body of the note, not its quiet tail.
                this.player.buffer = buffer;
                this.player.loopStart = 0;
                this.player.loopEnd = Math.min(buffer.duration, LOOP_SECONDS);
                if (this._playing) this.player.start();
                resolve();
            }, reject);
        });
        return this.ready;
    }

    get playing() { return this._playing; }

    start() {
        this._playing = true;
        if (this.player.buffer.loaded) this.player.start();
    }

    stop() {
        this._playing = false;
        if (this.player.state === 'started') this.player.stop();
    }

    /** Speed through the recording: 1 is as recorded, 0.1 ten times slower. */
    get rate() { return this.player.playbackRate; }
    set rate(v) { this.player.playbackRate = v; }

    /** Pitch shift in cents, independent of the rate. */
    get detune() { return this.player.detune; }
    set detune(cents) { this.player.detune = cents; }

    /** Length of each grain in seconds. */
    get grainSize() { return this.player.grainSize; }
    set grainSize(s) { this.player.grainSize = s; }

    /** Crossfade between grains in seconds. */
    get overlap() { return this.player.overlap; }
    set overlap(s) { this.player.overlap = s; }

    get reverse() { return this.player.reverse; }
    set reverse(on) { this.player.reverse = on; }
}
