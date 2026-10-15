import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Inspect the actual generated output before deployment. No packages or network.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public');
const profile = JSON.parse(await readFile(path.join(root, 'site/data/profile.json'), 'utf8'));
const publications = JSON.parse(await readFile(path.join(root, 'site/data/publications.json'), 'utf8'));
const origin = new URL(profile.siteUrl).origin;
const errors = [], files = new Set(), pages = new Map();
const fail = (file, message) => errors.push(`${file}: ${message}`);
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
  if (entity[0] === '#') {
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : match;
  }
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()];
});

async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) await walk(path.join(directory, entry.name), `${relative}/`);
    else if (entry.isFile()) files.add(relative);
    else fail(relative, 'Only regular files and directories may be published.');
  }
}
await walk(output);
for (const file of ['index.html', '404.html', 'publication/index.html', 'news/index.html', '.nojekyll', 'sitemap.xml', 'robots.txt', 'uploads/resume.pdf', 'google1eabce8c0587e6a7.html']) {
  if (!files.has(file)) fail(file, 'Required output is missing.');
}

function attributes(raw) {
  const result = new Map();
  for (const match of raw.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    result.set(match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return result;
}
for (const file of files) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(path.join(output, file), 'utf8');
  // Ignore raw script/style contents and comments when scanning HTML tags.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)>)/gi, '$1$2');
  const tags = [...markup.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)]
    .map(match => ({ name: match[1].toLowerCase(), attrs: attributes(match[2]) }));
  const ids = new Set();
  for (const { attrs } of tags) {
    if (!attrs.has('id')) continue;
    const id = attrs.get('id');
    if (!id || /\s/.test(id)) fail(file, `Invalid HTML id ${JSON.stringify(id)}.`);
    if (ids.has(id)) fail(file, `Duplicate HTML id ${JSON.stringify(id)}.`);
    ids.add(id);
  }
  pages.set(file, { html, tags, ids });
}

let checkedLinks = 0;
function checkReference(from, reference, label) {
  if (!reference || /^(?:mailto|tel|data|blob):/i.test(reference)) return;
  let target;
  try {
    const base = from.endsWith('/index.html') ? from.slice(0, -10) : from;
    target = new URL(reference, `${origin}/${base}`);
  } catch { fail(from, `Invalid ${label}: ${reference}`); return; }
  if (!['http:', 'https:'].includes(target.protocol)) {
    fail(from, `Unsupported ${label} URL: ${reference}`);
    return;
  }
  if (target.origin !== origin) return;
  checkedLinks++;
  let relative;
  try { relative = decodeURIComponent(target.pathname).replace(/^\/+/, ''); }
  catch { fail(from, `Malformed path in ${label}: ${reference}`); return; }
  if (relative.split('/').some(part => part === '..' || part === '.')) {
    fail(from, `Invalid path in ${label}: ${reference}`);
    return;
  }
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  else if (!files.has(relative) && files.has(`${relative}/index.html`)) relative += '/index.html';
  if (!files.has(relative)) { fail(from, `Missing ${label} target ${reference} (${relative}).`); return; }
  if (target.hash && pages.has(relative)) {
    let fragment;
    try { fragment = decodeURIComponent(target.hash.slice(1)).split(':~:text=')[0]; }
    catch { fail(from, `Malformed anchor in ${label}: ${reference}`); return; }
    if (fragment && !pages.get(relative).ids.has(fragment)) fail(from, `Missing anchor ${reference}.`);
  }
}

