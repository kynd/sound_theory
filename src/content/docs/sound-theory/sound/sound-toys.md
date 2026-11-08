---
title: "Sound Toys 音のおもちゃ"
slug: sound-toys
---
The design of a musical tool profoundly shapes how people make music. A phrase that feels natural on guitar may be difficult to play on piano, and vice versa. These differences shape not only the techniques and habits people develop but also how they think about music. We need not limit ourselves to traditional instruments: anyone can create new tools and, through them, new ways of thinking about and making music. For a century, inventors and artists have explored alternatives. The theremin (developed by Léon Theremin around 1920) is played by moving the hands through the air, while Toshio Iwai's Tenori-on (2007) uses a grid of lights to play patterns. The Otamatone offers another playful example: sliding a finger along its stem changes the pitch, while squeezing its mouth changes the timbre.

音楽をつくる道具のデザインは、人が音楽をつくる方法を大きく左右します。ギターでは自然に弾けるフレーズが、ピアノでは弾きにくいこともあり、その逆もあります。こうした違いは、身につく奏法や習慣だけでなく、音楽の捉え方そのものにも影響します。従来の楽器にとらわれる必要はありません。誰もが新しい道具をつくり、それを通して音楽の新たな考え方やつくり方を生み出せます。この1世紀、発明家や芸術家はさまざまな可能性を探ってきました。テルミン（レオン・テルミンが1920年ごろに開発）は、空中で手を動かして演奏します。岩井俊雄のTENORI-ON（2007年）は、光の格子でパターンを奏でます。オタマトーンも遊び心のある例で、細長い柄に沿って指を滑らせると音高が変わり、口を押すと音色が変わります。

The same freedom extends to notation: a score can use pictures instead of conventional notes. Beginning in the 1950s, composers began drawing scores to capture sounds and forms that staff notation could not represent. Earle Brown's *December 1952* is a page of scattered horizontal and vertical bars that performers can read in any direction. Morton Feldman's graph pieces, begun in 1950, use boxes to indicate only register and timing, leaving the pitches to the performers. John Cage's *Fontana Mix* (1958) consists of transparent sheets covered with lines and dots, designed to be overlaid. Cornelius Cardew's *Treatise* (1963–67) comprises 193 pages of lines, circles, and numbers, with no instructions at all. Krzysztof Penderecki's *Threnody to the Victims of Hiroshima* (1960) represents clusters of closely spaced pitches as thick black bands. Rainer Wehinger's "listening score" (1970) for György Ligeti's electronic *Artikulation* turns the finished sounds into colored shapes arranged along a timeline.

同様の自由さは、楽譜の書き方にも当てはまります。楽譜には、通常の音符の代わりに絵を使うこともできます。1950年代以降、五線譜では表せない音や形を記そうと、作曲家たちは楽譜を描き始めました。アール・ブラウンの『December 1952』は、水平と垂直の棒が散らばる1ページの作品で、演奏者はどの方向からでも読み進められます。1950年に始まるモートン・フェルドマンのグラフ作品では、箱に音域とタイミングだけが記され、音高は演奏者に委ねられます。ジョン・ケージの『フォンタナ・ミックス』（1958年）は、線と点を描いた透明なシートを重ねて使います。コーネリアス・カーデューの『トリーティス』（1963〜67年）は、線、円、数字からなる193ページの作品で、指示はまったくありません。クシシュトフ・ペンデレツキの『広島の犠牲者に捧げる哀歌』（1960年）では、密集した音高のクラスターが太い黒い帯で表されます。ジェルジ・リゲティの電子音楽『アーティキュレーション』をもとに、ライナー・ヴェーリンガーが作った「聴くための楽譜」（1970年）は、完成した音を時間軸に沿って色とりどりの形に置き換えています。

Some inventors went further, making pictures themselves produce sound. Evgeny Murzin's ANS synthesizer (1958) read scratches on glass plates as a spectrum; Daphne Oram's Oramics (from the late 1950s) read shapes drawn on strips of film; and Iannis Xenakis's UPIC (1977) read drawings on a tablet. The toys below explore similar ideas on a small scale.

