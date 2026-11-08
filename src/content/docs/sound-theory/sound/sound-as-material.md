---
title: "Sound as Material 素材としての音"
slug: sound-as-material
---
On [Synthesizers and Effects](/synthesis), sounds were built from oscillators, filters, envelopes, and effects, and then played as notes on a keyboard. This page keeps those tools but puts the notes aside. Most of music theory is about notes: which pitches, when, and in what combinations. Another tradition starts from the sound itself, its timbre, texture, and space, the small changes inside a single tone. It runs from musique concrète and electronic music (see [Breaking Conventions](/breaking-conventions)) to sound design for film and games and much of today's electronic music, and to quiet, sparse improvised music such as onkyō (音響), which grew in Tokyo around 2000, and the reductionism of Berlin at the same time. Sound design, the shaping of sounds for music, film, games, and products, works the same way: it uses the synthesizer's tools, together with recordings, space, and layers, and a single hit in a film is often a thump, a crack, and a long tail combined.

[シンセサイザーとエフェクト](/synthesis)では、オシレーター、フィルター、エンベロープ、エフェクトで音をつくり、鍵盤で音符として鳴らしました。このページでは、同じ道具を使いながら、音符をいったん脇に置きます。音楽理論の大半は、音符についてのものです。どの音高を、いつ、どんな組み合わせで鳴らすか。それとは別の伝統は、音そのもの、つまり音色、質感、空間、ひとつの音の中の小さな変化から始まります。ミュジーク・コンクレートや電子音楽（[慣習を破る](/breaking-conventions)を参照）から、映画やゲームのサウンドデザイン、今日の電子音楽の多く、そして2000年前後に東京で育った音響系や、同じころのベルリンのリダクショニズムのような、静かでまばらな即興音楽へと続いています。音楽、映画、ゲーム、製品のために音を形づくるサウンドデザインも、同じように考えます。シンセサイザーの道具に、録音、空間、レイヤーを加えて音を組み立て、映画のひとつの打撃音は、多くの場合、ドスンという音、パキッという音、長い余韻を重ねたものです。

Music made this way asks for a different kind of listening. The sounds can be very small: a single sine tone and how it fills the room as you move your head, the hum of a speaker or an amplifier, a click, a crackle, feedback slowly changing shape, a breath, the scrape of an object on a surface, a recording of a street or a room. Instead of following a melody or a beat, the listener attends to the grain and color of each sound, how it begins and decays, where it sits in the space, and how it changes over a long time. The silence between sounds, and the sounds of the room and the audience that fill it, become part of the music. Listening this way can start anywhere, with a sine wave on [Sound Waves](/sound-waves) played quietly and high, or with the sounds around you right now.

こうしてつくられる音楽は、別の種類の聞き方を求めます。音はとても小さいことがあります。ひとつのサイン波と、頭を動かすとそれが部屋をどう満たすか、スピーカーやアンプのハム、クリック、パチパチという音、ゆっくり形を変えるフィードバック、息、ものが表面をこする音、通りや部屋の録音。聞き手は、旋律や拍を追う代わりに、それぞれの音の肌理と色合い、音がどう始まりどう消えていくか、空間のどこにあるか、長い時間の中でどう変わっていくかに注意を向けます。音と音のあいだの沈黙、そしてそれを満たす部屋や聴衆の音も、音楽の一部になります。こうした聞き方はどこからでも始められます。[音の波](/sound-waves)のサイン波を小さく高く鳴らしてみても、いま身の回りにある音からでも。

# Layering
# レイヤー

In sound design, one sound is often several sounds played together, each adding something the others lack. Each layer here is a small synthesizer patch made from the parts on [Synthesizers and Effects](/synthesis). Press the **Hit** pad (or A, or the space bar) to play an impact made of four layers, each with its own level: **Thump**, a sine wave whose pitch drops fast (an envelope applied to pitch rather than loudness), felt more than heard; **Crack**, white noise through a high-pass filter with a very short envelope, which makes the hit sound hard; **Ring**, FM synthesis with a ratio that is not a whole number, a short metallic clang that gives it a body; and **Tail**, noise through a low-pass filter into a long reverb, which gives it a space. Lower a layer to 0 to hear what it was adding, or play one alone. The plot shows the combined waveform.

