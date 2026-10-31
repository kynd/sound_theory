# sound theory

Notes on sound and music theory, with playable demos. It will be merged into the
writing site (kynd.info/writing, repo `kynd/writing`), so the site setup is a copy of
that repo: Astro 4, the `docs` content collection, `DocLayout.astro`, `Sidebar.astro`,
`Breadcrumbs.astro`, KaTeX, the semantic search index, and the gh-pages deploy.
`documentation.md` (copied from writing) is the authority for the site's conventions;
read it before writing a page.

## Merging into writing

Keep everything mergeable by copying, with no rewriting:

- The base path is `/writing`, the same as the real site. The dev server is at
  `http://localhost:4321/writing/`.
- All series content lives in `src/content/docs/sound-theory/`. The root
  `src/content/docs/index.md` only links to it and is not merged.
- Slugs must be unique across the whole writing collection. Writing already has
  `wave`, `about-wave`, `sine-waves-and-additive-synthesis`, and `sound-visualization`;
  check before adding a slug.
- `DocLayout.astro` is writing's file with four additions, all to be carried over:
  `'sound-theory'` in `SECTION_ORDER`, the `SOUND_THEORY_ORDER` map and its sort, the
  `.demo-wrap` and `.demo-record` styles, and the `<script>` at the end of `<body>`
  that loads `public/lib/page/demoRecorder.js`. Add every new page to
  `SOUND_THEORY_ORDER`.
- Demos, the audio library, and their styles live under `public/demos/`,
  `public/lib/`, and `public/styles/`, which writing does not use.

## Writing pages

Follow `documentation.md`. In short:

- Frontmatter: `title: "English Title 日本語タイトル"` and `slug: short-slug`.
- English paragraph, then its Japanese paragraph. Headings: the English heading, then
  the Japanese heading at the same level (`# Sine Wave` / `# サイン波`).
- Lists: all English items, then the Japanese intro and all Japanese items. Do not
  interleave.
- Block math goes between `$$` lines of their own. `$$…$$` on one line renders inline,
  despite what `documentation.md` shows. Use `\dfrac`, not `\frac`.
- Internal markdown links use the short slug (`[Sound Waves](/sound-waves)`). Raw HTML
  `href`/`src` need the full prefix (`/writing/...`).
- Embed a demo with:

  ```html
  <div class="demo-wrap"><iframe src="/writing/demos/<name>/index.html" title="…" allow="autoplay" loading="lazy"></iframe></div>
  ```

  No "Open full size" link (or any other link to the demo) goes with it. Demos are not
  given `?embedded`: they fill the iframe. A small "record ●" button appears under every
  embedded demo by itself (`demoRecorder.js`); do not add one by hand. The frame is 620px tall by default; a demo
  whose controls need less sets its height inline to just fit them (a multiple of
  16px: the panel's 32px padding top and bottom plus its rows), e.g.
  `style="height: 176px"` for a Play button and two sliders.
- The body text carries every explanation a demo needs: what to do (press Play, choose
  a Preset, the A to ; keys), what the controls mean, and what the plot shows. The demo
  itself adds no titles or explanations (see the demo style rules).
- After adding or changing pages, run `npm run build:index` to refresh
  `public/search-index.json`.

## Library rules

- Demos never own logic. A demo page (`public/demos/<name>/index.html` + `main.js`)
  composes library classes and wires controls. Logic another demo could want belongs in
  the library. The library never imports from a demo.
- `public/lib/audio/` makes and shapes sound: `AudioEngine.js`, `instruments.js`,
  `effects.js`, `additive.js` (with `Chord`), `tuning.js`, `scales.js`, `sequence.js`, `rhythm.js`,
  `chords.js`, `granular.js`.
  No DOM.
- `public/lib/demo/` is shared demo support: `viewport.js`, `panel.js`, `controls.js`,
  `colors.js`, `Keyboard.js`, `Scope.js`, `PartialsView.js`, `BeatView.js`,
  `FifthsRing.js`, `ScaleView.js`, `CycleView.js`, `StepGrid.js`, `ProgressionView.js`.
- Every structural change updates `docs/audio-library.md` in the same change. When a
  group of classes shares behavior, write it once as a "common" section.
- Demo chrome comes from the `dp-*` classes in `public/styles/demo-ui.css`. A new
  control becomes a `dp-*` component there. Layout is fixed: stage on the left, a
  `.dp-panel` on the right.

## Demo style rules

These come from the user's direct instructions. Apply them to every demo, in CSS and on
canvas alike.

- **One text style:** one font (Google Sans Code, monospace, `--font`), one size
  (13px, `--font-size`), one weight (400, `--font-weight`). No sans serif, no muted
  grays, no bold titles, no larger headings. Hierarchy comes from order and space.
- **Black or white text:** text is black (`--demo-fg` / `COLORS.ink`), except on red,
  green, and other dark fills (dark green, black), where it is white
  (`--demo-white` / `COLORS.white`). Pink, yellow, butter, white, and the paper take
  black text.
- **No titles or explanations in demos:** a demo shows controls, their labels, and
  live values only. Anything the page's body text already says (the demo's name, what
  a group of controls is for, how to play, what the plot shows) does not appear in the
  panel or on the canvas. A status line (such as "Loading samples…") is allowed while
  it has something to report; it is empty otherwise.
