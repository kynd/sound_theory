import { defineConfig } from 'astro/config';
import { visit } from 'unist-util-visit';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const BASE = '/writing';

function remarkRebaseLinks() {
  return (tree) => {
    visit(tree, (node) => {
      if ((node.type === 'link' || node.type === 'image') &&
          typeof node.url === 'string' &&
          node.url.startsWith('/') && !node.url.startsWith('//')) {
        node.url = BASE + node.url;
      }
    });
  };
}

// Links to other sites (http/https) open in a new tab, on every page: markdown links
// here, links written as raw HTML (asides, bookmark cards) in rehypeExternalRawLinks.
function remarkExternalLinksNewTab() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (!/^https?:\/\//.test(node.url)) return;
      node.data = node.data ?? {};
      node.data.hProperties = { ...node.data.hProperties, target: '_blank', rel: 'noopener noreferrer' };
    });
  };
}

// The same for <a href="http..."> written as raw HTML in markdown, which is still a
// string when rehype plugins run. Anchors that already set a target are left alone.
function rehypeExternalRawLinks() {
  const ANCHOR = /<a\s(?![^>]*\btarget=)([^>]*\bhref="https?:\/\/[^"]*"[^>]*)>/g;
  return (tree) => {
    visit(tree, 'raw', (node) => {
      node.value = node.value.replace(ANCHOR, '<a $1 target="_blank" rel="noopener noreferrer">');
    });
  };
}

// Rebases absolute src/href paths inside raw HTML nodes in markdown.
// Raw HTML in markdown is not yet parsed into hast elements when rehype plugins run,
// so we rewrite the string directly.
function rehypeRebaseVideoSrc() {
  return (tree) => {
    visit(tree, 'raw', (node) => {
      node.value = node.value
        .replace(/src="\/videos\//g, `src="${BASE}/videos/`)
        .replace(/src="\/images\//g, `src="${BASE}/images/`)
        .replace(/href="\/images\//g, `href="${BASE}/images/`);
    });
  };
}

// Converts image title="100"|"75"|"50"|"33" to inline width style, removes the title.
function rehypeImageSize() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const title = String(node.properties?.title ?? '');
      if (!['100', '75', '50', '33'].includes(title)) return;
      node.properties.style = `width:${title}%`;
      delete node.properties.title;
    });
  };
}

export default defineConfig({
  site: 'https://www.kynd.info',
  base: BASE,
  server: {
    port: 4321,
  },
  markdown: {
    remarkPlugins: [remarkRebaseLinks, remarkExternalLinksNewTab, remarkMath],
    rehypePlugins: [rehypeImageSize, rehypeRebaseVideoSrc, rehypeExternalRawLinks, rehypeKatex],
  },
  output: 'static',
  build: {
    assets: 'assets',
  },
  devToolbar: {
    enabled: false,
  },
});
