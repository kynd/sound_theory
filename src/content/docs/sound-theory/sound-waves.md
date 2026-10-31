---
title: "Sound Waves 音の波"
slug: sound-waves
---
To begin, what is sound? Sound is a vibration that travels through a medium such as air. A vibrating object—a string, drumhead, or speaker cone—pushes and pulls on the surrounding air, creating alternating regions of higher and lower pressure (compression and rarefaction) that spread outward at about 343 meters per second. When these waves reach your ear, your eardrum moves with them, and you hear sound.

音とは何でしょうか。音は、空気などの媒質を伝わる振動です。弦や太鼓の皮、スピーカーのコーンなどの振動体が周囲の空気を押したり引いたりすると、気圧の高い部分と低い部分（圧縮と膨張）が交互に生まれ、秒速約343メートルで広がっていきます。こうした波が耳に届くと、鼓膜もそれに合わせて動き、私たちは音を聞きます。

But these vibrations tell only part of the story. Like other sensory experiences, the sound we hear arises within the being that perceives it; it is not simply a property of the world independent of a listener. Hearing likely evolved because it helped organisms make sense of their surroundings and survive—for example, by detecting nearby animals or locating running water. Yet for humans, listening is more than a means of survival: we have also found ways to enjoy and appreciate sound for its own sake.

しかし、こうした振動だけでは音のすべてを説明できません。ほかの感覚体験と同じように、私たちが聞く音は、それを知覚する存在の中で生まれるものであり、聴き手とは無関係に世界に備わっている性質そのものではありません。聴覚は、近くにいる動物の気配を察したり、水の流れる場所を探したりして周囲の状況を把握し、生き延びる助けとなったために進化したと考えられます。しかし、人間にとって聴くことは生存の手段にとどまりません。私たちは、音そのものを楽しみ、味わう方法も見いだしてきました。

# Sine Wave
# サイン波

A sine wave is a smooth, repeating oscillation at a single frequency. A perfectly pure, steady sine wave is a mathematical ideal, but a tuning fork produces a sound that comes close. Once its initial vibrations settle, the sound is dominated by a single frequency, though it gradually fades. In this demo, frequency—the number of cycles per second, measured in hertz (Hz)—determines pitch. Amplitude—the size of the pressure variation—affects loudness: at a fixed frequency, a larger amplitude generally sounds louder. Press **Play** and move the sliders.

サイン波は、単一の周波数でなめらかに繰り返す振動です。完全に純粋で振幅が一定のサイン波は数学上の理想ですが、音叉はそれに近い音を出します。最初の振動が落ち着くと、音は単一の周波数が中心になりますが、次第に弱まっていきます。このデモでは、周波数（1秒あたりの振動回数。単位はヘルツ、Hz）が音の高さを決めます。振幅（気圧の変化の大きさ）は音の大きさに影響します。周波数が同じなら、振幅が大きいほど一般に大きな音に聞こえます。**Play**を押して、スライダーを動かしてみてください。

<div class="demo-wrap"><iframe src="/writing/demos/sine-wave/index.html" title="Sine wave" allow="autoplay" loading="lazy" style="height: 176px"></iframe></div>

The display always shows the same brief interval (about 20 milliseconds), so a higher frequency packs more cycles into it. The time required for one cycle is the period, the reciprocal of the frequency (a 440 Hz wave repeats about every 2.27 ms).

画面には常に同じ短い時間（約20ミリ秒）が表示されるため、周波数が高いほど、その間に多くの周期が収まります。1周期にかかる時間を周期といい、周波数の逆数です（440 Hzの波は約2.27ミリ秒ごとに繰り返します）。

People can hear frequencies from about 20 Hz to 20 kHz, though the upper limit decreases with age. Doubling the frequency raises the pitch by an octave, so pitch depends on the ratio between frequencies, not the difference between them.

人が聞き取れる周波数の範囲は約20 Hzから20 kHzですが、上限は年齢とともに下がります。周波数が2倍になると音は1オクターブ上がるため、音の高さは周波数の差ではなく、周波数同士の比で決まります。

# Adding Sine Waves
# サイン波を足す

A sine wave sounds plain, and few instruments produce one on its own. A plucked string vibrates not only along its full length but also in halves, thirds, quarters, and so on. These vibrations produce a series of sine waves whose frequencies are whole-number multiples of the lowest frequency. The lowest is the fundamental; the others are harmonics (or overtones).

サイン波は単調な音で、それだけを出す楽器はほとんどありません。弦をはじくと、弦全体だけでなく、半分、3分の1、4分の1……の長さでも振動します。その結果、最も低い周波数の整数倍の周波数を持つサイン波が重なり合います。最も低い成分が基音で、ほかの成分が倍音です。

Adding harmonics changes the waveform and the sound's character (timbre) without changing the pitch, because their sum still repeats at the fundamental's period. The demo starts with a 220 Hz fundamental. Press **Play** and raise the sliders one at a time. Each slider sets the amplitude of the sine wave at the frequency shown beside it—a whole-number multiple of 220 Hz.

倍音を加えると、波形と音色は変わりますが、音高は変わりません。合成した波も基音の周期で繰り返すためです。デモは220 Hzの基音から始まります。**Play**を押し、スライダーをひとつずつ上げてみてください。各スライダーで、横に示された周波数（220 Hzの整数倍）のサイン波の振幅を調整できます。

