---
title: "Synthesizers and Effects シンセサイザーとエフェクト"
slug: synthesis
---
A synthesizer generates sound electronically or computationally from basic building blocks. Rather than simply playing back a recorded acoustic event, it classically creates raw waveforms with oscillators and shapes them with filters and envelopes. Modern synthesis extends this approach with techniques such as frequency modulation, additive harmonics, physical modeling, and granular manipulation, treating both generated waveforms and recorded audio buffers as raw materials for complex timbral design.

シンセサイザーは、基本的な構成要素を組み合わせ、電子回路や計算によって音を生み出します。録音された音を単に再生するのではなく、従来はオシレーターで基本となる波形をつくり、フィルターやエンベロープでその音を形づくってきました。現代の音響合成では、周波数変調、倍音の加算、物理モデリング、グラニュラー処理といった技法によって、このアプローチをさらに広げています。生成した波形も、録音した音声を格納したバッファーも素材として扱い、複雑な音色を設計します。

# Subtractive Synthesis
# 減算合成

The classic analog synthesizer, from the Moog and its successors in the 1960s and 1970s, creates sound by subtraction. First an oscillator produces a wave rich in harmonics (see [Building Waveforms](/building-waveforms)). For example, a sawtooth wave contains every harmonic, while a square wave contains only the odd ones. A low-pass filter then removes higher harmonics, darkening the sound. Its cutoff sets the frequency where filtering begins, while resonance boosts frequencies around the cutoff, adding a vocal, ringing edge. Finally, an amplifier shapes the loudness over time with an envelope: attack (how quickly the note rises), decay (how quickly it falls after the peak), sustain (the level held while the key is down), and release (how long it rings after the key is released). Together, these stages are called ADSR. A second envelope can move the filter's cutoff over the course of each note, making the sound brighter at the start and darker as it decays—the signature motion of analog synths.

1960年代から1970年代のモーグとその後継機に代表される古典的なアナログ・シンセサイザーは、引き算で音をつくります。まず、オシレーターが倍音を豊かに含む波をつくります（[波形を組み立てる](/building-waveforms)を参照）。たとえば、ノコギリ波はすべての倍音を含み、矩形波は奇数倍音だけを含みます。次にローパス・フィルターが高い倍音を取り除き、音を暗くします。カットオフはフィルターが効き始める周波数を決め、レゾナンスはカットオフ付近の周波数を強調して、声のような、よく響く輪郭を加えます。最後にアンプがエンベロープで音量の時間変化を形づくります。アタック（音が立ち上がる速さ）、ディケイ（ピークのあとに音量が下がる速さ）、サステイン（鍵を押しているあいだ保たれる音量）、リリース（鍵を離したあと音が響く長さ）をまとめてADSRと呼びます。もうひとつのエンベロープで音ごとにフィルターのカットオフを動かすと、音は始まりで明るく、減衰するにつれて暗くなります。これがアナログ・シンセを象徴する動きです。

Start with the oscillator and the filter alone. Press **Play** to hold an A3 (220 Hz) and choose a **Wave**. The filter starts fully open, with **Cutoff** at 10000 Hz; lower it to remove the higher harmonics, and raise **Resonance** to boost the ones near the cutoff. The waveform (above) grows smoother as harmonics are removed, and the spectrum (below) shows them disappearing from the right. With high resonance, a peak follows the cutoff as you move it, picking out one harmonic after another.

まず、オシレーターとフィルターだけを試します。**Play**を押すとA3（220 Hz）が鳴り続けます。**Wave**で波形を選んでください。フィルターは**Cutoff**が10000 Hzの、完全に開いた状態から始まります。下げると高い倍音が取り除かれ、**Resonance**を上げるとカットオフ付近の倍音が強まります。倍音が取り除かれるにつれて、波形（上）はなめらかになり、スペクトル（下）では倍音が右から消えていきます。レゾナンスを高くすると、カットオフを動かすのに合わせてピークがついてきて、倍音をひとつずつ拾い出していきます。

<div class="demo-wrap"><iframe src="/writing/demos/synth-filter/index.html" title="Oscillator and filter" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

Next, the envelope alone, on the plain oscillator. Each press of **Play** sounds one A3, held for 1.5 seconds and then released. Choose a **Wave** and set **Attack**, **Decay**, **Sustain**, and **Release**. The yellow shape is the loudness over time, from the start of the note to the end of its release, and it turns pink as the note plays. If the attack and decay together last longer than 1.5 seconds, the release begins before the sustain level is reached.

