# Project Documentation

A bilingual (English/Japanese) writing site built with Astro, served at `www.kynd.info/writing`.

> This file is copied from the writing repo and describes its conventions, which this
> project follows. The sound theory additions (demo embeds, section ordering, the
> audio library) are described in `CLAUDE.md` and `docs/audio-library.md`.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Static site generator | [Astro](https://astro.build) v4 (static output) |
| Content | Astro Content Collections (`src/content/docs/`) |
| Math rendering | remark-math + rehype-katex |
| Fonts | Sora (body/headings), Google Sans Code (monospace) — Google Fonts |
| Deployment | GitHub Actions → `gh-pages` branch → GitHub Pages |
| Live URL | `https://www.kynd.info/writing` (base path `/writing`) |

---

## Directory Structure

```
src/
  components/
    Sidebar.astro       — collapsible nav tree (receives TreeNode from DocLayout)
  content/
    config.ts           — Astro collection schema (title: string, description?: string)
    docs/               — all page content as Markdown files
  layouts/
    DocLayout.astro     — global page shell: sidebar, breadcrumbs, anchor links, styles
  pages/
    [...slug].astro     — dynamic route: renders every doc page
    index.astro         — site homepage (served at /writing/)
    proofread.astro     — internal proofreading checklist tool

public/
  images/               — all page images (referenced as /images/filename.ext)
  videos/               — video files

scripts/
  add-slugs.mjs         — one-time migration: adds slug frontmatter + rewrites links

astro.config.mjs        — Astro config, remark/rehype plugins, base path
```

---

## URL System

URLs are **decoupled from the file system hierarchy** via a `slug` frontmatter field. This means reorganising folders does not change published URLs.

### Rules

- Every page must have `slug: <short-kebab-slug>` in its frontmatter.
- The slug equals the file's own name (or parent folder name for `index.md` files).
- Slugs must be **unique across the entire collection** — there is no namespace by folder.
- **Exception:** `src/content/docs/index.md` (the site root) must NOT have a `slug` field.
- Internal markdown links use the short slug: `[text](/ray-casting)` — not the full path.
- Raw HTML `href` attributes that point to internal pages must include the base path and short slug: `href="/writing/ray-casting"`.

### How it works

`[...slug].astro` maps `doc.slug` → URL param. `DocLayout.astro` receives both:
- `slug` — the short URL slug (used in route)
- `filePath` — the normalized `doc.id` path (used for sidebar active state and breadcrumbs)

The sidebar and breadcrumbs always derive hierarchy from `doc.id` (file path), not `doc.slug`.

### Adding a new page

1. Create the file at the appropriate path under `src/content/docs/`.
2. Add frontmatter:
   ```markdown
   ---
   title: "Page Title 日本語タイトル"
   slug: page-title
   ---
   ```
3. Use the short slug for any internal links to/from this page.

---

## Content Authoring

### Frontmatter

```markdown
---
title: "English Title 日本語タイトル"
slug: english-title
description: "Optional description"   # not currently displayed
---
```

### Bilingual headings

Pages are bilingual EN + JA. The convention is to place the Japanese heading immediately after the English heading of the same level:

```markdown
# English Heading
# 日本語見出し

## English Subheading
## 日本語サブ見出し
```

The anchor-link icon appears only on the English heading. Hovering the Japanese heading shows the English heading's icon. This is handled automatically in `DocLayout.astro` — no per-page markup needed.

### Bilingual bullet lists

Bullet lists follow the same EN-then-JA pattern as headings: write the English intro paragraph and all English bullets together, then the Japanese intro paragraph and all Japanese bullets together. Do **not** interleave EN/JA pairs bullet-by-bullet.

```markdown
Intro sentence in English.

- English bullet one
- English bullet two
- English bullet three

日本語の導入文。

- 日本語の箇条書き1
- 日本語の箇条書き2
- 日本語の箇条書き3
```

### Page title

The `title` frontmatter field contains both languages in one string (e.g. `"Computing Colors 色を計算する"`). `[...slug].astro` splits on the first CJK character to render them in separate `<span>` tags.

### Images

Store images in `public/images/`. Reference them in markdown as:

```markdown
![Alt text](/images/filename.png)
```

The `remarkRebaseLinks` plugin prepends `/writing` to all absolute paths automatically.

**Image width control** — add a title attribute with a percentage value:

```markdown
![Alt text](/images/filename.png "75")   <!-- renders at 75% width -->
```

Supported values: `100`, `75`, `50`, `33`. Handled by the `rehypeImageSize` plugin in `astro.config.mjs`.

### Math

Uses KaTeX via remark-math + rehype-katex. Write standard LaTeX delimiters:

```markdown
Inline: $1/\sqrt{3}$

Block:
$$\sqrt{x^2 + y^2} = 1$$
```

Do **not** paste pre-rendered KaTeX HTML — use the `$...$` / `$$...$$` syntax directly.

**Fractions:** Always use `\dfrac` instead of `\frac`. In display mode (`$$`), `\frac` renders the numerator and denominator in textstyle (small); `\dfrac` forces them to full displaystyle size. Use `\cfrac` only for continued fractions. Only revert to `\frac` if explicitly instructed.

### CodePen embeds

```html
<div class="codepen-wrap"><p class="codepen" data-height="420" data-default-tab="result" data-slug-hash="XXXXXXX" data-user="kynd" data-preview="true"></p></div>
```

Replace `XXXXXXX` with the pen's slug hash. The CodePen embed script is loaded globally in `DocLayout.astro`.

### Callout / aside boxes

```html
<aside>
  <span class="aside-icon">💡</span>
  <div class="aside-body">
    <p>English text.</p>
    <p>日本語テキスト。</p>
    <p><a href="/writing/target-slug">Link text →</a></p>
  </div>
</aside>
```

Styled globally in `DocLayout.astro`. Links inside `<aside>` are raw HTML and require the full `/writing/` base prefix.

### Bookmark cards

External resource links with preview card appearance:

```html
<div class="bookmark-card">
  <a href="https://example.com" target="_blank" rel="noopener" class="bookmark-link">
    <div class="bookmark-info">
      <div class="bookmark-title">Site Name</div>
      <div class="bookmark-description">Description</div>
      <div class="bookmark-url">
        <img src="https://example.com/favicon.png" class="bookmark-favicon" alt="" onerror="this.style.display='none'">
        <span>https://example.com</span>
      </div>
    </div>
    <img src="https://example.com/og-image.jpg" class="bookmark-image" alt="" loading="lazy" onerror="this.style.display='none'">
  </a>
</div>
```

---

## Markdown Plugins (astro.config.mjs)

| Plugin | What it does |
|---|---|
| `remarkRebaseLinks` | Prepends `/writing` to all absolute markdown links and images starting with `/` |
| `remarkMath` | Enables `$...$` and `$$...$$` math syntax |
| `rehypeImageSize` | Converts `title="75"` on images to `style="width:75%"` |
| `rehypeRebaseVideoSrc` | Prepends `/writing` to `src="/videos/` and `src="/images/` inside raw HTML nodes |
| `rehypeKatex` | Renders math nodes to HTML via KaTeX |

**Important:** `remarkRebaseLinks` only applies to markdown-syntax links/images. Raw HTML `href` and `src` attributes (except images/videos handled by `rehypeRebaseVideoSrc`) are not automatically rebased and must include the full `/writing/` prefix manually.

---

## Global Styling

All styles live in `DocLayout.astro` (in a `<style is:global>` block) and `Sidebar.astro`.

### Design tokens

| Token | Value |
|---|---|
| Background | `#ffffff` |
| Foreground | `#000000` |
| Muted text / borders | `#777` / `#e0e0e0` |
| Body font | `Sora`, sans-serif |
| Code font | `Google Sans Code`, monospace |

### Key CSS classes

| Class | Purpose |
|---|---|
| `.prose` | Wraps all page content; scopes most content styles |
| `.page-title` | The `<h1>` rendered from the page title — excluded from anchor-link behaviour |
| `.codepen-wrap` | Container that constrains CodePen iframes |
| `.bookmark-card` | External link preview card |
| `aside` | Callout box (icon + body layout) |
| `.anchor-copy-btn` | Auto-injected link icon on headings (see Anchor Links) |

### Responsive layout

- **≥ 960px:** Sidebar visible and open by default.
- **< 960px:** Sidebar hidden in a drawer, toggled by a hamburger button.

---

## Anchor Links on Headings

All `h1`/`h2`/`h3` headings inside `.prose` (excluding `.page-title`) automatically receive:
- A slug `id` generated from their text (kebab-case ASCII; CJK-only headings fall back to `section`, `section-2`, …)
- A hoverable copy-link button (`<button class="anchor-copy-btn">`) prepended inside the heading

Clicking copies `window.location.origin + pathname + '#' + id` to the clipboard.

For bilingual heading pairs (`h1+h1`, `h2+h2`, `h3+h3`), the icon is suppressed on the Japanese (second) heading. Hovering the Japanese heading shows the English heading's icon via JS listeners.

This is implemented entirely in `DocLayout.astro` — no per-page edits needed.

---

## Navigation Components

### Sidebar (`Sidebar.astro`)

Receives a `TreeNode` tree built in `DocLayout.astro`. The tree is built from `doc.id` (file path), not `doc.slug`, so hierarchy is always correct regardless of URL slugs.

`TreeNode` shape:
```typescript
{
  label: string;   // page title
  path: string;    // hierarchical file path — used for active-state detection
  url: string;     // short slug — used for href links
  children: Map<string, TreeNode>;
}
```

Section order is controlled by `SECTION_ORDER` and `SKETCHING_ORDER` constants in `DocLayout.astro`.

### Breadcrumbs

Built by `buildBreadcrumbs(filePath, allDocs)` in `DocLayout.astro`. Splits the current page's `filePath` (hierarchical) to find ancestor docs, then uses each ancestor's `doc.slug` for the link URL.

---

## Deployment

Deployment is automated via `.github/workflows/deploy.yml`:

1. Push to `main` triggers the workflow.
2. Workflow runs `npm ci && npm run build`.
3. Built `dist/` is force-pushed to the `gh-pages` branch via `peaceiris/actions-gh-pages@v4`.
4. GitHub Pages serves from the `gh-pages` branch at `www.kynd.info/writing`.

**GitHub Pages setting:** "Deploy from a branch" → `gh-pages` branch. Do not change this to GitHub Actions mode.

---

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:4321/writing
npm run build      # build to dist/
```
