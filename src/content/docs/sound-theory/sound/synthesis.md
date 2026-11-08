---
title: "Synthesizers and Effects シンセサイザーとエフェクト"
slug: synthesis
---
A synthesizer generates sound electronically or computationally rather than simply playing back a recording. Early methods create raw waveforms with oscillators, then shape them with filters and envelopes. Modern synthesis builds on this approach with techniques such as frequency modulation, additive synthesis, physical modeling, and granular manipulation.

シンセサイザーは、録音をそのまま再生するのではなく、電子回路や計算によって音を生み出します。初期の手法では、オシレーターで波形を生成し、フィルターやエンベロープで形づくります。現代の音響合成はこのアプローチを発展させ、周波数変調、加算合成、物理モデリング、グラニュラー処理などの技法を用います。

# Classic Synthesizers
# 古典的シンセサイザー

Classic analog synthesizers, including the Moog and its successors of the 1960s and 1970s, create sound by subtraction.

1960年代から1970年代のモーグとその後継機に代表される古典的なアナログ・シンセサイザーは、音を引き算でつくります。

First, an oscillator produces a wave rich in harmonics (see [Building Waveforms](/building-waveforms)). A sawtooth wave, for example, contains every harmonic, while a square wave contains only the odd ones. A low-pass filter then removes higher harmonics, darkening the sound. Its cutoff sets the frequency at which filtering begins, while resonance boosts frequencies around the cutoff, adding a vocal, ringing edge.

まず、オシレーターが倍音を豊かに含む波形をつくります（[波形を組み立てる](/building-waveforms)を参照）。たとえば、ノコギリ波はすべての倍音を含み、矩形波は奇数倍音だけを含みます。次にローパス・フィルターが高い倍音を取り除き、音を暗くします。カットオフはフィルターが効き始める周波数を決め、レゾナンスはその周波数付近を強調して、声のような、よく響く輪郭を加えます。

Try this in the demo. Press **Play** to hold an A3 (220 Hz), then choose a **Wave**. The filter starts fully open, with **Cutoff** set to 10000 Hz. Lower it to remove higher harmonics, and raise **Resonance** to boost those near the cutoff. As harmonics are removed, the waveform (above) grows smoother, while the spectrum (below) shows them disappearing from the right. With high resonance, frequencies near the cutoff are strongly boosted. As you move the cutoff, different harmonics are boosted in turn, making each one stand out in the sound and the spectrum.

デモで試してみましょう。**Play**を押すとA3（220 Hz）が鳴り続けます。次に**Wave**で波形を選んでください。フィルターは**Cutoff**が10000 Hzの、完全に開いた状態から始まります。Cutoffを下げると高い倍音が取り除かれ、**Resonance**を上げるとカットオフ付近の倍音が強調されます。倍音が取り除かれるにつれて、波形（上）はなめらかになり、スペクトル（下）では倍音が右から消えていきます。レゾナンスを高くすると、カットオフ付近の周波数が強く増幅されます。カットオフを動かすと、強調される倍音が次々に変わり、それぞれの倍音が音でもスペクトルでも際立ちます。

<div class="demo-wrap"><iframe src="/writing/demos/synth-filter/index.html" title="Oscillator and filter" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

An amplifier then shapes the sound's loudness over time using an envelope: attack (how quickly the note rises), decay (how quickly it falls after the peak), sustain (the level held while the key is down), and release (how long it rings after the key is released). Together, these stages are called ADSR.

次に、アンプがエンベロープを使って音量の時間変化を形づくります。アタック（音が立ち上がる速さ）、ディケイ（ピーク後に音量が下がる速さ）、サステイン（鍵を押している間の音量）、リリース（鍵を離した後に音が響く長さ）をまとめてADSRと呼びます。

Try the envelope on the oscillator alone. Press **Play** to hear the A3 note. Choose a **Wave** and set **Attack**, **Decay**, **Sustain**, and **Release**. The yellow shape shows the note's loudness over time, from its start through the end of the release.

フィルターを使わず、オシレーターにエンベロープだけをかけて試してみましょう。**Play**を押してA3の音を鳴らし、**Wave**で波形を選んでから、**Attack**、**Decay**、**Sustain**、**Release**を設定してください。黄色の形は、音の始まりからリリースが終わるまでの音量変化を示します。

<div class="demo-wrap"><iframe src="/writing/demos/synth-envelope/index.html" title="Envelope" allow="autoplay" loading="lazy" style="height: 288px"></iframe></div>

The filter can change over time too. A second envelope can move the filter's cutoff during each note, making the sound brighter at the start and darker as it decays—the signature motion of analog synths.

