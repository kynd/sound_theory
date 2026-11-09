---
title: "Sound Sources 音源"
slug: sound-sources
---
This page does not explain any theory. It is a record of the instruments and effects that the demos on the other pages are built from, gathered in one place so you can hear them side by side. Every demo plays through the same set, so a sine wave in one demo sounds the same as a sine wave in another. For how the sounds are made, see [Sound Waves](/sound-waves), [Building Waveforms](/building-waveforms), and [Synthesizers and Effects](/synthesis).

このページは理論を説明するためのものではありません。ほかのページのデモが使っている楽器とエフェクトを記録し、まとめて聴き比べられるようにしたものです。どのデモも同じ楽器とエフェクトを通して鳴るので、あるデモのサイン波は、別のデモのサイン波と同じ音になります。音のつくり方については、[音の波](/sound-waves)、[波形を組み立てる](/building-waveforms)、[シンセサイザーとエフェクト](/synthesis)を参照してください。

# Instruments and Effects
# 楽器とエフェクト

Choose a sound with **Preset**, then play the keyboard below the display with the mouse, or with the keys from A to ; on your computer keyboard (Z and X shift the octave). The display shows the signal after the effects, as a **Waveform** or a **Spectrum**.

**Preset**で音を選び、表示の下にある鍵盤をマウスで弾くか、コンピューターのキーボードのAから;までのキーで弾いてみましょう（ZとXでオクターブを切り替えられます）。表示は、エフェクトを通したあとの信号を、**Waveform**（波形）か**Spectrum**（スペクトル）で示します。

<div class="demo-wrap"><iframe src="/writing/demos/instruments/index.html" title="Instruments and effects" allow="autoplay" loading="lazy" style="height: 672px"></iframe></div>

The presets:

-   **Waveforms:** Sine, Triangle, Square, Sawtooth.

-   **Synths:** FM synth, AM synth, Electric piano, Electric piano (bright), Drawbar organ, Synth pad, Synth bass, Synth lead. The Synth lead plays one note at a time, so a sounding note can bend; the other instruments cannot bend.

-   **Recorded instruments:** Piano, Violin, Cello, Contrabass, Flute, Clarinet, Saxophone, Bassoon, Trumpet, French horn, Trombone, Tuba, Acoustic guitar, Nylon guitar, Electric guitar, Electric bass, Harp, Xylophone, Organ, Harmonium. Each is recorded at a handful of notes, and the notes in between are played by shifting the nearest recording in pitch. The piano is the [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm; the others come from the [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) collection by Nicholas Brosowsky (samples from VSCO 2 Community Edition, the University of Iowa Electronic Music Studios, and Freesound). All are licensed CC BY 3.0.

-   **Drums and noise:** the Drum kit (synthesized) plays from a row of pads, one per piece, also on the keys from A to J. White noise and Pink noise play from a single pad, also on those keys or the space bar.

-   **Effects:** distortion, filter, delay, and reverb, always in that order. Each is off until you raise its **Mix** (or lower the filter's **Cutoff**).

プリセットは次のとおりです。

-   **波形：** Sine、Triangle、Square、Sawtooth。

-   **シンセ：** FM synth、AM synth、Electric piano、Electric piano (bright)、Drawbar organ、Synth pad、Synth bass、Synth lead。Synth leadは一度にひとつの音だけを鳴らすので、鳴っている音をベンドできます。ほかの楽器ではベンドできません。

-   **録音した楽器：** Piano、Violin、Cello、Contrabass、Flute、Clarinet、Saxophone、Bassoon、Trumpet、French horn、Trombone、Tuba、Acoustic guitar、Nylon guitar、Electric guitar、Electric bass、Harp、Xylophone、Organ、Harmonium。それぞれいくつかの音だけを録音しており、そのあいだの音は、最も近い録音の音高をずらして鳴らします。ピアノはAlexander Holmによる[Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3)、ほかはNicholas Brosowskyによる[tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)のコレクション（VSCO 2 Community Edition、アイオワ大学Electronic Music Studios、Freesoundのサンプル）です。いずれもCC BY 3.0です。

-   **ドラムとノイズ：** Drum kit（合成音）は、パーツごとのパッドの列で鳴らし、AからJまでのキーでも鳴らせます。White noiseとPink noiseはひとつのパッドで鳴らし、同じキーやスペースキーでも鳴らせます。

-   **エフェクト：** ディストーション、フィルター、ディレイ、リバーブが、常にこの順でかかります。どれも、**Mix**を上げる（フィルターでは**Cutoff**を下げる）までは効きません。

# A Small Band
# 小さなバンド

The jazz and improvisation pages play their examples as a small band: a melody, a backing that plays the chords, and a bass. By default the melody is the **AM synth**, raised 8 dB, the backing is the **Piano**, and the bass is the **Synth bass**.

ジャズと即興のページでは、例を小さなバンドで演奏します。旋律、和音を弾く伴奏、そしてベースです。標準では、旋律は8 dB上げた**AM synth**、伴奏は**Piano**、ベースは**Synth bass**です。

Choose an **Example** and press **Play**. **Melody**, **Backing**, and **Bass** choose each part's instrument, **Volume** sets its level in decibels, and the toggle below it turns the part on and off. **Walking bass** has no melody: its line is on the bass. The piano roll shows the chords, the melody in pink, and the bass below, and the keyboard lights the sounding notes; you can also play it with the melody's instrument, with the mouse or the keys from A to ; (Z and X shift the octave).

**Example**を選んで**Play**を押してみましょう。**Melody**、**Backing**、**Bass**でそれぞれのパートの楽器を選び、**Volume**でその音量をデシベルで決め、その下のトグルでパートをオンとオフに切り替えます。**Walking bass**には旋律がなく、ラインはベースにあります。ピアノロールには、和音、ピンクの旋律、その下のベースが表示され、鍵盤では鳴っている音が点灯します。鍵盤は、旋律の楽器で、マウスまたはAから;までのキーで弾くこともできます（ZとXでオクターブが変わります）。

<div class="demo-wrap"><iframe src="/writing/demos/band-mix/index.html" title="A small band" allow="autoplay" loading="lazy" style="height: 784px"></iframe></div>
