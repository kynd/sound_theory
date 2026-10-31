// Build-time semantic search index generator.
//
// Walks src/content/docs/**/*.md, extracts title, slug, first EN paragraph,
// first JA paragraph, and computes embeddings using Xenova/all-MiniLM-L6-v2
// (same model the browser uses at query time).
//
// Output: public/search-index.json — [{ slug, title, summary, summaryJa, vector, text }]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { glob } from 'node:fs/promises';
import { pipeline } from '@xenova/transformers';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'src/content/docs');
const PUBLIC_DIR = join(ROOT, 'public');
const MODEL = 'Xenova/all-MiniLM-L6-v2';

// ── Frontmatter + body parsing ──────────────────────────────────────────────
function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const [, fm, body] = m;
  const data = {};
  for (const line of fm.split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { data, body };
}

const isJa = (s) => /[぀-ヿ㐀-䶿一-鿿＀-￯]/.test(s);
const cleanBlock = (t) => t
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\s+/g, ' ').replace(/[*_`]/g, '').trim();
const isProse = (t) =>
  t && !t.startsWith('#') && !t.startsWith('<') && !t.startsWith('|') &&
  !t.startsWith('!') && !t.startsWith('>') && t !== '---' && t.length > 30;

// Extract first EN paragraph and first JA paragraph from the body.
// The Writing project interleaves EN/JA by paragraph (no <!-- --> separator).
function summaries(body) {
  const blocks = body.trim().split(/\n\s*\n/).map((b) => b.trim());
  let en = '', ja = '';
  for (const block of blocks) {
    if (!isProse(block)) continue;
    if (!en && !isJa(block)) { en = cleanBlock(block); continue; }
    if (!ja && isJa(block)) { ja = cleanBlock(block); }
    if (en && ja) break;
  }
  return { en, ja };
}

// Walk directory recursively and return all .md file paths
async function* walkMd(dir) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkMd(full);
    else if (entry.name.endsWith('.md')) yield full;
  }
}

async function main() {
  console.log('[build-index] loading model %s …', MODEL);
  const embed = await pipeline('feature-extraction', MODEL);
  const vec = async (text) => {
    const out = await embed(text, { pooling: 'mean', normalize: true });
    return Array.from(out.data).map((x) => +x.toFixed(5));
  };

  const docs = [];
  for await (const filePath of walkMd(DOCS_DIR)) {
    const raw = await readFile(filePath, 'utf8');
    const { data, body } = parse(raw);

    // Skip the site root index (no slug)
    if (!data.slug) continue;

    const slug = data.slug;
    const title = data.title || slug;
    const { en: summary, ja: summaryJa } = summaries(body);

    console.log('[build-index] embedding %s', slug);
    const vector = await vec(`${title}. ${summary}`);

    // Full plaintext for lexical matching
    const text = `${title} ${body}`
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`>#|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    docs.push({ slug, title, summary, summaryJa, vector, text });
  }

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(docs));
  console.log('[build-index] wrote %d pages → public/search-index.json', docs.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
