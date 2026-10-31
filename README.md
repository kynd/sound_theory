# sound theory

Notes on how sound works and how music is built from it, with playable demos.
Mostly music theory, plus the physics of sound, perception, synthesis, and processing.

The site setup is a copy of [kynd.info/writing](https://www.kynd.info/writing/), and the
series lives in `src/content/docs/sound-theory/` so it can be merged into that site.

## Running it

```
npm install
npm run dev
```

Open `http://localhost:4321/writing/sound-theory`.

`npm run build:index` refreshes the search index; `npm run build` writes the static
site to `dist/`.

## Layout

```
src/content/docs/sound-theory/  the series (markdown, EN + JA)
public/lib/audio/               sound: audio engine, instrument presets, effects (Tone.js)
public/lib/demo/                demo scaffolding: viewport, keyboard, scope, panel controls
public/demos/<name>/            index.html + main.js per demo
docs/audio-library.md           library reference
documentation.md                site conventions (from writing)
```

## Credits

Piano samples: Salamander Grand Piano by Alexander Holm (CC BY 3.0), hosted by Tone.js.

## License

Text and images: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — Kenichi Yoneda (kynd)
