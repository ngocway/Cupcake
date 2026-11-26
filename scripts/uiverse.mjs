#!/usr/bin/env node
/**
 * Uiverse.io Component Fetcher CLI (powered by official uiverse-io/galaxy repo)
 *
 * Usage:
 *   node scripts/uiverse.mjs categories
 *   node scripts/uiverse.mjs search <keyword> [category]
 *   node scripts/uiverse.mjs get <uiverse-url | author/slug | category/file.html>
 */

const CATEGORIES = [
  'Buttons',
  'Cards',
  'Checkboxes',
  'Forms',
  'Inputs',
  'Notifications',
  'Patterns',
  'Radio-buttons',
  'Toggle-switches',
  'Tooltips',
  'loaders',
];

const HEADERS = {
  'User-Agent': 'Cupcakes-Uiverse-CLI',
  Accept: 'application/vnd.github+json',
};

async function fetchTree() {
  const res = await fetch(
    'https://api.github.com/repos/uiverse-io/galaxy/git/trees/main?recursive=1',
    { headers: HEADERS }
  );
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return (data.tree || []).filter(
    (item) => item.type === 'blob' && item.path.endsWith('.html')
  );
}

async function fetchRaw(filePath) {
  const url = `https://raw.githubusercontent.com/uiverse-io/galaxy/main/${filePath}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Cupcakes-Uiverse-CLI' } });
  if (!res.ok) {
    return null;
  }
  return await res.text();
}

async function main() {
  const [, , cmd, arg1, arg2] = process.argv;

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log(`Uiverse CLI (uiverse-io/galaxy)
Commands:
  node scripts/uiverse.mjs categories
  node scripts/uiverse.mjs search <keyword> [category]
  node scripts/uiverse.mjs get <https://uiverse.io/author/slug | category/file.html>`);
    return;
  }

  if (cmd === 'categories') {
    console.log('Available Uiverse categories:\n- ' + CATEGORIES.join('\n- '));
    return;
  }

  if (cmd === 'search') {
    if (!arg1) {
      console.error('Usage: node scripts/uiverse.mjs search <keyword> [category]');
      process.exit(1);
    }
    const keyword = arg1.toLowerCase();
    const catFilter = arg2 ? arg2.toLowerCase() : null;
    const files = await fetchTree();
    const matches = files.filter((f) => {
      const lower = f.path.toLowerCase();
      if (catFilter && !lower.startsWith(catFilter + '/')) return false;
      return lower.includes(keyword);
    });

    console.log(`Found ${matches.length} matching component(s) (showing up to 25):`);
    for (const m of matches.slice(0, 25)) {
      const [cat, file] = m.path.split('/');
      const base = file.replace(/\.html$/, '');
      const sepIdx = base.lastIndexOf('_');
      const previewUrl =
        sepIdx > 0
          ? `https://uiverse.io/${base.slice(0, sepIdx)}/${base.slice(sepIdx + 1)}`
          : '';
      console.log(`- ${m.path}${previewUrl ? `  (${previewUrl})` : ''}`);
    }
    return;
  }

  if (cmd === 'get') {
    if (!arg1) {
      console.error('Usage: node scripts/uiverse.mjs get <url-or-path>');
      process.exit(1);
    }

    let input = arg1.trim();

    // Direct path in repo (e.g. Buttons/author_slug.html)
    if (input.endsWith('.html') && input.includes('/')) {
      const code = await fetchRaw(input);
      if (!code) {
        console.error(`Component not found at path: ${input}`);
        process.exit(1);
      }
      console.log(code);
      return;
    }

    // Parse https://uiverse.io/<author>/<slug> or <author>/<slug>
    const urlMatch = input.match(/(?:uiverse\.io\/)?([^\/]+)\/([^\/?#]+)\/?$/i);
    if (urlMatch) {
      const [, author, slug] = urlMatch;
      const targetFileName = `${author}_${slug}.html`;

      for (const cat of CATEGORIES) {
        const candidate = `${cat}/${targetFileName}`;
        const code = await fetchRaw(candidate);
        if (code) {
          console.log(`<!-- Source: ${candidate} (https://uiverse.io/${author}/${slug}) -->\n${code}`);
          return;
        }
      }

      // Fallback to tree search in case author has underscore
      const files = await fetchTree();
      const found = files.find((f) =>
        f.path.toLowerCase().endsWith(`${author}_${slug}.html`.toLowerCase())
      );
      if (found) {
        const code = await fetchRaw(found.path);
        console.log(`<!-- Source: ${found.path} -->\n${code}`);
        return;
      }
    }

    console.error(`Could not locate Uiverse component for: ${input}`);
    process.exit(1);
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
