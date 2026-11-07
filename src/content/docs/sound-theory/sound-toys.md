---
title: "Sound Toys 音のおもちゃ"
slug: sound-toys
---
A keyboard is only one way to play sound. Any gesture or picture can control it, as long as something maps the gesture onto the sound: position onto pitch, height onto brightness, a drawn line onto a melody. Inventors and artists have explored this for a century, from the theremin (Léon Theremin, around 1920), played by moving the hands in the air, to Iannis Xenakis's UPIC (1977), which turned drawings into sound, and Toshio Iwai's Tenori-on (2007), a grid of lights that plays patterns. This page has three such toys. One idea runs through them: snapping the sound to a pentatonic scale (see [Other Scales](/other-scales)) makes almost any gesture sound musical.

鍵盤は、音を演奏する方法のひとつにすぎません。身振りを音へと結びつける仕組み、つまり位置を音高に、高さを明るさに、描いた線を旋律に結びつけるものさえあれば、どんな身振りや絵でも音を操れます。発明家や芸術家は1世紀にわたってこれを探ってきました。空中で手を動かして演奏するテルミン（レオン・テルミン、1920年ごろ）から、絵を音に変えるヤニス・クセナキスのUPIC（1977年）、光の格子でパターンを鳴らす岩井俊雄のTENORI-ON（2007年）まで。このページには、そうしたおもちゃが3つあります。どれにも共通するのは、音をペンタトニック・スケールにそろえると（[その他の音階](/other-scales)を参照）、ほとんどどんな身振りも音楽的に聞こえる、という考え方です。

# Drag to Play
# ドラッグして弾く

Press and drag on the pad. Left to right is pitch, from C3 to C6; bottom to top is the cutoff of a low-pass filter, from dark to bright (see [Synthesizers and Effects](/synthesis)). The sound starts when you press and stops when you let go, and the trail shows your gesture. With **Pitch** set to **Pentatonic**, the pitch snaps to the C major pentatonic, marked by ticks along the bottom; with **Free**, it glides continuously like a theremin. **Wave** picks the oscillator, and the **Delay** and **Reverb** sections add space.

パッドを押してドラッグしてください。左から右が音高（C3からC6）、下から上がローパス・フィルターのカットオフ（暗いから明るいへ）です（[シンセサイザーとエフェクト](/synthesis)を参照）。押すと音が鳴り始め、離すと止まり、軌跡が身振りを示します。**Pitch**を**Pentatonic**にすると、音高は下端の目盛りで示したCのメジャー・ペンタトニックにそろい、**Free**にすると、テルミンのように連続して滑ります。**Wave**はオシレーターを選び、**Delay**と**Reverb**のセクションは空間を加えます。

<div class="demo-wrap"><iframe src="/writing/demos/xy-pad/index.html" title="XY pad" allow="autoplay" loading="lazy"></iframe></div>

# Draw a Melody
# 旋律を描く

Draw a line on the pad, then press **Play**: the line is played from left to right in a loop, its height becoming pitch, and gaps in the line become silence. A red dot follows the line as it plays. Drawing over part of the line replaces it, and **Clear** erases everything. **Pitch** snaps to the pentatonic or lets the line glide, and **Length** sets how many seconds one pass takes. A pad starts with a few rising and falling phrases to play.

パッドに線を描き、**Play**を押してください。線が左から右へ繰り返し再生され、高さが音高に、線の切れ目が無音になります。再生中は赤い点が線をたどります。線の一部の上に描くとその部分が置き換わり、**Clear**ですべて消えます。**Pitch**はペンタトニックにそろえるか滑らせるかを、**Length**は1回の再生にかかる秒数を決めます。最初から、上がって下がるいくつかのフレーズが描いてあります。

<div class="demo-wrap"><iframe src="/writing/demos/draw-melody/index.html" title="Draw a melody" allow="autoplay" loading="lazy"></iframe></div>

# A Grid of Notes
# 音の格子

Each row of the grid is a note of the C major pentatonic, two octaves from C4 to C6, and each column an eighth note; the grid loops over two bars. Press **Play**, then click a cell to turn a note on or off, and drag a note up or down to make it louder or softer. Because every row is from the pentatonic, any pattern works, and simple shapes, rising lines, chords, and repeated notes, are easy to see and hear. **Random** fills the grid with a random pattern, **Clear** empties it, and **Tempo** sets the speed.

格子の各行はCのメジャー・ペンタトニックの音で、C4からC6までの2オクターブ、各列は8分音符で、格子は2小節で繰り返します。**Play**を押し、セルをクリックして音をオン・オフし、音を上下にドラッグして大きく・小さくしてください。どの行もペンタトニックの音なので、どんなパターンでも合い、上がっていく線、和音、繰り返す音のような単純な形が、目でも耳でもわかりやすくなります。**Random**は格子をランダムなパターンで埋め、**Clear**は空にし、**Tempo**は速さを決めます。

<div class="demo-wrap"><iframe src="/writing/demos/note-matrix/index.html" title="A grid of notes" allow="autoplay" loading="lazy" style="height: 464px"></iframe></div>
