---
title: "Sound as Material 素材としての音"
slug: sound-as-material
---
On [Synthesizers and Effects](/synthesis), we built sounds from oscillators, filters, envelopes, and effects, then played them as notes on a keyboard. Here, we set the notes aside and focus on sound as material.

[シンセサイザーとエフェクト](/synthesis)では、オシレーター、フィルター、エンベロープ、エフェクトで音をつくり、鍵盤で音符として鳴らしました。ここでは音符をいったん脇に置き、素材としての音に注目します。

Sound is too vast for any one theory to encompass. Much of Western music theory makes this vast field more manageable by focusing on notes: organizing pitch into scales and intervals, and time into beats and rhythmic divisions. This covers only a narrow part of what sound can do, yet it is an extraordinarily rich part. But we never hear notes alone. We also hear timbre and texture, the resonance of a space, the tremble in a voice, and the way a sound begins, changes, and fades. These qualities shape how people enjoy sound across cultures, in Western and non-Western music alike, and beyond music—in everyday surroundings and spaces designed for listening. Paying attention to them reveals a richness in the world that notes alone cannot capture.

音の世界は、ひとつの理論では捉えきれないほど広大です。西洋音楽理論の多くは、音高を音階や音程に、時間を拍やリズムの区切りに整理し、音符に焦点を当てることで、この広大な領域を扱いやすくしています。それが扱うのは音にできることのごく一部ですが、その中にもきわめて豊かな世界があります。ただ、私たちが聴いているのは音符だけではありません。音色や質感、空間の響き、声の震え、音の始まり方や変化、消え方も聴いています。こうした性質は、西洋・非西洋を問わず、さまざまな文化での音の楽しみ方を形づくっています。それは音楽に限らず、日々の身の回りの音や、聴くためにしつらえられた空間にも当てはまります。それらに注意を向けると、音符だけでは捉えきれない世界の豊かさが見えてきます。

Some musical practices put these qualities at their center. Examples include musique concrète and electronic music (see [Breaking Conventions](/breaking-conventions)), much of today's electronic music, and quiet, sparse improvised styles such as onkyō (音響), which emerged in Tokyo around 2000, and Berlin reductionism from the same period. Sound design—the shaping of sounds for music, film, games, and products—also works directly with these qualities. It brings together tools, recordings, audio synthesis and processing, space, and layers.

こうした性質を中心に据える音楽もあります。ミュジーク・コンクレートや電子音楽（[慣習を破る](/breaking-conventions)を参照）、今日の電子音楽の多く、そして2000年前後に東京で生まれた音響系や同時期のベルリンのリダクショニズムのような、静かで音数の少ない即興音楽がその例です。音楽、映画、ゲーム、製品のために音を形づくるサウンドデザインも、こうした性質を直接扱います。そこでは、道具、録音、音の合成や加工、空間、音のレイヤーを組み合わせます。

Sounds made this way call for a different kind of listening. They can be subtle: a single sine tone and the way it fills a room as you move your head; a speaker or amplifier's hum; a click, a crackle, feedback slowly changing shape, a breath, an object scraping across a surface, or a recording of a street or room. Rather than following a melody or beat, the listener attends to each sound's grain and color, how it begins and fades, where it sits in space, and how it changes over time. The silence between sounds—and the sounds of the room and audience that fill it—becomes part of the music. You can listen this way anywhere and start playing around at any time.

こうしてつくられた音には、いつもとは違う聴き方が求められます。音はごくささやかなものかもしれません。ひとつのサイン波と、頭を動かしたときに変わる部屋の中での響き方、スピーカーやアンプのハム音、クリック音やパチパチという音、ゆっくり形を変えるフィードバック、息づかい、物が表面をこする音、街や部屋の録音などです。メロディやビートを追うのではなく、それぞれの音の粒立ちや色合い、始まり方や消え方、空間のどこにあるか、時間とともにどう変わるかに耳を傾けます。音と音のあいだの静けさ、そしてそこを満たす部屋や聴衆の音も、音楽の一部になります。こうした聴き方はどこでも始められ、いつでも音で遊び始められます。

# Layering
# レイヤー

In sound design, a single sound often combines several layers, each contributing something the others lack. The result need not represent any concrete object or event; it can simply be an abstract texture or an unfamiliar sound appreciated for its own qualities.