さらに進んで、絵そのものから音を生み出す発明家もいました。エフゲニー・ムルジンのANSシンセサイザー（1958年）は、ガラス板の引っかき傷をスペクトルとして読み取りました。ダフニ・オーラムのオラミクス（1950年代後半から）はフィルムの帯に描かれた形を読み取り、ヤニス・クセナキスのUPIC（1977年）はタブレット上の絵を読み取りました。下のおもちゃは、こうした考え方を小さなスケールで試すものです。

# Drag to Play
# ドラッグで演奏する

Drag across the canvas. Move left or right to change the pitch, and move from bottom to top to adjust the low-pass filter's cutoff, shifting the sound from dark to bright (see [Synthesizers and Effects](/synthesis)). Press to start the sound and release to stop it. **Pitch** determines which notes the pitch snaps to. With **Free**, the pitch glides continuously, like a theremin. **Wave** selects the oscillator, while **Delay** and **Reverb** add space.

キャンバス上をドラッグしてみましょう。左右に動かすと音高が変わり、下から上へ動かすとローパス・フィルターのカットオフが変わり、音が暗い音から明るい音へと変化します（[シンセサイザーとエフェクト](/synthesis)を参照）。押すと音が鳴り、離すと止まります。**Pitch**では、音高をどの音に合わせるかを選べます。**Free**にすると、テルミンのように音高が連続的に変化します。**Wave**ではオシレーターを選び、**Delay**と**Reverb**で音に空間的な広がりを加えます。

<div class="demo-wrap"><iframe src="/writing/demos/xy-pad/index.html" title="Drag to play" allow="autoplay" loading="lazy"></iframe></div>

# Draw a Melody
# 旋律を描く

Draw a line on the canvas, then press **Play**. The line loops from left to right, with its height determining the pitch. **Clear** erases the entire line. Use **Pitch** to set a scale and **Length** to set the duration of each pass in seconds.

キャンバスに線を描き、**Play**を押してみましょう。線は左から右へループ再生され、高さが音高を決めます。**Clear**を押すと線全体が消えます。**Pitch**で音階を設定し、**Length**で1回の再生時間を秒単位で設定できます。

<div class="demo-wrap"><iframe src="/writing/demos/draw-melody/index.html" title="Draw a melody" allow="autoplay" loading="lazy"></iframe></div>

# A Grid of Notes
# 音の格子

Each row represents a note in the C major pentatonic scale, spanning two octaves from C4 to C6, and each column represents an eighth note. The grid repeats every two bars. Press **Play**, then click a cell to turn a note on or off. Drag a note up or down to adjust its volume. Because every row uses a pentatonic note, any pattern works. Simple shapes, rising lines, chords, and repeated notes are easy to see and hear. **Random** fills the grid with a random pattern, **Clear** empties it, and **Tempo** sets the speed.

格子のそれぞれの行は、C4からC6まで2オクターブにわたるCメジャー・ペンタトニックの音を表し、それぞれの列は8分音符を表します。格子は2小節ごとに繰り返します。**Play**を押してからセルをクリックすると、音をオン・オフできます。音を上下にドラッグすると、音量を調節できます。どの行もペンタトニックの音なので、どんなパターンでも自然に響きます。単純な形や上昇する線、和音、繰り返す音を、目でも耳でも確かめやすくなっています。**Random**は格子をランダムなパターンで埋め、**Clear**は空にし、**Tempo**は速さを設定します。

<div class="demo-wrap"><iframe src="/writing/demos/note-matrix/index.html" title="A grid of notes" allow="autoplay" loading="lazy" style="height: 464px"></iframe></div>

# Paint a Spectrum
# スペクトルを描く

Here, the picture is the sound's spectrum. Each row represents a sine wave at a different frequency, from 60 Hz at the bottom to 6000 Hz at the top. The frequencies are evenly spaced in pitch, but they do not follow any scale. Each column represents a moment in time, and the grid loops from left to right. Press and drag on an empty cell to paint it; press and drag on a painted cell to erase it. Press **Play** to hear the result; the cells in the sounding column turn red. A single painted cell produces a pure tone. A diagonal line creates a sweep, a thick block of neighboring rows forms a dense, beating band like Penderecki's clusters, and scattered cells create a spray of bright points. **Clear** erases everything, **Length** sets the duration of one pass in seconds, and **Delay** and **Reverb** add space.

