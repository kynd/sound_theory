---
title: "Synthesizers and Effects シンセサイザーとエフェクト"
slug: synthesis
---
A synthesizer builds a sound from scratch, out of oscillators, filters, and envelopes, rather than recording one. Audio effects then shape any sound, synthesized or recorded, by changing its loudness, its frequencies, or its sense of space. This page builds up a basic synthesizer, runs sounds through common effects, and ends with two synthesis methods that work in a different way.

シンセサイザーは、音を録音するのではなく、オシレーター、フィルター、エンベロープから音をゼロからつくります。そしてエフェクトは、合成した音でも録音した音でも、その音量や周波数、空間の感じを変えることで音を形づくります。このページでは、基本的なシンセサイザーを組み立て、音をよく使われるエフェクトに通し、最後に、違う仕組みで働く2つの合成方法を見ていきます。

# Subtractive Synthesis
# 減算合成

The classic analog synthesizer, from the Moog and its successors in the 1960s and 1970s, works by subtraction. An oscillator produces a wave rich in harmonics (see [Sound Waves](/sound-waves)): a sawtooth has every harmonic, a square only the odd ones. A low-pass filter then removes the higher harmonics, darkening the sound; its cutoff sets where it starts cutting, and its resonance boosts the frequencies right at the cutoff, giving a vocal, ringing edge. Finally an amplifier shapes the loudness over time with an envelope: attack (how fast the note rises), decay (how fast it falls after the peak), sustain (the level held while the key is down), and release (how long it rings after the key is let go), together called ADSR. A second envelope can move the filter's cutoff over each note, so the sound brightens at the start and darkens as it decays, the most characteristic move of analog synths.

1960年代から1970年代のモーグとその後継機に代表される古典的なアナログ・シンセサイザーは、引き算で音をつくります。オシレーターが倍音を豊かに含む波をつくり（[音の波](/sound-waves)を参照）、ノコギリ波はすべての倍音を、矩形波は奇数倍音だけを含みます。次にローパス・フィルターが高い倍音を取り除き、音を暗くします。カットオフはどこから削り始めるかを、レゾナンスはカットオフのすぐ近くの周波数を強めて、声のような、響く輪郭を与えます。最後にアンプが、エンベロープで音量の時間変化を形づくります。アタック（音が立ち上がる速さ）、ディケイ（ピークのあと下がる速さ）、サステイン（鍵を押しているあいだ保たれる音量）、リリース（鍵を離したあと響く長さ）で、まとめてADSRと呼ばれます。もうひとつのエンベロープでフィルターのカットオフを音ごとに動かすと、音は始まりで明るく、減衰するにつれて暗くなります。アナログ・シンセの最も特徴的な動きです。

Play the keyboard with the mouse or the keys from A to ; on your computer keyboard (Z and X shift the octave). **Wave** picks the oscillator; **Cutoff** and **Resonance** set the filter; **Env amt** sets how many octaves the filter's envelope opens it above the cutoff; and **Attack**, **Decay**, **Sustain**, and **Release** shape both envelopes. **Waveform** and **Spectrum** switch the display between the wave and its frequencies. Try a low cutoff with high resonance and a large envelope amount for a classic bass, or a slow attack and release for a pad.

マウス、またはコンピューターのキーボードのAから;までのキーで鍵盤を弾いてください（ZとXでオクターブが変わります）。**Wave**はオシレーターを選び、**Cutoff**と**Resonance**はフィルターを設定します。**Env amt**は、フィルターのエンベロープがカットオフから何オクターブ開くかを、**Attack**、**Decay**、**Sustain**、**Release**は両方のエンベロープの形を決めます。**Waveform**と**Spectrum**は、表示を波形と周波数で切り替えます。低いカットオフに高いレゾナンスと大きなエンベロープ量で典型的なベースを、ゆっくりしたアタックとリリースでパッドをつくってみてください。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=subtractive" title="Subtractive synthesizer" allow="autoplay" loading="lazy"></iframe></div>

# Effects
# エフェクト

Effects are usually chained one after another, and their order matters. A compressor reduces the level of the loud parts above a threshold, by a ratio, making a sound more even and punchy; it is used on almost every recording. An auto-wah is a resonant filter that opens as the sound gets louder, so each note says "wah"; a wah-wah pedal does the same with a guitarist's foot moving the filter. Chorus mixes in slightly delayed, slowly wavering copies, as if several players were playing together, and a phaser sweeps notches through the spectrum for a swirling sound. Delay repeats the sound after a set time, each echo fed back to make the next, and reverb imitates the thousands of reflections of a room, from a small studio to a cathedral.

エフェクトはふつう順につながれ、その順番も音に影響します。コンプレッサーは、スレッショルドを超える大きな部分の音量をレシオに従って下げ、音を均一で力強くします。ほぼすべての録音に使われています。オートワウは音が大きくなるほど開くレゾナンスつきのフィルターで、音ごとに「ワウ」と鳴ります。ワウワウ・ペダルは、ギタリストの足でフィルターを動かして同じことをします。コーラスは、わずかに遅れてゆっくり揺れる複製を混ぜ、何人もが一緒に演奏しているように聞かせます。フェイザーはスペクトルの中に溝を走らせ、渦を巻くような響きをつくります。ディレイは一定の時間のあとに音を繰り返し、それぞれのこだまを戻して次のこだまをつくります。リバーブは、小さなスタジオから大聖堂まで、部屋の何千もの反射をまねます。