次に、エンベロープだけを、フィルターのないオシレーターで試します。**Play**を押すたびにA3がひとつ鳴り、1.5秒保たれてから離されます。**Wave**を選び、**Attack**、**Decay**、**Sustain**、**Release**を設定してください。黄色の形は、音の始まりからリリースの終わりまでの音量の時間変化で、音が鳴るにつれてピンクに変わります。アタックとディケイを合わせて1.5秒より長いと、サステインのレベルに届く前にリリースが始まります。

<div class="demo-wrap"><iframe src="/writing/demos/synth-envelope/index.html" title="Envelope" allow="autoplay" loading="lazy" style="height: 288px"></iframe></div>

Finally, all of it together. Play the keyboard with your mouse or by pressing the keys from A to ; on your computer keyboard (Z and X shift the octave). **Wave** selects the oscillator; **Cutoff** and **Resonance** set the filter; **Env amt** sets how many octaves above the cutoff the filter envelope opens it; and **Attack**, **Decay**, **Sustain**, and **Release** shape both envelopes. **Waveform** and **Spectrum** switch the display between the wave and its frequencies. Try a low cutoff, high resonance, and a large envelope amount for a classic bass, or a slow attack and release for a pad.

最後に、すべてを組み合わせます。マウス、またはコンピューターのキーボードのAから;までのキーで鍵盤を弾いてください（ZとXでオクターブが変わります）。**Wave**はオシレーターを選び、**Cutoff**と**Resonance**はフィルターを設定します。**Env amt**はフィルターのエンベロープがカットオフより何オクターブ高くまでフィルターを開くかを、**Attack**、**Decay**、**Sustain**、**Release**は両方のエンベロープの形を決めます。**Waveform**と**Spectrum**は表示を波形と周波数に切り替えます。低いカットオフ、高いレゾナンス、大きなエンベロープ量を組み合わせると典型的なベース音に、ゆっくりしたアタックとリリースを使うとパッドになります。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=subtractive" title="Subtractive synthesizer" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

# Effects
# エフェクト

Effects are usually chained, and their order matters. A compressor reduces the level of loud parts above a threshold according to a ratio, making the sound more even and punchy; it is used on almost every recording. An auto-wah is a resonant filter that opens as the sound gets louder, making each note say "wah." A wah-wah pedal does the same thing, with the guitarist's foot moving the filter. Chorus blends in slightly delayed copies that waver slowly, as if several players were performing together. A phaser sweeps notches through the spectrum, creating a swirling sound. Delay repeats the sound after a set time, feeding each echo back to create the next. Reverb imitates the thousands of reflections in a room, from a small studio to a cathedral.

エフェクトはふつう順につなぎ、その順番も音に影響します。コンプレッサーは、スレッショルドを超えた大きな音をレシオに応じて抑え、音量のばらつきを抑えながら力強さを加えます。ほぼすべての録音で使われます。オートワウは音が大きくなるほど開くレゾナンス付きのフィルターで、音ごとに「ワウ」と鳴ります。ワウワウ・ペダルも同じ仕組みですが、ギタリストが足でフィルターを動かします。コーラスは、わずかに遅れてゆっくり揺れる音の複製を混ぜ、何人もの演奏者が一緒に弾いているように聞かせます。フェイザーはスペクトルに切れ込みを走らせ、渦を巻くような響きをつくります。ディレイは一定の時間をおいて音を繰り返し、それぞれのこだまを戻して次のこだまを生みます。リバーブは、小さなスタジオから大聖堂まで、部屋の中で起きる何千もの反射を再現します。

Choose a **Preset**, open an effect, and turn it up. Every effect starts out transparent, with its mix at 0 (the compressor starts with its threshold at 0 dB and ratio at 1), so you can hear what each one adds. **Compressor** controls **Threshold** and **Ratio**; **Auto-wah** controls the filter's resting frequency (**Base**) and how far it opens (**Octaves**); **Chorus** and **Phaser** control how fast they move (**Rate**, in cycles per second) and how far; **Delay** controls the time between echoes and their feedback; and **Reverb** controls the decay time. **Mix** blends each effect with the dry sound. The effects run in the order listed.

