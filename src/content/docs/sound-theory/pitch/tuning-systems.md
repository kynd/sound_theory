---
title: "Tuning Systems 音律"
slug: tuning-systems
---
As discussed in [Sound and Timbre](/sound-and-timbre), pitch is only one aspect of sound; many sounds have no definite pitch. In much music, however, melodies and harmonies are built from a set of distinct pitches, or notes. A tuning system defines the frequency relationships among those notes, while a reference pitch assigns each one a specific frequency.

[音と音色](/sound-and-timbre)のページで見たように、音高は音の一要素にすぎず、明確な音高を持たない音も数多くあります。一方、多くの音楽では、旋律や和声は明確な音高を持つ個々の音（音符）をもとに組み立てられています。音律はそれらの音の周波数の関係を定め、基準音はそれぞれの音の周波数を具体的に定めます。

# Simple Ratios
# 単純な比

A taut string is one of the simplest instruments to make, and its pitch is easy to change. You can easily try this at home with a rubber band, too.

ピンと張った弦は、最も簡単に作れる楽器の1つで、音高も簡単に変えられます。輪ゴムを使えば、家でも手軽に試せます。

A string's fundamental frequency depends on its vibrating length, mass per unit length, and tension. A shorter or more tightly stretched string sounds higher; a heavier string with the same length and tension sounds lower. On instruments such as guitars and violins, players press a string against the fingerboard, shortening its vibrating length to produce different notes. Stopping the string at its midpoint halves its vibrating length. If the tension remains unchanged, its frequency doubles, raising the note by one octave.

弦の基音の周波数は、振動する部分の長さ、単位長さあたりの質量、張力によって決まります。弦は短いほど、また張力が強いほど高い音を出し、長さと張力が同じなら、質量の大きい弦ほど低い音になります。ギターやバイオリンなどでは、弦を指板に押さえて振動部分を短くし、音高を変えます。弦の中央を押さえると、振動部分の長さは半分になります。張力が変わらなければ周波数は2倍になり、音高は1オクターブ上がります。

A string fixed at both ends vibrates along its whole length, and also in halves, thirds, quarters, and so on (see [Sound Waves](/sound-waves)). Its sound therefore contains the frequencies $f$, $2f$, $3f$, $4f$, …, the harmonic series. The relative strengths of these harmonics, and how they change over time, play a major role in shaping the instrument's timbre. The same numbers appear when you change the length of the string: halving it doubles the frequency, and shortening it to two-thirds raises the frequency by a ratio of 3:2.

両端を固定した弦は、全体で振動すると同時に、2分の1、3分の1、4分の1……の長さでも振動します（[音の波](/sound-waves)を参照）。そのため弦の音には、$f$、$2f$、$3f$、$4f$……の周波数、つまり倍音列が含まれます。これらの倍音の強さのバランスと、その時間的な変化は、楽器の音色を形づくるうえで大きな役割を果たします。弦の長さを変えたときにも同じ数が現れます。長さを半分にすると周波数は2倍に、3分の2にすると周波数は3:2の比で高くなります。

Two notes whose frequencies form a simple ratio share many harmonics. At 3:2, every third harmonic of the lower note lands exactly on every second harmonic of the upper one. The combined wave repeats after a short time, and the two notes blend. When the ratio is slightly off, harmonics that should coincide are close but not equal, and they beat (the loudness wavers at the difference of their frequencies), which sounds rough.

周波数が単純な比をなす2つの音は、多くの倍音を共有します。3:2では、低い音の3番目ごとの倍音が、高い音の2番目ごとの倍音にぴったり重なります。合わさった波は短い時間で繰り返し、2つの音はよく溶け合います。比が少しずれると、重なるはずの倍音が近いのに一致せず、うなり（2つの周波数の差の速さで音量が揺れる現象）が生じて、ざらついて聞こえます。

Press **Play** to hear two sine waves, the lower fixed at 220 Hz and the upper at a ratio to it. Choose a whole-number **Ratio**, from 1:1 (the unison) to 2:1 (the octave), or move **Upper** to set the upper frequency as any multiple of the lower one between 1 and 2; the menu shows **Other** between the whole-number ratios. The plot shows eight cycles of the lower wave and the upper wave at the same ratio as yellow lines, and their sum as a red line. At a ratio $p$:$q$, the sum repeats every $q$ cycles of the lower wave: every two cycles at 3:2, every four at 5:4. Between them, it changes from cycle to cycle and never quite repeats. Sine waves have no harmonics, so mistuned ratios sound rough only where the two tones themselves come close; near 1:1, the two waves beat.

