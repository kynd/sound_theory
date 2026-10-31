---
title: "Tuning Systems 音律"
slug: tuning-systems
---
Sound can have any frequency, but music uses only a small set of them: the notes. A tuning system is the rule that picks those frequencies. This page starts from the most basic rule, multiplying a starting frequency by simple ratios, follows how it leads to the twelve equal steps of the modern piano, and ends with other ways of dividing pitch.

音はどんな周波数も取りえますが、音楽が使うのはそのうちのごく一部、つまり音符の音だけです。どの周波数を使うかを決める規則が音律です。このページでは、最も基本的な規則である、基準の周波数に単純な比を掛ける方法から始め、それが現代のピアノの12の等しい段階にどうつながるかをたどり、最後に音高のほかの分け方に触れます。

# Simple Ratios
# 単純な比

A string fixed at both ends vibrates along its whole length, and also in halves, thirds, quarters, and so on (see [Sound Waves](/sound-waves)). Its sound therefore contains the frequencies $f$, $2f$, $3f$, $4f$, …, the harmonic series. The same numbers appear when you change the length of the string: halving it doubles the frequency, and shortening it to two-thirds raises the frequency by a ratio of 3:2.

両端を固定した弦は、全体で振動すると同時に、2分の1、3分の1、4分の1……の長さでも振動します（[音の波](/sound-waves)を参照）。そのため弦の音には、$f$、$2f$、$3f$、$4f$……の周波数、つまり倍音列が含まれます。弦の長さを変えたときにも同じ数が現れます。長さを半分にすると周波数は2倍に、3分の2にすると周波数は3:2の比で高くなります。

Two notes whose frequencies form a simple ratio share many harmonics. At 3:2, every third harmonic of the lower note lands exactly on every second harmonic of the upper one. The combined wave repeats after a short time, and the two notes blend. When the ratio is slightly off, harmonics that should coincide are close but not equal, and they beat (the loudness wavers at the difference of their frequencies), which sounds rough.

周波数が単純な比をなす2つの音は、多くの倍音を共有します。3:2では、低い音の3番目ごとの倍音が、高い音の2番目ごとの倍音にぴったり重なります。合わさった波は短い時間で繰り返し、2つの音はよく溶け合います。比が少しずれると、重なるはずの倍音が近いのに一致せず、うなり（2つの周波数の差の速さで音量が揺れる現象）が生じて、ざらついて聞こえます。

The simplest ratios have names. An interval is measured in cents: an octave is 1200 cents, and a ratio $r$ spans $1200 \log_2 r$ cents.

-   **2:1:** the octave. The upper note sounds so much like the lower one that both get the same note name.

-   **3:2:** the perfect fifth.

-   **4:3:** the perfect fourth.

-   **5:4:** the major third.

-   **6:5:** the minor third.

最も単純な比には名前があります。音程はセントで測ります。1オクターブは1200セントで、比$r$は$1200 \log_2 r$セントにあたります。

-   **2:1：** オクターブ。上の音が下の音とよく似て聞こえるため、どちらにも同じ音名をつけます。

-   **3:2：** 完全5度。

-   **4:3：** 完全4度。

-   **5:4：** 長3度。

-   **6:5：** 短3度。

Metal bars behave differently. A bar that is free at both ends (a xylophone or glockenspiel bar) does not vibrate in simple fractions of its length, so its overtones are not whole-number multiples: in a uniform bar they fall near 2.76, 5.40, and 8.93 times the fundamental. Bells and gongs are inharmonic in the same way. Makers carve away the underside of a marimba bar so that its first overtone lands at 4 times the fundamental (two octaves), and a xylophone bar at 3 times (an octave and a fifth), pulling the sound back toward the harmonic series. Which ratios sound smooth depends on the overtones of the instrument, which is one explanation offered for why music built on metallophones, such as Indonesian gamelan, uses different tunings.

