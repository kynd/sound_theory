---
title: "Sound Sources 音源"
slug: sound-sources
---
Every demo in this series plays through the same set of instruments and effects, so a sine wave in one demo sounds the same as a sine wave in another. This page introduces them: basic waveforms, a few synthesizers, recorded instruments, a drum kit, noise, the effects that process them, and the small band that plays the jazz examples.

このシリーズのデモは、すべて同じ楽器とエフェクトを通して音を鳴らします。そのため、あるデモのサイン波は、別のデモのサイン波と同じ音になります。このページでは、それらを紹介します。基本の波形、いくつかのシンセサイザー、録音した楽器、ドラムキット、ノイズ、それらを加工するエフェクト、そしてジャズの例を演奏する小さなバンドです。

# Instruments and Effects
# 楽器とエフェクト

Choose a sound with **Preset**, then play the keyboard below the display with the mouse, or with the keys from A to ; on your computer keyboard (Z and X shift the octave).

**Preset**で音を選び、表示の下にある鍵盤をマウスで弾くか、コンピューターのキーボードのAから;までのキーで弾いてみましょう（ZとXでオクターブを切り替えられます）。

<div class="demo-wrap"><iframe src="/writing/demos/instruments/index.html" title="Instruments and effects" allow="autoplay" loading="lazy" style="height: 672px"></iframe></div>

The display shows the signal after the effects. **Waveform** plots amplitude over the last few milliseconds, and **Spectrum** plots level against frequency on a logarithmic scale, where each octave takes the same width.

表示は、エフェクトを通したあとの信号です。**Waveform**は直近数ミリ秒の振幅を描き、**Spectrum**は周波数ごとの音量を対数軸で描きます。対数軸では、どのオクターブも同じ幅を占めます。

## Waveforms
## 波形

A sine wave is a single frequency (a pure tone). The other three are built from a fundamental plus harmonics at whole-number multiples of its frequency: a square wave has the odd harmonics at 1/n of the fundamental's amplitude, a sawtooth has every harmonic at 1/n, and a triangle has the odd harmonics at 1/n². Switch to **Spectrum** to see the harmonics as a row of peaks.

サイン波は、ひとつの周波数だけからなる音（純音）です。ほかの3つは、基音と、その整数倍の周波数にある倍音から組み立てられています。矩形波は奇数次の倍音を基音の1/nの振幅で含み、ノコギリ波はすべての倍音を1/nで、三角波は奇数次の倍音を1/n²で含みます。**Spectrum**に切り替えると、倍音が並んだピークとして見えます。

## Synths
## シンセ

**FM synth** and **AM synth** use one oscillator to modulate another: FM (frequency modulation) varies its frequency, and AM (amplitude modulation) varies its volume. Modulation at audio rates adds new frequencies around the carrier (sidebands), giving bell-like and metallic tones from only two oscillators. **Electric piano** is an FM synth tuned like the tine pianos of the 1970s: the modulation fades fast, so each note starts with a bell-like bite and settles into a warm tone, and **Electric piano (bright)** keeps the bite longer. **Drawbar organ** adds a few harmonics at fixed levels, the way an organ's drawbars do, and sounds at full level for as long as a key is held. **Synth pad** stacks slightly detuned sawtooth waves that fade in and out slowly, and **Synth bass** is a sawtooth through a low-pass filter that opens at the start of each note.

**FM synth**と**AM synth**は、あるオシレーターで別のオシレーターを変調します。FM（周波数変調）は周波数を、AM（振幅変調）は音量を変化させます。可聴域の速さで変調すると、搬送波の周りに新しい周波数（側波帯）が生まれ、2つのオシレーターだけで鐘のような音や金属的な音がつくれます。**Electric piano**は、1970年代のトーン・バー式のエレクトリック・ピアノのように設定したFMシンセです。変調がすぐに弱まるので、それぞれの音は鐘のような鋭いアタックで始まり、温かい音に落ち着きます。**Electric piano (bright)**は、その鋭さがより長く続きます。**Drawbar organ**は、オルガンのドローバーのように、いくつかの倍音を決まった量で加え、鍵盤を押しているあいだ同じ音量で鳴り続けます。**Synth pad**は、わずかにずらしたノコギリ波を重ね、ゆっくり現れてゆっくり消えます。**Synth bass**は、それぞれの音の始まりで開くローパスフィルターを通したノコギリ波です。