サウンドデザインでは、ひとつの音に複数のレイヤーを重ね、それぞれにほかのレイヤーにはない要素を加えることがよくあります。できあがった音は、具体的な物や出来事を表す必要はありません。抽象的な質感や、聞き慣れない響きとして、その音自体を楽しむこともできます。

Each layer here is a small synthesizer patch built from the components introduced in [Synthesizers and Effects](/synthesis). Press the **Mix** pad (or A or the space bar) to hear an impact made of four layers, each with its own level. **Thump** is a sine wave whose pitch drops quickly—an envelope is applied to its pitch rather than its loudness—so you feel it more than hear it. **Crack** is white noise passed through a high-pass filter and shaped by a very short envelope, giving the hit a hard edge. **Ring** uses FM synthesis with a non-integer ratio to create a short metallic clang that gives the sound body. **Tail** is noise passed through a low-pass filter and long reverb, giving the sound a sense of space. The pads after **Mix** (or S, D, F, and G) play one layer alone. The plot shows the waveform of what is sounding.

ここでのそれぞれのレイヤーは、[シンセサイザーとエフェクト](/synthesis)で紹介した部品からつくった、小さなシンセサイザーの音色です。**Mix**のパッド（またはA、スペースキー）を押すと、4つのレイヤーからなる衝撃音が鳴ります。レイヤーの音量はそれぞれ個別に調整できます。**Thump**は音高が急速に下がるサイン波です。音量ではなく音高にエンベロープをかけているため、耳で聴くというより体で感じられます。**Crack**は、ハイパス・フィルターを通したホワイトノイズにごく短いエンベロープをかけ、打撃に硬い響きを加えます。**Ring**は、整数比でないFM合成で短い金属音をつくり、音に厚みを加えます。**Tail**は、ローパス・フィルターを通したノイズに長いリバーブをかけ、空間の広がりを感じさせます。**Mix**の右にあるパッド（またはS、D、F、G）は、レイヤーをひとつだけ鳴らします。図は鳴っている音の波形です。

<div class="demo-wrap"><iframe src="/writing/demos/layers/index.html" title="Layering" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

# Sampling
# サンプリング

Sampling means recording a sound and using it as an instrument. By layering recordings and applying effects, we can reshape them into new textures.

サンプリングとは、音を録音して楽器のように使うことです。録音を重ね、エフェクトを加えることで、新たな質感に作り変えられます。

A recording's source need not match what the finished sound represents. Chopping a cabbage might provide the crunch of a sword strike, while beans rolling across a tilted surface can evoke ocean waves. What matters is how the sound feels in context. **Field recording** extends this attention to the world around us: we record places, weather, machines, and animals, listening closely and using the recordings as materials.

録音した音の出どころと、完成した音が表すものは一致していなくてもかまいません。キャベツを刻む音が剣撃の鋭い響きになったり、傾斜した面を転がる豆の音が海の波を思わせたりすることもあります。大切なのは、文脈の中でどう聞こえるかです。**フィールドレコーディング**では、この視点を身の回りの世界へ広げ、場所や天候、機械、動物の音に耳を澄ませて録音し、素材として活用します。