フィルターも時間とともに変化させられます。2つ目のエンベロープで音ごとにカットオフを動かすと、音は始まりに明るく、減衰するにつれて暗くなります。これがアナログ・シンセを象徴する変化です。

Try moving the filter by hand first. Drag on the canvas to sound an A2 (110 Hz): left to right sets the **Cutoff** from 100 Hz to 8000 Hz, and bottom to top the **Resonance** from 0.5 to 15. Releasing stops the sound. Sweep slowly from left to right near the top for the classic resonant sweep, or move quickly to make the sound talk. A filter envelope makes this kind of move by itself on every note.

まず、手でフィルターを動かしてみましょう。キャンバスの上でドラッグすると、A2（110 Hz）が鳴ります。左から右で**Cutoff**が100 Hzから8000 Hzまで、下から上で**Resonance**が0.5から15まで変わります。離すと音が止まります。上のほうで左から右へゆっくり動かすと典型的なレゾナンスのスイープに、すばやく動かすと話すような音になります。フィルターのエンベロープは、こうした動きを音ごとに自動で行います。

<div class="demo-wrap"><iframe src="/writing/demos/filter-sweep/index.html" title="Filter sweep" allow="autoplay" loading="lazy" style="height: 176px"></iframe></div>

Let's put everything together. Play the keyboard with your mouse or by pressing the A-to-; keys on your computer keyboard (Z and X shift the octave). **Wave** selects the oscillator; **Cutoff** and **Resonance** control the filter; **Env amt** sets how many octaves above the cutoff the filter envelope opens it; and **Attack**, **Decay**, **Sustain**, and **Release** shape both envelopes. **Waveform** and **Spectrum** switch the display between the waveform and its frequency spectrum. Try a low cutoff, high resonance, and a large envelope amount for a classic bass sound, or a slow attack and release for a pad.

すべてを組み合わせてみましょう。マウス、またはコンピューターのキーボードのAから;までのキーで鍵盤を弾いてください（ZとXでオクターブが変わります）。**Wave**はオシレーターを選び、**Cutoff**と**Resonance**はフィルターを調整します。**Env amt**は、フィルターのエンベロープがカットオフより何オクターブ高い位置までフィルターを開くかを決めます。**Attack**、**Decay**、**Sustain**、**Release**は両方のエンベロープの形を決めます。**Waveform**と**Spectrum**で、表示を波形と周波数スペクトルに切り替えられます。低いカットオフ、高いレゾナンス、大きなエンベロープ量を組み合わせると典型的なベース音になり、ゆっくりしたアタックとリリースを使うとパッドになります。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=subtractive" title="Subtractive synthesizer" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

# Effects
# エフェクト

Effects can further shape a sound and change its character. For example, a compressor reduces the level of loud sounds above a threshold according to a set ratio, making the overall sound more even and punchy. An auto-wah is a resonant filter that opens as the sound gets louder, giving each note a "wah" quality. A wah-wah pedal works similarly, with the guitarist moving the filter using a foot pedal. Chorus blends in slightly delayed copies that waver slowly, making it sound as if several players are performing together. A phaser sweeps notches through the spectrum to create a swirling sound. Delay repeats the sound after a set time, feeding each echo back to create the next. Reverb simulates the thousands of reflections in a room, from a small studio to a cathedral. Effects are usually chained, and their order matters.

エフェクトを使うと、音をさらに加工し、その音色を変えられます。たとえば、コンプレッサーは閾値を超えた大きな音を設定したレシオに応じて抑え、全体の音量をより均一にしながら、力強さを加えます。オートワウは、音が大きくなるにつれて開くレゾナンス付きのフィルターで、音ごとに「ワウ」という響きを生みます。ワウワウ・ペダルも同じように働きますが、ギタリストが足でフィルターを動かします。コーラスは、わずかに遅れてゆっくり揺れる音の複製を混ぜ、何人もの演奏者が一緒に弾いているような響きをつくります。フェイザーはスペクトルに切れ込みを走らせ、渦を巻くような音をつくります。ディレイは一定の時間をおいて音を繰り返し、それぞれのこだまをフィードバックして次のこだまを生みます。リバーブは、小さなスタジオから大聖堂まで、室内で起きる何千もの反射を再現します。エフェクトは通常、順につないで使い、その順番も音に影響します。

Choose a **Preset**, open an effect, and turn up its mix. Each effect starts out transparent, with its mix set to 0 (the compressor starts with its threshold at 0 dB and ratio at 1), so you can hear the difference it makes. **Compressor** controls **Threshold** and **Ratio**; **Auto-wah** controls the filter's resting frequency (**Base**) and how far it opens (**Octaves**); **Chorus** and **Phaser** control their speed (**Rate**, in cycles per second) and range; **Delay** controls the time between echoes and their feedback; and **Reverb** controls the decay time. **Mix** blends each effect with the dry sound. The effects are applied in the order listed.

