---
title: "Building Waveforms 波形を組み立てる"
slug: building-waveforms
---
On [Sound Waves](/sound-waves), adding harmonics to a sine wave changed its shape and its timbre. With the right amplitudes, the sum can take almost any shape, including ones with sharp corners and sudden jumps that look nothing like a sine wave. This page builds three classic waveforms from sine waves, the square, the sawtooth, and the triangle. They are the basic oscillator shapes of synthesizers (see [Synthesizers and Effects](/synthesis)), and each is a simple rule for which harmonics to use and how strong to make them.

[音の波](/sound-waves)では、サイン波に倍音を加えると、その形と音色が変わりました。振幅をうまく選べば、和はほとんどどんな形にもなります。鋭い角や急な段差を持つ、サイン波とは似ても似つかない形も含めてです。このページでは、3つの代表的な波形、矩形波、のこぎり波、三角波をサイン波から組み立てます。これらはシンセサイザーの基本的なオシレーターの形で（[シンセサイザーとエフェクト](/synthesis)を参照）、それぞれが、どの倍音をどれくらいの強さで使うかという単純な規則になっています。

# Fourier Series
# フーリエ級数

A wave that repeats with frequency $f$ can be written as a sum of sine waves at its harmonics $f$, $2f$, $3f$, and so on:

周波数$f$で繰り返す波は、その倍音$f$、$2f$、$3f$……のサイン波の和として書くことができます。

$$
x(t) = \sum_{k=1}^{\infty} b_k \sin(2\pi k f t)
$$

Here $k$ is the harmonic number and $b_k$ is the amplitude of the $k$th harmonic. This is a Fourier series, after Joseph Fourier, who used such sums in his study of heat in the early 1800s. In general each harmonic also has its own phase (or, equivalently, a cosine term as well as a sine), but the three waves on this page need only sines that all start together, as in the demo on [Sound Waves](/sound-waves). A negative $b_k$ simply turns that sine upside down.

ここで$k$は倍音の番号、$b_k$は$k$番目の倍音の振幅です。これをフーリエ級数といい、1800年代初めに熱の研究でこのような和を使ったジョゼフ・フーリエにちなんでいます。一般には、それぞれの倍音に固有の位相もあります（同じことですが、サインの項に加えてコサインの項もあります）。しかし、このページの3つの波には、[音の波](/sound-waves)のデモと同じく、そろって始まるサイン波だけで足ります。$b_k$が負なら、そのサイン波は上下が逆になるだけです。

Real sums cannot go on forever, so the demos stop after a number of harmonics. In each demo, press **Play** and raise **Harmonics** from 1 to add the harmonics one at a time; **Shape** switches between the three waves. The fundamental is fixed at 220 Hz. The yellow lines are the individual sine waves and the red line their sum, over two periods. The yellow bars below show the amplitude of each harmonic, the fundamental on the left; a bar's height is the size of $b_k$, whatever its sign.

実際の和は無限には続けられないので、デモはある数の倍音で止めます。どのデモでも、**Play**を押して**Harmonics**を1から上げると、倍音がひとつずつ加わります。**Shape**で3つの波を切り替えられます。基音は220 Hzに固定しています。黄色の線は個々のサイン波、赤い線はその和で、2周期分を示しています。下の黄色い棒はそれぞれの倍音の振幅で、左端が基音です。棒の高さは、符号にかかわらず$b_k$の大きさを示します。

# Square Wave
# 矩形波

A square wave jumps between two levels, spending half of each period at the top and half at the bottom. Its series has only the odd harmonics, each with amplitude $1/k$:

矩形波は2つの値のあいだを跳び移り、それぞれの周期の半分を上に、半分を下にとどまります。その級数には奇数次の倍音だけがあり、それぞれの振幅は$1/k$です。

$$
x(t) = \dfrac{4}{\pi} \left( \sin(2\pi f t) + \dfrac{1}{3}\sin(2\pi \cdot 3 f t) + \dfrac{1}{5}\sin(2\pi \cdot 5 f t) + \cdots \right)
$$

With the fundamental alone, the wave is a sine. Adding the third harmonic flattens its top and steepens its sides; each further odd harmonic squares it off a little more. The sound is hollow and reedy, like the clarinet's low register, whose odd harmonics are also much stronger than its even ones.

基音だけなら、波はサイン波です。3倍音を加えると、山の上が平らになり、両側が急になります。奇数次の倍音を加えるたびに、少しずつ四角くなっていきます。音はうつろで、リードのような響きです。奇数次の倍音が偶数次よりずっと強い、クラリネットの低音域に似ています。

<div class="demo-wrap"><iframe src="/writing/demos/fourier-series/index.html?shape=square" title="Square wave from sine waves" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

Look closely at the corners. However many harmonics are added, the sum overshoots just before and after each jump, by about 9% of the jump. Adding harmonics squeezes the ripple closer to the jump but never makes it smaller. This is the Gibbs phenomenon, and it is why a sudden jump needs infinitely many harmonics to be drawn exactly.

角をよく見てみましょう。倍音をいくつ加えても、和は段差の直前と直後で、段差の約9%だけ行き過ぎます。倍音を加えると、この波打ちは段差の近くへ押し縮められますが、小さくはなりません。これをギブズ現象といいます。急な段差を正確に描くには、無限に多くの倍音が必要なのです。

# Sawtooth Wave
# のこぎり波