サウンドデザインでは、ひとつの音が、いくつかの音を同時に鳴らしたものであることがよくあります。それぞれが、ほかの音にないものを加えます。ここでのレイヤーは、どれも[シンセサイザーとエフェクト](/synthesis)で見た部品でつくった、小さなシンセサイザーの音色です。**Hit**のパッド（またはA、スペースキー）を押すと、4つのレイヤーでできた衝撃音が鳴ります。それぞれに音量があります。**Thump**は音高が急速に下がるサイン波で（音量ではなく音高にかけたエンベロープ）、聞こえるというより体で感じる音です。**Crack**は、ハイパス・フィルターを通したホワイトノイズにごく短いエンベロープをかけたもので、打撃を硬く聞こえさせます。**Ring**は、比が整数でないFM合成による短い金属的な響きで、音に胴体を与えます。**Tail**は、ローパス・フィルターを通したノイズを長いリバーブに送ったもので、音に空間を与えます。レイヤーを0にすると、それが何を加えていたかがわかります。ひとつだけ鳴らしてみることもできます。図は合わさった波形です。

<div class="demo-wrap"><iframe src="/writing/demos/layers/index.html" title="Layering" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

# Sampling
# サンプリング

Sampling means recording a sound and using the recording as an instrument. Where a synthesizer starts from an oscillator, a sampler starts from a recording; the envelopes, filters, and effects that follow can be the same. The piano in the demos on [Synthesizers and Effects](/synthesis) is itself a sampler: recordings of a real piano, played back at new pitches. Sampling began with tape: from 1948 Pierre Schaeffer in Paris built musique concrète from recordings of trains, pans, and voices, looping, slowing, and reversing them by cutting and splicing tape. Digital samplers arrived around 1980 (the Fairlight CMI, the E-mu Emulator) and became cheap in the late 1980s (the Akai MPC, the E-mu SP-1200), which made sampling the backbone of hip-hop: producers looped and chopped drum breaks and phrases from funk and soul records into new beats. Since then, sampling ideas have multiplied:

-   **Looping:** a short phrase repeated until it becomes a groove or a texture, as in Steve Reich's tape pieces (see [Breaking Conventions](/breaking-conventions)) and countless hip-hop beats.

-   **Chopping:** cutting a recording into slices and playing them in a new order, the basis of beat-making and of jungle's rapid edits of drum breaks.

-   **Changing speed:** playing a recording faster or slower, which moves its pitch with it, from chipmunk voices to the slowed, dreamy loops of vaporwave.

-   **Reversing:** playing it backward, which turns a sharp attack into a swell.

-   **Plunderphonics and collage:** building pieces from recognizable recordings, as John Oswald did in the 1980s, raising questions about authorship along the way.

-   **Glitch:** using the failures of playback, skipping CDs and digital errors, as material, as Oval did in the 1990s (see [Sound Toys](/sound-toys)).

-   **Field recording:** recording places, weather, machines, and animals, and composing with them, as a kind of listening.

サンプリングとは、音を録音し、その録音を楽器として使うことです。シンセサイザーがオシレーターから始めるところを、サンプラーは録音から始めます。そのあとに続くエンベロープ、フィルター、エフェクトは同じでかまいません。[シンセサイザーとエフェクト](/synthesis)のデモのピアノも、じつはサンプラーです。本物のピアノの録音を、別の音高で鳴らしています。サンプリングはテープから始まりました。1948年から、パリのピエール・シェフェールは、列車、鍋、声の録音から、テープを切ってつなぐことでループさせたり、遅くしたり、逆にしたりして、ミュジーク・コンクレートを組み立てました。デジタルのサンプラーは1980年ごろ（フェアライトCMI、E-mu Emulator）に登場し、1980年代後半に安価になり（AKAI MPC、E-mu SP-1200）、サンプリングをヒップホップの背骨にしました。プロデューサーたちは、ファンクやソウルのレコードのドラム・ブレイクやフレーズをループさせ、切り刻んで、新しいビートにしたのです。それ以来、サンプリングのアイデアは増え続けています。

-   **ループ：** 短いフレーズを、グルーヴや質感になるまで繰り返します。スティーヴ・ライヒのテープ作品（[慣習を破る](/breaking-conventions)を参照）や、数えきれないヒップホップのビートのように。

-   **チョップ：** 録音を切り分け、新しい順番で鳴らします。ビートメイキングの基本であり、ジャングルのドラム・ブレイクのすばやい編集の基本でもあります。

-   **速さを変える：** 録音を速く、あるいは遅く再生すると、音高も一緒に動きます。リスのような声から、ヴェイパーウェイヴの遅く夢のようなループまで。

-   **逆再生：** 後ろから再生すると、鋭い立ち上がりが、ふくらんでいく音に変わります。

-   **プランダーフォニックスとコラージュ：** 聞き覚えのある録音から作品を組み立てます。1980年代にジョン・オズワルドがしたように。その過程で、作者とは誰かという問いも生まれます。

-   **グリッチ：** 飛ぶCDやデジタルのエラーといった、再生の失敗を素材にします。1990年代のOvalのように（[音のおもちゃ](/sound-toys)を参照）。

-   **フィールド・レコーディング：** 場所、天気、機械、動物を録音し、それで作曲します。それ自体が、聞くことの一種です。