**Preset**を選び、エフェクトを開いてかかり具合を上げてみてください。どのエフェクトも、ミックス0（コンプレッサーはスレッショルド0 dB、レシオ1）の、元の音を変えない状態から始まるので、それぞれが音に何を加えるかを聞き分けられます。**Compressor**では**Threshold**と**Ratio**を、**Auto-wah**ではフィルターの基準周波数（**Base**）と開く幅（**Octaves**）を設定します。**Chorus**と**Phaser**では、動く速さ（**Rate**、1秒あたりの周期数）と幅を、**Delay**ではこだまの間隔とフィードバックを、**Reverb**では残響の長さを設定します。**Mix**は各エフェクトと元の音を混ぜ合わせます。エフェクトは表示された順につながります。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?presets&effects=compressor,autowah,chorus,phaser,delay,reverb" title="Effects" allow="autoplay" loading="lazy"></iframe></div>

# Beyond Subtraction
# 減算を越えて

Frequency modulation (FM), developed by John Chowning at Stanford in the late 1960s and popularized by Yamaha's DX7 in 1983, creates complex sounds from just two sine waves. One sine wave, the modulator, bends the pitch of the other, the carrier, many times per second. The ratio between their frequencies determines which partials appear: whole-number ratios produce harmonic tones like electric pianos and organs, while other ratios produce bell-like, metallic sounds. The modulation index determines the strength of those partials. Applying an envelope to the index makes a note bright at the start and mellow as it decays, like a struck instrument. Amplitude modulation (AM), by contrast, varies one wave's loudness with another, adding sidebands—extra partials on either side of each one—to create a hollow or ringing tone.

周波数変調（FM）は、1960年代後半にスタンフォード大学のジョン・チャウニングが開発し、1983年のヤマハDX7によって広く知られるようになった方法で、たった2つのサイン波から複雑な音をつくります。ひとつのサイン波（モジュレーター）が、もうひとつ（キャリア）の音高を1秒間に何度も揺らします。2つの周波数の比によって現れる部分音が決まります。整数比ではエレクトリック・ピアノやオルガンのような倍音的な音が生まれ、それ以外の比では鐘のような金属的な音になります。変調指数が部分音の強さを決めます。変調指数にエンベロープをかけると、打楽器のように、音は始まりで明るく、減衰するにつれてまろやかになります。一方、振幅変調（AM）は、ひとつの波でもうひとつの波の音量を変えます。その結果、各部分音の両側にサイドバンド（追加の部分音）が生まれ、うつろな、あるいは鳴り響くような音色になります。

Choose an **Engine** and play. In **FM**, **Ratio** sets the modulator's frequency as a multiple of the carrier's, **Index** sets the modulation strength, and **Mod decay** sets how quickly the modulation fades during each note. Try a ratio of 1 with a high index for a brassy sound, a ratio of 3.5 for a bell-like sound, or a short mod decay for an electric-piano sound. In **AM**, **Ratio** sets the modulating wave's frequency. **Spectrum** shows the partials added by each setting.

**Engine**を選んで弾いてください。**FM**では、**Ratio**がキャリアに対するモジュレーターの周波数の倍率を、**Index**が変調の強さを、**Mod decay**が各音の中で変調が消える速さを決めます。比を1にしてインデックスを高くすると金管のような音に、比を3.5にすると鐘のような音に、Mod decayを短くするとエレクトリック・ピアノのような音になります。**AM**では、**Ratio**が変調する波の周波数を決めます。**Spectrum**には、各設定によって加わる部分音が表示されます。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=fm,am" title="FM and AM synthesis" allow="autoplay" loading="lazy"></iframe></div>

Many other methods exist. Additive synthesis builds sounds from individual sine waves (see [Sound Waves](/sound-waves)). Wavetable synthesis moves through a series of stored waveforms, while granular synthesis rebuilds sound from tiny grains (see [Sound as Material](/sound-as-material)). Sampling plays recordings at new pitches, as the piano in these demos does. Physical modeling simulates the vibrating strings, tubes, and bodies of real instruments.

ほかにも多くの方法があります。加算合成は個々のサイン波から音を組み立てます（[音の波](/sound-waves)を参照）。ウェーブテーブル合成は保存された一連の波形のあいだを移り変わり、グラニュラー合成は小さな音の粒から音を組み立て直します（[素材としての音](/sound-as-material)を参照）。サンプリングは、これらのデモのピアノのように、録音を別の音高で再生します。物理モデリングは、実際の楽器の弦や管、胴の振動をシミュレートします。