<div class="demo-wrap"><iframe src="/writing/demos/adding-sines/index.html" title="Adding sine waves" allow="autoplay" loading="lazy" style="height: 368px"></iframe></div>

The yellow lines show the individual sine waves, and the red line shows their sum over two periods of the fundamental.

黄色の線は個々のサイン波、赤い線はそれらを足し合わせた波を示しています（基音の2周期分）。

All the sine waves here start in phase. Changing their relative phases changes the shape of the combined wave, but usually has little effect on the sound of a steady tone like this. Phase still matters in audio processing: when peaks from multiple components align, their combined peak can exceed a system's limits and cause clipping. In some synthesis and signal-processing applications, phases are deliberately adjusted to reduce these peaks.

ここでは、すべてのサイン波が同じ位相で始まります。各成分の相対的な位相を変えると合成波の形は変わりますが、このような持続音では、聞こえ方への影響は大抵ほとんどありません。位相は音声処理でも重要です。複数の成分のピークが重なると、合成波のピークが信号や機器の扱える上限を超え、クリッピングによる歪みが生じることがあります。そのため、音の合成や信号処理では、ピークを抑えるために位相を意図的に調整する場合があります。

# Frequency Components
# 周波数成分

This works in the other direction too. In theory, any sound can be broken down into sine waves of different frequencies, amplitudes, and phases (Fourier analysis). Each of those sine waves is a frequency component, and the set of them is the sound's spectrum.

この関係は、逆向きにも成り立ちます。理論上、どんな音も、周波数、振幅、位相の異なるサイン波に分解できます（フーリエ解析）。そのひとつひとつのサイン波を周波数成分と呼び、その集まりを音のスペクトルと呼びます。

A sound with a clear pitch is periodic, so its components sit at the harmonics of the fundamental and its spectrum is a row of separate peaks. A sound without a clear pitch, such as noise or a cymbal, has components spread over a continuous range of frequencies.

はっきりした音高を持つ音は周期的なので、成分は基音の倍音の位置に並び、スペクトルは離れたピークの列になります。ノイズやシンバルのように、はっきりした音高を持たない音では、成分が連続した周波数の範囲に広がります。

# Waveform and Spectrum
# 波形とスペクトル

Real sounds change over time, so a spectrum is measured over a short window of the signal with the FFT (fast Fourier transform). This demo shows the waveform (above) and the spectrum (below) of the same sound at once. Choose a **Preset** (a recorded instrument, the drum kit, or noise) and play a few notes with the mouse, or with the keys from A to ; on your computer keyboard (Z and X shift the octave).

実際の音は時間とともに変化するため、スペクトルは、信号の短い区間に対してFFT（高速フーリエ変換）を使って求めます。このデモでは、同じ音の波形（上）とスペクトル（下）を同時に表示します。**Preset**（録音した楽器、ドラムキット、ノイズ）を選んで、マウスか、コンピューターのキーボードのAから;までのキーでいくつか音を弾いてみてください（ZとXでオクターブを切り替えられます）。

<div class="demo-wrap"><iframe src="/writing/demos/waveform-spectrum/index.html" title="Waveform and spectrum" allow="autoplay" loading="lazy" style="height: 512px"></iframe></div>

Because the spectrum's frequency axis is logarithmic, each octave occupies the same width. As a result, evenly spaced harmonics appear increasingly close together toward the right.

-   **Piano and guitar:** The harmonics fade at different rates, usually with the higher ones fading faster. As the note decays, both the spectrum and waveform change.

-   **Violin, cello, and trumpet:** These instruments have many strong harmonics, giving them a bright, rich tone.

-   **Flute:** Its strong fundamental and few, weak harmonics give it a waveform close to a sine wave.

-   **Clarinet:** In its low register, the odd harmonics are much stronger than the even ones, producing a sound like a square wave.

-   **Drum kit:** Its waveforms do not repeat. The kick's energy is concentrated at low frequencies, while the hats and crash spread across the high frequencies.

-   **Noise:** White noise has the same energy at every frequency, so its spectrum is roughly flat. Pink noise has the same energy in every octave, so its spectrum slopes downward at higher frequencies.

スペクトルの周波数軸は対数目盛りなので、どのオクターブも同じ幅になります。そのため、等間隔に並ぶ倍音は、右に行くほど間隔が狭く見えます。

-   **Piano、Acoustic guitar：** 倍音によって減衰の速さが異なり、通常は高い倍音ほど速く減衰します。そのため、音が減衰するにつれてスペクトルも波形も変化します。

-   **Violin、Cello、Trumpet：** 強い倍音を多く含むため、明るく豊かな音色になります。

-   **Flute：** 基音が強く、倍音は少なく弱いため、波形はサイン波に近くなります。

-   **Clarinet：** 低音域では、奇数次の倍音が偶数次の倍音よりずっと強く、矩形波に似た音になります。

-   **Drum kit：** 波形は繰り返しません。キックのエネルギーは低い周波数に集中し、ハイハットやクラッシュは高い周波数帯に広がります。

-   **Noise：** ホワイトノイズはすべての周波数で同じエネルギーを持つため、スペクトルはほぼ平らです。ピンクノイズはどのオクターブでも同じエネルギーを持つため、スペクトルは高い周波数ほど低くなります。