金属の棒は、ふるまいが異なります。両端が自由な棒（木琴や鉄琴の音板）は、長さの単純な分数では振動しないため、倍音が整数倍になりません。均一な棒では、基音の約2.76倍、5.40倍、8.93倍に現れます。鐘やゴングも同じように非整数倍の倍音を持ちます。マリンバの音板は裏側を削って最初の倍音を基音の4倍（2オクターブ）に、木琴の音板は3倍（1オクターブと5度）に合わせ、音を倍音列に近づけています。どの比がなめらかに聞こえるかは楽器の倍音によって変わります。これは、インドネシアのガムランのように金属打楽器を中心とする音楽が異なる音律を使う理由のひとつとして挙げられています。

# Pythagorean Tuning
# ピタゴラス音律

According to Greek tradition, Pythagoras (6th century BCE) studied these ratios on a monochord, a single string with a movable bridge. Pythagorean tuning builds every note from the two simplest ratios: go up a fifth (×3/2) again and again, and come down an octave (÷2) whenever a note goes past the octave. Starting from C, the fifths give G, D, A, E, B, F♯, and so on, and folded into one octave they fill in a scale.

ギリシャの伝承によれば、ピタゴラス（紀元前6世紀）は、可動式の駒を持つ1本の弦、モノコードでこれらの比を調べました。ピタゴラス音律は、最も単純な2つの比からすべての音をつくります。5度上げる（×3/2）ことを繰り返し、音が1オクターブを超えたら1オクターブ下げます（÷2）。Cから始めると、5度ごとにG、D、A、E、B、F♯……が得られ、1オクターブの中に折りたたむと音階が埋まっていきます。

The method has a flaw. Twelve fifths should land back on C, seven octaves up, but they overshoot:

$$
\left(\dfrac{3}{2}\right)^{12} \approx 129.75 \qquad 2^{7} = 128
$$

この方法には欠点があります。5度を12回重ねると、7オクターブ上のCに戻るはずですが、行き過ぎてしまいます。

The gap, a ratio of about 1.0136 (23.5 cents, about a quarter of a semitone), is the Pythagorean comma. A circle of pure fifths never closes, so one fifth in a Pythagorean scale is left noticeably out of tune (the wolf fifth). The thirds are also rough: four fifths make a major third of 81:64 instead of the simpler 5:4, about 22 cents wide.

この差、約1.0136の比（23.5セント、半音の約4分の1）がピタゴラスコンマです。純正な5度の環は閉じないため、ピタゴラス音律の音階では、5度のひとつが目立って狂ったまま残ります（ウルフの5度）。3度もざらつきます。5度を4回重ねた長3度は、より単純な5:4ではなく81:64になり、約22セント広くなります。

Raise **Fifths** one step at a time to stack fifths up from C, and press **Play** to hear the starting C together with the latest note. The ring is one octave, starting at the top and running clockwise, and each note sits where its fifth folds back into the octave. At twelve fifths, B♯ (red) lands just past C. That gap is the comma, and you can hear the two notes beat about three and a half times a second.

**Fifths**を1段ずつ上げてCから5度を重ね、**Play**を押すと、最初のCと最新の音を同時に聞けます。リングは1オクターブで、上から時計回りに進み、各音は5度を1オクターブに折りたたんだ位置に置かれます。5度を12回重ねると、B♯（赤）はCのわずかに先に着地します。この隙間がコンマで、2つの音が1秒に約3.5回うなるのが聞こえます。

<div class="demo-wrap"><iframe src="/writing/demos/stacking-fifths/index.html" title="Stacking fifths" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

Tunings that use 5:4 for thirds, and other ratios of small numbers, directly are called just intonation. They sound pure in the key they are built on but go out of tune when the music moves to another key.

3度に5:4を使うなど、小さな数の比を直接使う音律を純正律と呼びます。基準にした調では純粋に響きますが、音楽がほかの調に移ると音が狂います。

# Twelve-Tone Equal Temperament
# 十二平均律