for (const [file, { html, tags, ids }] of pages) {
  for (const { name, attrs } of tags) {
    for (const key of ['href', 'src', 'poster', 'action', 'data']) {
      if (attrs.has(key)) checkReference(file, attrs.get(key), `${name}[${key}]`);
    }
    if (attrs.has('srcset')) {
      for (const candidate of attrs.get('srcset').split(',')) checkReference(file, candidate.trim().split(/\s+/)[0], `${name}[srcset]`);
    }
    if (name === 'meta' && ['og:image', 'og:url', 'twitter:image'].includes(attrs.get('property') || attrs.get('name'))) {
      checkReference(file, attrs.get('content'), 'metadata');
    }
    for (const key of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const id of (attrs.get(key) || '').split(/\s+/).filter(Boolean)) {
        if (!ids.has(id)) fail(file, `${key} refers to missing id ${id}.`);
      }
    }
    if (name === 'label' && attrs.has('for') && !ids.has(attrs.get('for'))) fail(file, `Label refers to missing control ${attrs.get('for')}.`);
  }
  // Google's ownership-verification document must remain its plain text response.
  if (/^google[\da-f]+\.html$/.test(file)) continue;
  if (!/^<!doctype html>/i.test(html.trimStart())) fail(file, 'Missing HTML doctype.');
  if (!tags.find(tag => tag.name === 'html')?.attrs.get('lang')) fail(file, 'Missing document language.');
  if (!/<title>\s*[^<]+<\/title>/i.test(html)) fail(file, 'Missing page title.');
  for (const key of ['description', 'viewport', 'og:title', 'og:description', 'og:url', 'og:image']) {
    const entries = tags.filter(tag => tag.name === 'meta' && (tag.attrs.get('name') === key || tag.attrs.get('property') === key));
    if (entries.length !== 1 || !entries[0].attrs.get('content')?.trim()) fail(file, `Expected one nonempty ${key} meta tag.`);
  }
  if (!tags.some(tag => tag.name === 'meta' && tag.attrs.get('charset')?.toLowerCase() === 'utf-8')) fail(file, 'Missing UTF-8 charset.');
  const canonical = tags.filter(tag => tag.name === 'link' && tag.attrs.get('rel')?.split(/\s+/).includes('canonical'));
  if (canonical.length !== 1 || !canonical[0].attrs.get('href')?.startsWith(`${origin}/`)) fail(file, 'Expected one absolute canonical URL on this site.');
  const schemas = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!schemas.length) fail(file, 'Missing structured data.');
  for (const [, json] of schemas) {
    try { JSON.parse(json); }
    catch { fail(file, 'Invalid JSON-LD structured data.'); }
  }
}
for (const file of files) {
  if (!file.endsWith('.css')) continue;
  const css = (await readFile(path.join(output, file), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) {
    checkReference(file, (match[1] || match[2]).trim(), 'CSS asset');
  }
}
if (files.has('sitemap.xml')) {
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) checkReference('sitemap.xml', decode(location), 'sitemap URL');
}

const publicationIds = new Set();
const archiveRows = pages.get('publication/index.html')?.tags.filter(tag => tag.attrs.has('data-publication')) ?? [];
const homeRows = pages.get('index.html')?.tags.filter(tag => tag.attrs.has('data-publication')) ?? [];
const archiveIds = new Set(archiveRows.map(tag => tag.attrs.get('id')));
const homeIds = new Set(homeRows.map(tag => tag.attrs.get('id')));
for (const publication of publications) {
  const { id } = publication;
  if (typeof id !== 'string' || !/^[a-z0-9_-]+$/.test(id)) fail('site/data/publications.json', `Invalid publication id ${JSON.stringify(id)}.`);
  if (publicationIds.has(id)) fail('site/data/publications.json', `Duplicate publication id ${id}.`);
  publicationIds.add(id);
  if (!archiveIds.has(id)) fail('publication/index.html', `Publication ${id} is missing from the archive.`);
  if (Boolean(publication.featured) !== homeIds.has(id)) fail('index.html', `Selected-paper visibility does not match data for ${id}.`);
  for (const name of ['index.html', 'cite.bib']) {
    const file = `publication/${id}/${name}`;
    if (!files.has(file)) fail(file, 'Missing publication output.');
  }
  if (publication.image) checkReference('index.html', `/assets/papers/${publication.image}`, `figure for ${id}`);
}
for (const id of [...archiveIds, ...homeIds]) {
  if (!publicationIds.has(id)) fail('publication/index.html', `Rendered paper id ${id} has no data record.`);
}
if (archiveRows.length !== publications.length) fail('publication/index.html', 'Rendered publication count does not match the data.');
for (const id of ['about', 'recent-news', 'featured', 'experience']) {
  if (!pages.get('index.html')?.ids.has(id)) fail('index.html', `Missing legacy anchor #${id}.`);
}
if (errors.length) {
  console.error(`Site check failed with ${errors.length} issue(s):\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.size} HTML files, ${checkedLinks} local references, and ${publications.length} publication records. All checks passed.`);
}