**Play**を押すと、2つのサイン波が鳴ります。低い音は220 Hzに固定され、高い音はそれに対する比で決まります。**Ratio**で1:1（同音）から2:1（オクターブ）までの整数比を選ぶか、**Upper**を動かして、高い音の周波数を低い音の1倍から2倍のあいだの好きな倍率にしてみましょう。整数比のあいだでは、メニューは**Other**になります。図は、低い波の8周期分と、同じ比の高い波を黄色の線で、その和を赤い線で示しています。比が$p$:$q$のとき、和は低い波の$q$周期ごとに繰り返します。3:2では2周期ごと、5:4では4周期ごとです。そのあいだの比では、和は周期ごとに形を変え、きちんと繰り返すことはありません。サイン波には倍音がないため、比がずれてざらついて聞こえるのは、2つの音そのものが近づくときだけです。1:1の近くでは、2つの波がうなります。

<div class="demo-wrap"><iframe src="/writing/demos/ratios/index.html" title="Frequency ratios" allow="autoplay" loading="lazy" style="height: 192px"></iframe></div>

The simplest ratios have names: 2:1 is the octave, 3:2 the perfect fifth, 4:3 the perfect fourth, 5:4 the major third, and 6:5 the minor third. In an octave, the upper note sounds so similar to the lower one that both are given the same note name.

最も単純な比には、それぞれ名前があります。2:1はオクターブ、3:2は完全5度、4:3は完全4度、5:4は長3度、6:5は短3度です。オクターブでは、上の音が下の音とよく似て聞こえるため、どちらにも同じ音名が与えられます。

A bar free at both ends, such as a xylophone or glockenspiel bar, does not vibrate in segments whose lengths are simple fractions of the bar's length. Its overtones are therefore not whole-number multiples of the fundamental: in a uniform bar, they occur at about 2.76, 5.40, and 8.93 times the fundamental frequency. Bells and gongs are similarly inharmonic. Makers carve material from the underside of marimba bars to tune the first overtone to four times the fundamental (two octaves); for xylophone bars, they tune it to three times the fundamental (an octave and a fifth). This brings the overtones closer to the harmonic series. Which ratios sound smooth depends on an instrument's overtones. This may help explain why music centered on metallophones, such as Indonesian gamelan, uses different tunings.

木琴や鉄琴の音板のように両端が自由な棒は、長さを単純な分数に分けた部分ごとには振動しません。そのため、その倍音は基音の整数倍にはならず、均一な棒では基音周波数の約2.76倍、5.40倍、8.93倍に現れます。鐘やゴングも同様に、倍音は基音の整数倍にはなりません。マリンバでは、音板の裏側を削って最初の倍音が基音の4倍（2オクターブ）になるように調整します。木琴では、最初の倍音が基音の3倍（1オクターブと5度）になるように調整します。こうして、主な上音の周波数を基音の整数倍に近づけます。どの比がなめらかに聞こえるかは、楽器の倍音によって異なります。そのため、インドネシアのガムランのように金属製の旋律打楽器を中心とする音楽では、異なる音律が使われるのかもしれません。

<aside>
  <span class="aside-icon">💡</span>
  <div class="aside-body">
    <p><strong>Overtones, harmonics, and the harmonic series</strong></p>
    <p>An <strong>overtone</strong> is any component above the fundamental frequency. A <strong>harmonic</strong> is a component at a whole-number multiple of the fundamental; the fundamental itself is the first harmonic. Overtones can be harmonic or inharmonic, so the first overtone is not necessarily the second harmonic. The <strong>harmonic series</strong> is the sequence of whole-number multiples: 1, 2, 3, 4, … times the fundamental.</p>
    <p><strong>上音・倍音・倍音列の違い</strong></p>
    <p><strong>上音</strong>は、基音より高い周波数の成分を指します。<strong>倍音</strong>は、厳密には基音の整数倍の周波数を持つ成分で、基音自体が第1倍音です。上音には、基音の整数倍になるものと、ならないものがあるため、最初の上音が必ず第2倍音になるわけではありません。<strong>倍音列</strong>は、基音の1倍、2倍、3倍、4倍……という周波数の並びです。日本語では「倍音」を上音全般の意味で使うこともありますが、この違いを説明するときは「上音」と「基音の整数倍」を使い分けると明確になります。</p>
  </div>
