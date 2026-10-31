# Audio library

Reference for `public/lib/`. Not published; kept in step with the code.

<div class="prose">

The classes that make and shape sound (`public/lib/audio/`), and the demo components that play and display it (`public/lib/demo/`). All of them are built on [Tone.js](https://tonejs.github.io/) 15.1.22, loaded through the import map in each demo's `index.html`.
<div class="jp">音をつくり、加工するクラス（`public/lib/audio/`）と、それを演奏・表示するデモ用コンポーネント（`public/lib/demo/`）です。すべて[Tone.js](https://tonejs.github.io/) 15.1.22の上に構築し、各デモの`index.html`にあるインポートマップから読み込みます。</div>

## The audio engine

`AudioEngine.js` holds what every demo shares. Importing it sets Tone's `lookAhead` to 0, so notes start the moment a key is pressed instead of 0.1 s later; a demo that schedules sequences on the Transport can raise it again.
<div class="jp">`AudioEngine.js`には、すべてのデモが共有するものを置きます。読み込むとToneの`lookAhead`を0にするため、音は0.1秒遅れずに、鍵盤を押した瞬間に鳴ります。Transportで先にシーケンスを予約するデモでは、値を戻せます。</div>

- **`startAudio()`:** resumes the audio context. Browsers keep it suspended until a user gesture, so call it from inside a pointer or key handler before the first note. Do not await it before playing: schedule the note right after the call. The suspended context's clock stands still, so the note starts when audio resumes, and a quick tap's noteOff cannot overtake its noteOn and leave a sound stuck on.
- **`MasterBus`:** the last stage before the speakers, a volume control (`volume`, in dB) followed by a limiter at −1 dB. Every demo routes its sound through one.
- **`midiToNote(midi)`, `midiToFrequency(midi)`:** conversions from a MIDI number (60 = C4) to a note name and to Hz at A4 = 440 Hz.
- **`frequencyToMidi(hz)`, `nearestNote(hz)`:** the reverse. `frequencyToMidi` returns a fractional MIDI number; `nearestNote` returns `{ midi, name, cents }`, the nearest equal-tempered note and the offset from it in cents.
<div class="jp">

- **`startAudio()`：**オーディオコンテキストを再開します。ブラウザはユーザー操作があるまでコンテキストを停止させておくため、最初の音の前に、ポインターやキーのハンドラの中で呼びます。音を鳴らす前にawaitせず、呼んだ直後に音を予約します。停止中のコンテキストの時計は進まないため、音はオーディオの再開と同時に鳴り、短いタップのnoteOffがnoteOnを追い越して音が鳴りっぱなしになることもありません。
- **`MasterBus`：**スピーカーの手前の最終段で、音量（`volume`、dB）と−1 dBのリミッターからなります。すべてのデモは、音をひとつの`MasterBus`に通します。
- **`midiToNote(midi)`、`midiToFrequency(midi)`：**MIDI番号（60 = C4）から音名へ、またA4 = 440 HzでのHzへ変換します。
- **`frequencyToMidi(hz)`、`nearestNote(hz)`：**その逆の変換です。`frequencyToMidi`は小数のMIDI番号を返し、`nearestNote`は最も近い平均律の音と、そこからのずれ（セント）を`{ midi, name, cents }`で返します。

</div>

## Instruments

`instruments.js` puts every sound source behind one contract, so a demo can swap a sine wave for a piano or a drum kit without changing how it plays notes.
<div class="jp">`instruments.js`は、すべての音源をひとつの契約の後ろにまとめます。そのため、デモは音の鳴らし方を変えずに、サイン波をピアノやドラムキットに差し替えられます。</div>

### Common to every instrument

- **Notes:** MIDI numbers, never names or frequencies.
- **`noteOn(midi, velocity, time)`, `noteOff(midi, time)`, `releaseAll()`:** velocity is 0–1. `time` is optional, on the audio clock, for sequencers that schedule ahead; live playing leaves it out. One-shot sounds ignore `noteOff`.
- **`output`:** a gain node the caller connects onward; `connect(destination)` returns the instrument.
- **`ready`:** a promise that resolves once any samples have loaded. Synthesized instruments resolve immediately.
- **`pads`:** a list of `{ label, midi }`, or null. Set when the instrument has no pitch and is played from pads instead of piano keys: one pad per sound (the drum kit's pieces), or a single pad (noise).
<div class="jp">

- **音符：**MIDI番号で指定します。音名や周波数は使いません。
- **`noteOn(midi, velocity, time)`、`noteOff(midi, time)`、`releaseAll()`：**velocityは0〜1です。`time`は省略可能なオーディオクロック上の時刻で、先に予約するシーケンサーが使います。演奏で鳴らすときは省略します。ワンショットの音は`noteOff`を無視します。
- **`output`：**呼び出し側が接続先につなぐゲインノードです。`connect(destination)`は楽器自身を返します。
- **`ready`：**サンプルの読み込みが終わると解決するプロミスです。合成音の楽器はすぐに解決します。
- **`pads`：**`{ label, midi }`のリスト、またはnullです。音高を持たず、鍵盤ではなくパッドで演奏する楽器で設定します。音ごとにひとつ（ドラムキットのパーツ）、またはひとつだけ（ノイズ）のパッドです。

</div>

### The classes

- **`PolyInstrument`:** a `Tone.PolySynth` over one of Tone's monophonic voices (`Synth`, `FMSynth`, `AMSynth`, …), up to 32 voices.
- **`SampledInstrument`:** a `Tone.Sampler`, which repitches the nearest recorded note. Notes played before the samples load are ignored.
- **`DrumKit`:** synthesized drums (kick, snare, clap, hat, open hat, tom, crash), played from one pad per piece. Each piece also sits on a white key in every octave, C to B in that order. A rim click sits on C♯ (as General MIDI's side stick) without a pad, for rhythm patterns; the other black keys are silent. `DRUM_NOTES` names each piece's note. Both hi-hats share one synth, so a closed hat chokes an open one.
- **`NoiseInstrument`:** a held white, pink, or brown noise, played from a single pad. Any note plays the same sound, which lasts while any is held.
<div class="jp">

- **`PolyInstrument`：**Toneのモノフォニックな音源（`Synth`、`FMSynth`、`AMSynth`など）を`Tone.PolySynth`で束ねたもので、最大32音を同時に鳴らせます。
- **`SampledInstrument`：**`Tone.Sampler`です。最も近い録音の音高をずらして鳴らします。サンプルの読み込み前に弾いた音は無視します。
- **`DrumKit`：**合成ドラム（キック、スネア、クラップ、ハイハット、オープンハイハット、タム、クラッシュ）で、パーツごとのパッドで演奏します。各パーツは、どのオクターブでも白鍵にも割り当てています（CからBへこの順）。リズムのパターン用に、リムクリックをパッドなしでC♯に置いています（General MIDIのサイドスティックと同じ）。ほかの黒鍵は鳴りません。`DRUM_NOTES`が各パーツの音を示します。2つのハイハットはひとつのシンセを共有するため、クローズドハイハットがオープンハイハットを止めます（チョーク）。
- **`NoiseInstrument`：**持続するホワイト、ピンク、ブラウンノイズで、ひとつのパッドで演奏します。どの音符でも同じ音が鳴り、いずれかを押さえているあいだ続きます。

</div>

### Presets

`INSTRUMENTS` lists every preset in menu order, as `{ id, label, group, create }`; `createInstrument(id)` builds one. Add new presets there, never in a demo. Waveform presets are leveled by ear, since a square or sawtooth at the same amplitude as a sine sounds much louder.
<div class="jp">`INSTRUMENTS`は、すべてのプリセットを`{ id, label, group, create }`の形でメニュー順に並べたもので、`createInstrument(id)`でひとつを生成します。新しいプリセットはデモではなく、ここに追加します。矩形波やノコギリ波は、サイン波と同じ振幅でもずっと大きく聞こえるため、波形のプリセットは耳で音量を揃えています。</div>

The piano uses the Salamander Grand Piano samples (Alexander Holm, CC BY 3.0) hosted at `tonejs.github.io/audio/salamander/`, one file every three semitones. Violin, cello, flute, clarinet, trumpet, and acoustic guitar use the tonejs-instruments samples (Nicholas Brosowsky; VSCO 2 Community Edition, University of Iowa, Freesound; CC BY 3.0) hosted at `nbrosowsky.github.io/tonejs-instruments/samples/`. `TONEJS_INSTRUMENTS` lists, per instrument, a subset of the recorded notes at least three semitones apart; add another instrument from that collection by adding its folder name and notes there.
<div class="jp">ピアノには、`tonejs.github.io/audio/salamander/`にあるSalamander Grand Pianoのサンプル（Alexander Holm、CC BY 3.0）を使います。ファイルは3半音ごとに1つです。バイオリン、チェロ、フルート、クラリネット、トランペット、アコースティックギターには、`nbrosowsky.github.io/tonejs-instruments/samples/`にあるtonejs-instrumentsのサンプル（Nicholas Brosowsky。VSCO 2 Community Edition、アイオワ大学、Freesound。CC BY 3.0）を使います。`TONEJS_INSTRUMENTS`には、楽器ごとに、録音された音のうち3半音以上離れた一部を並べています。このコレクションのほかの楽器を加えるには、そこにフォルダ名と音を追加します。</div>

## Effects

`effects.js` describes each effect as data: a factory for the Tone node and the parameters a demo can expose. Panels are generated from the parameters, so a new parameter appears in every demo that shows the effect.
<div class="jp">`effects.js`は、各エフェクトをデータとして記述します。Toneのノードを生成する関数と、デモが公開できるパラメータです。パネルはパラメータから生成するため、新しいパラメータは、そのエフェクトを表示するすべてのデモに現れます。</div>

### Parameters

- **Required:** `key`, `label`, `min`, `max`, `value` (the default), and `apply(node, value)`.
- **`step`, `unit`:** slider step, and `'Hz'`, `'s'`, or `'dB'` for display.
- **`scale: 'log'`:** the slider moves evenly in ratios rather than in steps, for frequency and similar quantities. The value is still snapped to `step` (1 for frequencies), so the readout shows exactly the value that is applied. Hz values are shown as whole numbers, never abbreviated.
- **`live: false`:** the value applies only when the slider is released, for parameters that are expensive to change (reverb decay renders a new impulse response).
<div class="jp">

- **必須：**`key`、`label`、`min`、`max`、`value`（初期値）、`apply(node, value)`。
- **`step`、`unit`：**スライダーの刻みと、表示用の単位（`'Hz'`、`'s'`、`'dB'`）。
- **`scale: 'log'`：**スライダーが一定の差ではなく一定の比で動きます。周波数などに使います。値は`step`（周波数では1）に揃えるため、表示される値が、実際に適用される値と正確に一致します。Hzの値は省略せず、整数で表示します。
- **`live: false`：**スライダーを離したときだけ値を反映します。変更の負荷が大きいパラメータに使います（リバーブのdecayは、変更のたびにインパルス応答を生成し直します）。

</div>

Every effect with a dry/wet balance has a **Mix** parameter that starts at 0, so a chain is transparent until an effect is turned up.
<div class="jp">原音とエフェクト音のバランスを持つエフェクトにはすべて、0から始まる<strong>Mix</strong>パラメータがあります。そのため、エフェクトを上げるまでチェーンは音を変えません。</div>

### The effects

- **`distortion`:** `Tone.Distortion`, a waveshaper, oversampled 4×. Drive and Mix.
- **`filter`:** `Tone.Filter`, a 12 dB/octave low-pass. Cutoff (log) and Resonance. Transparent at the default 20 kHz cutoff.
- **`delay`:** `Tone.FeedbackDelay`, up to 1 s. Time, Feedback, and Mix.
- **`reverb`:** `Tone.Reverb`, a convolution reverb with a generated impulse response. Decay and Mix.
<div class="jp">

- **`distortion`：**`Tone.Distortion`（ウェーブシェーパー、4倍オーバーサンプリング）。DriveとMix。
- **`filter`：**`Tone.Filter`（12 dB/オクターブのローパス）。Cutoff（対数）とResonance。初期値のカットオフ20 kHzでは音を変えません。
- **`delay`：**`Tone.FeedbackDelay`（最大1秒）。Time、Feedback、Mix。
- **`reverb`：**`Tone.Reverb`（生成したインパルス応答による畳み込みリバーブ）。DecayとMix。

</div>

### EffectChain

`EffectChain(ids)` connects the listed effects in series between `input` and `output`, in the order given (by default every effect, in the order above). `set(id, key, value)` and `get(id, key)` read and write a parameter by name.
<div class="jp">`EffectChain(ids)`は、指定したエフェクトを`input`と`output`のあいだに、与えた順で直列につなぎます（省略すると、上の順にすべてのエフェクトをつなぎます）。`set(id, key, value)`と`get(id, key)`で、パラメータを名前で読み書きします。</div>

## Additive tones

`additive.js` builds a tone as a sum of sine waves (partials) at whole-number multiples of a fundamental frequency. A partial list is an array of amplitudes, fundamental first, so `[1]` is a plain sine wave. Every partial starts in phase (a rising sine at time zero), and the sum is scaled to a peak of 1, matching what the Web Audio PeriodicWave plays.
<div class="jp">`additive.js`は、基音の整数倍の周波数にあるサイン波（部分音）の和として音をつくります。部分音のリストは、基音を先頭にした振幅の配列で、`[1]`はただのサイン波です。すべての部分音は同じ位相（時刻0で上昇するサイン）から始まり、和はピークが1になるようにスケールされます。これはWeb AudioのPeriodicWaveが鳴らす音と一致します。</div>

- **`harmonicSeries(shape, n)`:** the first `n` harmonic amplitudes of `'sine'`, `'square'` (odd harmonics at 1/n), or `'sawtooth'` (every harmonic at 1/n).
- **`partialSum(partials, phase)`, `partialPeak(partials)`:** the unscaled sum at a phase (0–1 is one period), and its largest absolute value over a period. Views use them to draw what the oscillator plays.
- **`AdditiveOscillator`:** a continuously running additive tone with `frequency`, `amplitude` (the summed wave's peak, 0–1), `partials`, and `setPartial(index, amplitude)`. `start()` and `stop()` fade over 30 ms so they never click; call `start()` after `startAudio()`. When every partial is 0 the output is muted, since a PeriodicWave of zeros cannot be normalized.
<div class="jp">

- **`harmonicSeries(shape, n)`：**`'sine'`、`'square'`（奇数次の倍音を1/nで）、`'sawtooth'`（すべての倍音を1/nで）の最初の`n`個の倍音の振幅を返します。
- **`partialSum(partials, phase)`、`partialPeak(partials)`：**ある位相（0〜1が1周期）でのスケール前の和と、1周期のなかでのその絶対値の最大値です。ビューはこれらを使って、オシレーターが鳴らす波を描きます。
- **`AdditiveOscillator`：**鳴り続ける加算合成の音で、`frequency`、`amplitude`（和の波のピーク、0〜1）、`partials`、`setPartial(index, amplitude)`を持ちます。`start()`と`stop()`は30ミリ秒かけてフェードするため、クリックノイズが出ません。`start()`は`startAudio()`のあとに呼びます。すべての部分音が0のときは出力を消音します。ゼロだけのPeriodicWaveは正規化できないためです。

</div>

## Chord

`Chord` (in `additive.js`) is several `AdditiveOscillator`s that start and stop together, one per frequency, all with the same partials: an interval or a chord. It has the same `start()`, `stop()`, and `playing` as a single oscillator, so it works with `wirePlayButton`, and `frequencies` reads and sets every note at once.
<div class="jp">`Chord`（`additive.js`）は、周波数ごとにひとつの`AdditiveOscillator`をまとめて同時に鳴らし止めるもので、すべて同じ部分音を持ちます。音程や和音に使います。ひとつのオシレーターと同じ`start()`、`stop()`、`playing`を持つため`wirePlayButton`で扱え、`frequencies`で全音の周波数を一度に読み書きします。</div>

## Tuning

`tuning.js` holds tuning math, as plain functions of frequency ratios.
<div class="jp">`tuning.js`には、音律の計算を周波数比の関数として置きます。</div>

- **`INTERVALS`:** the common intervals, each with its pure `ratio` `[p, q]` (upper / lower = p / q) and its size in equal-tempered `semitones`.
- **`intervalFactor(interval, system)`:** the frequency factor for `'pure'` (p / q) or `'equal'` (2^(semitones / 12)).
- **`cents(factor)`:** 1200 log₂ factor.
- **`meetingHarmonics(interval, system, base)`:** the first pair of harmonics that coincide when the interval is pure (harmonic p of the lower note and q of the upper), their frequencies, and `beat`, their difference in Hz.
- **`stackFifths(n, system)`, `FIFTH_NAMES`:** n fifths stacked up from a starting note and folded into its octave, as `{ index, name, factor, cents }`, from C to B♯. `system` is `'pure'` (3/2; twelve overshoot by the Pythagorean comma) or `'equal'` (2^(7/12); twelve land exactly on the start).
<div class="jp">

- **`INTERVALS`：**よく使う音程で、それぞれ純正な`ratio` `[p, q]`（上 / 下 = p / q）と、平均律での大きさ`semitones`を持ちます。
- **`intervalFactor(interval, system)`：**`'pure'`（p / q）または`'equal'`（2^(semitones / 12)）の周波数比です。
- **`cents(factor)`：**1200 log₂ factorです。
- **`meetingHarmonics(interval, system, base)`：**音程が純正なときに最初に重なる倍音の組（低い音のp番目と高い音のq番目）と、その周波数、差`beat`（Hz）を返します。
- **`stackFifths(n, system)`、`FIFTH_NAMES`：**最初の音から5度をn回重ね、その1オクターブに折りたたんだ音を、CからB♯まで`{ index, name, factor, cents }`で返します。`system`は`'pure'`（3/2。12回でピタゴラスコンマだけ行き過ぎる）または`'equal'`（2^(7/12)。12回でちょうど最初の音に戻る）です。

</div>

## Scales

`scales.js` holds scales as spelled note names (`E♭`, not `D♯`), listed from the scale's `root` (default C), so a spelling fixes both the pitch and the note's place on a staff.
<div class="jp">`scales.js`には、音階を、その`root`（省略時はC）からの綴りつきの音名（`D♯`ではなく`E♭`）で置きます。綴りが音高と五線上の位置の両方を決めます。</div>

- **`SCALES`, `MODES`, `WHITE_KEY_MODES`, `MINOR_SCALES`, `OTHER_SCALES`, `SCALE_SETS`:** scales from C; the seven church modes on C; the same modes on the white keys (C major from each of its notes, with `root`); the three minor scales; other scales common in jazz and pop music; and named sets of these (`scales`, `modes`, `white-key-modes`, `minor`, `other`, `pentatonic`, `diminished`), for a demo that takes the set as a URL parameter. Each scale is `{ id, label, notes, root?, descending? }`; `descending` lists the notes for the way down where they differ (the melodic minor). Scale ids are unique across sets. Add new scales here, never in a demo.
- **`findScale(id)`:** the scale with that id in any set.
- **`scaleNotes(scale, octave, { descending })`:** the scale from its root in `octave` (default 4) up to the root above, as `{ name, letter, accidental, midi, position }`, from the `descending` notes when asked and the scale has them. `position` counts staff steps from C4 (C4 = 0, E4 = 2, C5 = 7).
- **`scaleRun(scale, octave)`:** the scale up to the octave and back down, as `scaleNotes` entries; the way down uses `descending`.
- **`rootMidi(scale, octave)`:** the MIDI number of the scale's root in that octave.
- **`parseNote(name)`, `PITCH_CLASS_NAMES`:** a note name's letter, accidental, and semitones above C; and the plain name of each of the 12 pitch classes.
<div class="jp">

- **`SCALES`、`MODES`、`WHITE_KEY_MODES`、`MINOR_SCALES`、`OTHER_SCALES`、`SCALE_SETS`：**Cから始まる音階、Cを主音とする7つの教会旋法、白鍵上の同じ旋法（Cの長音階を各音から始めたもので、`root`を持つ）、3つの短音階、ジャズやポップ音楽でよく使うその他の音階、そしてそれらを名前で引けるようにしたセット（`scales`、`modes`、`white-key-modes`、`minor`、`other`、`pentatonic`、`diminished`）です。セットは、URLのパラメータで受け取るデモに使います。各音階は`{ id, label, notes, root?, descending? }`の形で、`descending`は下行で音が異なる場合（旋律的短音階）の下行の音です。音階のidはセットをまたいで一意です。新しい音階はデモではなく、ここに追加します。
- **`findScale(id)`：**どのセットからでも、そのidの音階を返します。
- **`scaleNotes(scale, octave, { descending })`：**`octave`（省略時は4）の主音から1オクターブ上の主音までの音階を、`{ name, letter, accidental, midi, position }`で返します。指定され、音階が持っていれば`descending`の音を使います。`position`はC4からの五線上の段数です（C4 = 0、E4 = 2、C5 = 7）。
- **`scaleRun(scale, octave)`：**オクターブまで上がって戻る音階を、`scaleNotes`の要素で返します。下行には`descending`を使います。
- **`rootMidi(scale, octave)`：**その音域での主音のMIDI番号です。
- **`parseNote(name)`、`PITCH_CLASS_NAMES`：**音名の文字、変化記号、Cからの半音数と、12のピッチクラスそれぞれの基本の音名です。

</div>

## Sequence

`Sequence` (`sequence.js`) plays `notes` (MIDI numbers) one after another on an instrument, `step` seconds apart, holding each for `gate` of the step, at `velocity`, once or (`loop: true`) until stopped; a repeated bass note is a one-note loop. It has the `start()`, `stop()`, and `playing` of a continuous source, so it works with `wirePlayButton`, and it stops by itself at the end. `onStep(index, midi)` runs as each note starts (and with `(-1, null)` at the end), and `onEnd` when it ends or is stopped. It uses browser timers, which are steady enough at a few hundred milliseconds per note.
<div class="jp">`Sequence`（`sequence.js`）は、`notes`（MIDI番号）を楽器で`step`秒おきに`velocity`の強さで順に鳴らし、各音を歩幅の`gate`の割合だけ保ちます。一度だけ、または（`loop: true`で）止めるまで繰り返します。繰り返す低音は、1音のループです。持続する音源と同じ`start()`、`stop()`、`playing`を持つため`wirePlayButton`で扱え、最後まで来ると自分で止まります。`onStep(index, midi)`は各音の開始時に（終了時は`(-1, null)`で）、`onEnd`は終了または停止時に呼ばれます。ブラウザのタイマーを使いますが、1音数百ミリ秒の間隔なら十分に安定しています。</div>

## Rhythm

`rhythm.js` holds rhythm patterns and the sequencer that plays them on a `DrumKit`. A pattern is one cycle (usually a bar) of equal steps: `{ id, label, stepsPerBeat, groups, tempo, tracks }`. `groups` lists the steps in each beat group (`[2, 2, 3]` for 7/8) and `tempo` counts beats per minute. Each track is `{ id, label, midi, steps, offset?, gain? }`: one velocity per step (0 is a rest), moved off the grid by `offset` seconds (negative is early) and scaled by `gain`.

- **`DRUM_TRACKS`:** the tracks a pattern can use, high to low: hat, rim, snare, kick.
- **`makePattern(def)`:** builds a pattern from one string per track, one character per step: `X` full (`FULL`), `x` soft (`SOFT`, half), `-` rest; spaces are ignored. `trackIds` picks the tracks.
- **`clonePattern(pattern)`:** a copy to edit. **`pulsePattern(count, accent)`:** a rim-click pulse, with every `accent`-th beat full and the others soft, or all the same.
- **`METER_PATTERNS`, `FEEL_PATTERNS`, `BACKBEAT`, `PATTERN_SETS`:** beats in common time signatures (eighth-note steps); subdivisions and styles (quarter, eighth, sixteenth notes, funk, shuffle, swing, bossa nova); the simple beat for timing and loudness; and the sets by name (`meters`, `feels`). Add patterns here, never in a demo.
- **`StepSequencer(instrument, { pattern, tempo, onStep })`:** loops a pattern until stopped, with the `start()`, `stop()`, and `playing` of a continuous source. Notes are scheduled about 0.2 s ahead on the audio clock, so they land exactly on (or exactly `offset` off) the grid; `onStep(i)` runs as step `i` sounds, and with -1 when stopped. `pattern` and `tempo` can change while playing. `stepDuration` is the seconds per step. `MAX_EARLY` (0.1 s) is the most a track can be moved early.
<div class="jp">

`rhythm.js`には、リズムのパターンと、それを`DrumKit`で鳴らすシーケンサーを置きます。パターンは等しいステップからなる1周期（ふつうは1小節）で、`{ id, label, stepsPerBeat, groups, tempo, tracks }`の形です。`groups`は拍のまとまりごとのステップ数（7/8なら`[2, 2, 3]`）、`tempo`は1分あたりの拍数です。各トラックは`{ id, label, midi, steps, offset?, gain? }`で、ステップごとのベロシティ（0は休み）を持ち、`offset`秒だけグリッドからずらし（負は前）、`gain`倍します。

- **`DRUM_TRACKS`：**パターンが使えるトラックで、高い音から順にハイハット、リム、スネア、キックです。
- **`makePattern(def)`：**トラックごとの文字列からパターンをつくります。1文字が1ステップで、`X`が強（`FULL`）、`x`が弱（`SOFT`、半分）、`-`が休みです。空白は無視します。`trackIds`でトラックを選びます。
- **`clonePattern(pattern)`：**編集用のコピーです。**`pulsePattern(count, accent)`：**リムクリックの拍で、`accent`拍ごとに強く、ほかは弱く、または全部同じに鳴らします。
- **`METER_PATTERNS`、`FEEL_PATTERNS`、`BACKBEAT`、`PATTERN_SETS`：**よく使う拍子のビート（8分音符のステップ）、細分とスタイル（4分、8分、16分音符、ファンク、シャッフル、スウィング、ボサノヴァ）、タイミングと音量を聞くための簡単なビート、そしてそれらを名前で引くセット（`meters`、`feels`）です。パターンはデモではなく、ここに追加します。
- **`StepSequencer(instrument, { pattern, tempo, onStep })`：**止めるまでパターンを繰り返し、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。音はオーディオクロック上で約0.2秒先に予約するので、ぴったりグリッド上に（または`offset`だけ正確にずれて）鳴ります。`onStep(i)`はステップ`i`が鳴るときに、停止時は-1で呼ばれます。演奏中に`pattern`と`tempo`を変えられます。`stepDuration`は1ステップの秒数、`MAX_EARLY`（0.1秒）はトラックを前にずらせる最大量です。

</div>

## Phasing

`PhasePlayer(instruments, { notes, step, drift, onStep })` (in `rhythm.js`) plays the same loop of `notes` on two instruments, panned left and right, the second `drift` percent faster, so they move out of phase and back (Steve Reich's phasing). It owns `output` (connect it to the master bus) and has the `start()`, `stop()`, and `playing` of a continuous source; `onStep(voice, i)` runs as each voice plays note `i`, and `(-1, -1)` when stopped. `PHASE_LOOP` is an original twelve-note loop for it.
<div class="jp">

`PhasePlayer(instruments, { notes, step, drift, onStep })`（`rhythm.js`）は、同じ`notes`のループを、左右に振った2つの楽器で、2つ目を`drift`パーセントだけ速く鳴らし、位相をずらしては戻します（スティーヴ・ライヒのフェイズ）。`output`を持ち（マスターバスにつなぐ）、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。`onStep(voice, i)`は各声部が`i`番目の音を鳴らすときに、停止時は`(-1, -1)`で呼ばれます。`PHASE_LOOP`はそのためのオリジナルの12音のループです。

</div>

## Chords and Progressions

`chords.js` holds chords, progressions, and their player. A chord symbol is a root, a quality from `QUALITIES` (`m7`, `maj7`, `7`, `m7♭5` …), optional tensions in parentheses (`G7(♭9)`), and an optional slash bass (`D♭/F`); ♭/♯ or b/# both work.

- **`parseChord(symbol)`:** `{ symbol, root, bass, intervals }`, pitch classes and semitones above the root.
- **`voiceProgression(chords, melody)`:** voices chords for piano: the bass in E2–D♯3, the other tones in close position above (the root left to the bass in four-note chords, the fifth dropped in chords of five or more, or with ♯5/♭13), each chord in the inversion that moves least from the last, and below the melody when there is one. Chords with hand-written `notes` keep them. Returns `{ bass, upper, notes }` per chord.
- **Progressions:** `{ id, label, tempo, loop?, chords: [{ symbol, beats, roman?, fn?, notes? }], melody?: [{ midi, beats }] }`. The sets, by page: `DIATONIC_`, `CHORD_TYPE_`, `SEVENTH_`, `FUNCTIONAL_`, `RESOLUTION_`, `SUBDOMINANT_MINOR_`, `NON_FUNCTIONAL_`, `REHARMONIZATION_PROGRESSIONS`, and `PROGRESSION_SETS` by name for `?set=`. Add progressions here, never in a demo.
- **`ProgressionPlayer(instrument, { onChord, onMelody, onEnd })`:** `setProgression(p)` voices it (`voicings`); `start()`, `stop()`, `playing` as a continuous source. Chords and melody are scheduled ahead on the audio clock; `onChord(i)` / `onMelody(i)` run as each starts (-1 when stopped), `onEnd` when a non-looping progression finishes.
<div class="jp">

`chords.js`には、和音、進行、その再生を置きます。コード・シンボルは、根音、`QUALITIES`の種類（`m7`、`maj7`、`7`、`m7♭5`…）、括弧内の省略可能なテンション（`G7(♭9)`）、省略可能なスラッシュのベース（`D♭/F`）からなり、♭/♯でもb/#でも書けます。

- **`parseChord(symbol)`：**`{ symbol, root, bass, intervals }`、ピッチクラスと根音からの半音数です。
- **`voiceProgression(chords, melody)`：**ピアノ向けに和音を配置します。ベースをE2〜D♯3に、ほかの音をその上に密集配置で置き（4音以上の和音では根音をベースに任せ、5音以上や♯5/♭13を含む和音では5度を省く）、各和音を前の和音からいちばん少なく動く転回形にし、旋律があればその下に置きます。`notes`を手で書いた和音はそれを使います。和音ごとに`{ bass, upper, notes }`を返します。
- **進行：**`{ id, label, tempo, loop?, chords: [{ symbol, beats, roman?, fn?, notes? }], melody?: [{ midi, beats }] }`。ページごとのセットは`DIATONIC_`、`CHORD_TYPE_`、`SEVENTH_`、`FUNCTIONAL_`、`RESOLUTION_`、`SUBDOMINANT_MINOR_`、`NON_FUNCTIONAL_`、`REHARMONIZATION_PROGRESSIONS`で、`PROGRESSION_SETS`が`?set=`用に名前で引きます。進行はデモではなく、ここに追加します。
- **`ProgressionPlayer(instrument, { onChord, onMelody, onEnd })`：**`setProgression(p)`で配置し（`voicings`）、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。和音と旋律はオーディオクロック上で先に予約します。`onChord(i)` / `onMelody(i)`はそれぞれの開始時に（停止時は-1で）、`onEnd`は繰り返さない進行が終わったときに呼ばれます。

</div>

## Granular Synthesis

`granular.js`: `GranularSource` loops a recording (from `GRAIN_SOURCES`, single notes found with `sampleUrl(instrument, file)` from `instruments.js`) through `Tone.GrainPlayer`, the first two seconds of it. `setSource(id)` loads another (returns `ready`). `rate` (speed through the recording), `detune` (cents), `grainSize` and `overlap` (seconds), and `reverse` are independent. Same `start()`, `stop()`, `playing` as a continuous source; connect `output`.
<div class="jp">

`granular.js`：`GranularSource`は、録音（`GRAIN_SOURCES`の単音で、`instruments.js`の`sampleUrl(instrument, file)`で求める）の最初の2秒を、`Tone.GrainPlayer`でループします。`setSource(id)`で別の録音を読み込みます（`ready`を返す）。`rate`（録音を進む速さ）、`detune`（セント）、`grainSize`と`overlap`（秒）、`reverse`はそれぞれ独立です。持続する音源と同じ`start()`、`stop()`、`playing`を持ち、`output`をつなぎます。

</div>

## ProgressionView

`ProgressionView` (`ProgressionView.js`) draws a progression as a piano roll: time to the right (each chord as wide as its beats), pitch up, each voiced note a yellow bar across its chord, the melody in pink, sounding notes red. Chord symbols sit above; Roman numerals and functions, when present, below. Pressing a chord calls `onPress(i)` / `onRelease(i)`. `update(progression, voicings)`, `setChord(i)`, `setNote(i)`. The progression demo pairs it with a `Keyboard` whose `setLit(midis)` lights the sounding notes.
<div class="jp">

`ProgressionView`（`ProgressionView.js`）は、進行をピアノロールとして描きます。時間は右へ（各和音は拍の長さぶんの幅）、音高は上へ進み、配置された各音は和音の幅の黄色い横棒、旋律はピンク、鳴っている音は赤です。コード・シンボルは上に、ローマ数字と機能は（あれば）下に置きます。和音を押すと`onPress(i)` / `onRelease(i)`を呼びます。`update(progression, voicings)`、`setChord(i)`、`setNote(i)`。進行のデモでは、鳴っている音を`setLit(midis)`で光らせる`Keyboard`と組み合わせます。

</div>

## CycleView and StepGrid

Both draw a rhythm pattern and share `update(pattern, stepDuration)` (the step duration converts track offsets into steps) and `setStep(i)` (the sounding step, -1 for none; `CycleView` also takes an array, one step per track). Hits are yellow with their size or height following velocity times gain, the sounding step's hits are red, and a track with an `offset` is drawn moved by that share of a step.

- **`CycleView`** (`CycleView.js`): the pattern as a cycle, steps running clockwise from the top, one white ring per track with the first track outermost. A lone track gets larger dots.
- **`StepGrid`** (`StepGrid.js`): an editable grid, a labeled row per track and a cell per step, wider gaps between beat groups; the sounding column's wells are butter. Clicking a cell cycles it rest → full → soft and calls `onEdit(track, step, velocity)`. It lives in a `.canvas-wrap.dp-strip` below the stage (the stacked layout) and sets the strip's height to its rows.
<div class="jp">

どちらもリズムのパターンを描き、`update(pattern, stepDuration)`（ステップの長さはトラックのずれをステップ数に換算するため）と`setStep(i)`（鳴っているステップ、なしは-1）を共有します。打音は黄色で、大きさや高さはベロシティとゲインの積に従います。鳴っているステップの打音は赤く、`offset`を持つトラックは、そのぶんステップの割合だけずらして描きます。

- **`CycleView`**（`CycleView.js`）：パターンを周期として、上から時計回りにステップを並べ、トラックごとに白いリングを描きます（最初のトラックがいちばん外側）。トラックがひとつのときは点を大きくします。
- **`StepGrid`**（`StepGrid.js`）：編集できるグリッドで、トラックごとにラベルつきの行、ステップごとにセルを並べ、拍のまとまりのあいだを広く空けます。鳴っている列のくぼみはバター色です。セルをクリックすると休み → 強 → 弱と変わり、`onEdit(track, step, velocity)`を呼びます。ステージの下の`.canvas-wrap.dp-strip`（スタック型のレイアウト）に置き、帯の高さを行数に合わせます。

</div>

## ScaleView

`ScaleView` (`public/lib/demo/ScaleView.js`) shows a scale two ways: a row of 13 squares from the root to the root an octave above (white wells for notes outside the scale, yellow for notes in it, labeled with the scale's spelling), and the scale written ascending on a treble staff with ledger lines and accidentals (up and back down for a scale with `descending`). The sounding note is red in both. Pressing a square plays its note through `onNoteOn` / `onNoteOff`. Call `update(scale)` and `setSounding(midi, step)`; `step` is the note's index in `scaleRun` while a run plays (or null), so the squares follow the direction and the staff marks that one note. The clef and accidentals use the Noto Music web font, which the demo page loads.
<div class="jp">`ScaleView`（`public/lib/demo/ScaleView.js`）は、音階を2通りに表示します。基準音から1オクターブ上の基準音までの13の四角の列（音階外の音は白いくぼみ、音階の音は黄色で、音階の綴りでラベルをつける）と、加線や変化記号をつけて五線譜に上行で書いた音階（`descending`を持つ音階は上行と下行）です。鳴っている音は両方で赤くなります。四角を押すと、`onNoteOn` / `onNoteOff`でその音を鳴らします。`update(scale)`と`setSounding(midi, step)`を呼びます。`step`は、上下行の演奏中に`scaleRun`の中でのその音の位置（それ以外はnull）で、四角は進む方向に合わせて変わり、五線譜はその1音だけを示します。音部記号と変化記号には、デモのページが読み込むNoto Musicのウェブフォントを使います。</div>

## BeatView

`BeatView` (`public/lib/demo/BeatView.js`) draws half a second of two sine waves that differ by `beat` hertz, each as a thin yellow line, and their sum (the main wave) as a red line on top. The sum keeps a steady size at 0 Hz and swells and shrinks `beat` times per second otherwise. The beating harmonics are near 1000 Hz, more than a hundred cycles per swell, so the waves are drawn at 48 Hz (`DRAWN_HZ`) while keeping the real difference between them: every cycle is visible and the swells keep their real rate. Call `update(beat)`; it is computed, so it shows whether or not anything is playing.
<div class="jp">`BeatView`（`public/lib/demo/BeatView.js`）は、`beat` Hzだけ異なる2つのサイン波を0.5秒分、それぞれ黄色の細い線で、その和（主要な波）を赤い線で上に重ねて描きます。和の大きさは0 Hzでは一定で、それ以外では1秒に`beat`回膨らんだり縮んだりします。うなる倍音は約1000 Hzで、1回の膨らみに100以上の周期が入って細かすぎるため、波は2つの差を保ったまま48 Hz（`DRAWN_HZ`）で描きます。各周期が見え、膨らみの速さは実際のままです。`update(beat)`を呼びます。計算で描くため、音が鳴っていてもいなくても表示されます。</div>

## FifthsRing

`FifthsRing` (`public/lib/demo/FifthsRing.js`) draws notes within one octave on a ring: the full circle is 1200 cents, starting at the top and running clockwise. The ring is a white well, notes are yellow dots labeled outside the ring, and the latest note is red with its label inside, so it can sit next to another note without the labels colliding. Call `update(notes)` with `{ name, cents }`, oldest first.
<div class="jp">`FifthsRing`（`public/lib/demo/FifthsRing.js`）は、1オクターブの中の音をリング上に描きます。円の一周が1200セントで、上から時計回りに進みます。リングは白いくぼみで、音はリングの外側にラベルのある黄色い点です。最新の音は赤で、ラベルを内側に置くため、ほかの音のすぐ隣にあってもラベルが重なりません。古い順の`{ name, cents }`で`update(notes)`を呼びます。</div>

## Keyboard

`Keyboard` (`public/lib/demo/Keyboard.js`) builds the on-screen input inside a `.dp-keyboard` element, shaped to the sound: a piano keyboard, or pads for sounds without pitch. It reports notes as MIDI numbers through `onNoteOn` and `onNoteOff` and makes no sound itself. `setLit(midis)` lights keys for notes played from elsewhere (a chord from a progression) in the same yellow.
<div class="jp">`Keyboard`（`public/lib/demo/Keyboard.js`）は、`.dp-keyboard`要素の中に、音に合わせた画面上の入力をつくります。鍵盤か、音高を持たない音ではパッドです。音符をMIDI番号として`onNoteOn`と`onNoteOff`で通知するだけで、自身は音を鳴らしません。`setLit(midis)`は、ほかから鳴らした音（進行の和音など）の鍵盤を同じ黄色で光らせます。</div>

- **Range:** `low` (a C) and `octaves`, with a top C added. `shiftOctave(±1)` moves it.
- **Pointer:** dragging glides across keys.
- **Computer keys:** A to ; play from the lowest C (white keys on the home row, black keys on the row above). Z and X shift the octave.
- **Overlapping sources:** a note held by a key and a pointer at once sounds once, and stops when the last one lets go.
- **`whiteOnly`, `setRoot(pc)`:** `whiteOnly: true` builds white keys only, each labeled with its letter, played from the home row (A = the lowest C, S = D, …), for music on the white keys. `setRoot(pc)` marks every key of one pitch class in butter yellow, so the home note stays visible.
- **`setPads(pads)`:** switches to a row of pads (an instrument's `pads`) or back to piano keys (null). Pads are equal white shapes one grid unit apart, labeled at the bottom; A, S, D, … play them from the left, and a single pad answers to all of those keys and the space bar. Octave shifting applies to keys only.
<div class="jp">

- **音域：**`low`（Cの音）と`octaves`で決まり、最上部にCが1つ加わります。`shiftOctave(±1)`で移動します。
- **ポインター：**ドラッグすると鍵盤の上を滑るように弾けます。
- **コンピューターのキー：**Aから;までが最も低いCから鳴ります（ホーム列が白鍵、その上の列が黒鍵）。ZとXでオクターブを切り替えます。
- **重なった入力：**キーとポインターで同時に押さえた音は一度だけ鳴り、最後の入力が離れたときに止まります。
- **`whiteOnly`、`setRoot(pc)`：**`whiteOnly: true`では白鍵だけをつくり、それぞれに音名を表示して、ホーム列（Aが最も低いC、SがD……）で弾けるようにします。白鍵の音楽に使います。`setRoot(pc)`は、ひとつのピッチクラスのすべての鍵盤をバター色で示し、主音が見えるようにします。
- **`setPads(pads)`：**パッドの列（楽器の`pads`）に切り替えるか、鍵盤（null）に戻します。パッドは1グリッド間隔で並ぶ同じ大きさの白い形で、下にラベルがあります。A、S、D……のキーで左から鳴らせ、パッドがひとつのときは、それらのキーとスペースキーのどれでも鳴ります。オクターブの切り替えは鍵盤のときだけです。

</div>

## Scope

`Scope` (`public/lib/demo/Scope.js`) draws a signal on a canvas inside a `.canvas-wrap`, sized by `Viewport`. It listens to a source node and does not pass audio on. Set `mode` to switch views. `size` (2048) is the waveform's analysis length and `fftSize` (4096) the number of spectrum bins; more bins resolve low frequencies better but react more slowly.
<div class="jp">`Scope`（`public/lib/demo/Scope.js`）は、`.canvas-wrap`の中のキャンバスに信号を描きます。サイズは`Viewport`で決まります。ソースのノードを聞くだけで、音を先に渡しません。`mode`で表示を切り替えます。`size`（2048）は波形の解析長、`fftSize`（4096）はスペクトルのビン数です。ビンが多いほど低い周波数をよく分解できますが、反応は遅くなります。</div>

- **`'wave'`:** amplitude over half the analysis length (about 21 ms at 2048 samples and 48 kHz), starting at a rising zero crossing so a periodic wave holds still.
- **`'spectrum'`:** level in dB from 20 Hz to 20 kHz on a logarithmic frequency axis.
- **`'both'`:** the waveform in the upper half and the spectrum in the lower half.
- **`freeze()`, `unfreeze()`:** `freeze()` holds the current frame (or replaces the held one) until `unfreeze()`, for reading short sounds.
- **`freezeOnNextOnset()`:** (not used by any demo at present) freezes just after the next sound arrives. It watches the newest samples for the signal to rise above a threshold, since output latency varies by device and a fixed delay after the note can miss a drum hit.
<div class="jp">

- **`'wave'`：**解析長の半分（2048サンプル、48 kHzで約21ミリ秒）の振幅を描きます。周期的な波が静止して見えるよう、上向きのゼロ交差から描き始めます。
- **`'spectrum'`：**20 Hzから20 kHzまでの音量（dB）を、対数の周波数軸で描きます。
- **`'both'`：**上半分に波形、下半分にスペクトルを描きます。
- **`freeze()`、`unfreeze()`：**`freeze()`は、`unfreeze()`まで現在のフレームを保持します（すでに保持していれば置き換えます）。短い音を読み取るために使います。
- **`freezeOnNextOnset()`：**（現在はどのデモも使っていません）次の音が届いた直後に表示を止めます。出力の遅延は機器によって異なり、音符から一定時間後に止めるとドラムの打音を逃すことがあるため、最新のサンプルがしきい値を超えるのを監視します。

</div>

## PartialsView

`PartialsView` (`public/lib/demo/PartialsView.js`) draws an additive tone from its partial list rather than from audio, so it shows whether or not the tone is playing. It draws directly on the paper with no panels, titles, or labels: two periods of the fundamental, each partial as a thin yellow line and their sum (the main wave) as a thick red line on top, all at the scale `AdditiveOscillator` plays, so the yellow lines add up to the red one. Call `update(partials)` after every change.
<div class="jp">`PartialsView`（`public/lib/demo/PartialsView.js`）は、加算合成の音を、音声からではなく部分音のリストから描きます。そのため、音が鳴っていてもいなくても表示されます。パネルや見出し、ラベルを使わず、紙の上に直接、基音の2周期分を描きます。各部分音を黄色の細い線で、その和（主要な波）を赤い太い線で上に重ね、`AdditiveOscillator`が鳴らすのと同じスケールで描くため、黄色の線を足すと赤い線になります。変更のたびに`update(partials)`を呼びます。</div>

## Recording demos

`public/lib/page/demoRecorder.js` runs on the page, not in a demo. The layout loads it once, and it adds a small "record ●" button under every embedded demo (`.demo-wrap`). Pressing it asks the browser to share the current tab (`getDisplayMedia`, with the tab's audio), crops the video to the demo's iframe where region capture exists (`CropTarget`, Chrome), and records with `MediaRecorder`. The button reads "stop ■" while recording. Stopping, from the button or from the browser's own sharing controls, downloads the file, named after the iframe's `title`. It is MP4 (H.264 and AAC) where MediaRecorder can write it (Chrome, Safari) and WebM otherwise (Firefox). A page cannot read its own pixels and audio without that prompt, so the browser asks every time.
<div class="jp">`public/lib/page/demoRecorder.js`はデモの中ではなく、ページ上で動きます。レイアウトが一度だけ読み込み、埋め込まれたすべてのデモ（`.demo-wrap`）の下に小さな「record ●」ボタンを加えます。押すと、ブラウザに現在のタブの共有（`getDisplayMedia`、タブの音声を含む）を求め、領域キャプチャ（`CropTarget`、Chrome）が使える場合は映像をデモのiframeに切り抜いて、`MediaRecorder`で録画します。録画中のボタンは「stop ■」になります。ボタンか、ブラウザ自身の共有の操作で止めると、iframeの`title`にちなんだ名前でファイルをダウンロードします。MediaRecorderがMP4（H.264とAAC）を書き出せるブラウザ（Chrome、Safari）ではMP4、それ以外（Firefox）ではWebMです。ページは、この確認なしに自分の画面と音声を読み取れないため、ブラウザは毎回確認を求めます。</div>

## Colors

`public/lib/demo/colors.js` holds the demo palette, sampled from a flower illustration: `paper` (a bright off-white) is the background for the whole demo, `white` is for wells on it (white keys, slider tracks, idle toggles, selects), `ink` is the only text color, `green` marks the main controls, `red` draws the main wave, and `pink`, `yellow`, `darkGreen`, `butter`, and `green` are the accents for a series, in that order (`ACCENTS` leaves red out, and puts green last so it shows up only in longer series). `ACCENTS` lists the accents in an order where neighbors contrast, and `accent(i)` cycles through it for a series (voices, notes, harmonics).
<div class="jp">`public/lib/demo/colors.js`には、花のイラストから抽出したデモ用のパレットを置きます。`paper`（明るいオフホワイト）がデモ全体の背景、`white`がその上のくぼみ（白鍵、スライダーのトラック、オフのトグル、セレクト）、`ink`が唯一の文字色、`green`が主要なコントロールの色、`red`が主要な波の色で、`pink`、`yellow`、`darkGreen`、`butter`、`green`がこの順で系列のアクセントです（`ACCENTS`には赤を含めず、緑は長い系列にだけ現れるよう最後に置きます）。`ACCENTS`は、隣り合う色が対比するようにアクセントを並べたもので、`accent(i)`は、系列（声部、音符、倍音など）に順に色を割り当てます。</div>

`demo-ui.css` mirrors the palette as CSS custom properties (`--demo-bg`, `--accent-pink`, …). Change both together.

The demo style rules are listed in `CLAUDE.md`: one font (monospace), size, and weight; black text, or white on red, green, and dark fills; a 16px grid for every size and space; no titles or explanations that the page text gives, and no "Open full size" links; one background shared by the panel and the stage; white for wells; green for the main controls; red for the main wave; filled shapes instead of outlines, except waveforms, which are lines; no borders, rules, or grid lines; no nested boxes. `--accent` (green by default) can be set on any element to recolor the controls inside it. Plots sit directly on the paper: the scope draws the waveform as a red line and fills the spectrum yellow. Played keys, white or black, light up yellow, the gaps between keys are the background showing through, and labels go on white keys only.
<div class="jp">`demo-ui.css`は、同じパレットをCSSのカスタムプロパティ（`--demo-bg`、`--accent-pink`など）として持ちます。両方を一緒に変更してください。

デモのスタイルの規則は`CLAUDE.md`にまとめています。フォント（等幅）、文字のサイズと太さはひとつだけにする。文字は黒、ただし赤、緑、暗い色の上では白にする。すべての大きさと余白を16pxのグリッドに揃える。ページの本文にある見出しや説明をデモに入れず、「Open full size」のリンクも置かない。パネルとステージは同じ背景にする。くぼみには白を使う。主要なコントロールは緑、主要な波は赤にする。形は線で囲まずに塗る（ただし波形は線で描く）。枠線、罫線、グリッド線を使わない。入れ子の箱をつくらない。`--accent`（初期値は緑）を任意の要素に設定すると、その中のコントロールの色が変わります。プロットは紙の上に直接描き、スコープは波形を赤い線で描き、スペクトルを黄色で塗ります。弾いた鍵盤は白鍵も黒鍵も黄色に光り、鍵盤のあいだの隙間は背景の色で、ラベルは白鍵にだけ表示します。</div>

## Panel controls

`public/lib/demo/controls.js` builds `dp-*` controls from data, for controls that come from a library registry rather than being fixed in a demo's HTML.
<div class="jp">`public/lib/demo/controls.js`は、データから`dp-*`のコントロールを組み立てます。デモのHTMLに固定するのではなく、ライブラリのレジストリから来るコントロールに使います。</div>

- **`addRange(parent, param)`:** a labeled slider; takes an effect parameter's fields directly. The track fills with the accent color up to the value (`--fill`, kept in step from script), and `color` sets that accent for one row.
- **`setRange(input, value)`:** moves a slider made by `addRange` and updates its readout, without firing `onChange`.
- **`formatValue(v, unit, step)`:** the readout text: whole numbers for Hz, dB, and any slider whose `step` is 1 or more; milliseconds or seconds for `'s'`; two decimals otherwise.
- **`wirePlayButton(button, source, startAudio)`** (in `panel.js`): a green Play/Stop button for anything with `start()`, `stop()`, and `playing`. It returns its `sync` function, for a source that stops by itself (a `Sequence`) to call so the label returns to Play.
- **`addSelect(parent, { label, options, value, onChange })`:** options sharing a `group` become one optgroup. The select gives up focus after a change, so the computer keyboard goes back to playing notes.
- **`addSection(parent, title, { collapsed, color })`:** a collapsible section; returns its body. `color` sets the accent for the section and its controls.
- **`unwrap(mount)`:** replaces a mount element with the controls built into it, so they sit directly in the panel.
- **`addEffectControls(parent, chain)`:** one section per effect in an `EffectChain`, one slider per parameter. Each section takes the next accent color.
<div class="jp">

- **`addRange(parent, param)`：**ラベル付きのスライダーです。エフェクトのパラメータの項目をそのまま受け取ります。トラックは値の位置までアクセントカラーで塗られ（`--fill`をスクリプトで更新）、`color`でその行のアクセントを設定します。
- **`setRange(input, value)`：**`addRange`でつくったスライダーを動かし、表示も更新します。`onChange`は呼びません。
- **`wirePlayButton(button, source, startAudio)`**（`panel.js`）：`start()`、`stop()`、`playing`を持つものに対するPlay/Stopボタンです。
- **`addSelect(parent, { label, options, value, onChange })`：**同じ`group`を持つ選択肢は、ひとつのoptgroupにまとめます。変更後にフォーカスを手放すため、コンピューターのキーボードはすぐに演奏に戻ります。
- **`addSection(parent, title, { collapsed, color })`：**折りたたみ可能なセクションをつくり、その本体を返します。`color`で、セクションとその中のコントロールのアクセントを設定します。
- **`unwrap(mount)`：**マウント用の要素を、その中につくったコントロールで置き換え、コントロールがパネルの直下に並ぶようにします。
- **`addEffectControls(parent, chain)`：**`EffectChain`のエフェクトごとにセクションを、パラメータごとにスライダーをつくります。各セクションには順にアクセントカラーが割り当てられます。

</div>

</div>
