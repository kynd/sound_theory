# Audio library

Reference for `public/lib/`. Not published; kept in step with the code.

<div class="prose">

The classes that make and shape sound (`public/lib/audio/`), and the demo components that play and display it (`public/lib/demo/`). All of them are built on [Tone.js](https://tonejs.github.io/) 15.1.22, loaded through the import map in each demo's `index.html`.
<div class="jp">音をつくり、加工するクラス（`public/lib/audio/`）と、それを演奏・表示するデモ用コンポーネント（`public/lib/demo/`）です。すべて[Tone.js](https://tonejs.github.io/) 15.1.22の上に構築し、それぞれのデモの`index.html`にあるインポートマップから読み込みます。</div>

## The audio engine

`AudioEngine.js` holds what every demo shares. Importing it sets Tone's `lookAhead` to 0, so notes start the moment a key is pressed instead of 0.1 s later; a demo that schedules sequences on the Transport can raise it again.
<div class="jp">`AudioEngine.js`には、すべてのデモが共有するものを置きます。読み込むとToneの`lookAhead`を0にするため、音は0.1秒遅れずに、鍵盤を押した瞬間に鳴ります。Transportで先にシーケンスを予約するデモでは、値を戻せます。</div>

- **`startAudio()`:** resumes the audio context. Browsers keep it suspended until a user gesture, so call it from inside a pointer or key handler before the first note. Do not await it before playing: schedule the note right after the call. The suspended context's clock stands still, so the note starts when audio resumes, and a quick tap's noteOff cannot overtake its noteOn and leave a sound stuck on.
- **`MasterBus`:** the last stage before the speakers, a volume control (`volume`, in dB) followed by a limiter at −1 dB. Every demo routes its sound through one.
- **`midiToNote(midi)`, `midiToFrequency(midi)`:** conversions from a MIDI number (60 = C4) to a note name and to Hz at A4 = 440 Hz.
- **`frequencyToMidi(hz)`, `nearestNote(hz)`:** the reverse. `frequencyToMidi` returns a fractional MIDI number; `nearestNote` returns `{ midi, name, cents }`, the nearest equal-tempered note and the offset from it in cents.
- **`audioNow()`:** the audio clock in seconds, the time notes are scheduled against, for drawing that follows scheduled notes.
<div class="jp">

- **`startAudio()`：**オーディオコンテキストを再開します。ブラウザはユーザー操作があるまでコンテキストを停止させておくため、最初の音の前に、ポインターやキーのハンドラの中で呼びます。音を鳴らす前にawaitせず、呼んだ直後に音を予約します。停止中のコンテキストの時計は進まないため、音はオーディオの再開と同時に鳴り、短いタップのnoteOffがnoteOnを追い越して音が鳴りっぱなしになることもありません。
- **`MasterBus`：**スピーカーの手前の最終段で、音量（`volume`、dB）と−1 dBのリミッターからなります。すべてのデモは、音をひとつの`MasterBus`に通します。
- **`midiToNote(midi)`、`midiToFrequency(midi)`：**MIDI番号（60 = C4）から音名へ、またA4 = 440 HzでのHzへ変換します。
- **`frequencyToMidi(hz)`、`nearestNote(hz)`：**その逆の変換です。`frequencyToMidi`は小数のMIDI番号を返し、`nearestNote`は最も近い平均律の音と、そこからのずれ（セント）を`{ midi, name, cents }`で返します。
- **`audioNow()`：**音を予約する基準となるオーディオクロック（秒）です。予約した音に合わせて描くときに使います。

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
- **`LayeredHit`:** one impact from four layers in `layers` (`{ id, label, gain }`): a thump (a sine whose pitch drops), a crack (a burst of high-passed noise), a ring (a metallic clang), and a tail (dark noise into a long reverb). Each layer's `gain` sets its level. Its `pads` are **Mix** (MIDI 60, every layer) and one pad per layer (61 to 64, that layer alone), for the layering demo.
<div class="jp">

- **`PolyInstrument`：**Toneのモノフォニックな音源（`Synth`、`FMSynth`、`AMSynth`など）を`Tone.PolySynth`で束ねたもので、最大32音を同時に鳴らせます。
- **`SampledInstrument`：**`Tone.Sampler`です。最も近い録音の音高をずらして鳴らします。サンプルの読み込み前に弾いた音は無視します。
- **`DrumKit`：**合成ドラム（キック、スネア、クラップ、ハイハット、オープンハイハット、タム、クラッシュ）で、パーツごとのパッドで演奏します。それぞれのパーツは、どのオクターブでも白鍵にも割り当てています（CからBへこの順）。リズムのパターン用に、リムクリックをパッドなしでC♯に置いています（General MIDIのサイドスティックと同じ）。ほかの黒鍵は鳴りません。`DRUM_NOTES`がそれぞれのパーツの音を示します。2つのハイハットはひとつのシンセを共有するため、クローズドハイハットがオープンハイハットを止めます（チョーク）。
- **`NoiseInstrument`：**持続するホワイト、ピンク、ブラウンノイズで、ひとつのパッドで演奏します。どの音符でも同じ音が鳴り、いずれかを押さえているあいだ続きます。
- **`LayeredHit`：**4つのレイヤー（`layers`、`{ id, label, gain }`）でできたひとつの衝撃音です。ドスン（音高が下がるサイン波）、パキッ（ハイパスしたノイズのバースト）、響き（金属的な音）、余韻（長いリバーブへ入る暗いノイズ）。それぞれのレイヤーの`gain`が音量を決めます。`pads`は、すべてのレイヤーを鳴らす**Mix**（MIDI 60）と、レイヤーをひとつだけ鳴らすレイヤーごとのパッド（61〜64）で、レイヤーのデモで使います。

</div>

### Presets

`INSTRUMENTS` lists every preset in menu order, as `{ id, label, group, create }`; `createInstrument(id)` builds one. Add new presets there, never in a demo. Waveform presets are leveled by ear, since a square or sawtooth at the same amplitude as a sine sounds much louder.
<div class="jp">`INSTRUMENTS`は、すべてのプリセットを`{ id, label, group, create }`の形でメニュー順に並べたもので、`createInstrument(id)`でひとつを生成します。新しいプリセットはデモではなく、ここに追加します。矩形波やノコギリ波は、サイン波と同じ振幅でもずっと大きく聞こえるため、波形のプリセットは耳で音量を揃えています。</div>

The piano uses the Salamander Grand Piano samples (Alexander Holm, CC BY 3.0) hosted at `tonejs.github.io/audio/salamander/`, one file every three semitones. Violin, cello, flute, clarinet, trumpet, and acoustic guitar use the tonejs-instruments samples (Nicholas Brosowsky; VSCO 2 Community Edition, University of Iowa, Freesound; CC BY 3.0) hosted at `nbrosowsky.github.io/tonejs-instruments/samples/`. `TONEJS_INSTRUMENTS` lists, per instrument, a subset of the recorded notes at least three semitones apart; add another instrument from that collection by adding its folder name and notes there. The electric bass (`bass`) uses the same library's `bass-electric` samples. The same library also gives `organ`, `harmonium`, `guitar-electric`, `guitar-nylon`, `harp`, `xylophone`, `saxophone`, `french-horn`, `trombone`, `tuba`, `bassoon`, and `contrabass`. `epiano` is an FM electric piano (a sine modulating a sine at the same frequency, the modulation decaying fast); `epiano-bright` is the same with a stronger, longer bite. `organ-synth` is a drawbar organ (fixed harmonics, full level while held), `pad` detuned saws with a slow envelope, and `synth-bass` a saw through a low-pass filter opened by its own envelope.
<div class="jp">ピアノには、`tonejs.github.io/audio/salamander/`にあるSalamander Grand Pianoのサンプル（Alexander Holm、CC BY 3.0）を使います。ファイルは3半音ごとに1つです。バイオリン、チェロ、フルート、クラリネット、トランペット、アコースティックギターには、`nbrosowsky.github.io/tonejs-instruments/samples/`にあるtonejs-instrumentsのサンプル（Nicholas Brosowsky。VSCO 2 Community Edition、アイオワ大学、Freesound。CC BY 3.0）を使います。`TONEJS_INSTRUMENTS`には、楽器ごとに、録音された音のうち3半音以上離れた一部を並べています。このコレクションのほかの楽器を加えるには、そこにフォルダ名と音を追加します。 エレクトリック・ベース（`bass`）は同じライブラリの`bass-electric`のサンプルを使います。同じライブラリから、`organ`、`harmonium`、`guitar-electric`、`guitar-nylon`、`harp`、`xylophone`、`saxophone`、`french-horn`、`trombone`、`tuba`、`bassoon`、`contrabass`も使えます。`epiano`はFMのエレクトリック・ピアノ（同じ周波数のサイン波でサイン波を変調し、変調はすぐに減衰します）です。`epiano-bright`は同じもので、アタックの響きをより強く長くしたものです。`organ-synth`はドローバー・オルガン（決まった倍音を、押しているあいだ一定の音量で鳴らします）、`pad`はゆっくりしたエンベロープのデチューンしたのこぎり波、`synth-bass`は、それ自身のエンベロープで開くローパス・フィルターを通したのこぎり波です。</div>

## Effects

`effects.js` describes each effect as data: a factory for the Tone node and the parameters a demo can expose. Panels are generated from the parameters, so a new parameter appears in every demo that shows the effect.
<div class="jp">`effects.js`は、それぞれのエフェクトをデータとして記述します。Toneのノードを生成する関数と、デモが公開できるパラメータです。パネルはパラメータから生成するため、新しいパラメータは、そのエフェクトを表示するすべてのデモに現れます。</div>

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

- **`harmonicSeries(shape, n)`:** the first `n` harmonic amplitudes of `'sine'`, `'square'` (odd harmonics at 1/n), `'sawtooth'` (every harmonic at 1/n), or `'triangle'` (odd harmonics at 1/n², alternating in sign): the first `n` terms of each wave's Fourier series.
- **`partialSum(partials, phase)`, `partialPeak(partials)`:** the unscaled sum at a phase (0–1 is one period), and its largest absolute value over a period. Views use them to draw what the oscillator plays.
- **`AdditiveOscillator`:** a continuously running additive tone with `frequency`, `amplitude` (the summed wave's peak, 0–1), `partials`, and `setPartial(index, amplitude)`. `start()` and `stop()` fade over 30 ms so they never click; call `start()` after `startAudio()`. When every partial is 0 the output is muted, since a PeriodicWave of zeros cannot be normalized.
<div class="jp">

- **`harmonicSeries(shape, n)`：**`'sine'`、`'square'`（奇数次の倍音を1/nで）、`'sawtooth'`（すべての倍音を1/nで）、`'triangle'`（奇数次の倍音を1/n²で、符号を交互に）の最初の`n`個の倍音の振幅、つまりそれぞれの波のフーリエ級数の最初の`n`項を返します。
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

- **`SCALES`, `MODES`, `WHITE_KEY_MODES`, `MINOR_SCALES`, `OTHER_SCALES`, `SCALE_SETS`:** scales from C; the seven church modes on C; the same modes on the white keys (C major from each of its notes, with `root`); the three minor scales; other scales common in jazz and pop music; and named sets of these (`scales`, `modes`, `white-key-modes`, `minor`, `other`, `pentatonic`, `diminished`, and `altered-lydian`, the altered scale on C with the Lydian 7th on G♭, the same pitches), for a demo that takes the set as a URL parameter. Each scale is `{ id, label, notes, root?, descending? }`; `descending` lists the notes for the way down where they differ (the melodic minor). Scale ids are unique across sets. Add new scales here, never in a demo.
- **`findScale(id)`:** the scale with that id in any set.
- **`scalePitchClasses(scale)`:** the scale's notes as pitch classes (0 = C … 11 = B), for snapping a pitch to the scale (`pitchAt` in `gesture.js`).
- **`TOY_SCALES`, `scaleLadder(scale, count, octave)`:** the scales the sound toys offer (major and minor pentatonic, blues, major, whole tone, In, Hijaz, all on C); and the first `count` notes of a scale going up from its root in `octave`, as `{ label, midi }` low to high ("E♭4"), so a fixed number of rows covers fewer octaves of a scale with more notes. The note grid toy builds its rows with it.
- **`pitchClassNames(scale)`:** names for the twelve pitch classes, for notes outside a scale: flats when the scale spells more notes with flats than with sharps, sharps otherwise.
- **`MINOR_ROOTS`:** roots in the spellings of minor keys (C♯, G♯ rather than D♭, A♭), for a minor scale's Key select.
- **`ROOTS`, `transposeScale(scale, root)`:** the roots a scale can move to (C, D♭, D, E♭ …), and the scale moved there with its notes respelled by letter, so the pattern of steps is kept (double sharps and flats, 𝄪 and 𝄫, where needed).
- **`transposeNote(name, from, to)`, `transposeBy(scale, from, to)`, `majorKeyModes(key)`:** a note or scale moved by the interval between two notes, spelled by letter; and the seven modes of a major key, labeled with their roots ("A Dorian" in G), ids `degree-1` to `degree-7` in every key.
- **`scaleNotes(scale, octave, { descending })`:** the scale from its root in `octave` (default 4) up to the root above, as `{ name, letter, accidental, midi, position }`, from the `descending` notes when asked and the scale has them. `position` counts staff steps from C4 (C4 = 0, E4 = 2, C5 = 7).
- **`scaleRun(scale, octave)`:** the scale up to the octave and back down, as `scaleNotes` entries; the way down uses `descending`.
- **`rootMidi(scale, octave)`:** the MIDI number of the scale's root in that octave.
- **`parseNote(name)`, `PITCH_CLASS_NAMES`:** a note name's letter, accidental, and semitones above C; and the plain name of each of the 12 pitch classes.
<div class="jp">

- **`SCALES`、`MODES`、`WHITE_KEY_MODES`、`MINOR_SCALES`、`OTHER_SCALES`、`SCALE_SETS`：**Cから始まる音階、Cを主音とする7つの教会旋法、白鍵上の同じ旋法（Cの長音階をそれぞれの音から始めたもので、`root`を持つ）、3つの短音階、ジャズやポップ音楽でよく使うその他の音階、そしてそれらを名前で引けるようにしたセット（`scales`、`modes`、`white-key-modes`、`minor`、`other`、`pentatonic`、`diminished`、そして同じ音高を持つCのオルタードとG♭のリディアン・セブンスの組`altered-lydian`）です。セットは、URLのパラメータで受け取るデモに使います。それぞれの音階は`{ id, label, notes, root?, descending? }`の形で、`descending`は下行で音が異なる場合（旋律的短音階）の下行の音です。音階のidはセットをまたいで一意です。新しい音階はデモではなく、ここに追加します。
- **`findScale(id)`：**どのセットからでも、そのidの音階を返します。
- **`scalePitchClasses(scale)`：**音階の音をピッチクラス（0 = C … 11 = B）で返します。音高を音階にそろえるのに使います（`gesture.js`の`pitchAt`）。
- **`TOY_SCALES`、`scaleLadder(scale, count, octave)`：**音のおもちゃが並べる音階（メジャーとマイナーのペンタトニック、ブルース、長音階、全音音階、都節、ヒジャーズ。どれもCから）と、`octave`の主音から上へ数えた音階の最初の`count`音を、低い順に`{ label, midi }`（「E♭4」）で返す関数です。行の数が決まっていれば、音の多い音階ほど少ないオクターブにわたります。音の格子のおもちゃが、行をこれでつくります。
- **`pitchClassNames(scale)`：**音階外の音に使う12のピッチクラスの名前です。音階がシャープよりフラットで綴る音を多く持つときはフラット、それ以外はシャープを使います。
- **`MINOR_ROOTS`：**短調の綴り（D♭、A♭ではなくC♯、G♯）による主音で、短音階のKeyの選択に使います。
- **`ROOTS`、`transposeScale(scale, root)`：**音階を移せる主音（C、D♭、D、E♭…）と、そこへ移した音階です。音名は文字ごとに綴り直すので、歩幅の並びが保たれます（必要ならダブルシャープ𝄪とダブルフラット𝄫を使います）。
- **`transposeNote(name, from, to)`、`transposeBy(scale, from, to)`、`majorKeyModes(key)`：**2つの音のあいだの音程だけ動かした音や音階（文字ごとに綴る）と、長調の7つの旋法です。旋法には主音をつけた名前（Gでは「A Dorian」）がつき、idはどの調でも`degree-1`〜`degree-7`です。
- **`scaleNotes(scale, octave, { descending })`：**`octave`（省略時は4）の主音から1オクターブ上の主音までの音階を、`{ name, letter, accidental, midi, position }`で返します。指定され、音階が持っていれば`descending`の音を使います。`position`はC4からの五線上の段数です（C4 = 0、E4 = 2、C5 = 7）。
- **`scaleRun(scale, octave)`：**オクターブまで上がって戻る音階を、`scaleNotes`の要素で返します。下行には`descending`を使います。
- **`rootMidi(scale, octave)`：**その音域での主音のMIDI番号です。
- **`parseNote(name)`、`PITCH_CLASS_NAMES`：**音名の文字、変化記号、Cからの半音数と、12のピッチクラスそれぞれの基本の音名です。

</div>

## Sequence

`Sequence` (`sequence.js`) plays `notes` (MIDI numbers) one after another on an instrument, `step` seconds apart, holding each for `gate` of the step, at `velocity`, once or (`loop: true`) until stopped; a repeated bass note is a one-note loop. It has the `start()`, `stop()`, and `playing` of a continuous source, so it works with `wirePlayButton`, and it stops by itself at the end. `onStep(index, midi)` runs as each note starts (and with `(-1, null)` at the end), and `onEnd` when it ends or is stopped. It uses browser timers, which are steady enough at a few hundred milliseconds per note.
<div class="jp">`Sequence`（`sequence.js`）は、`notes`（MIDI番号）を楽器で`step`秒おきに`velocity`の強さで順に鳴らし、それぞれの音を歩幅の`gate`の割合だけ保ちます。一度だけ、または（`loop: true`で）止めるまで繰り返します。繰り返す低音は、1音のループです。持続する音源と同じ`start()`、`stop()`、`playing`を持つため`wirePlayButton`で扱え、最後まで来ると自分で止まります。`onStep(index, midi)`はそれぞれの音の開始時に（終了時は`(-1, null)`で）、`onEnd`は終了または停止時に呼ばれます。ブラウザのタイマーを使いますが、1音数百ミリ秒の間隔なら十分に安定しています。</div>

## Rhythm

`rhythm.js` holds rhythm patterns and the sequencer that plays them on a `DrumKit`. A pattern is one cycle (usually a bar) of equal steps: `{ id, label, stepsPerBeat, groups, beatsPerBar?, tempo, tracks }`. `groups` lists the steps in each beat group (`[2, 2, 3]` for 7/8), `beatsPerBar` the groups in one bar for a pattern longer than a bar (the two-bar bossa nova), and `tempo` counts beats per minute. Each track is `{ id, label, midi, steps, offset?, offsets?, gain? }`: one velocity per step (0 is a rest), moved off the grid by `offset` seconds (negative is early) and scaled by `gain`. `offsets`, one per step, moves single hits on top of the track's `offset`.

- **`DRUM_TRACKS`:** the tracks a pattern can use, high to low: hat, rim, snare, kick.
- **`makePattern(def)`:** builds a pattern from one string per track, one character per step: `X` full (`FULL`), `x` soft (`SOFT`, half), `-` rest; spaces are ignored. `trackIds` picks the tracks.
- **`clonePattern(pattern)`:** a copy to edit. **`pulsePattern(count, accent)`:** an even pulse of rim clicks, all at one velocity; with `accent`, every `accent`-th beat (from the first) is a kick instead, so the cycles are marked by sound, not loudness.
- **`METER_PATTERNS`, `FEEL_PATTERNS`, `IMPLIED_PATTERNS`, `BACKBEAT`, `HAMMER`, `PATTERN_SETS`:** beats in common time signatures (eighth-note steps, with a 4/4 shuffle in thirds of a beat); subdivisions and styles (quarter, eighth, sixteenth notes, funk, shuffle, bossa nova); sixteenths and shuffle with every subdivision played and with it only implied by a few notes; the simplest beat, kick and snare on the beats, for timing and loudness; a work song's hammer on every downbeat; and the sets by name (`meters`, `feels`, `implied`). Add patterns here, never in a demo.
- **`STYLE_PATTERNS`, `polyrhythmPattern(high, low, { cycle })`:** drum patterns for styles (rock, reggae's one drop, samba, the 3-2 son clave, the 12/8 bell pattern, boom bap; the four tracks stand in for the style's own instruments), also `PATTERN_SETS.styles`. `polyrhythmPattern` builds two pulses in one cycle (`high` rim clicks and `low` kicks) on as many steps as both need (their least common multiple), with the tempo that makes the cycle last `cycle` seconds (2 by default); both start together, and that note is louder. The polyrhythm demo uses it.
- **`StepSequencer(instrument, { pattern, tempo, onStep, onSchedule })`:** loops a pattern until stopped, with the `start()`, `stop()`, and `playing` of a continuous source. Notes are scheduled about 0.2 s ahead on the audio clock, so they land exactly on (or exactly `offset` off) the grid; `onStep(i)` runs as step `i` sounds, and with -1 when stopped. `onSchedule(i, time)` runs as step `i` is scheduled, with the audio-clock time it will sound at. `pattern` and `tempo` can change while playing. `stepDuration` is the seconds per step. `MAX_EARLY` (0.1 s) is the most a track's `offset` and a hit's `offsets` together can move it early.
- **`humanize(pattern, { timing, minVelocity })`:** moves every hit by a random amount up to `timing` seconds either way (default 0.03, into `offsets`, rounded to whole milliseconds) and gives it a random velocity from `minVelocity` (default 0.25) to a full hit, weighted toward loud (a random number squared below a full hit, so fewer than one hit in five falls under half). Rests stay rests; the pattern changes in place.
<div class="jp">

`rhythm.js`には、リズムのパターンと、それを`DrumKit`で鳴らすシーケンサーを置きます。パターンは等しいステップからなる1周期（ふつうは1小節）で、`{ id, label, stepsPerBeat, groups, beatsPerBar?, tempo, tracks }`の形です。`groups`は拍のまとまりごとのステップ数（7/8なら`[2, 2, 3]`）、`beatsPerBar`は1小節より長いパターン（2小節のボサノヴァ）での1小節の拍のまとまりの数、`tempo`は1分あたりの拍数です。それぞれのトラックは`{ id, label, midi, steps, offset?, offsets?, gain? }`で、ステップごとのベロシティ（0は休み）を持ち、`offset`秒だけグリッドからずらし（負は前）、`gain`倍します。ステップごとの`offsets`は、トラックの`offset`に加えて、1つずつの打音をずらします。

- **`DRUM_TRACKS`：**パターンが使えるトラックで、高い音から順にハイハット、リム、スネア、キックです。
- **`makePattern(def)`：**トラックごとの文字列からパターンをつくります。1文字が1ステップで、`X`が強（`FULL`）、`x`が弱（`SOFT`、半分）、`-`が休みです。空白は無視します。`trackIds`でトラックを選びます。
- **`clonePattern(pattern)`：**編集用のコピーです。**`pulsePattern(count, accent)`：**すべて同じベロシティのリムクリックの拍です。`accent`を渡すと、最初の拍から`accent`拍ごとにキックに替わり、周期を音量ではなく音の違いで示します。
- **`METER_PATTERNS`、`FEEL_PATTERNS`、`IMPLIED_PATTERNS`、`BACKBEAT`、`HAMMER`、`PATTERN_SETS`：**よく使う拍子のビート（8分音符のステップ。4/4のシャッフルは1拍の3分の1）、細分とスタイル（4分、8分、16分音符、ファンク、シャッフル、ボサノヴァ）、細分をすべて演奏する16分音符とシャッフルと、いくつかの音だけで細分を感じさせるもの、タイミングと音量を聞くための、拍の上のキックとスネアだけのいちばん簡単なビート、毎小節の1拍目に振り下ろす労働歌のハンマー、そしてそれらを名前で引くセット（`meters`、`feels`、`implied`）です。パターンはデモではなく、ここに追加します。
- **`STYLE_PATTERNS`、`polyrhythmPattern(high, low, { cycle })`：**スタイルのドラム・パターン（ロック、レゲエのワン・ドロップ、サンバ、3-2のソン・クラーベ、12/8のベル・パターン、ブーム・バップ。4つのトラックが、そのスタイル自身の楽器の代わりをします）。`PATTERN_SETS.styles`でもあります。`polyrhythmPattern`は、ひとつの周期の中の2つの拍（`high`回のリム・クリックと`low`回のキック）を、両方に必要なだけの（最小公倍数の）ステップで組み、周期が`cycle`秒（既定は2秒）続くテンポとともに返します。2つの拍は一緒に始まり、その音は大きくなります。polyrhythmデモが使います。
- **`StepSequencer(instrument, { pattern, tempo, onStep, onSchedule })`：**止めるまでパターンを繰り返し、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。音はオーディオクロック上で約0.2秒先に予約するので、ぴったりグリッド上に（または`offset`だけ正確にずれて）鳴ります。`onStep(i)`はステップ`i`が鳴るときに、停止時は-1で呼ばれます。`onSchedule(i, time)`はステップ`i`を予約するときに、それが鳴るオーディオクロック上の時刻とともに呼ばれます。演奏中に`pattern`と`tempo`を変えられます。`stepDuration`は1ステップの秒数、`MAX_EARLY`（0.1秒）は、トラックの`offset`と打音の`offsets`を合わせて前にずらせる最大量です。
- **`humanize(pattern, { timing, minVelocity })`：**すべての打音を前後それぞれ最大`timing`秒（既定0.03、`offsets`に入れ、ミリ秒単位に丸めます）ランダムにずらし、`minVelocity`（既定0.25）から強までのランダムなベロシティを、大きい側に寄せて与えます（強からの差を乱数の2乗にするので、半分より弱くなる打音は5つに1つ未満です）。休みは休みのままで、パターンをその場で変えます。

</div>

## Phasing

`PhasePlayer(instruments, { notes, step, drift, onStep })` (in `rhythm.js`) plays the same loop of `notes` on two instruments, panned left and right, the second `drift` percent faster, so they move out of phase and back (Steve Reich's phasing). It owns `output` (connect it to the master bus) and has the `start()`, `stop()`, and `playing` of a continuous source; `onStep(voice, i)` runs as each voice plays note `i`, and `(-1, -1)` when stopped. `PHASE_LOOP` is an original twelve-note loop for it.
<div class="jp">

`PhasePlayer(instruments, { notes, step, drift, onStep })`（`rhythm.js`）は、同じ`notes`のループを、左右に振った2つの楽器で、2つ目を`drift`パーセントだけ速く鳴らし、位相をずらしては戻します（スティーヴ・ライヒのフェイズ）。`output`を持ち（マスターバスにつなぐ）、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。`onStep(voice, i)`はそれぞれの声部が`i`番目の音を鳴らすときに、停止時は`(-1, -1)`で呼ばれます。`PHASE_LOOP`はそのためのオリジナルの12音のループです。

</div>

## Chords and Progressions

`chords.js` holds chords, progressions, and their player. A chord symbol is a root, a quality from `QUALITIES` (`m7`, `maj7`, `7`, `m7♭5` …), optional tensions in parentheses (`G7(♭9)`), and an optional slash bass (`D♭/F`); ♭/♯ or b/# both work.

- **`parseChord(symbol)`:** `{ symbol, root, bass, intervals }`, pitch classes and semitones above the root.
- **`voiceProgression(chords, melody, { bassLow, open })`:** voices chords for piano: the bass in the octave from `bassLow` (E2–D♯3 by default), the other tones in close position above (the root left to the bass in four-note chords, the fifth dropped in chords of five or more, or with ♯5/♭13), each chord in the inversion that moves least from the last, and below the melody when there is one. Chords with hand-written `notes` keep them. Returns `{ bass, upper, notes }` per chord.
- **Progressions:** `{ id, label, tempo, loop?, chords: [{ symbol, beats, roman?, fn?, bass?, notes?, scale? }], melody?: [{ midi, beats, velocity?, gate? }], riff?, comp?, voicing?, bassLow?, drums?, sounds? }`. `riff` is `[[semitones, beats], …]`, a bass figure played up from each chord's bass note in place of the held bass, restarted at each chord. `comp` is `[[part, beats], …]`, a rhythm for the chords in place of holding them, repeated through each chord: `'bass'` plays the bass note, `'upper'` the notes above it, `'all'` both, `null` rests (`[['bass', 1], ['upper', 1], ['upper', 1]]` is a waltz's oom-pah-pah). A chord may carry its own `comp` and `riff`, which replace the progression's for that chord (an anticipated chord that starts half a beat early with one short stroke). `riffNotes(progression, voicings)` lists the riff's notes as `{ at, beats, midi }`; the player plays them and `ProgressionView` draws them as a dark green line (red while sounding, `setBass(i)`), with the chords above it drawn without their bass. The player's `onBass(i, notes)` gives the riff note's index, or -2 for a chord's held bass on its own instrument. `compHits(progression, voicings)` turns a progression into what each chord plays, one list of `{ at, beats, notes, part }` per chord (a single held hit without a comp). `voicing: 'open'` spreads each chord's upper notes at their own intervals above the root (the 9th a ninth up, the 13th a thirteenth up), from the lowest octave clear of the bass, so tensions sit above the chord tones; the tension examples use it. `voicing: 'rootless'` uses jazz piano's rootless voicings (the root left to the bass; 3–5–7–9 for major and minor sevenths, 3–13–7–9 for dominants, the 9th added to sixth chords, written tensions kept) in close position between D3 and D5, moving as little as possible and ignoring the melody, as a pianist comps under a soloist; every improvisation set in `PROGRESSION_SETS` takes it. `bassLow` is the lowest bass note: every chord's bass falls in the octave from it (E2, 40, by default; the diatonic set uses C3 so its bass climbs with the scale); a chord's own `bass` (MIDI) places its bass note outside that octave, as the last C of the diatonic triads, on C4. `drums` is a rhythm pattern (`rhythm.js`) looped along with the chords. `sounds` is `{ chords, melody, bass?, levels? }`, instrument ids for the demo to create (piano by default), and `levels` a level in dB per part (`{ melody: 8 }`); `progressionSounds(progression)` reads it as `{ chords, melody, bass }`, each `{ id, level }` or null for no bass instrument, so every demo resolves the defaults the same way. The sets, by page: `DIATONIC_`, `DIATONIC_MINOR_` (natural, harmonic, and melodic minor triads), `MINOR_DOMINANT_`, `MINOR_COLOR_`, `MINOR_MODE_` and `MINOR_CHORD_SCALE_` (seventh chords with their chord scales run over them as the melody; each chord names its scale as `scale`, which the progression demo shows in a Scale readout), `CHORD_TYPE_`, `SEVENTH_`, `FUNCTIONAL_`, `DOMINANT_MOTION_`, `TWO_FIVE_`, `RESOLUTION_`, `SUBDOMINANT_MINOR_`, `NON_FUNCTIONAL_`, `REHARMONIZATION_`, `WORK_SONG_`, `BLUES_`, `JAZZ_BLUES_`, `WALTZ_PROGRESSIONS` (Edelweiss with and without its beats), `SIXTH_DIMINISHED_` (Barry Harris's sixth diminished scales harmonized, hand-voiced, one chord a beat), `BEBOP_LINE_PROGRESSIONS` (eighth-note lines down the major and sixth diminished scales over C6 with a click on every beat), `BEBOP_II_V_PROGRESSIONS` (bebop phrases over a ii–V–I, chord tones on the beats), the improvisation sets `PENTATONIC_` (with `playScale`), `DIATONIC_IMPROV_`, `CHORD_TONE_`, `IDIOM_`, `TWO_FIVE_SCALE_`, `TWO_FIVE_PHRASE_`, `JAZZ_CHORD_SCALE_`, `MODERN_PENTATONIC_` (pentatonic runs on other roots, `scaleRoot`), `TRIAD_PAIR_` (triads as triplets over one held chord, labeled with `tied` chords), `OUTSIDE_`, `FOURTHS_`, `COLTRANE_PROGRESSIONS` (the 1-2-3-5 pattern on each chord), `JAZZ_PHRASE_` and `MODERN_PENTATONIC_PHRASES` (written phrases; `jazz-chords` merges the jazz scale runs and phrases), `MODAL_PROGRESSIONS` (So What voicing, fourths over a pedal, sus chords), `WALKING_BASS_PROGRESSIONS` (bass lines as the melody under piano voicings struck in a Charleston rhythm), `ARTICULATION_PROGRESSIONS` (the same melodies legato, staccato, accented, swelling, straight, and swung, through per-note `gate` and `velocity`), `SYNCOPATION_PROGRESSIONS` (one melody on the beat, syncopated, and anticipated, with accented notes through `velocity`; chords on the beat, in the Charleston rhythm, and pushed; bossa nova and samba backings with a riff, a comp, and drums from `STYLE_PATTERNS`), `STYLE_PROGRESSIONS` (backings in rock, funk, reggae, salsa with a tumbao bass written as the melody, 12/8, and hip-hop), `JPOP_PROGRESSIONS` (the royal road, Komuro, Canon, and Marusa progressions, a line cliché, borrowed chords, a chromatic progression, and a key change, under a pop comp), `WORLD_PROGRESSIONS` (a raga-like phrase over a drone, maqam Hijaz over a drone, and gamelan-style interlocking over a gong tone; drones are chords with no symbol, `drone(notes, beats, label)`), `MINIMAL_PROGRESSIONS` (Philip Glass's additive process on five notes), `STELLA_PROGRESSIONS` (the changes of "Stella by Starlight" in B♭, eight bars at a time, two readings each; `scaleLines(list)` gives each chord a Roman numeral and a chord scale from `SCALE_STEPS` and runs the scale in eighth notes). `OUTSIDE_PROGRESSIONS` also has a motivic sequence, a turnaround imposed on a vamp, and a cycle of minor thirds. `IDIOM_PROGRESSIONS` also has longer lines (`long-ii-v-i`, `long-turnaround`, `long-minor`) whose bars end in enclosures of the next chord's 3rd. The jazz and improvisation sets sound as a small band (`band()` gives them `BAND_SOUNDS`: `{ chords: 'piano', melody: 'am', bass: 'synth-bass', levels: { melody: 8 } }`, which the walking bass set and the band-mix demo also follow); with `sounds.bass`, the player puts each chord's bass note (or the riff) on that instrument, held for the chord, and the chord instrument plays the notes above. A chord's `alt` (hand voicings) or the rootless voicing's nearest different voicing is taken by every other comp hit and by the same chord repeated, so repeats change voicing. A progression's `generate()` returns a new melody (`randomWalkingLine(chords)` for the random walking bass); the demo shows a New line button for it. A progression's `vary()` returns new fields (`{ chords, melody }`) for every pass of a loop: the player's `onLoop(seconds)` is called as each pass is scheduled and `swap(progression)` puts the next pass in without stopping, and the callbacks pass each event's notes so the lights stay right across a swap (`soWhatChorus()` makes a line in fourths, `fourthsLine(bars)`: a stack of perfect fourths every four eighth notes from a random start in `FOURTHS_STARTS`, over comping that strikes once or twice a bar in a rhythm from `SO_WHAT_BAR_RHYTHMS` and moves through `SO_WHAT_VOICINGS`). and `VOICING_` and `UPPER_STRUCTURE_PROGRESSIONS` (hand-voiced), `COMMON_PROGRESSIONS` (well-known progressions, each chord struck on every beat), and `PROGRESSION_SETS` by name for `?set=`; the progression demo's `?example=` picks one progression of the set (or several, comma-separated, so each section of a page can have its own demo) and drops the menu when there is one, `?key` adds a Key select (`?key=minor` with minor-key spellings), and `?roots` the same select labeled Root, for chords on a root. A progression's `sevenths` (the same chords as seventh chords, as on Chords in Minor Keys) gives the demo a 7th toggle; `withSevenths(progression)` swaps them in. `?play` is for playing along: the keyboard sits higher (C3 to C6), a Phrase toggle mutes the melody to leave a backing track, and a progression's `playScale` (note names, moved with the key) limits the keyboard to that scale with its first note as the root. Other examples in a set written in another `key` move by the same interval as the first. A chord marked `tied` holds the previous one on (no new strike) so its label can change under one sustained chord; a chord's `scaleRoot` names the root of the scale shown in the Scale readout when it is not the chord's own. `transposeProgression(progression, root)` moves a progression from its `key` (a note name, C by default) to another root: chord symbols are respelled by letter as the new key spells them (`transposeSymbol`; double sharps and flats become the plain note), and the bass range, placed basses, hand-voiced notes, and melody move by the interval, up to a tritone up and otherwise down. Roman numerals are unchanged. Add progressions here, never in a demo; melody note names use ASCII flats (`'Bb4'`), which Tone reads.
- **`ProgressionPlayer(instrument, { melodyInstrument, drums, onChord, onMelody, onBass, onHit, onEnd })`:** `setProgression(p)` voices it (`voicings`); `start()`, `stop()`, `playing` as a continuous source. Chords and the riff play on `instrument`, the melody on `melodyInstrument` (default `instrument`), the drums on `drums`; all three are properties a demo may swap between progressions. Everything is scheduled ahead on the audio clock; `onChord(i)` / `onMelody(i)` run as each starts `onBass(midi)` as each riff note starts, and `onHit(k)` as hit `k` of the current chord's comp starts (`hits[i][k]`, from `compHits`) (-1 when stopped), `onEnd` when a non-looping progression finishes. `chordNotes(i)` is what chord `i` holds (its upper notes when a riff takes the bass, none with a comp, whose hits are reported by `onHit`).
<div class="jp">

`chords.js`には、和音、進行、その再生を置きます。コード・シンボルは、根音、`QUALITIES`の種類（`m7`、`maj7`、`7`、`m7♭5`…）、括弧内の省略可能なテンション（`G7(♭9)`）、省略可能なスラッシュのベース（`D♭/F`）からなり、♭/♯でもb/#でも書けます。

- **`parseChord(symbol)`：**`{ symbol, root, bass, intervals }`、ピッチクラスと根音からの半音数です。
- **`voiceProgression(chords, melody, { bassLow, open })`：**ピアノ向けに和音を配置します。ベースを`bassLow`から1オクターブの中に（既定はE2〜D♯3）、ほかの音をその上に密集配置で置き（4音以上の和音では根音をベースに任せ、5音以上や♯5/♭13を含む和音では5度を省く）、それぞれの和音を前の和音からいちばん少なく動く転回形にし、旋律があればその下に置きます。`notes`を手で書いた和音はそれを使います。和音ごとに`{ bass, upper, notes }`を返します。
- **進行：**`{ id, label, tempo, loop?, chords: [{ symbol, beats, roman?, fn?, bass?, notes?, scale? }], melody?: [{ midi, beats, velocity?, gate? }], riff?, comp?, voicing?, bassLow?, drums?, sounds? }`。`riff`は`[[半音数, 拍数], …]`で、それぞれの和音のベース音から上に弾くベースの音型です。保持するベースの代わりに鳴り、和音ごとに最初からやり直します。`comp`は`[[パート, 拍数], …]`で、和音を保持する代わりのリズムです。和音ごとに繰り返し、`'bass'`はベース音、`'upper'`はその上の音、`'all'`は両方を鳴らし、`null`は休みです（`[['bass', 1], ['upper', 1], ['upper', 1]]`がワルツの「ズン・チャッ・チャッ」）。和音はそれ自身の`comp`と`riff`を持つことができ、その和音では進行のものの代わりになります（半拍早く短いひと鳴らしで始まる、先取りされた和音）。`riffNotes(progression, voicings)`はリフの音を`{ at, beats, midi }`として並べ、プレイヤーはそれを鳴らし、`ProgressionView`は深緑の線として描きます（鳴っているあいだは赤、`setBass(i)`）。その上の和音はベースを除いて描きます。プレイヤーの`onBass(i, notes)`は、リフの音の番号、または和音の保持するベースを別の楽器で鳴らすときは-2を渡します。`compHits(progression, voicings)`は、それぞれの和音が鳴らすものを、和音ごとに`{ at, beats, notes, part }`のリストにします（compがなければ、保持する1つの打音）。`voicing: 'open'`は、和音の上の音を根音からそれぞれの音程に（9度は9度上に、13度は13度上に）、ベースから離れたいちばん低いオクターブから広げて置くので、テンションは和音の音の上に重なります。テンションの例が使います。`voicing: 'rootless'`は、ジャズ・ピアノのルートレス・ボイシング（根音はベースに任せ、メジャーとマイナーのセブンスは3–5–7–9、ドミナントは3–13–7–9、6の和音には9度を加え、書かれたテンションは残します）を、D3からD5のあいだの密集配置で、できるだけ動かずに、旋律を気にせず置きます。ソリストの下でピアニストがコンピングするのと同じです。`PROGRESSION_SETS`の即興のセットはすべてこれを使います。`bassLow`はいちばん低いベース音で、それぞれの和音のベースはそこから1オクターブの中に置かれます（既定はE2、40。ダイアトニックのセットは、ベースが音階とともに上がるようC3を使います）。和音の`bass`（MIDI）は、そのオクターブの外にベース音を置きます。ダイアトニック・トライアドの最後のCがC4にあるのがその例です。`drums`は和音と一緒に繰り返すリズムのパターン（`rhythm.js`）、`sounds`はデモがつくる楽器のid`{ chords, melody, bass?, levels? }`で（既定はピアノ）、`levels`はパートごとの音量（dB、`{ melody: 8 }`）です。`progressionSounds(progression)`はそれを`{ chords, melody, bass }`（それぞれ`{ id, level }`、ベースの楽器がなければnull）として読むので、どのデモも同じように既定値を決めます。ページごとのセットは`DIATONIC_`、`DIATONIC_MINOR_`（自然、和声的、旋律的短音階の三和音）、`MINOR_DOMINANT_`、`MINOR_COLOR_`、`MINOR_MODE_`と`MINOR_CHORD_SCALE_`（7の和音と、その上を旋律として上がるコード・スケール。それぞれの和音は`scale`に音階の名前を持ち、進行のデモはそれをScaleの表示に出します）、`CHORD_TYPE_`、`SEVENTH_`、`FUNCTIONAL_`、`DOMINANT_MOTION_`、`TWO_FIVE_`、`RESOLUTION_`、`SUBDOMINANT_MINOR_`、`NON_FUNCTIONAL_`、`REHARMONIZATION_`、`WORK_SONG_`、`BLUES_`、`JAZZ_BLUES_`、`WALTZ_PROGRESSIONS`（拍を鳴らす伴奏とそうでない伴奏のエーデルワイス）、`SIXTH_DIMINISHED_`（バリー・ハリスのシックス・ディミニッシュ・スケールの和声づけ。手で配置し、1拍にひとつの和音）、`BEBOP_LINE_PROGRESSIONS`（C6の上で、拍ごとのクリックとともに長音階とシックス・ディミニッシュ・スケールを下る8分音符の旋律）、`BEBOP_II_V_PROGRESSIONS`（ii–V–Iの上の、和音の音を拍の上に置いたビバップのフレーズ）、即興のセット`PENTATONIC_`（`playScale`つき）、`DIATONIC_IMPROV_`、`CHORD_TONE_`、`IDIOM_`、`TWO_FIVE_SCALE_`、`TWO_FIVE_PHRASE_`、`JAZZ_CHORD_SCALE_`、`MODERN_PENTATONIC_`（ほかの根音のペンタトニック、`scaleRoot`）、`TRIAD_PAIR_`（ひとつの和音の上の3連符の三和音。`tied`の和音でラベルをつけます）、`OUTSIDE_`、`FOURTHS_`、`COLTRANE_PROGRESSIONS`（それぞれの和音の上の1-2-3-5のパターン）、`JAZZ_PHRASE_`と`MODERN_PENTATONIC_PHRASES`（書いたフレーズ。`jazz-chords`はジャズの音階とフレーズをまとめたもの）、`MODAL_PROGRESSIONS`（ソー・ホワット・ボイシング、保続音の上の4度、サス・コード）、`WALKING_BASS_PROGRESSIONS`（チャールストンのリズムで鳴らすピアノのボイシングの下で、旋律として弾くベース・ライン）、`ARTICULATION_PROGRESSIONS`（音ごとの`gate`と`velocity`で、同じ旋律をレガート、スタッカート、アクセント、強弱の起伏、まっすぐ、スウィングで）、`SYNCOPATION_PROGRESSIONS`（拍の上、シンコペーション、先取りのひとつの旋律。アクセントは`velocity`で。拍の上、チャールストン、プッシュで鳴らす和音。リフ、コンピング、`STYLE_PATTERNS`のドラムによるボサノヴァとサンバの伴奏）、`STYLE_PROGRESSIONS`（ロック、ファンク、レゲエ、旋律として書いたトゥンバオのベースによるサルサ、12/8、ヒップホップの伴奏）、`JPOP_PROGRESSIONS`（王道進行、小室進行、カノン進行、丸サ進行、クリシェ、借用和音、半音的な進行、転調を、ポップスのコンピングで）、`WORLD_PROGRESSIONS`（保続音の上のラーガふうのフレーズ、保続音の上のマカーム・ヒジャーズ、ゴングの音の上のガムランふうのかみ合い。保続音はシンボルのない和音で、`drone(notes, beats, label)`）、`MINIMAL_PROGRESSIONS`（5つの音によるフィリップ・グラスの加算的プロセス）、`STELLA_PROGRESSIONS`（B♭の「星影のステラ」のコード進行を8小節ずつ、それぞれ2つの読み方で。`scaleLines(list)`は、それぞれの和音にローマ数字と`SCALE_STEPS`のコード・スケールを与え、その音階を8分音符で弾きます）。`OUTSIDE_PROGRESSIONS`には、動機のシーケンス、ヴァンプに重ねたターンアラウンド、短3度の周期もあります。`IDIOM_PROGRESSIONS`には、それぞれの小節が次の和音の3度へのエンクロージャーで終わる長い旋律（`long-ii-v-i`、`long-turnaround`、`long-minor`）もあります。ジャズと即興のセットは小さなバンドとして鳴ります（`band()`が`BAND_SOUNDS`、つまり`{ chords: 'piano', melody: 'am', bass: 'synth-bass', levels: { melody: 8 } }`を与えます。ウォーキング・ベースのセットとband-mixのデモもこれに従います）。`sounds.bass`があると、プレイヤーはそれぞれの和音のベース音（またはリフ）をその楽器で和音の長さだけ鳴らし、和音の楽器はその上の音だけを弾きます。和音の`alt`（手で配置した場合）、またはルートレス・ボイシングでいちばん近い別のボイシングは、コンピングの1回おきの打音と、同じ和音の繰り返しで使われ、繰り返しのたびにボイシングが変わります。進行の`generate()`は新しい旋律を返し（ランダムなウォーキング・ベースは`randomWalkingLine(chords)`）、デモはそのためのNew lineボタンを表示します。進行の`vary()`は、ループの1回ごとの新しいフィールド（`{ chords, melody }`）を返します。プレイヤーは1回ごとに、予約するときに`onLoop(seconds)`を呼び、`swap(progression)`が止めずに次の回を差し込みます。コールバックはそれぞれのイベントの音を渡すので、入れ替えをまたいでも点灯は正しいままです（`soWhatChorus()`は4度の旋律`fourthsLine(bars)`をつくります。8分音符4つごとに、`FOURTHS_STARTS`からランダムに選んだ出発音から完全4度を積み上げ、`SO_WHAT_BAR_RHYTHMS`のリズムで1小節に1回か2回鳴らして`SO_WHAT_VOICINGS`を動くコンピングの上に置きます）。そして`VOICING_`と`UPPER_STRUCTURE_PROGRESSIONS`（手で配置）、`COMMON_PROGRESSIONS`（よく知られた進行。それぞれの和音を拍ごとに鳴らします）で、`PROGRESSION_SETS`が`?set=`用に名前で引きます。進行のデモの`?example=`は、セットの中のひとつの進行を選び、メニューを出しません。`?key`はKeyの選択を（`?key=minor`では短調の綴りで）加え、`?roots`は同じ選択をRootという名前で加えます（根音の上の和音のため）。進行の`sevenths`（同じ和音を7の和音にしたもの。短調の和音のページで使います）があると、デモに7thのトグルがつきます。`withSevenths(progression)`がそれに入れ替えます。`?play`は一緒に弾くためのもので、鍵盤が高め（C3〜C6）になり、Phraseのトグルで旋律を消して伴奏だけにでき、進行の`playScale`（音名。調とともに移ります）が鍵盤をその音階だけにし、最初の音を主音にします。セットの中で別の`key`で書かれた例は、最初の例と同じ音程だけ移ります。`tied`の和音は前の和音を（打ち直さずに）伸ばすので、ひとつの持続する和音の下でラベルを変えられます。和音の`scaleRoot`は、和音自身の根音でないとき、Scaleの表示に出す音階の根音を示します。`transposeProgression(progression, root)`は、進行をその`key`（音名、既定はC）からほかの根音へ移します。コード・シンボルは新しい調の書き方で文字ごとに書き直し（`transposeSymbol`。ダブルシャープとダブルフラットはふつうの音名にします）、ベースの範囲、置かれたベース、手で配置した音、旋律は、その音程だけ（三全音までは上へ、それ以上は下へ）移します。ローマ数字は変えません。進行はデモではなく、ここに追加します。旋律の音名のフラットは、Toneが読めるASCIIで書きます（`'Bb4'`）。
- **`ProgressionPlayer(instrument, { melodyInstrument, drums, onChord, onMelody, onBass, onHit, onEnd })`：**`setProgression(p)`で配置し（`voicings`）、持続する音源と同じ`start()`、`stop()`、`playing`を持ちます。和音とリフは`instrument`で、旋律は`melodyInstrument`（既定は`instrument`）で、ドラムは`drums`で鳴らします。3つともプロパティで、デモは進行ごとに差し替えられます。すべてオーディオクロック上で先に予約します。`onChord(i)` / `onMelody(i)`はそれぞれの開始時に、`onBass(midi)`はリフのそれぞれの音の開始時に、`onHit(k)`は現在の和音のcompの打音`k`（`compHits`による`hits[i][k]`）の開始時に（停止時は-1で）、`onEnd`は繰り返さない進行が終わったときに呼ばれます。`chordNotes(i)`は和音`i`が保持する音です（リフがベースを担うときは上の音だけ、compがあるときはなしで、打音は`onHit`が知らせます）。

</div>

## Granular Synthesis

`granular.js`: `GranularSource` loops a recording (from `GRAIN_SOURCES`, single notes found with `sampleUrl(instrument, file)` from `instruments.js`) through `Tone.GrainPlayer`, the first two seconds of it. `setSource(id)` loads another (returns `ready`). `rate` (speed through the recording), `detune` (cents), `grainSize` and `overlap` (seconds), and `reverse` are independent. Same `start()`, `stop()`, `playing` as a continuous source; connect `output`.
<div class="jp">

`granular.js`：`GranularSource`は、録音（`GRAIN_SOURCES`の単音で、`instruments.js`の`sampleUrl(instrument, file)`で求める）の最初の2秒を、`Tone.GrainPlayer`でループします。`setSource(id)`で別の録音を読み込みます（`ready`を返す）。`rate`（録音を進む速さ）、`detune`（セント）、`grainSize`と`overlap`（秒）、`reverse`はそれぞれ独立です。持続する音源と同じ`start()`、`stop()`、`playing`を持ち、`output`をつなぎます。

</div>

## Sampling

`sampler.js`: `SAMPLE_SOURCES` (loops, a drum break, a voice, a guitar chord, a gong, and a piano note, hosted with Tone.js's examples) and `loadSample(id)`, which resolves to a ToneAudioBuffer. `MicRecorder` records from the microphone: `start()` (inside a user gesture) and `stop()`, which resolves to the recording with the silence before the first sound cut off and the peak raised to 0.9. `SliceLooper` plays a recording slice by slice in a loop (start/stop/playing): `setBuffer(buffer)`, then `slices` (equal slices; 1 plays it whole), `repeat` and `jump` (the chances that the next slice is the same one or one at random, otherwise the next in order), `reverse` (the chance a slice plays backward; 1 reverses all), `rate` (speed and pitch together), `attack` and `release` (fades per slice), and `spread` (random placement left and right), all changeable while playing. `onSlice(i, reversed)` reports each slice. The sampler demo uses it as a sampler and, with `?mode=skip`, as a skipping CD.

<div class="jp">

`sampler.js`：`SAMPLE_SOURCES`（Tone.jsの例とともに公開されているループ、ドラム・ブレイク、声、ギターの和音、ゴング、ピアノの単音）と、ToneAudioBufferを返す`loadSample(id)`。`MicRecorder`はマイクから録音します。`start()`（ユーザーの操作の中で呼ぶ）と`stop()`で、`stop()`は最初の音より前の無音を切り、ピークを0.9に上げた録音を返します。`SliceLooper`は録音をスライスごとにループ再生します（start/stop/playing）。`setBuffer(buffer)`のあと、`slices`（等しいスライス。1は全体）、`repeat`と`jump`（次のスライスが同じスライスになる確率と、ランダムなスライスになる確率。それ以外は順番どおり）、`reverse`（スライスが逆に鳴る確率。1ですべて逆）、`rate`（速さと音高を一緒に）、`attack`と`release`（スライスごとのフェード）、`spread`（左右へのランダムな配置）で、どれも再生中に変えられます。`onSlice(i, reversed)`がそれぞれのスライスを知らせます。samplerのデモは、これをサンプラーとして、そして`?mode=skip`では飛ぶCDとして使います。

</div>

## Tetrachords

`scales.js`: `TETRACHORDS` (major, minor, Phrygian, and harmonic, each written as a lower half from C and an upper half from G) and `joinTetrachords(lower, upper)`, the seven-note scale on C the two make a whole step apart, labeled with its common name (major, Dorian, harmonic minor, Phrygian dominant, …) or an empty string. The tetrachords demo uses them.

<div class="jp">

`scales.js`：`TETRACHORDS`（長調、短調、フリギア、和声的。それぞれCからの下の半分と、Gからの上の半分として書きます）と`joinTetrachords(lower, upper)`。後者は、2つを全音離してできるCの上の7音の音階を、よく知られた名前（長音階、ドリアン、和声的短音階、フリジアン・ドミナントなど）か空の文字列のラベルとともに返します。tetrachordsのデモが使います。

</div>

## Spectral painting

`spectral.js`: `spectralFrequencies(rows, low, high)` spaces sine frequencies evenly in pitch (not tuned to a scale). `SpectralPlayer(grid, { duration, onColumn })` plays a grid (`grid[col][row]`, 0–1) left to right in a loop, one sine per row, sharing each column's level among its sounding rows (start/stop/playing); the grid can change while it plays. `PaintGrid` (`lib/demo/PaintGrid.js`) draws the grid and lets the user paint it: pressing an empty cell paints, a painted one erases; `setColumn(i)` marks the sounding column red.

<div class="jp">

`spectral.js`：`spectralFrequencies(rows, low, high)`は、サイン波の周波数を音高の上で等間隔に（音階に合わせずに）並べます。`SpectralPlayer(grid, { duration, onColumn })`は、格子（`grid[col][row]`、0〜1）を、1行につきひとつのサイン波で、左から右へ繰り返し再生し、それぞれの列の音量を鳴っている行で分け合います（start/stop/playing）。格子は再生中に変えられます。`PaintGrid`（`lib/demo/PaintGrid.js`）は格子を描き、ユーザーが塗れるようにします。空いたセルを押すと塗り、塗ったセルを押すと消します。`setColumn(i)`は鳴っている列を赤くします。

</div>

## SampleView

`SampleView` (`lib/demo/SampleView.js`) draws a recording's waveform as a red line (the lowest and highest sample under each pixel, at 70% of the height), cut into `slices`; the sounding slice is filled yellow behind it, butter when it plays backward. `update(buffer, slices)`, `setSlice(i, reversed)`.

<div class="jp">

`SampleView`（`lib/demo/SampleView.js`）は、録音の波形を赤い線（それぞれのピクセルの下の最小と最大のサンプル。高さの70%）で描き、`slices`に切り分けます。鳴っているスライスは後ろを黄色で、逆再生のときはバター色で塗ります。`update(buffer, slices)`、`setSlice(i, reversed)`。

</div>

## ProgressionView and ChordChart

Both draw a progression and share `update(progression, voicings)`, `setChord(i)`, `setNote(i)`, `setHit(k)`, and pressing a chord to call `onPress(i)` / `onRelease(i)`, so the progression demo takes either (`?view=chart` for the chart). The demo pairs them with a `Keyboard` whose `setLit(midis)` lights the sounding notes.

- **`ChordChart`** (`ChordChart.js`): the progression as a lead sheet's chart, four 4/4 bars to a line, each chord a white well as wide as its share of the bar with its symbol inside and its Roman numeral below; the sounding chord is red with white text. A chord longer than a bar fills each of its bars. The melody is not drawn.
<div class="jp">

どちらも進行を描き、`update(progression, voicings)`、`setChord(i)`、`setNote(i)`、`setHit(k)`、そして和音を押すと`onPress(i)` / `onRelease(i)`を呼ぶことを共有するので、進行のデモはどちらでも使えます（表は`?view=chart`）。デモでは、鳴っている音を`setLit(midis)`で光らせる`Keyboard`と組み合わせます。

- **`ChordChart`**（`ChordChart.js`）：進行をリード・シートの表として、1行に4/4の4小節ずつ描きます。それぞれの和音は小節の中の拍の割合ぶんの幅の白いくぼみで、中にシンボル、下にローマ数字を置きます。鳴っている和音は赤地に白い文字です。1小節より長い和音は、またがる小節をすべて埋めます。旋律は描きません。

</div>

`ProgressionView` (`ProgressionView.js`) draws a progression as a piano roll: time to the right (each chord as wide as its beats), pitch up, each voiced note a yellow bar across its chord (or, with a comp, across each hit), the melody in pink, sounding notes red. Chord symbols sit above, on two alternating lines when one is wider than its chord (Roman numerals below do the same); Roman numerals and functions, when present, below. Pressing a chord calls `onPress(i)` / `onRelease(i)`. `update(progression, voicings)`, `setChord(i)`, `setNote(i)`, `setHit(k)`. The progression demo pairs it with a `Keyboard` whose `setLit(midis)` lights the sounding notes.
<div class="jp">

`ProgressionView`（`ProgressionView.js`）は、進行をピアノロールとして描きます。時間は右へ（それぞれの和音は拍の長さぶんの幅）、音高は上へ進み、配置されたそれぞれの音は和音の幅（compがあればそれぞれの打音の幅）の黄色い横棒、旋律はピンク、鳴っている音は赤です。コード・シンボルは上に（和音の幅より広いものがあれば2行に交互に。下のローマ数字も同じ）、ローマ数字と機能は（あれば）下に置きます。和音を押すと`onPress(i)` / `onRelease(i)`を呼びます。`update(progression, voicings)`、`setChord(i)`、`setNote(i)`、`setHit(k)`。進行のデモでは、鳴っている音を`setLit(midis)`で光らせる`Keyboard`と組み合わせます。

</div>

## CycleView and StepGrid

Both draw a rhythm pattern and share `update(pattern, stepDuration)` (the step duration converts track offsets into steps) and `setStep(i)` (the sounding step, -1 for none; `CycleView` also takes an array, one step per track). Hits are yellow with their size or height following velocity times gain, the sounding step's hits are red, and a track with an `offset` is drawn moved by that share of a step (in `StepGrid`, so is a hit with an `offsets` entry).

- **`CycleView`** (`CycleView.js`): the pattern as a cycle, steps running clockwise from the top, one white ring per track with the first track outermost. A lone track gets larger dots. With `{ oneRing: true }` all tracks share one ring and are told apart by color, the first track yellow and the others `accent(0)`, `accent(1)`, … (the pulse whose first beat is another sound).
- **`StepGrid`** (`StepGrid.js`): an editable grid, a labeled row per track (the label column as wide as the longest label, rounded up to the grid) and a cell per step, wider gaps between beat groups; the sounding column's wells are butter. Clicking a cell turns it on (a full hit) or off, and dragging a hit up or down changes its velocity by a hundredth per pixel, down to 0.05, shown on the cell as a percentage while dragging; both call `onEdit(track, step, velocity)`. With `{ shift }` (seconds), a hit can also be dragged left or right into its track's `offsets`, up to `shift` either way, at a quarter of a millisecond per pixel, with the offset shown on the cell. A drag keeps the direction it starts in; a press that does not move toggles the cell. With `{ paint: true }` (not with `shift`), cells can also be toggled by dragging: a press on an empty cell turns it on at once and the drag turns on every cell it passes, while a press on a hit that moves sideways turns off the hits it passes; up or down still sets the velocity. The note grid toy uses it. The grid leaves room on the right for the last hit moved as late as it can go. With `{ count: true }` a row above counts the beats, one well per beat group numbered from 1 (restarting each bar, `pattern.beatsPerBar` for a pattern longer than one), the sounding beat red. It lives in a `.canvas-wrap.dp-strip`, below the stage in the stacked layout or as the whole stage in a `.stage-col`, and sets the strip's height to its rows.
<div class="jp">

どちらもリズムのパターンを描き、`update(pattern, stepDuration)`（ステップの長さはトラックのずれをステップ数に換算するため）と`setStep(i)`（鳴っているステップ、なしは-1）を共有します。打音は黄色で、大きさや高さはベロシティとゲインの積に従います。鳴っているステップの打音は赤く、`offset`を持つトラックは、そのぶんステップの割合だけずらして描きます（`StepGrid`では、`offsets`を持つ打音も同じです）。

- **`CycleView`**（`CycleView.js`）：パターンを周期として、上から時計回りにステップを並べ、トラックごとに白いリングを描きます（最初のトラックがいちばん外側）。トラックがひとつのときは点を大きくします。`{ oneRing: true }`では、すべてのトラックがひとつのリングを共有し、色で区別されます。最初のトラックが黄色、ほかは`accent(0)`、`accent(1)`…です（最初の拍だけ音が違う拍のため）。
- **`StepGrid`**（`StepGrid.js`）：編集できるグリッドで、トラックごとにラベルつきの行（ラベルの列は、いちばん長いラベルの幅をグリッドに切り上げた幅）、ステップごとにセルを並べ、拍のまとまりのあいだを広く空けます。鳴っている列のくぼみはバター色です。セルをクリックするとオン（強）とオフが切り替わり、打音を上下にドラッグすると、1ピクセルあたり0.01ずつ、0.05までベロシティが変わります。ドラッグ中はその値をパーセントでセルに表示します。どちらも`onEdit(track, step, velocity)`を呼びます。`{ shift }`（秒）を渡すと、打音を左右にドラッグして、トラックの`offsets`に前後それぞれ最大`shift`までのずれを入れられます。1ピクセルあたり0.25ミリ秒で、ずれをセルに表示します。ドラッグは動き始めた向きのまま続き、動かさずに押した場合はセルを切り替えます。`{ paint: true }`（`shift`とは併用できません）を渡すと、ドラッグでもセルを切り替えられます。空のセルを押すとすぐにオンになり、ドラッグで通ったセルがすべてオンになります。打音を押して横に動かすと、通った打音がオフになります。上下に動かすと、これまでどおりベロシティが変わります。音の格子のおもちゃが使っています。グリッドは、最後の打音をいちばん後ろまでずらしても収まるよう、右に余白を残します。`{ count: true }`では、上の行が拍を数えます。拍のまとまりごとに1から番号をつけたくぼみを置き（小節ごとにやり直し、1小節より長いパターンでは`pattern.beatsPerBar`）、鳴っている拍を赤くします。`.canvas-wrap.dp-strip`に置き、スタック型のレイアウトではステージの下に、`.stage-col`ではステージ全体として使い、帯の高さを行数に合わせます。

</div>

## PulseView

`PulseView` (`public/lib/demo/PulseView.js`) draws a pulse with no cycle as beats scrolling from right to left along a white track, 64 px apart. Each yellow dot (sized by velocity) sounds as it reaches the middle, is red for the first half of its beat, and leaves at the left; a faster tempo moves them faster. It follows the audio clock, not callback timing: construct it with `{ now: audioNow }`, feed it `addBeat(time, velocity)` from `StepSequencer`'s `onSchedule`, and call `update(stepDuration, velocity)` when the tempo changes (it places beats not scheduled yet) and `stop()` when the sequencer stops, which returns it to rest with the first beat waiting in the middle.
<div class="jp">`PulseView`（`public/lib/demo/PulseView.js`）は、周期のない拍を、白いトラックの上を64 px間隔で右から左へ流れる拍として描きます。黄色い点（大きさはベロシティに従う）は真ん中に来たところで鳴り、その拍の前半のあいだ赤くなり、左へ去ります。テンポが速いほど速く動きます。コールバックのタイミングではなくオーディオクロックに従います。`{ now: audioNow }`でつくり、`StepSequencer`の`onSchedule`から`addBeat(time, velocity)`を渡します。テンポが変わったら`update(stepDuration, velocity)`を（まだ予約されていない拍の位置に使う）、シーケンサーが止まったら`stop()`を呼びます。`stop()`で最初の拍が真ん中で待つ静止状態に戻ります。</div>

## ScaleView

`ScaleView` (`public/lib/demo/ScaleView.js`) shows a scale two ways: a row of 13 squares from the root to the root an octave above (white wells for notes outside the scale, yellow for notes in it, labeled with the scale's spelling), and the scale written ascending on a treble staff with ledger lines and accidentals (up and back down for a scale with `descending`; a plain note after a sharp or flat on the same line takes a natural). The sounding note is red in both. Pressing a square plays its note through `onNoteOn` / `onNoteOff`. Call `update(scale)` and `setSounding(midi, step)`; `step` is the note's index in `scaleRun` while a run plays (or null), so the squares follow the direction and the staff marks that one note. The clef and accidentals use the Noto Music web font, which the demo page loads.
<div class="jp">`ScaleView`（`public/lib/demo/ScaleView.js`）は、音階を2通りに表示します。基準音から1オクターブ上の基準音までの13の四角の列（音階外の音は白いくぼみ、音階の音は黄色で、音階の綴りでラベルをつける）と、加線や変化記号をつけて五線譜に上行で書いた音階（`descending`を持つ音階は上行と下行）です。鳴っている音は両方で赤くなります。四角を押すと、`onNoteOn` / `onNoteOff`でその音を鳴らします。`update(scale)`と`setSounding(midi, step)`を呼びます。`step`は、上下行の演奏中に`scaleRun`の中でのその音の位置（それ以外はnull）で、四角は進む方向に合わせて変わり、五線譜はその1音だけを示します。音部記号と変化記号には、デモのページが読み込むNoto Musicのウェブフォントを使います。</div>

## BeatView

`BeatView` (`public/lib/demo/BeatView.js`) draws half a second of two sine waves that differ by `beat` hertz, each as a thin yellow line, and their sum (the main wave) as a red line on top. The sum keeps a steady size at 0 Hz and swells and shrinks `beat` times per second otherwise. The beating harmonics are near 1000 Hz, more than a hundred cycles per swell, so the waves are drawn at 48 Hz (`DRAWN_HZ`) while keeping the real difference between them: every cycle is visible and the swells keep their real rate. Call `update(beat)`; it is computed, so it shows whether or not anything is playing.
<div class="jp">`BeatView`（`public/lib/demo/BeatView.js`）は、`beat` Hzだけ異なる2つのサイン波を0.5秒分、それぞれ黄色の細い線で、その和（主要な波）を赤い線で上に重ねて描きます。和の大きさは0 Hzでは一定で、それ以外では1秒に`beat`回膨らんだり縮んだりします。うなる倍音は約1000 Hzで、1回の膨らみに100以上の周期が入って細かすぎるため、波は2つの差を保ったまま48 Hz（`DRAWN_HZ`）で描きます。それぞれの周期が見え、膨らみの速さは実際のままです。`update(beat)`を呼びます。計算で描くため、音が鳴っていてもいなくても表示されます。</div>

## FifthsRing

`FifthsRing` (`public/lib/demo/FifthsRing.js`) draws notes within one octave on a ring: the full circle is 1200 cents, starting at the top and running clockwise. The ring is a white well, notes are yellow dots labeled outside the ring, and the latest note is red with its label inside, so it can sit next to another note without the labels colliding. Call `update(notes)` with `{ name, cents }`, oldest first.
<div class="jp">`FifthsRing`（`public/lib/demo/FifthsRing.js`）は、1オクターブの中の音をリング上に描きます。円の一周が1200セントで、上から時計回りに進みます。リングは白いくぼみで、音はリングの外側にラベルのある黄色い点です。最新の音は赤で、ラベルを内側に置くため、ほかの音のすぐ隣にあってもラベルが重なりません。古い順の`{ name, cents }`で`update(notes)`を呼びます。</div>

## Keyboard

`Keyboard` (`public/lib/demo/Keyboard.js`) builds the on-screen input inside a `.dp-keyboard` element, shaped to the sound: a piano keyboard, or pads for sounds without pitch. It reports notes as MIDI numbers through `onNoteOn` and `onNoteOff` and makes no sound itself. `setLit(midis)` lights keys for notes played from elsewhere (a chord from a progression) in the same yellow. `setScale(pcs, names)` shows only a scale's notes (such as a major key) as a row of equal keys labeled with `names`, played from the home row like the white keys (`whiteOnly` is this for the white keys); null returns to the full keyboard.
<div class="jp">`Keyboard`（`public/lib/demo/Keyboard.js`）は、`.dp-keyboard`要素の中に、音に合わせた画面上の入力をつくります。鍵盤か、音高を持たない音ではパッドです。音符をMIDI番号として`onNoteOn`と`onNoteOff`で通知するだけで、自身は音を鳴らしません。`setLit(midis)`は、ほかから鳴らした音（進行の和音など）の鍵盤を同じ黄色で光らせます。`setScale(pcs, names)`は、音階の音（長調など）だけを`names`のラベルつきの等しい鍵盤の列として表示し、白鍵と同じようにホーム列で弾けるようにします（`whiteOnly`は白鍵でこれを行うもの）。nullで通常の鍵盤に戻ります。</div>

- **Range:** `low` (a C) and `octaves`, with a top C added. `shiftOctave(±1)` moves it.
- **Pointer:** dragging glides across keys.
- **Computer keys:** A to ; play from the lowest C (white keys on the home row, black keys on the row above). Z and X shift the octave.
- **Overlapping sources:** a note held by a key and a pointer at once sounds once, and stops when the last one lets go.
- **`whiteOnly`, `setRoot(pc)`:** `whiteOnly: true` builds white keys only, each labeled with its letter, played from the home row (A = the lowest C, S = D, …), for music on the white keys. `setRoot(pc)` marks every key of one pitch class in butter yellow, so the home note stays visible.
- **`setPads(pads)`:** switches to a row of pads (an instrument's `pads`) or back to piano keys (null). Pads are equal white shapes one grid unit apart, labeled at the bottom; A, S, D, … play them from the left, the space bar plays the first pad, and a single pad answers to all of those keys. Octave shifting applies to keys only.
<div class="jp">

- **音域：**`low`（Cの音）と`octaves`で決まり、最上部にCが1つ加わります。`shiftOctave(±1)`で移動します。
- **ポインター：**ドラッグすると鍵盤の上を滑るように弾けます。
- **コンピューターのキー：**Aから;までが最も低いCから鳴ります（ホーム列が白鍵、その上の列が黒鍵）。ZとXでオクターブを切り替えます。
- **重なった入力：**キーとポインターで同時に押さえた音は一度だけ鳴り、最後の入力が離れたときに止まります。
- **`whiteOnly`、`setRoot(pc)`：**`whiteOnly: true`では白鍵だけをつくり、それぞれに音名を表示して、ホーム列（Aが最も低いC、SがD……）で弾けるようにします。白鍵の音楽に使います。`setRoot(pc)`は、ひとつのピッチクラスのすべての鍵盤をバター色で示し、主音が見えるようにします。
- **`setPads(pads)`：**パッドの列（楽器の`pads`）に切り替えるか、鍵盤（null）に戻します。パッドは1グリッド間隔で並ぶ同じ大きさの白い形で、下にラベルがあります。A、S、D……のキーで左から鳴らせ、パッドがひとつのときは、それらのキーとスペースキーのどれでも鳴ります。オクターブの切り替えは鍵盤のときだけです。

</div>

### Common to Scope and PartialsView: one plot height

Every wave or spectrum plot on the site is the same height, `--plot` (128px) in `demo-ui.css`. Both classes add `.dp-plot` to their `.canvas-wrap`, which fixes it at the plot plus the 32px inset above and below (192px); with two plots stacked (Scope's `'both'`, PartialsView's `spectrum`) they also add `.dp-plots-2`, two plots with one inset between them (352px), split evenly. In a `.stage-col` the canvas no longer stretches, so a keyboard sits right under it. A frame is sized to the taller of the stage and the panel; space left over stays empty below the stage.
<div class="jp">サイトのすべての波形・スペクトルのプロットは、同じ高さ、`demo-ui.css`の`--plot`（128px）です。どちらのクラスも自分の`.canvas-wrap`に`.dp-plot`をつけ、プロットとその上下32pxの余白の高さ（192px）に固定します。2つのプロットを重ねる場合（Scopeの`'both'`、PartialsViewの`spectrum`）は`.dp-plots-2`もつけ、あいだに余白ひとつを挟んだ2つ分（352px）にして、均等に分けます。`.stage-col`の中ではキャンバスが伸びなくなるので、鍵盤はそのすぐ下に来ます。フレームの高さは、ステージとパネルの高いほうに合わせます。余った空間は、ステージの下に空いたまま残ります。</div>

## Scope

`Scope` (`public/lib/demo/Scope.js`) draws a signal on a canvas inside a `.canvas-wrap`, sized by `Viewport`. It listens to a source node and does not pass audio on. Set `mode` to switch views. `size` (2048) sets the waveform's length, half of which is drawn (the scope reads twice `size` so its trigger filter can settle), and `fftSize` (4096) the number of spectrum bins; more bins resolve low frequencies better but react more slowly. `gain` (2) magnifies the wave so that a level of ±0.5 reaches the plot's edges, since sounds rarely come near full scale; louder parts are flattened just past the edges. The sine-wave demo uses `gain: 1`, so its Amplitude slider spans the full height.
<div class="jp">`Scope`（`public/lib/demo/Scope.js`）は、`.canvas-wrap`の中のキャンバスに信号を描きます。サイズは`Viewport`で決まります。ソースのノードを聞くだけで、音を先に渡しません。`mode`で表示を切り替えます。`size`（2048）は波形の長さで、その半分を描きます（トリガーのフィルターが落ち着くよう、スコープは`size`の2倍を読み取ります）。`fftSize`（4096）はスペクトルのビン数です。ビンが多いほど低い周波数をよく分解できますが、反応は遅くなります。`gain`（2）は波を拡大する倍率で、±0.5の大きさがプロットの端に届きます。音が最大の大きさに近づくことはまれだからです。それより大きい部分は、端を少し越えたところで平らになります。サイン波のデモは`gain: 1`を使い、Amplitudeのスライダーが高さ全体にわたるようにしています。</div>

- **`'wave'`:** amplitude over half of `size` (about 21 ms at 2048 samples and 48 kHz), starting at a rising zero crossing so a periodic wave holds still. The crossing is chosen like an oscilloscope's "HF reject" trigger: on a filtered copy of the signal (a DC blocker and a steep low pass at 150 Hz) the fundamental outweighs every harmonic, so a strong harmonic, such as a resonant filter's peak, cannot add crossings that make the picture jump between frames. Drawing then starts at the signal's own next rising crossing, interpolated between samples, so a sine still starts at zero.
- **`'spectrum'`:** level in dB from 20 Hz to 20 kHz on a logarithmic frequency axis.
- **`'both'`:** the waveform in the upper half and the spectrum in the lower half.
- **`freeze()`, `unfreeze()`:** `freeze()` holds the current frame (or replaces the held one) until `unfreeze()`, for reading short sounds.
- **`freezeOnNextOnset()`:** (not used by any demo at present) freezes just after the next sound arrives. It watches the newest samples for the signal to rise above a threshold, since output latency varies by device and a fixed delay after the note can miss a drum hit.
<div class="jp">

- **`'wave'`：**`size`の半分（2048サンプル、48 kHzで約21ミリ秒）の振幅を描きます。周期的な波が静止して見えるよう、上向きのゼロ交差から描き始めます。交差はオシロスコープの「HFリジェクト」トリガーのように選びます。信号をフィルターに通した複製（DCブロッカーと、150 Hzの急なローパス）では基音がどの倍音よりも強いので、レゾナンスのピークのような強い倍音が交差を増やして、フレームごとに絵が跳ぶことがありません。そのうえで、信号そのものの次の上向きの交差（サンプル間を補間した位置）から描くので、サイン波はやはり0から始まります。
- **`'spectrum'`：**20 Hzから20 kHzまでの音量（dB）を、対数の周波数軸で描きます。
- **`'both'`：**上半分に波形、下半分にスペクトルを描きます。
- **`freeze()`、`unfreeze()`：**`freeze()`は、`unfreeze()`まで現在のフレームを保持します（すでに保持していれば置き換えます）。短い音を読み取るために使います。
- **`freezeOnNextOnset()`：**（現在はどのデモも使っていません）次の音が届いた直後に表示を止めます。出力の遅延は機器によって異なり、音符から一定時間後に止めるとドラムの打音を逃すことがあるため、最新のサンプルがしきい値を超えるのを監視します。

</div>

## PartialsView

`PartialsView` (`public/lib/demo/PartialsView.js`) draws an additive tone from its partial list rather than from audio, so it shows whether or not the tone is playing. It draws directly on the paper with no panels, titles, or labels: two periods of the fundamental, each partial as a thin yellow line and their sum (the main wave) as a thick red line on top, all at the scale `AdditiveOscillator` plays, so the yellow lines add up to the red one. Call `update(partials)` after every change. With `{ spectrum: true }` it also draws each partial's magnitude as a yellow bar below the wave, one slot per entry in the list, so a list padded with zeros keeps the bars in place as partials are added.
<div class="jp">`PartialsView`（`public/lib/demo/PartialsView.js`）は、加算合成の音を、音声からではなく部分音のリストから描きます。そのため、音が鳴っていてもいなくても表示されます。パネルや見出し、ラベルを使わず、紙の上に直接、基音の2周期分を描きます。それぞれの部分音を黄色の細い線で、その和（主要な波）を赤い太い線で上に重ね、`AdditiveOscillator`が鳴らすのと同じスケールで描くため、黄色の線を足すと赤い線になります。変更のたびに`update(partials)`を呼びます。`{ spectrum: true }`を渡すと、波の下にそれぞれの部分音の大きさを黄色い棒で描きます。棒の位置はリストの要素ごとに1つなので、0で埋めたリストを渡せば、部分音を加えても棒の位置は変わりません。</div>

## EnvelopeView

`EnvelopeView` (`public/lib/demo/EnvelopeView.js`) draws an ADSR envelope as a yellow filled shape on the paper, level over time for a note held `hold` seconds, across a fixed `span` of seconds so that longer stages take more room. `update({ attack, decay, sustain, release })` redraws it; `play(time)` fills the part already sounded in pink, following the audio clock from `time`. `envelopeLevel(t, envelope, hold)` gives the level at a moment, with straight-line stages and a release that starts from wherever the level is when the note is let go, matching the `envelope` synth engine.
<div class="jp">`EnvelopeView`（`public/lib/demo/EnvelopeView.js`）は、ADSRエンベロープを、紙の上に黄色の塗りの形で描きます。`hold`秒押した音の音量の時間変化を、決まった`span`秒の幅で描くので、長い段階ほど広く場所をとります。`update({ attack, decay, sustain, release })`で描き直し、`play(time)`は、`time`からの音声の時計に合わせて、鳴り終えた部分をピンクで塗ります。`envelopeLevel(t, envelope, hold)`はある時点のレベルを返します。それぞれの段階は直線で、リリースは音を離した時点のレベルから始まり、`envelope`シンセ・エンジンと一致します。</div>

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

## Synth engines and the new effects

`instruments.js` also has `SYNTH_ENGINES`, synthesizers described as data like the effects: `subtractive` (an oscillator through a resonant low-pass filter with its own envelope, then the amplitude ADSR), its two halves on their own, `filter` (wave, cutoff, resonance; the cutoff fixed, the sound at full level while held) and `envelope` (wave and a straight-line ADSR, so `EnvelopeView` draws it exactly), `fm` (ratio, index, modulation decay), and `am` (ratio). Each parameter has `key`, `label`, `apply(synth, value)`, and either a range or `options` (a select). `SynthEngine(id)` is a `PolyInstrument` with `set(key, value)` and `get(key)`. `HeldNote(instrument, midi)` gives one note the `start()`/`stop()`/`playing` contract of a continuous source, so `wirePlayButton` can hold it. `MalletSynth` is a short struck tone that decays by itself, for players that only send noteOn (a step sequencer of pitched notes). `effects.js` adds `compressor` (threshold, ratio; transparent at 0 dB and 1), `autowah` (base, octaves, mix), `chorus` and `phaser` (rate, depth or octaves, mix); `DEFAULT_CHAIN` keeps the instrument demos on distortion, filter, delay, and reverb. The `synth` demo takes `?engine=` (one engine or a comma list offered in a select), `?presets` (the instrument presets), and `?effects=` (the chain, in order); a `.dp-group` mount holds controls that are rebuilt in place.
<div class="jp">`instruments.js`には、エフェクトと同じようにデータとして記述したシンセサイザー、`SYNTH_ENGINES`もあります。`subtractive`（レゾナンスつきローパス・フィルターと、そのエンベロープ、音量のADSRを通るオシレーター）、その前半と後半だけの`filter`（波形、カットオフ、レゾナンス。カットオフは固定で、押しているあいだは一定の音量）と`envelope`（波形と直線のADSR。そのため`EnvelopeView`で正確に描けます）、`fm`（比、インデックス、変調のディケイ）、`am`（比）です。それぞれのパラメータは`key`、`label`、`apply(synth, value)`と、範囲か`options`（選択）を持ちます。`SynthEngine(id)`は`set(key, value)`と`get(key)`を持つ`PolyInstrument`です。`HeldNote(instrument, midi)`は、ひとつの音に、鳴り続ける音源と同じ`start()`/`stop()`/`playing`の約束を与え、`wirePlayButton`で保てるようにします。`MalletSynth`は自然に減衰する短い打音で、noteOnだけを送るもの（音高のあるステップ・シーケンサー）のためのものです。`effects.js`には`compressor`（スレッショルド、レシオ。0 dBと1で透明）、`autowah`（ベース、オクターブ、ミックス）、`chorus`と`phaser`（速さ、深さまたはオクターブ、ミックス）を加え、`DEFAULT_CHAIN`で楽器のデモはディストーション、フィルター、ディレイ、リバーブのままです。`synth`のデモは`?engine=`（ひとつのエンジン、またはカンマ区切りで選択に）、`?presets`（楽器のプリセット）、`?effects=`（順に並べたチェーン）を受け取ります。その場で組み立て直すコントロールは`.dp-group`のマウントに置きます。</div>

## Gesture

`gesture.js` plays sound from gestures rather than notes. `GestureSynth` is one continuous voice (an oscillator, a resonant low-pass filter, a gate) with `setPitch(midi)`, `setCutoff(hz)`, `setResonance(q)`, `start()`, and `stop()`; it glides between values. `pitchAt(position, { low, high, pcs, root })` maps 0–1 onto a MIDI pitch, continuous or snapped to the pitch classes `pcs` (`PENTATONIC_PCS` for the major pentatonic). A gesture demo's Pitch menu offers `TOY_SCALES` from `scales.js`, turned into `pcs` with `scalePitchClasses`; `cutoffAt(position)` maps 0–1 onto 100 Hz–8 kHz in octaves, and `resonanceAt(position)` onto a Q of 0.5–15, evenly in ratio. `ContourPlayer(synth, { sample, pitch, duration, onPosition })` sweeps a drawn contour left to right in a loop, silent where `sample(x)` is null, with the start/stop/playing contract. `rhythm.js` adds `pitchedPattern(notes, { steps, stepsPerBeat, tempo })`, an empty grid of pitched tracks for `StepSequencer` and `StepGrid`.
<div class="jp">`gesture.js`は、音符ではなく身振りから音を鳴らします。`GestureSynth`は連続するひとつの声（オシレーター、レゾナンスつきローパス・フィルター、ゲート）で、`setPitch(midi)`、`setCutoff(hz)`、`setResonance(q)`、`start()`、`stop()`を持ち、値のあいだを滑ります。`pitchAt(position, { low, high, pcs, root })`は0〜1をMIDIの音高に対応させ、連続のまま、またはピッチクラス`pcs`（メジャー・ペンタトニックは`PENTATONIC_PCS`）にそろえます。身振りのデモのPitchメニューは`scales.js`の`TOY_SCALES`を並べ、`scalePitchClasses`で`pcs`に変えます。`cutoffAt(position)`は0〜1をオクターブ単位で100 Hz〜8 kHzに、`resonanceAt(position)`は比で均等に0.5〜15のQに対応させます。`ContourPlayer(synth, { sample, pitch, duration, onPosition })`は、描いた輪郭を左から右へ繰り返したどり、`sample(x)`がnullのところは無音にします。持続する音源と同じstart/stop/playingを持ちます。`rhythm.js`には、`StepSequencer`と`StepGrid`のための空の音高つきトラックの格子、`pitchedPattern(notes, { steps, stepsPerBeat, tempo })`を加えます。</div>

## XYPad and DrawPad

`XYPad` (`XYPad.js`) is a white well to drag on, reporting x and y from 0 to 1 (y = 0 at the bottom) through `onStart`, `onMove`, and `onEnd`; the pointer is a red dot trailing a yellow line, a smooth curve that thins and fades toward its tail, and `setMarks(positions)` ticks the bottom edge where snapped notes fall. `DrawPad` (`DrawPad.js`) is a white well to draw a line on, read back with `sample(x)` (height 0–1, or null where nothing is drawn); `fill(fn)` and `clear()` replace or erase it, and `setPlayhead(x)` marks the playing position with a red dot on the line (a small butter dot when silent). The line is pink.
<div class="jp">`XYPad`（`XYPad.js`）は、ドラッグする白いくぼみで、xとyを0〜1（下端がy = 0）として`onStart`、`onMove`、`onEnd`で知らせます。ポインターは赤い点で、なめらかな曲線の黄色い軌跡を引きます。軌跡は末尾へ向かって細く薄くなります。`setMarks(positions)`はそろえた音の位置に下端の目盛りをつけます。`DrawPad`（`DrawPad.js`）は線を描く白いくぼみで、`sample(x)`（高さ0〜1、何も描いていないところはnull）で読み取ります。`fill(fn)`と`clear()`で置き換えたり消したりでき、`setPlayhead(x)`は再生位置を線上の赤い点で（無音のところでは小さなバター色の点で）示します。線はピンクです。</div>

## Panel controls

`public/lib/demo/controls.js` builds `dp-*` controls from data, for controls that come from a library registry rather than being fixed in a demo's HTML.
<div class="jp">`public/lib/demo/controls.js`は、データから`dp-*`のコントロールを組み立てます。デモのHTMLに固定するのではなく、ライブラリのレジストリから来るコントロールに使います。</div>

- **`addRange(parent, param)`:** a labeled slider; takes an effect parameter's fields directly. The track fills with the accent color up to the value (`--fill`, kept in step from script), and `color` sets that accent for one row.
- **`setRange(input, value)`:** moves a slider made by `addRange` and updates its readout, without firing `onChange`.
- **`formatValue(v, unit, step)`:** the readout text: whole numbers for Hz, dB, and any slider whose `step` is 1 or more; milliseconds or seconds for `'s'`; two decimals otherwise.
- **`wirePlayButton(button, source, startAudio)`** (in `panel.js`): a green Play/Stop button for anything with `start()`, `stop()`, and `playing`. It returns its `sync` function, for a source that stops by itself (a `Sequence`) to call so the label returns to Play.
- **`addReadout(parent, { label, value })`:** a labeled read-only text value one row tall (`.dp-readout`), for something reported while playing; returns a setter.
- **`addSelect(parent, { label, options, value, onChange })`:** options sharing a `group` become one optgroup. The select gives up focus after a change, so the computer keyboard goes back to playing notes.
- **`addSection(parent, title, { collapsed, color })`:** a collapsible section; returns its body. `color` sets the accent for the section and its controls.
- **`unwrap(mount)`:** replaces a mount element with the controls built into it, so they sit directly in the panel.
- **`addEffectControls(parent, chain)`:** one section per effect in an `EffectChain`, one slider per parameter. Each section takes the next accent color.
- **`addEngineControls(parent, engine, { onChange })`:** one control per parameter of a `SynthEngine`, a select for a parameter with `options` and a slider otherwise; `onChange(key, value)` runs after the engine is set.
<div class="jp">

- **`addRange(parent, param)`：**ラベル付きのスライダーです。エフェクトのパラメータの項目をそのまま受け取ります。トラックは値の位置までアクセントカラーで塗られ（`--fill`をスクリプトで更新）、`color`でその行のアクセントを設定します。
- **`setRange(input, value)`：**`addRange`でつくったスライダーを動かし、表示も更新します。`onChange`は呼びません。
- **`wirePlayButton(button, source, startAudio)`**（`panel.js`）：`start()`、`stop()`、`playing`を持つものに対するPlay/Stopボタンです。
- **`addReadout(parent, { label, value })`：**ラベルつきの、1行分の読み取り専用の文字の値（`.dp-readout`）。演奏中に知らせるもののためのもので、値を設定する関数を返します。
- **`addSelect(parent, { label, options, value, onChange })`：**同じ`group`を持つ選択肢は、ひとつのoptgroupにまとめます。変更後にフォーカスを手放すため、コンピューターのキーボードはすぐに演奏に戻ります。
- **`addSection(parent, title, { collapsed, color })`：**折りたたみ可能なセクションをつくり、その本体を返します。`color`で、セクションとその中のコントロールのアクセントを設定します。
- **`unwrap(mount)`：**マウント用の要素を、その中につくったコントロールで置き換え、コントロールがパネルの直下に並ぶようにします。
- **`addEffectControls(parent, chain)`：**`EffectChain`のエフェクトごとにセクションを、パラメータごとにスライダーをつくります。それぞれのセクションには順にアクセントカラーが割り当てられます。
- **`addEngineControls(parent, engine, { onChange })`：**`SynthEngine`のパラメータごとにコントロールをつくります。`options`を持つパラメータは選択、それ以外はスライダーです。`onChange(key, value)`はエンジンに値を設定したあとに呼ばれます。

</div>

</div>
