---
title: "Sound Sources 音源"
slug: sound-sources
---
Every demo in this series plays through the same set of instruments and effects, so a sine wave in one demo sounds the same as a sine wave in another. This page introduces them: basic waveforms, a few synthesizers, a sampled piano, a drum kit, noise, and the effects that process them.

このシリーズのデモは、すべて同じ楽器とエフェクトを通して音を鳴らします。そのため、あるデモのサイン波は、別のデモのサイン波と同じ音になります。このページでは、それらを紹介します。基本の波形、いくつかのシンセサイザー、サンプリングしたピアノ、ドラムキット、ノイズ、そしてそれらを加工するエフェクトです。

# Instruments and Effects
# 楽器とエフェクト

Choose a sound with **Preset**, then play the keyboard below the display with the mouse, or with the keys from A to ; on your computer keyboard (Z and X shift the octave).

**Preset**で音を選び、表示の下にある鍵盤をマウスで弾くか、コンピューターのキーボードのAから;までのキーで弾いてください（ZとXでオクターブを切り替えられます）。

<div class="demo-wrap"><iframe src="/writing/demos/instruments/index.html" title="Instruments and effects" allow="autoplay" loading="lazy"></iframe></div>

The display shows the signal after the effects. **Waveform** plots amplitude over the last few milliseconds, and **Spectrum** plots level against frequency on a logarithmic scale, where each octave takes the same width.

表示は、エフェクトを通したあとの信号です。**Waveform**は直近数ミリ秒の振幅を描き、**Spectrum**は周波数ごとの音量を対数軸で描きます。対数軸では、どのオクターブも同じ幅を占めます。

## Waveforms
## 波形

A sine wave is a single frequency (a pure tone). The other three are built from a fundamental plus harmonics at whole-number multiples of its frequency: a square wave has the odd harmonics at 1/n of the fundamental's amplitude, a sawtooth has every harmonic at 1/n, and a triangle has the odd harmonics at 1/n². Switch to **Spectrum** to see the harmonics as a row of peaks.

サイン波は、ひとつの周波数だけからなる音（純音）です。ほかの3つは、基音と、その整数倍の周波数にある倍音から組み立てられています。矩形波は奇数次の倍音を基音の1/nの振幅で含み、ノコギリ波はすべての倍音を1/nで、三角波は奇数次の倍音を1/n²で含みます。**Spectrum**に切り替えると、倍音が並んだピークとして見えます。

## Synths
## シンセ

**FM synth** and **AM synth** use one oscillator to modulate another: FM (frequency modulation) varies its frequency, and AM (amplitude modulation) varies its volume. Modulation at audio rates adds new frequencies around the carrier (sidebands), giving bell-like and metallic tones from only two oscillators.

**FM synth**と**AM synth**は、あるオシレーターで別のオシレーターを変調します。FM（周波数変調）は周波数を、AM（振幅変調）は音量を変化させます。可聴域の速さで変調すると、搬送波の周りに新しい周波数（側波帯）が生まれ、2つのオシレーターだけで鐘のような音や金属的な音がつくれます。

## Recorded Instruments
## 録音した楽器

**Piano**, **Violin**, **Cello**, **Flute**, **Clarinet**, **Trumpet**, and **Acoustic guitar** play recordings of real instruments. Each is recorded at a handful of notes a few semitones apart, and the notes in between are played by shifting the nearest recording up or down in pitch. The piano is the [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, and the others come from the [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) collection by Nicholas Brosowsky (samples from VSCO 2 Community Edition, the University of Iowa Electronic Music Studios, and Freesound). All are licensed CC BY 3.0.

**Piano**、**Violin**、**Cello**、**Flute**、**Clarinet**、**Trumpet**、**Acoustic guitar**は、実際の楽器の録音を再生します。各楽器は数半音おきのいくつかの音だけを録音しており、そのあいだの音は、最も近い録音の音高を上下にずらして鳴らします。ピアノはAlexander Holmによる[Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3)、ほかはNicholas Brosowskyによる[tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)のコレクション（VSCO 2 Community Edition、アイオワ大学Electronic Music Studios、Freesoundのサンプル）です。いずれもCC BY 3.0です。

## Drum Kit and Noise
## ドラムキットとノイズ

The drums are synthesized rather than recorded. For the drum kit the keyboard becomes a row of pads, one per piece, which you can also play with the keys from A to J. The kick is a sine wave whose pitch drops quickly, the snare and clap are bursts of noise, and the hi-hats and crash are clusters of inharmonic frequencies. **White noise** and **Pink noise** have no pitch, so they play from a single pad, which any of those keys or the space bar also plays.

ドラムは録音ではなく合成した音です。ドラムキットでは、鍵盤がパーツごとのパッドの列に変わり、AからJまでのキーでも鳴らせます。キックは音高が急速に下がるサイン波、スネアとクラップはノイズのバースト、ハイハットとクラッシュは非整数倍の周波数の集まりです。**White noise**と**Pink noise**は音高を持たないため、ひとつのパッドで鳴らします。同じキーやスペースキーでも鳴らせます。

## Effects
## エフェクト

Effects run in a fixed order: distortion, filter, delay, then reverb. Each one is off until you raise its **Mix** (or lower the filter's **Cutoff**).

-   **Distortion:** clips the waveform, which adds harmonics.

-   **Filter:** a low-pass filter that removes frequencies above the cutoff and boosts those near it as **Resonance** rises.

-   **Delay:** repeats the sound after **Time**, feeding each repeat back in at the **Feedback** level.

-   **Reverb:** simulates the reflections of a room, with **Decay** setting how long they take to fade.

エフェクトは、ディストーション、フィルター、ディレイ、リバーブの順に固定でかかります。どのエフェクトも、**Mix**を上げる（フィルターでは**Cutoff**を下げる）までは効きません。

-   **Distortion：** 波形をクリップし、倍音を加えます。

-   **Filter：** カットオフより上の周波数を取り除くローパスフィルターです。**Resonance**を上げると、カットオフ付近が強調されます。

-   **Delay：** **Time**だけ遅れて音を繰り返し、各反復を**Feedback**の量で再び入力に戻します。

-   **Reverb：** 部屋の反射音を再現します。**Decay**で、反射音が消えるまでの長さを決めます。