</aside>

# Pythagorean Tuning
# ピタゴラス音律

According to Greek tradition, [Pythagoras](https://en.wikipedia.org/wiki/Pythagoras) (6th century BCE) studied these ratios using a [monochord](https://en.wikipedia.org/wiki/Monochord)—a single string with a movable bridge. Pythagorean tuning derives every note from two simple ratios: repeatedly raise the pitch by a fifth (×3/2), then lower it by an octave (÷2) whenever it exceeds the octave. Starting from C, successive fifths produce G, D, A, E, B, F♯, and so on. Folded into a single octave, these notes fill out a scale.

ギリシャの伝承によれば、[ピタゴラス](https://ja.wikipedia.org/wiki/ピタゴラス)（紀元前6世紀）は、可動式の駒を備えた1本の弦、[モノコード](https://ja.wikipedia.org/wiki/モノコード)を使ってこれらの比を調べました。ピタゴラス音律では、2つの単純な比を使ってすべての音を導きます。5度上げる（×3/2）操作を繰り返し、音が1オクターブを超えたら1オクターブ下げます（÷2）。Cから始めると、5度上げるたびにG、D、A、E、B、F♯……が得られます。これらを1オクターブ内に収めると、音階ができます。

Stacking pure fifths does not form an exactly closed circle: twelve pure fifths span slightly more than seven octaves. The gap, a ratio of about 1.0136 (about a quarter of a semitone), is called the Pythagorean comma.

純正な5度を重ねても、環はぴったりとは閉じません。純正な5度を12回重ねた音程は、7オクターブよりわずかに広くなります。この差、約1.0136の比（半音の約4分の1）はピタゴラスコンマと呼ばれています。

$$
\left(\dfrac{3}{2}\right)^{12} \approx 129.75 \qquad 2^{7} = 128
$$

Raise **Fifths** one step at a time to stack fifths from C. Press **Play** to hear the starting C alongside the latest note. The ring represents one octave, starting at the top and moving clockwise; each note marks where its fifth falls when folded back into the octave. After twelve fifths, B♯ (red) lands just beyond C. That gap is the comma, and you can hear the two notes beat about three and a half times per second.

**Fifths**を1段ずつ上げて、Cから5度を重ねていきます。**Play**を押すと、最初のCと最新の音を同時に聞けます。リングは1オクターブを表し、上から時計回りに進みます。それぞれの音は、5度を1オクターブ内に折り返した位置にあります。5度を12回重ねると、B♯（赤）はCをわずかに越えた位置に着地します。この差がコンマです。2つの音が1秒に約3.5回うなるのが聞こえます。

<div class="demo-wrap"><iframe src="/writing/demos/stacking-fifths/index.html" title="Stacking fifths" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

Tunings that directly use simple ratios—such as 5:4 for thirds—are called [just intonation](https://en.wikipedia.org/wiki/Just_intonation). They sound pure in their home key, but go out of tune when the music moves to another key.

3度に5:4などの単純な比を直接用いる音律を[純正律](https://ja.wikipedia.org/wiki/純正律)と呼びます。基準となる調では純粋に響きますが、別の調に移ると音程が合わなくなります。

# Twelve-Tone Equal Temperament
# 十二平均律

Instruments with fixed pitches, such as pianos and fretted guitars, need a single set of notes that works in every key. Today, this is achieved by dividing the octave into 12 equal steps. The steps have equal frequency ratios, not equal frequency differences: each step multiplies the frequency by the same factor, and twelve steps double it exactly.

ピアノやフレットのあるギターのように音高が固定された楽器には、どの調でも使える1組の音が必要です。現在一般的な方法では、1オクターブを12の等しい段階に分けます。ここで等しいのは周波数の差ではなく比です。それぞれの段階で周波数に同じ倍率を掛けるため、12段階でちょうど2倍になります。

$$
2^{1/12} \approx 1.0595
$$

Intervals are often measured in cents, a unit built on this division: one equal-tempered semitone is 100 cents, so an octave is 1200 cents. Because cents measure ratios, any interval can be expressed in them, pure or tempered. A ratio $r$ spans $1200 \log_2 r$ cents, so a pure fifth (3:2) is about 701.96 cents and the Pythagorean comma about 23.5 cents. This makes it easy to compare pure intervals with equal-tempered ones.

音程は、この分割をもとにした単位であるセントで測ることがよくあります。平均律の半音1つが100セントで、1オクターブは1200セントです。セントは比を測るので、純正な音程でも平均律の音程でも、どんな音程もセントで表せます。比$r$は$1200 \log_2 r$セントにあたり、純正な5度（3:2）は約701.96セント、ピタゴラスコンマは約23.5セントです。これで、純正な音程と平均律の音程を比べやすくなります。

In equal temperament, the circle of fifths closes exactly. After twelve fifths, B♯ lands on C, so the two sound as one. The Pythagorean comma is spread evenly across all twelve fifths.

平均律では、5度を重ねた環がぴったり閉じます。5度を12回重ねると、B♯はCに重なり、2つの音はひとつに聞こえます。ピタゴラスコンマは、12の5度すべてに均等に分散されます。

<div class="demo-wrap"><iframe src="/writing/demos/stacking-fifths/index.html?tuning=equal" title="Stacking equal-tempered fifths" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

Dividing the octave into twelve steps is no arbitrary choice. It is the smallest equal division that comes close to a pure fifth: seven steps span 700 cents, just 2 cents less than the pure 3:2 ratio. The trade-off is that thirds and sixths fall 14 to 16 cents from their simple ratios, producing noticeable beats when sustained.

1オクターブを12段階に分けるのは、恣意的な選択ではありません。12等分は、純正な5度に近い音程を得られる最小の等分法です。7段階で700セントとなり、純正な3:2の比よりわずか2セント狭くなります。その代わり、3度と6度は単純な比から14〜16セントずれ、音を伸ばすとうなりがはっきり聞こえます。

| Interval 音程 | Ratio 比 | Pure (cents) 純正（セント） | Equal (cents) 平均律（セント） | Difference 差 |
|---|---|---|---|---|
| Octave オクターブ | 2:1 | 1200.00 | 1200 | 0 |
| Perfect fifth 完全5度 | 3:2 | 701.96 | 700 | −1.96 |
| Perfect fourth 完全4度 | 4:3 | 498.04 | 500 | +1.96 |
| Major third 長3度 | 5:4 | 386.31 | 400 | +13.69 |
| Minor third 短3度 | 6:5 | 315.64 | 300 | −15.64 |
| Major sixth 長6度 | 5:3 | 884.36 | 900 | +15.64 |
| Minor sixth 短6度 | 8:5 | 813.69 | 800 | −13.69 |

Choose an **Interval** and press **Play** to hear two tones, 220 Hz and the note above it, each with eight harmonics. Switch between **Pure** (the simple ratio) and **Equal** (the equal-tempered step). The plot shows half a second of the two harmonics that meet in the pure interval (for a major third, the 5th harmonic of the lower note and the 4th of the upper one, both near 1100 Hz) as yellow lines, and their sum as a red line. When the harmonics coincide, the sum keeps a steady size; when they don't, it swells and shrinks at the beat rate. The waves are drawn at a lower pitch than they sound, so each cycle is visible, but the swells keep their real rate: in equal temperament the major third beats almost nine times a second, while the fifth beats less than once. Equal temperament is a compromise: every key is equally usable, and every key is equally, slightly, out of tune.

**Interval**を選んで**Play**を押すと、220 Hzとその上の音、それぞれ8つの倍音を持つ2つの音が聞こえます。**Pure**（単純な比）と**Equal**（平均律の段階）を切り替えてみましょう。グラフは、純正な音程で重なる2つの倍音（長3度では、低い音の5番目と高い音の4番目の倍音で、どちらも約1100 Hz）を黄色の線で、その和を赤い線で、0.5秒分示しています。倍音が一致していれば和の大きさは一定で、一致しなければ、うなりの速さで膨らんだり縮んだりします。それぞれの周期が見えるよう、波は実際より低い音高で描いていますが、膨らみの速さは実際のままです。平均律では、長3度は1秒に約9回うなり、5度は1回未満しかうなりません。平均律は妥協の産物です。どの調も等しく使え、どの調もわずかに等しく狂っています。

<div class="demo-wrap"><iframe src="/writing/demos/intervals/index.html" title="Intervals" allow="autoplay" loading="lazy" style="height: 272px"></iframe></div>

# Other Systems
# ほかの音律

Pitch is continuous, so there is no requirement for twelve notes, equal steps, or even an octave. Many musical cultures and composers divide pitch in other ways. The few below are only starting points, each touched on briefly. Every one of them is a world of its own, so look them up, find recordings, and listen for yourself.

音高は連続しているため、12音に分けることも、等間隔にすることも、オクターブを基準にすることも必須ではありません。多くの音楽文化や作曲家が、異なる方法で音高を分けています。以下はほんの入り口として、それぞれを簡単に紹介したものにすぎません。どれもそれだけでひとつの世界なので、ぜひ自分で調べ、録音を探して、耳で確かめてみましょう。

[Arabic maqam](https://en.wikipedia.org/wiki/Arabic_maqam) uses intervals between a semitone and a whole tone, such as the [neutral second](https://en.wikipedia.org/wiki/Neutral_interval), about three-quarters of a tone, whose exact size varies by maqam and region. In Indian classical music, theory describes 22 [śruti](https://en.wikipedia.org/wiki/Shruti_%28music%29), small divisions of the octave from which each [rāga](https://en.wikipedia.org/wiki/Raga) draws its notes, and performers tune against a drone, which draws the intervals toward pure ratios.

アラブ音楽の[マカーム](https://ja.wikipedia.org/wiki/マカーム)は、約4分の3音にあたる[中立2度](https://en.wikipedia.org/wiki/Neutral_interval)など、半音と全音のあいだの音程を使い、その正確な大きさはマカームや地域によって異なります。インド古典音楽の理論では、1オクターブを分ける小さな音程として22の[シュルティ](https://en.wikipedia.org/wiki/Shruti_%28music%29)が挙げられ、それぞれの[ラーガ](https://ja.wikipedia.org/wiki/ラーガ)はそこから音を選びます。ミュージシャンはドローンを基準に音を合わせるため、音程は純正な比に近づきます。

In Indonesian [gamelan](https://en.wikipedia.org/wiki/Gamelan), [slendro](https://en.wikipedia.org/wiki/Slendro) has five roughly equal steps per octave, while [pelog](https://en.wikipedia.org/wiki/Pelog) has seven unequal steps. Each gamelan set is tuned as a whole, so no two sets sound exactly alike.

インドネシアの[ガムラン](https://ja.wikipedia.org/wiki/ガムラン)では、[スレンドロ](https://ja.wikipedia.org/wiki/スレンドロ)が1オクターブをほぼ等しい5段階に、[ペロッグ](https://ja.wikipedia.org/wiki/ペロッグ)が不均等な7段階に分けます。ガムランは1組ごとに調律されるため、どの2組もまったく同じ響きにはなりません。

Equal divisions other than twelve are possible too. Dividing the octave into [19](https://en.wikipedia.org/wiki/19_equal_temperament) or [31](https://en.wikipedia.org/wiki/31_equal_temperament) equal steps gives purer thirds than dividing it into 12; the major third in 31-tone equal temperament is within 1 cent of 5:4. The [Bohlen–Pierce scale](https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale) goes further: it divides the ratio 3:1, rather than the octave, into 13 steps, and has no octave at all.

12以外の等分も可能です。1オクターブを[19](https://en.wikipedia.org/wiki/19_equal_temperament)または[31](https://en.wikipedia.org/wiki/31_equal_temperament)段階に等分すると、12等分より純正な3度が得られ、31等分の平均律における長3度は、5:4との差が1セント以内です。[ボーレン＝ピアス音階](https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale)はさらに進んで、オクターブではなく3:1の比を13段階に分け、オクターブをまったく持ちません。