**Preset**を選び、エフェクトを開いてミックスを上げてみてください。どのエフェクトも、ミックス0（コンプレッサーはスレッショルド0 dB、レシオ1）の、元の音に影響しない状態から始まるため、効果を聞き比べられます。**Compressor**では**Threshold**と**Ratio**を、**Auto-wah**ではフィルターの基準周波数（**Base**）と開く幅（**Octaves**）を設定します。**Chorus**と**Phaser**では動く速さ（**Rate**、1秒あたりの周期数）と幅を、**Delay**ではこだまの間隔とフィードバックを、**Reverb**では残響の長さを設定します。**Mix**は各エフェクトと元の音を混ぜ合わせます。エフェクトは表示されている順に適用されます。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?presets&effects=compressor,autowah,chorus,phaser,delay,reverb" title="Effects" allow="autoplay" loading="lazy" style="height: 496px"></iframe></div>

# Other Methods
# そのほかの手法

Frequency modulation (FM), developed by John Chowning at Stanford in the late 1960s and popularized by Yamaha's DX7 in 1983, creates complex sounds using just two sine waves. One, the modulator, rapidly bends the pitch of the other, the carrier. The ratio between their frequencies determines which partials appear: whole-number ratios produce harmonic tones, such as electric pianos and organs, while other ratios create bell-like, metallic sounds. The modulation index determines the strength of these partials. Applying an envelope to the index makes a note bright at the start and mellow as it decays, like a struck instrument.

周波数変調（FM）は2つのサイン波だけで複雑な音をつくる方法で、1960年代後半にスタンフォード大学のジョン・チャウニングが開発し、1983年のヤマハDX7によって広く知られるようになりました。モジュレーターと呼ばれる一方のサイン波が、キャリアと呼ばれるもう一方の音高をすばやく変化させます。2つの周波数の比によって現れる部分音が決まり、整数比ではエレクトリック・ピアノやオルガンのような倍音的な音が生まれ、それ以外の比では鐘のような金属的な音になります。変調指数は、これらの部分音の強さを決めます。変調指数にエンベロープをかけると、打楽器のように、音は始まりで明るく、減衰するにつれてまろやかになります。

Amplitude modulation (AM) uses one wave to vary the loudness of another. This adds sidebands—extra partials on either side of each existing partial—creating a hollow or ringing tone.

振幅変調（AM）では、一方の波を使ってもう一方の波の音量を変化させます。これにより、それぞれの部分音の両側にサイドバンド（追加の部分音）が生まれ、空洞感や響きのある音色になります。

Choose an **Engine** and play. In **FM**, **Ratio** sets the modulator's frequency as a multiple of the carrier's, **Index** sets the modulation strength, and **Mod decay** sets how quickly the modulation fades during each note. Try a ratio of 1 with a high index for a brassy sound, a ratio of 3.5 for a bell-like sound, or a short mod decay for an electric-piano sound. In **AM**, **Ratio** sets the modulating wave's frequency.

**Engine**を選んで弾いてみましょう。**FM**では、**Ratio**がモジュレーターの周波数をキャリア周波数の何倍にするかを、**Index**が変調の強さを、**Mod decay**が各音の中で変調が減衰する速さを決めます。比を1にしてインデックスを高くすると金管のような音になり、比を3.5にすると鐘のような音に、Mod decayを短くするとエレクトリック・ピアノのような音になります。**AM**では、**Ratio**が変調する波の周波数を決めます。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=fm,am" title="FM and AM synthesis" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

There are many other methods. Additive synthesis builds sounds from individual sine waves (see [Sound Waves](/sound-waves)). Wavetable synthesis moves through a series of stored waveforms, while granular synthesis rebuilds sound from tiny grains (see [Sound as Material](/sound-as-material)). Sampling plays recordings at new pitches, as the piano in these demos does. Physical modeling simulates the vibrations of real instruments' strings, tubes, and bodies.

ほかにも多くの方法があります。加算合成は個々のサイン波から音を組み立てます（[音の波](/sound-waves)を参照）。ウェーブテーブル合成は保存された一連の波形を順に切り替え、グラニュラー合成は小さな音の粒から音を組み立て直します（[素材としての音](/sound-as-material)を参照）。サンプリングは録音された音を別の音高で再生します。物理モデリングは、実際の楽器の弦や管、胴の振動をシミュレートします。