ここでは、絵が音のスペクトルを表します。格子の行はそれぞれ異なる周波数のサイン波を表し、下端の60 Hzから上端の6000 Hzまで並びます。音高の間隔は均等ですが、特定の音階には沿っていません。列はそれぞれ時間上のひとつの時点を表し、格子は左から右へループ再生されます。空のセルを押してドラッグすると描け、色のついたセルを押してドラッグすると消せます。**Play**を押すと音が鳴り、再生中の列のセルが赤くなります。ひとつのセルは純音を生み出します。斜めの線は音の上昇・下降を、隣り合う行に広がる太いかたまりはペンデレツキのクラスターのように密集してうなり合う帯を、散らばったセルは明るい点のしぶきを生み出します。**Clear**ですべて消去でき、**Length**で1回の再生時間を秒単位で設定できます。**Delay**と**Reverb**で音に空間的な広がりを加えられます。

<div class="demo-wrap"><iframe src="/writing/demos/spectral-paint/index.html" title="Paint a spectrum" allow="autoplay" loading="lazy" style="height: 512px"></iframe></div>

# Skipping Sounds
# 飛ぶ音

In the 1990s the German group Oval (Markus Popp and others) drew on the underside of CDs with markers so that players skipped and stuttered, and built music from the clicks, loops, and fragments that came out, on albums such as *Systemisch* (1994). What had been a fault became the material, a sound later called glitch. The toy below imitates a skipping player: it cuts a recording into many short slices and, instead of playing them in order, often repeats a slice, jumps to another one, or plays one backward, placing each a little left or right.

1990年代、ドイツのグループOval（マルクス・ポップほか）は、CDの裏面にマーカーで描いてプレーヤーを飛ばしたりつっかえさせたりし、そこから出てくるクリック、ループ、断片から、『Systemisch』（1994年）などのアルバムの音楽を組み立てました。故障だったものが素材になったのです。この響きは、のちにグリッチと呼ばれるようになります。下のおもちゃは、飛ぶプレーヤーをまねます。録音を多くの短いスライスに切り分け、順に鳴らす代わりに、しばしば同じスライスを繰り返したり、別のスライスへ跳んだり、逆に鳴らしたりし、それぞれを少し左や右に置きます。

Choose a **Sound** and press **Play**, or press **Record** to record your own sound with the microphone (press it again to stop, or it stops after ten seconds). **Slices** is how many pieces the recording is cut into; **Repeat** is the chance that a slice plays again, **Jump** the chance that the next slice is anywhere at random, and **Reverse** the chance that a slice plays backward. **Speed** plays the slices faster or slower, and **Spread** places them across left and right. **Filter**, **Delay**, and **Reverb** shape the result. The plot shows the recording with the sounding slice marked in yellow (butter when it plays backward). Voices and chords sound especially strange cut this finely.

**Sound**を選んで**Play**を押すか、**Record**を押してマイクで自分の音を録音してみましょう（もう一度押すと止まり、10秒で自動的に止まります）。**Slices**は録音を切り分ける数、**Repeat**はスライスがもう一度鳴る確率、**Jump**は次のスライスがランダムなどこかになる確率、**Reverse**はスライスが逆に鳴る確率です。**Speed**はスライスを速く、あるいは遅く鳴らし、**Spread**は左右に散らします。**Filter**、**Delay**、**Reverb**で結果を形づくれます。図は録音で、鳴っているスライスは黄色（逆再生のときはバター色）で示されます。声や和音は、これほど細かく切ると特に奇妙に響きます。

<div class="demo-wrap"><iframe src="/writing/demos/sampler/index.html?mode=skip" title="Skipping sounds" allow="autoplay; microphone" loading="lazy" style="height: 560px"></iframe></div>