Instruments with fixed pitches, such as the piano and the fretted guitar, need one set of notes that works in every key. The solution used today divides the octave into 12 equal steps. Equal means equal ratios, not equal differences in frequency: each step multiplies the frequency by the same number,

$$
2^{1/12} \approx 1.0595
$$

so that twelve steps multiply it by exactly 2.

ピアノやフレットのあるギターのように音高が固定された楽器には、どの調でも使える1組の音が必要です。現在使われている解決法は、1オクターブを12の等しい段階に分けることです。等しいとは、周波数の差ではなく比が等しいという意味です。各段階で周波数に同じ数を掛け、12段階でちょうど2倍になるようにします。

Stacking fifths now works out exactly. In equal temperament a fifth is seven steps (700 cents), 2 cents narrower than 3:2. Raise **Fifths** as before: the notes land on twelve evenly spaced positions, and after twelve fifths B♯ falls exactly on C, so the circle closes and the two notes sound as one. The Pythagorean comma has been spread evenly over all twelve fifths.

これで、5度を重ねるとぴったり閉じるようになります。平均律の5度は7段階（700セント）で、3:2より2セント狭くなります。先ほどと同じように**Fifths**を上げてみてください。音は等間隔の12の位置に並び、5度を12回重ねると、B♯はちょうどCに重なります。環が閉じ、2つの音はひとつに聞こえます。ピタゴラスコンマが、12の5度すべてに均等に分けられたのです。

<div class="demo-wrap"><iframe src="/writing/demos/stacking-fifths/index.html?tuning=equal" title="Stacking equal-tempered fifths" allow="autoplay" loading="lazy" style="height: 384px"></iframe></div>

From A4 at 440 Hz, the next note, A♯4, is 466.16 Hz, 26.16 Hz higher. An octave up, A5 at 880 Hz is followed by A♯5 at 932.33 Hz, 52.33 Hz higher. The difference in hertz doubles every octave, while the ratio stays the same, and the ratio is what we hear: the same interval sounds the same anywhere on the keyboard.

440 HzのA4の次の音、A♯4は466.16 Hzで、26.16 Hz高くなります。1オクターブ上では、880 HzのA5の次のA♯5は932.33 Hzで、52.33 Hz高くなります。ヘルツでの差はオクターブごとに2倍になりますが、比は変わりません。そして耳が聞いているのは比です。同じ音程は、鍵盤のどこで弾いても同じに聞こえます。

Twelve is not arbitrary. It is the smallest number of equal steps that comes very close to a pure fifth: seven steps make 700 cents, only 2 cents below 3:2. The cost is in the thirds and sixths, which land 14 to 16 cents away from their simple ratios and beat noticeably when held.

12という数は恣意的ではありません。純正な5度にごく近づく、最も少ない等分の数です。7段階で700セントとなり、3:2よりわずか2セント低いだけです。その代わりに3度と6度は単純な比から14〜16セントずれ、伸ばすとはっきりうなります。

| Interval 音程 | Ratio 比 | Pure (cents) 純正（セント） | Equal (cents) 平均律（セント） | Difference 差 |
|---|---|---|---|---|
| Octave オクターブ | 2:1 | 1200.00 | 1200 | 0 |
| Perfect fifth 完全5度 | 3:2 | 701.96 | 700 | −1.96 |
| Perfect fourth 完全4度 | 4:3 | 498.04 | 500 | +1.96 |
| Major third 長3度 | 5:4 | 386.31 | 400 | +13.69 |
| Minor third 短3度 | 6:5 | 315.64 | 300 | −15.64 |
| Major sixth 長6度 | 5:3 | 884.36 | 900 | +15.64 |
| Minor sixth 短6度 | 8:5 | 813.69 | 800 | −13.69 |