A sawtooth wave ramps steadily in one direction and then jumps back. It uses every harmonic, again with amplitude $1/k$:

のこぎり波は一方向へ一定の速さで進み、そこから跳び戻ります。すべての倍音を使い、振幅はやはり$1/k$です。

$$
x(t) = \dfrac{2}{\pi} \left( \sin(2\pi f t) + \dfrac{1}{2}\sin(2\pi \cdot 2 f t) + \dfrac{1}{3}\sin(2\pi \cdot 3 f t) + \cdots \right)
$$

This sum falls steadily and jumps back up; changing the sign of every term turns it upside down into a rising ramp, which sounds the same. With every harmonic present and strong, the sawtooth is the brightest and buzziest of the three, close to bowed strings and brass, and it is the usual starting point for subtractive synthesis, where a filter takes harmonics away.

この和は一定の速さで下がり、跳び上がって戻ります。すべての項の符号を変えると上下が逆になり、上がっていく傾斜になりますが、聞こえ方は同じです。すべての倍音が強く含まれるので、のこぎり波は3つのうちで最も明るく、ざらついた音で、弓で弾く弦楽器や金管楽器に近い響きです。フィルターで倍音を取り除いていく減算合成の、ふつうの出発点でもあります。

<div class="demo-wrap"><iframe src="/writing/demos/fourier-series/index.html?shape=sawtooth" title="Sawtooth wave from sine waves" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

# Triangle Wave
# 三角波

A triangle wave rises and falls in straight lines. Like the square wave it has only odd harmonics, but their amplitudes fall much faster, as $1/k^2$, and every other one is upside down:

三角波は直線で上がり、下がります。矩形波と同じく奇数次の倍音だけを持ちますが、その振幅は$1/k^2$とずっと速く小さくなり、ひとつおきに上下が逆になります。

$$
x(t) = \dfrac{8}{\pi^2} \left( \sin(2\pi f t) - \dfrac{1}{9}\sin(2\pi \cdot 3 f t) + \dfrac{1}{25}\sin(2\pi \cdot 5 f t) - \cdots \right)
$$

Three or four terms already look like a triangle, and beyond the first few the bars are barely visible. The sound is soft and round, much like a sine wave with a little more edge, close to a flute.

3つか4つの項で、もう三角形に見えます。最初のいくつかより先の棒は、ほとんど見えません。音は柔らかく丸く、サイン波に少し輪郭を加えたような、フルートに近い響きです。

<div class="demo-wrap"><iframe src="/writing/demos/fourier-series/index.html?shape=triangle" title="Triangle wave from sine waves" allow="autoplay" loading="lazy" style="height: 352px"></iframe></div>

The three waves show a general rule. A wave with a jump (the square and the sawtooth) has harmonics that shrink only as $1/k$; a wave with corners but no jumps (the triangle) has harmonics that shrink as $1/k^2$; a smooth wave needs even fewer. The sharper the shape, the more strong high harmonics it has, and the brighter it sounds.

3つの波から、一般的な規則が見えてきます。段差のある波（矩形波とのこぎり波）の倍音は$1/k$でしか小さくなりません。角はあっても段差のない波（三角波）の倍音は$1/k^2$で小さくなります。なめらかな波なら、さらに少ない倍音で足ります。形が鋭いほど、強い高次の倍音を多く含み、明るく聞こえるのです。

# The Other Way: Fourier Analysis
# 逆向き：フーリエ解析

The process also runs backward. Given a repeating wave, each amplitude $b_k$ can be found by multiplying the wave by the sine of the $k$th harmonic and taking twice the average over one period $T$:

この過程は逆にもたどれます。繰り返す波が与えられれば、それぞれの振幅$b_k$は、波に$k$番目の倍音のサインを掛けて、1周期$T$にわたる平均を2倍することで求められます。

$$
b_k = \dfrac{2}{T} \int_0^T x(t) \sin(2\pi k f t)\, dt
$$

The product is mostly positive where the wave moves with that sine and mostly negative where it moves against it, so the average measures how much of that harmonic the wave contains; the sines of other harmonics average out to zero. Doing this for the square wave gives back exactly the $1/k$ amplitudes of its odd harmonics: the yellow bars in the demo are both the recipe for building the wave and the result of taking it apart.

波がそのサイン波と同じ向きに動くところでは積はおもに正に、逆向きに動くところではおもに負になります。そのため平均は、波がその倍音をどれだけ含むかを測ることになります。ほかの倍音のサインは、平均すると0になります。矩形波でこれを行うと、奇数次の倍音の振幅$1/k$がそのまま得られます。デモの黄色い棒は、波を組み立てるためのレシピであると同時に、波を分解した結果でもあるのです。

Sounds that do not repeat, such as noise or a drum hit, are handled by the Fourier transform, which extends the same idea from a row of harmonics to a continuous range of frequencies. Computers calculate it with the FFT (fast Fourier transform), which is what draws the spectrum in the waveform and spectrum demo on [Sound Waves](/sound-waves).

ノイズや太鼓の一打のように繰り返さない音は、フーリエ変換で扱います。これは同じ考え方を、倍音の列から連続した周波数の範囲へ広げたものです。コンピューターはFFT（高速フーリエ変換）でこれを計算します。[音の波](/sound-waves)の波形とスペクトルのデモで、スペクトルを描いているのもFFTです。