## Recorded Instruments
## 録音した楽器

**Piano**, the strings (**Violin**, **Cello**, **Contrabass**), the winds (**Flute**, **Clarinet**, **Saxophone**, **Bassoon**), the brass (**Trumpet**, **French horn**, **Trombone**, **Tuba**), the guitars (**Acoustic guitar**, **Nylon guitar**, **Electric guitar**, **Electric bass**), **Harp**, **Xylophone**, **Organ**, and **Harmonium** play recordings of real instruments. Each is recorded at a handful of notes a few semitones apart, and the notes in between are played by shifting the nearest recording up or down in pitch. The piano is the [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, and the others come from the [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) collection by Nicholas Brosowsky (samples from VSCO 2 Community Edition, the University of Iowa Electronic Music Studios, and Freesound). All are licensed CC BY 3.0.

**Piano**、弦楽器（**Violin**、**Cello**、**Contrabass**）、木管楽器（**Flute**、**Clarinet**、**Saxophone**、**Bassoon**）、金管楽器（**Trumpet**、**French horn**、**Trombone**、**Tuba**）、ギター（**Acoustic guitar**、**Nylon guitar**、**Electric guitar**、**Electric bass**）、**Harp**、**Xylophone**、**Organ**、**Harmonium**は、実際の楽器の録音を再生します。それぞれの楽器は数半音おきのいくつかの音だけを録音しており、そのあいだの音は、最も近い録音の音高を上下にずらして鳴らします。ピアノはAlexander Holmによる[Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3)、ほかはNicholas Brosowskyによる[tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)のコレクション（VSCO 2 Community Edition、アイオワ大学Electronic Music Studios、Freesoundのサンプル）です。いずれもCC BY 3.0です。

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

-   **Delay：** **Time**だけ遅れて音を繰り返し、それぞれの反復を**Feedback**の量で再び入力に戻します。

-   **Reverb：** 部屋の反射音を再現します。**Decay**で、反射音が消えるまでの長さを決めます。

# A Small Band
# 小さなバンド

The jazz and improvisation pages play their examples as a small band of three parts: a melody, a backing that plays the chords, and a bass. By default the melody is the **AM synth**, raised 8 dB so it stands out over the chords, the backing is the **Piano**, and the bass is the **Synth bass**. The demo below lets you change each part.

ジャズと即興のページでは、例を3つのパートからなる小さなバンドで演奏します。旋律、和音を弾く伴奏、そしてベースです。標準では、旋律は和音の上で際立つよう8 dB上げた**AM synth**、伴奏は**Piano**、ベースは**Synth bass**です。下のデモでは、それぞれのパートを変えられます。

Choose an **Example** and press **Play**. **Melody**, **Backing**, and **Bass** choose each part's instrument, from any of the pitched sounds above; **Volume** raises or lowers that part in decibels, and the toggle below it turns the part on and off, so you can hear one part alone or the band without it. **Walking bass** has no melody: its line is on the bass. The piano roll shows the chords, the melody in pink, and the bass below, and the keyboard lights the sounding notes. You can also play the keyboard with the melody's instrument, with the mouse or the keys from A to ; (Z and X shift the octave).

**Example**を選んで**Play**を押してみましょう。**Melody**、**Backing**、**Bass**で、上の音高のある音の中からそれぞれのパートの楽器を選びます。**Volume**はそのパートの音量をデシベルで上げ下げし、その下のトグルはパートをオンとオフに切り替えます。ひとつのパートだけを聞いたり、そのパートを抜いたバンドを聞いたりできます。**Walking bass**には旋律がなく、ラインはベースにあります。ピアノロールには、和音、ピンクの旋律、その下のベースが表示され、鍵盤では鳴っている音が点灯します。鍵盤は、旋律の楽器で、マウスまたはAから;までのキーで弾くこともできます（ZとXでオクターブが変わります）。

<div class="demo-wrap"><iframe src="/writing/demos/band-mix/index.html" title="A small band" allow="autoplay" loading="lazy" style="height: 784px"></iframe></div>