- **No "Open full size" links:** a demo is only embedded on its page; never add a
  separate link to it.
- **No readouts the controls already give:** no stats or derived values (period,
  nearest note) beside the controls, and no axis labels for things the page explains
  (the waveform's time span). A slider's readout is the exact value applied (log
  sliders snap to `step`; Hz is shown in whole numbers, never abbreviated).
- **Frames fit their controls:** a demo is no taller than its controls need.
- **16px grid:** every height, gap, padding, and inset is a multiple of 16px
  (`--grid`), so text lines fall on the grid and spread evenly. Single-line items (a
  slider row, a button, a select, a section header, a stats line) are 32px tall
  (`--row`) with their text centered. A button is followed by one grid unit before the
  next item, groups are separated by one grid unit (`.dp-divider`), and wrapped text
  uses a 16px line height. Plots and the keyboard sit 32px in from the edges and from
  each other, and the panel's controls start on the same top line; canvas labels are
  centered in a 16px line, with one grid unit of space between a plot and its labels.
  Labels are 80px wide and values 48px.
- **Keyboard full width:** when a demo's panel is short, use the stacked layout
  (`.demo-layout.stacked`: canvas and panel side by side in a `.stage-row`, the keyboard
  below across the whole width, inside the same 32px margins).
- **One background:** the panel and the stage share the paper (`#fbf8f5`, the
  brighter color the white keys used to be). Nothing divides left from right: no panel
  fill, no border, no rule.
- **White for wells:** pure white (`--demo-white` / `COLORS.white`) for things that
  sit on the paper: white keys, slider tracks, idle toggles, selects.
- **Green for the main controls:** play buttons, active toggles, and any slider that
  is not part of a colored series (`--accent` defaults to `--accent-green`).
- **Red for the main wave:** the waveform on a scope, the summed wave over its
  partials (drawn on top of them). Red is kept out of the series colors (`ACCENTS`); green comes last in
  them, so it shows up in a series only after the other accents.
- **Yellow for components:** the parts that add up to the main wave (the sine waves
  of an additive tone) are all yellow, on the canvas and on their sliders, with the red
  sum on top. Components are not told apart by color; their sliders are labeled with
  their frequencies instead.
- **Other colors as needed:** pink, yellow, dark green, and butter for other series
  (`accent(i)`, e.g. effect sections), the spectrum fill (yellow), and played keys
  (yellow, white and black alike).
- **Fills, not lines:** fill shapes (buttons, slider tracks, bars, spectra, keys) with
  accent colors instead of outlining them. Waveforms are the exception: a wave is drawn
  as a line.
- **No borders or rules:** separate areas with space and a change of fill. `.dp-divider`
  is space only. No grid lines on plots. The one exception is music notation: a staff's
  five lines and ledger lines are drawn, thin and black, because they are the notation.
- **No unnecessary boxes:** no nested containers, visual or structural. Nothing gets
  its own card or panel inside the panel, plots sit directly on the paper, a lone
  button is not wrapped in a row, a title is not wrapped in a header div, and mount
  points are removed with `unwrap()` once their controls are built.
- **Accents from the palette:** a series that is not a set of components (effect
  sections) takes `accent(i)` in order, the same colors in the panel and on the
  canvas. Other controls are green.
- **One demo, two settings:** when two sections need the same demo with one thing
  changed (pure or equal-tempered fifths), reuse the demo with a URL parameter
  (`?tuning=equal`) rather than copying it.
- **Fixed values over extra controls:** when a parameter is not the point of a demo
  (the fundamental in the additive demo, fixed at 220 Hz), fix it and say so in the
  page text instead of adding a slider. Presets that the page text can describe as
  settings are left out.
- **Input shaped to the sound:** pitched instruments get piano keys (octave names on
  the Cs); sounds without pitch get pads from the instrument's `pads`: one pad per
  drum, a single pad for noise. Played keys and pads turn yellow.

## Audio rules

- Tone.js via the import map in each demo's `index.html`, pinned to `tone@15.1.22`
  (`+esm` build from jsDelivr). Raw Web Audio is available through
  `Tone.getContext().rawContext`.
- Importing `AudioEngine.js` sets Tone's `lookAhead` to 0 so notes play when a key is
  pressed. A demo that schedules sequences on the Transport can raise it.
- Notes are MIDI numbers everywhere in the library (60 = C4). Convert at the edges with
  `midiToNote`, `midiToFrequency`, `nearestNote`.
- Every demo routes sound through one `MasterBus` (volume and limiter).
- Call `startAudio()` inside a user gesture before the first note, and never await it
  before playing: call it, then schedule the note right away. Awaiting lets a quick
  tap's noteOff run before its noteOn, which leaves noise or a synth stuck on.
- Presets live in `INSTRUMENTS`, effects in `EFFECTS`. Never define either in a demo.
- Effects start transparent (Mix 0, filter fully open).

## Colors

Demos use the palette in `public/lib/demo/colors.js`: the off-white `paper` as the
background, `white` for wells, `ink` for all text, `green` for main controls, `red` for the main wave, and the other flower colors (pink, yellow,
butter, dark green) as accents. Canvas drawing imports `COLORS` / `accent(i)`;
CSS uses the mirrored custom properties in demo-ui.css. Never write a
color literal in a demo.

## Layout

```
src/content/docs/
  index.md                       root (local only, links to the series)
  sound-theory/
    index.md                     series intro           slug: sound-theory
    sound-sources.md             instruments, effects   slug: sound-sources
    sound-waves.md               sine, additive, FFT    slug: sound-waves
    tuning-systems.md            ratios, Pythagorean, 12-TET, others   slug: tuning-systems
    scales.md                    what a scale is, scales from C        slug: scales
    church-modes.md              modes from C, white keys, drone       slug: church-modes
    minor-scales.md              natural, harmonic, melodic minor      slug: minor-scales
    other-scales.md              pentatonic, blues, whole tone, …      slug: other-scales
    pulse-and-cycles.md          pulse, accents, cycles                slug: pulse-and-cycles
    time-signatures.md           meters, drum patterns                 slug: time-signatures
    rhythm-and-feel.md           subdivisions, styles, timing          slug: rhythm-and-feel
    diatonic-chords.md           triads, Roman numerals, functions     slug: diatonic-chords
    chord-types.md               dim, aug, sus                         slug: chord-types
    seventh-chords.md            sevenths, tensions                    slug: seventh-chords
    functional-harmony.md        T, SD, D, progressions                slug: functional-harmony
    tension-and-resolution.md    dominant motion, other resolutions    slug: tension-and-resolution
    subdominant-minor.md         borrowed chords                       slug: subdominant-minor
    non-functional-harmony.md    modes, planing, twelve tones          slug: non-functional-harmony
    reharmonization.md           Twinkle, five versions                slug: reharmonization
    breaking-conventions.md      20th-century experiments, phasing     slug: breaking-conventions
    sound-as-material.md         onkyō, sound design, granular         slug: sound-as-material
src/layouts/DocLayout.astro      writing's layout + sound-theory additions
src/components/                  writing's Sidebar and Breadcrumbs
public/lib/audio/                AudioEngine.js  instruments.js  effects.js  additive.js
                                 tuning.js  scales.js  sequence.js  rhythm.js
                                 chords.js  granular.js
public/lib/demo/                 viewport.js  panel.js  controls.js  colors.js
                                 Keyboard.js  Scope.js  PartialsView.js  BeatView.js
                                 FifthsRing.js  ScaleView.js  CycleView.js  StepGrid.js
                                 ProgressionView.js
public/demos/<name>/             index.html + main.js per demo
public/styles/demo-ui.css        demo chrome
public/lib/page/demoRecorder.js  record button under each embedded demo (page-level)
docs/audio-library.md            library reference (not published)
documentation.md                 site conventions (from writing)
scripts/build-index.mjs          search index builder (from writing)
```

## Git

- Never `git push` unless the user explicitly asks.