Sampling began with tape. From 1948 onward, [Pierre Schaeffer](https://en.wikipedia.org/wiki/Pierre_Schaeffer) in Paris created musique concrète from recordings of trains, pans, and voices. He cut and spliced tape to make loops, slow sounds down, and reverse them. These techniques remain common. **Looping** repeats a short phrase until it becomes a groove or texture, as in [Steve Reich](https://en.wikipedia.org/wiki/Steve_Reich)'s tape pieces (see [Breaking Conventions](/breaking-conventions)) and countless hip-hop beats. **Changing speed** also shifts pitch, as with chipmunk-like voices and vaporwave's slowed, dreamy loops. **Reversing** a sound turns a sharp attack into a swell.

サンプリングはテープから始まりました。1948年以降、パリの[ピエール・シェフェール](https://ja.wikipedia.org/wiki/ピエール・シェフェール)は、列車や鍋、声の録音をもとに、テープを切り貼りしてループをつくったり、速度を落としたり、逆再生したりしながら、ミュジーク・コンクレートを制作しました。こうした手法は今も広く使われています。**ループ**は短いフレーズを繰り返し、グルーヴや質感を生み出します。[スティーヴ・ライヒ](https://ja.wikipedia.org/wiki/スティーヴ・ライヒ)のテープ作品（[慣習を破る](/breaking-conventions)を参照）や、数えきれないほどのヒップホップのビートがその例です。**再生速度を変える**と音高も変わります。チップマンクのような甲高い声や、速度を落として夢幻的な響きにしたヴェイパーウェイヴのループがその例です。**逆再生**すると、鋭い立ち上がりがふくらむような音に変わります。

Digital samplers emerged around 1980 with instruments such as the [Fairlight CMI](https://en.wikipedia.org/wiki/Fairlight_CMI) and [E-mu Emulator](https://en.wikipedia.org/wiki/E-mu_Emulator). More affordable models, including the [Akai MPC](https://en.wikipedia.org/wiki/Akai_MPC) and [E-mu SP-1200](https://en.wikipedia.org/wiki/E-mu_SP-1200), followed in the late 1980s, helping establish sampling as a backbone of hip-hop.

デジタル・サンプラーは、[Fairlight CMI](https://ja.wikipedia.org/wiki/フェアライトCMI)や[E-mu Emulator](https://ja.wikipedia.org/wiki/E-mu_Emulator)などの楽器とともに1980年ごろに登場しました。1980年代後半には、[Akai MPC](https://en.wikipedia.org/wiki/Akai_MPC)や[E-mu SP-1200](https://en.wikipedia.org/wiki/E-mu_SP-1200)など、より手ごろな機種が登場し、サンプリングがヒップホップの基盤のひとつとして定着するのを後押ししました。

Recordings can retain their identity or reveal the quirks of their playback medium. **[Plunderphonics](https://en.wikipedia.org/wiki/Plunderphonics) and collage** build pieces from recognizable recordings, as [John Oswald](https://en.wikipedia.org/wiki/John_Oswald_%28composer%29) did in the 1980s, raising questions about authorship. **Glitch**, on the other hand, uses playback failures such as skipping CDs and digital errors as material, as [Oval](https://en.wikipedia.org/wiki/Oval_%28musical_project%29) did in the 1990s (see [Sound Toys](/sound-toys)).

録音は、元の音だとわかる形で使うことも、再生媒体ならではの癖を際立たせることもできます。**[プランダーフォニックス](https://ja.wikipedia.org/wiki/プランダーフォニックス)とコラージュ**は、1980年代の[ジョン・オズワルド](https://en.wikipedia.org/wiki/John_Oswald_%28composer%29)のように、聞き覚えのある録音から作品を組み立て、作者性を問いかけます。一方、**グリッチ**は、CDの音飛びやデジタルのエラーといった再生の不具合を素材にします。1990年代の[Oval](https://ja.wikipedia.org/wiki/オヴァル)がその例です（[音のおもちゃ](/sound-toys)を参照）。

Try these techniques in the demo. Choose a **Sound** and press **Play** to loop it, or press **Record** to record a sound with the microphone. Press **Record** again to stop; otherwise, recording stops automatically after ten seconds. Your recording appears in the menu as **Recording**.

デモでこれらの手法を試してみましょう。**Sound**を選んで**Play**を押すと、ループ再生できます。**Record**を押すと、マイクで音を録音できます。もう一度**Record**を押すと停止します。押さなければ、10秒後に録音が自動で止まります。録音はメニューに**Recording**として表示されます。

The **Speed** control plays the recording faster or slower, shifting its pitch as well. **Slices** divides the recording into equal sections and plays them in order; **Shuffle** plays them in a random order. **Reverse** plays each slice backward, while **Attack** and **Release** fade each slice in and out. The sections below add distortion, a filter, delay, and reverb. The plot shows the recording's waveform, with the sounding slice marked in yellow (butter when it plays backward).

**Speed**は録音の再生速度を変え、それに応じて音高も変化させます。**Slices**は録音を同じ長さの区間に分割して順に再生し、**Shuffle**はランダムな順番で再生します。**Reverse**はそれぞれのスライスを逆再生し、**Attack**と**Release**はスライスごとにフェードイン、フェードアウトさせます。下のセクションでは、ディストーション、フィルター、ディレイ、リバーブを加えられます。図は録音の波形で、鳴っているスライスは黄色（逆再生のときはバター色）で示されます。

<div class="demo-wrap"><iframe src="/writing/demos/sampler/index.html" title="Sampler" allow="autoplay; microphone" loading="lazy" style="height: 640px"></iframe></div>

# Granular Synthesis
# グラニュラー合成

Granular synthesis, one of the other methods mentioned at the end of [Synthesizers and Effects](/synthesis), sits between synthesis and sampling. Like a sampler, it starts with a recording; like a synthesizer, it rebuilds the sound from tiny pieces. It cuts a recording into grains lasting from a few to a few hundred milliseconds and plays many of them at once, overlapping. The idea dates back to [Iannis Xenakis](https://en.wikipedia.org/wiki/Iannis_Xenakis) in the late 1950s and was developed in software by [Curtis Roads](https://en.wikipedia.org/wiki/Curtis_Roads) and others. Because each grain retains its pitch, playback speed and pitch become independent: a single note can stretch into a still cloud or shift in pitch without speeding up.

グラニュラー合成は、[シンセサイザーとエフェクト](/synthesis)の最後で触れた手法のひとつで、シンセサイズとサンプリングの中間にあります。サンプラーのように録音から始まりますが、シンセサイザーのように小さな断片から音をつくり直します。録音を数ミリ秒から数百ミリ秒の粒（グレイン）に切り分け、多数の粒を重ねて再生します。この考え方は1950年代後半の[ヤニス・クセナキス](https://ja.wikipedia.org/wiki/ヤニス・クセナキス)にさかのぼり、[カーティス・ローズ](https://en.wikipedia.org/wiki/Curtis_Roads)らがソフトウェアで発展させました。それぞれの粒が音高を保つため、録音を進む速さと音高を別々に変えられます。ひとつの音を静止した雲のように引き伸ばしたり、再生速度を変えずに音高だけを変えたりできます。

Choose a **Sound**, a recorded note, and press **Play** to loop it as grains, or press **Record** to record your own voice with the microphone. Press **Record** again to stop; otherwise, recording stops automatically after ten seconds. Your recording appears in the menu as **Recording** and loops as a whole. **Rate** controls how quickly playback moves through the recording: 1 is the original speed, and lower values stretch it over time without changing its pitch. **Pitch** shifts the sound up or down in cents (100 cents make a semitone) without changing its speed. **Grain** sets the length of each grain: short grains sound buzzy and rough, while long ones sound smooth. **Overlap** controls the crossfade between grains. **Reverse** plays each grain backward. The plot shows the waveform above and the spectrum below.

**Sound**で録音された音を選び、**Play**を押すと、粒に分かれてループ再生されます。**Record**を押すと、マイクで自分の声を録音できます。もう一度**Record**を押すと停止します。押さなければ、10秒後に録音が自動で止まります。録音はメニューに**Recording**として表示され、全体がループ再生されます。**Rate**は録音の中を進む速さです。1は録音どおりの速さで、それより小さくすると音高を変えずに時間を引き伸ばします。**Pitch**は、速さを変えずに音高をセント単位で上下させます（100セントで半音です）。**Grain**は粒の長さを決めます。短い粒はざらついたブザーのように、長い粒はなめらかに聞こえます。**Overlap**は粒どうしのクロスフェードを調整します。**Reverse**はそれぞれの粒を逆再生します。図では、上に波形、下にスペクトルを表示します。

<div class="demo-wrap"><iframe src="/writing/demos/granular/index.html" title="Granular synthesis" allow="autoplay; microphone" loading="lazy" style="height: 384px"></iframe></div>

Try a **Rate** near 0.05 with long grains for a frozen drone, short grains with lots of overlap for a buzzing texture, or **Pitch** an octave down with **Reverse** for a sound no instrument could produce. Composing with sound this way is less about choosing notes than listening closely and shaping what you hear.

**Rate**を0.05近くにして粒を長くすると、凍りついたドローンになります。粒を短くして**Overlap**を大きくすると、ざわめくような質感になります。**Pitch**を1オクターブ下げて**Reverse**を使えば、どんな楽器でも出せないような音になります。こうして音で作曲することは、音符を選ぶというより、よく聞いて、聞こえるものを形づくることに近いのです。