Choose an **Interval** and press **Play** to hear two tones, 220 Hz and the note above it, each with eight harmonics. Switch between **Pure** (the simple ratio) and **Equal** (the equal-tempered step). The plot shows half a second of the two harmonics that meet in the pure interval (for a major third, the 5th harmonic of the lower note and the 4th of the upper one, both near 1100 Hz) as yellow lines, and their sum as a red line. When the harmonics coincide, the sum keeps a steady size; when they don't, it swells and shrinks at the beat rate. The waves are drawn at a lower pitch than they sound, so each cycle is visible, but the swells keep their real rate: in equal temperament the major third beats almost nine times a second, while the fifth beats less than once.

**Interval**を選んで**Play**を押すと、220 Hzとその上の音、それぞれ8つの倍音を持つ2つの音が聞こえます。**Pure**（単純な比）と**Equal**（平均律の段階）を切り替えてみてください。グラフは、純正な音程で重なる2つの倍音（長3度では、低い音の5番目と高い音の4番目の倍音で、どちらも約1100 Hz）を黄色の線で、その和を赤い線で、0.5秒分示しています。倍音が一致していれば和の大きさは一定で、一致しなければ、うなりの速さで膨らんだり縮んだりします。各周期が見えるよう、波は実際より低い音高で描いていますが、膨らみの速さは実際のままです。平均律では、長3度は1秒に約9回うなり、5度は1回未満しかうなりません。

<div class="demo-wrap"><iframe src="/writing/demos/intervals/index.html" title="Intervals" allow="autoplay" loading="lazy" style="height: 256px"></iframe></div>

Equal temperament is a compromise: every key is equally usable, and every key is equally, slightly, out of tune. Before it became standard in the 19th century, European keyboards used meantone and well temperaments, which kept some keys purer than others.

平均律は妥協の産物です。どの調も等しく使え、どの調もわずかに等しく狂っています。19世紀に平均律が標準になる前、ヨーロッパの鍵盤楽器は中全音律やウェル・テンペラメントを使い、一部の調をほかより純粋に保っていました。

# Other Systems
# ほかの音律

Pitch is continuous, so nothing requires twelve notes, equal steps, or even the octave. Many musical cultures, and many composers, divide it in other ways.

-   **Arabic maqam:** uses intervals between a semitone and a whole tone (such as the neutral second, about three quarters of a tone), whose exact size varies by maqam and by region.

-   **Indian classical music:** theory names 22 śruti, small divisions of the octave from which each rāga draws its notes. Performers tune against a drone, which pulls the intervals toward pure ratios.

-   **Indonesian gamelan:** slendro has five roughly equal steps per octave, and pelog seven unequal ones. Each gamelan set is tuned as a whole, so no two sound exactly alike.

-   **Other equal divisions:** 19 or 31 equal steps per octave give purer thirds than 12. The major third of 31 steps is within 1 cent of 5:4.

-   **Bohlen–Pierce scale:** divides the ratio 3:1, instead of the octave, into 13 steps, and has no octave at all.

音高は連続しているため、12の音も、等しい段階も、オクターブさえも必須ではありません。多くの音楽文化や作曲家が、ほかの方法で音高を分けています。

-   **アラブ音楽のマカーム：** 半音と全音のあいだの音程（約4分の3音の中立2度など）を使い、その正確な大きさはマカームや地域によって異なります。

-   **インド古典音楽：** 理論では1オクターブを22のシュルティに細かく分け、各ラーガはそこから音を選びます。演奏者はドローンに合わせて調律するため、音程は純正な比に引き寄せられます。

-   **インドネシアのガムラン：** スレンドロは1オクターブをほぼ等しい5段階に、ペロッグは不均等な7段階に分けます。ガムランは1組ごとにまとめて調律されるため、まったく同じ響きの組はありません。

-   **ほかの等分：** 1オクターブを19や31に等分すると、12等分より純粋な3度が得られます。31等分の長3度は、5:4との差が1セント以内です。

-   **ボーレン＝ピアス音階：** オクターブではなく3:1の比を13段階に分け、オクターブをまったく持ちません。