Choose a **Preset**, open an effect, and turn it up. Every effect starts transparent, with its mix at 0 (the compressor with its threshold at 0 dB and ratio 1), so you can hear what each one adds. **Compressor** sets **Threshold** and **Ratio**; **Auto-wah** sets the filter's resting frequency (**Base**) and how far it opens (**Octaves**); **Chorus** and **Phaser** set how fast they move (**Rate**, in cycles per second) and how far; **Delay** sets the time between echoes and their feedback; **Reverb** sets the decay time. **Mix** blends each effect with the dry sound. The effects run in the order listed.

**Preset**を選び、エフェクトを開いて上げてみてください。どのエフェクトも、ミックス0（コンプレッサーはスレッショルド0 dB、レシオ1）の透明な状態から始まるので、それぞれが何を加えるかを聞き分けられます。**Compressor**は**Threshold**と**Ratio**を、**Auto-wah**はフィルターの基準の周波数（**Base**）と開く幅（**Octaves**）を、**Chorus**と**Phaser**は動く速さ（**Rate**、1秒あたりの周期）と幅を、**Delay**はこだまの間隔とフィードバックを、**Reverb**は残響の長さを設定します。**Mix**は、それぞれのエフェクトを元の音と混ぜ合わせます。エフェクトは並んだ順に通ります。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?presets&effects=compressor,autowah,chorus,phaser,delay,reverb" title="Effects" allow="autoplay" loading="lazy"></iframe></div>

# Beyond Subtraction
# 減算を越えて

Frequency modulation (FM), worked out by John Chowning at Stanford in the late 1960s and made famous by the Yamaha DX7 in 1983, makes complex sounds from just two sine waves. One sine, the modulator, bends the pitch of another, the carrier, many times per second. The ratio between their frequencies decides which partials appear: whole-number ratios give harmonic tones like electric pianos and organs, and other ratios give bell-like, metallic sounds. The modulation index decides how strong those partials are, so an envelope on the index makes a note bright at the start and mellow as it decays, like a struck instrument. Amplitude modulation (AM) changes the loudness of one wave with another instead, adding sidebands, extra partials on either side of each one, for a hollow or ringing color.

周波数変調（FM）は、1960年代後半にスタンフォード大学のジョン・チャウニングが確立し、1983年のヤマハDX7で広く知られるようになった方法で、たった2つのサイン波から複雑な音をつくります。ひとつのサイン波（モジュレーター）が、もうひとつ（キャリア）の音高を1秒に何度も揺らします。2つの周波数の比が、どの部分音が現れるかを決めます。整数の比はエレクトリック・ピアノやオルガンのような倍音的な音を、それ以外の比は鐘のような金属的な音をつくります。変調指数（インデックス）がそれらの部分音の強さを決めるので、インデックスにエンベロープをかけると、打楽器のように、音は始まりで明るく、減衰するにつれてまろやかになります。振幅変調（AM）は、代わりにひとつの波でもうひとつの波の音量を変え、各部分音の両側にサイドバンドと呼ばれる部分音を加えて、うつろな、あるいは鳴り響くような色をつくります。

Choose an **Engine** and play. For **FM**, **Ratio** is the modulator's frequency as a multiple of the carrier's, **Index** the strength of the modulation, and **Mod decay** how fast the modulation fades within each note. Try ratio 1 with a high index for a brassy sound, ratio 3.5 for a bell, and a short mod decay for an electric piano. For **AM**, **Ratio** sets the modulating wave's frequency. Spectrum shows the partials each setting adds.

**Engine**を選んで弾いてください。**FM**では、**Ratio**がキャリアに対するモジュレーターの周波数の倍率、**Index**が変調の強さ、**Mod decay**が各音の中で変調が消えていく速さです。比1で高いインデックスにすると金管のような音に、比3.5で鐘の音に、短いMod decayでエレクトリック・ピアノのような音になります。**AM**では、**Ratio**が変調する波の周波数を決めます。Spectrumには、それぞれの設定が加える部分音が表示されます。

<div class="demo-wrap"><iframe src="/writing/demos/synth/index.html?engine=fm,am" title="FM and AM synthesis" allow="autoplay" loading="lazy"></iframe></div>

Many other methods exist. Additive synthesis builds a sound from individual sine waves (see [Sound Waves](/sound-waves)); wavetable synthesis moves through a series of stored waveforms; granular synthesis rebuilds sound from tiny grains (see [Sound as Material](/sound-as-material)); sampling plays recordings back at new pitches, as the piano in these demos does; and physical modeling simulates the vibrating strings, tubes, and bodies of real instruments.

ほかにも多くの方法があります。加算合成は個々のサイン波から音を組み立て（[音の波](/sound-waves)を参照）、ウェーブテーブル合成は保存した一連の波形のあいだを移り、グラニュラー合成は音を小さな粒から組み立て直します（[素材としての音](/sound-as-material)を参照）。サンプリングは、これらのデモのピアノのように録音を新しい音高で再生し、物理モデリングは、実際の楽器の振動する弦や管、胴をシミュレートします。