Choose a **Sound** and press **Play** to loop it, or press **Record** to record your own sound with the microphone (press it again to stop, or it stops after ten seconds); your recording appears in the menu as **Recording**. **Speed** plays it faster or slower, moving the pitch with it. **Attack** and **Release** fade each slice in and out. **Slices** cuts the recording into equal slices, played in order, and **Shuffle** plays them in a random order instead; **Reverse** plays each slice backward. The sections below add distortion, a filter, delay, and reverb. The plot shows the recording's waveform, with the sounding slice marked in yellow (butter when it plays backward). Try the piano note with **Reverse**, the voice at half speed, and the drum break with eight slices and **Shuffle**.

**Sound**を選んで**Play**を押すとループします。**Record**を押すと、マイクで自分の音を録音できます（もう一度押すと止まり、10秒で自動的に止まります）。録音はメニューに**Recording**として現れます。**Speed**は速く、あるいは遅く再生し、音高も一緒に動かします。**Attack**と**Release**は、それぞれのスライスをフェードイン、フェードアウトさせます。**Slices**は録音を等しいスライスに切り分けて順に鳴らし、**Shuffle**はランダムな順番で鳴らします。**Reverse**はそれぞれのスライスを逆再生します。下のセクションで、ディストーション、フィルター、ディレイ、リバーブを加えられます。図は録音の波形で、鳴っているスライスは黄色（逆再生のときはバター色）で示されます。ピアノの音を**Reverse**で、声を半分の速さで、ドラム・ブレイクを8つのスライスと**Shuffle**で試してみましょう。

<div class="demo-wrap"><iframe src="/writing/demos/sampler/index.html" title="Sampler" allow="autoplay; microphone" loading="lazy" style="height: 640px"></iframe></div>

# Granular Synthesis
# グラニュラー合成

Granular synthesis, one of the other methods mentioned at the end of [Synthesizers and Effects](/synthesis), sits between the two: it starts from a recording, like a sampler, but rebuilds the sound from tiny pieces, like a synthesizer. It cuts a recording into grains of a few to a few hundred milliseconds and plays many of them, overlapping. The idea goes back to Iannis Xenakis in the late 1950s and was developed in software by Curtis Roads and others. Because each grain keeps its own pitch, the speed through the recording and the pitch become independent: a single note can be stretched into a still cloud, or shifted in pitch without speeding up.

グラニュラー合成は、[シンセサイザーとエフェクト](/synthesis)の最後で触れたそのほかの手法のひとつで、2つのあいだにあります。サンプラーのように録音から始めますが、シンセサイザーのように、小さな断片から音をつくり直します。録音を数ミリ秒から数百ミリ秒の粒（グレイン）に切り分け、多くの粒を重ねながら鳴らします。この考え方は1950年代後半のヤニス・クセナキスにさかのぼり、カーティス・ローズらがソフトウェアで発展させました。それぞれの粒は自分の音高を保つので、録音を進む速さと音高が独立します。ひとつの音を静止した雲のように引き伸ばしたり、速さを変えずに音高だけを変えたりできます。

Choose a **Sound**, a recorded note, and press **Play** to loop it through grains. **Rate** is the speed through the recording: 1 is as recorded, and lower values stretch it in time without changing its pitch. **Pitch** shifts it up or down in cents (100 to a semitone) without changing its speed. **Grain** is the length of each grain: short grains sound buzzy and rough, long ones smooth. **Overlap** is the crossfade between grains. **Reverse** plays each grain backward. The plot shows the waveform above and the spectrum below.

**Sound**で録音された音を選び、**Play**を押すと、その音が粒になってループします。**Rate**は録音を進む速さで、1が録音どおり、小さくすると音高を変えずに時間を引き伸ばします。**Pitch**は、速さを変えずに音高をセント単位（半音が100）で上下させます。**Grain**はそれぞれの粒の長さで、短い粒はざらついたブザーのように、長い粒はなめらかに聞こえます。**Overlap**は粒どうしのクロスフェードの長さです。**Reverse**はそれぞれの粒を逆向きに鳴らします。図は、上に波形、下にスペクトルを表示します。

<div class="demo-wrap"><iframe src="/writing/demos/granular/index.html" title="Granular synthesis" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

Try a Rate near 0.05 with long grains for a frozen drone, short grains with a lot of overlap for a buzzing texture, and Pitch an octave down with Reverse for something no instrument would play. Composing with sound in this way is less about choosing notes than about listening closely and shaping what you hear.

Rateを0.05近くにして粒を長くすると凍りついたドローンに、粒を短くしてOverlapを多くするとざわめく質感に、Pitchを1オクターブ下げてReverseにすると、どんな楽器も奏でない音になります。こうして音で作曲することは、音符を選ぶことよりも、よく聞き、聞こえるものを形づくることに近いのです。
