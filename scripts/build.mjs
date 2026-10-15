import { readFile, writeFile, mkdir, cp, readdir, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');
const profile = JSON.parse(await readFile(path.join(root, 'site/data/profile.json'), 'utf8'));
const publications = JSON.parse(await readFile(path.join(root, 'site/data/publications.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exists = async name => access(name).then(() => true, () => false);
const url = pathname => `${profile.siteUrl}${pathname}`;
const byDate = (a,b) => b.year-a.year || b.date.localeCompare(a.date);
publications.sort(byDate);
const ids = new Set();
for (const p of publications) {
  if (!p.id || !/^[a-z0-9_-]+$/.test(p.id) || ids.has(p.id)) throw new Error(`Invalid or duplicate id: ${p.id}`);
  if (!p.title || !p.authors?.length || !p.venue || !p.year || !p.paper || !p.summary) throw new Error(`Missing publication fields: ${p.id}`);
  if (!p.authors.includes('Haotian Zhang') && !p.authorNote) throw new Error(`Authorship requires verification: ${p.id}`);
  for (const key of ['paper','code','project']) if (p[key] && !p[key].startsWith('https://')) throw new Error(`Invalid ${key} URL: ${p.id}`);
  ids.add(p.id);
}
await rm(out, { recursive:true, force:true });
await mkdir(out, { recursive:true });
await cp(path.join(root,'site/assets'),path.join(out,'assets'),{recursive:true});
await cp(path.join(root,'static/uploads'),path.join(out,'uploads'),{recursive:true});
await cp(path.join(root,'google1eabce8c0587e6a7.html'),path.join(out,'google1eabce8c0587e6a7.html'));
await writeFile(path.join(out,'.nojekyll'),'');

function layout({ title, description, pathname='/', body, active='', noindex=false, schema=null }) {
  const person = { '@context':'https://schema.org','@type':'Person',name:profile.name,url:profile.siteUrl,image:url('/assets/portrait.jpg'),jobTitle:profile.role,worksFor:{'@type':'Organization',name:profile.organization,url:profile.organizationUrl},sameAs:[profile.scholar,profile.linkedin,profile.github] };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#fdfdfb">
<link rel="canonical" href="${esc(url(pathname))}"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="Haotian Zhang"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url(pathname))}"><meta property="og:image" content="${esc(url('/assets/portrait.jpg'))}"><meta name="twitter:card" content="summary">
${noindex?'<meta name="robots" content="noindex">':''}<link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script>
<script type="application/ld+json">${JSON.stringify(schema||person).replace(/</g,'\\u003c')}</script></head>
<body><a class="skip-link" href="#main">Skip to content</a><div class="container">
<header class="site-header"><a class="wordmark" href="/" aria-label="Haotian Zhang, home"><span class="monogram" aria-hidden="true">HZ</span><span>Haotian Zhang</span></a><nav aria-label="Main navigation"><a href="/#about"${active==='about'?' aria-current="page"':''}>About</a><a href="/publication/"${active==='research'?' aria-current="page"':''}>Research</a><a href="/#experience">Experience</a><a class="nav-contact" href="/#contact">Contact</a></nav></header>
<main id="main">${body}</main>
<footer class="site-footer"><span>© ${profile.updated.slice(0,4)} Haotian Zhang</span><span>Last updated ${new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(profile.updated))} &nbsp;·&nbsp; <a href="https://github.com/Haotian-Zhang/haotian-zhang.github.io">Website source ↗</a></span></footer>
</div></body></html>`;
}

function authorList(p, full=false) {
  if(p.id==='cosmos3') return 'NVIDIA Cosmos team, including <strong>Haotian Zhang</strong>';
  if(p.id==='apple-intelligence-2025') return 'Apple foundation models team, including <strong>Haotian Zhang</strong>';
  const format = a => a==='Haotian Zhang'?`<strong>${esc(a)}</strong>`:esc(a);
  if(full || p.authors.length <= 6) return p.authors.map(format).join(', ');
  const indices = new Set([0,1,p.authors.indexOf('Haotian Zhang')]);
  let previous = -1;
  return [...indices].filter(i=>i>=0).sort((a,b)=>a-b).map(i => {
    const separator = previous<0?'':i>previous+1?', …, ':', ';
    previous=i;
    return separator + format(p.authors[i]);
  }).join('') + (previous<p.authors.length-1?', et al.':'');
}
function links(p, includeDetails=false) {
  return `<div class="paper-links"><a href="${esc(p.paper)}">Paper ↗</a>${p.code?`<a href="${esc(p.code)}">Code ↗</a>`:''}${p.project?`<a href="${esc(p.project)}">Project ↗</a>`:''}<a href="/publication/${p.id}/cite.bib" download>Cite</a>${includeDetails?`<a href="/publication/${p.id}/">Details</a>`:''}</div>`;
}
function figure(p) {
  if(p.image) return `<a class="paper-figure" href="${esc(p.project||p.paper)}" tabindex="-1" aria-hidden="true"><img src="/assets/papers/${esc(p.image)}" alt="" width="480" height="320" loading="lazy" decoding="async"></a>`;
  const short = p.shortTitle || p.title.split(':')[0];
  return `<a class="paper-figure text-figure" href="${esc(p.paper)}" tabindex="-1" aria-hidden="true">${esc(short)}<span>${esc(p.topic)}</span></a>`;
}
function paperRow(p, archive=false) {
  return `<li class="publication" id="${esc(p.id)}" data-publication data-topic="${esc(p.topic)}" data-year="${p.year}" data-search="${esc([p.title,...p.authors,p.topic,p.venue,p.year].join(' ').toLocaleLowerCase())}">
${archive?`<div class="archive-year" aria-hidden="true">${p.year}</div>`:figure(p)}
<div class="paper-copy"><div class="paper-meta"><span class="venue">${esc(p.venue)} ${p.year}</span>${p.award?`<span class="award">${esc(p.award)}</span>`:''}<span>${esc(p.topic)}</span></div>
<h3><a href="${esc(p.paper)}">${esc(p.title)}</a></h3><p class="authors">${authorList(p)}</p><p class="summary">${esc(p.summary)}</p>${links(p,true)}</div></li>`;
}
function careerItem({ mark, style='', organization, orgUrl, role, dates, detail='' }) {
  return `<div class="career-item"><span class="org-mark ${style}" aria-hidden="true">${mark}</span><div><h3><a href="${orgUrl}">${organization}</a></h3><p>${role}</p><p class="date">${dates}</p>${detail?`<p>${detail}</p>`:''}</div></div>`;
}
const news = `<dl class="news"><dt>Jun 2026</dt><dd><a href="https://research.nvidia.com/labs/cosmos-lab/cosmos3/">Cosmos 3</a>: omnimodal world models for physical AI.</dd><dt>2026</dt><dd><a href="https://machinelearning.apple.com/research/manzano">MANZANO</a> at ICLR — unified multimodal understanding and generation.</dd><dt>Jan 2026</dt><dd>Joined <a href="${profile.organizationUrl}">NVIDIA Cosmos Lab</a> to work on world foundation models.</dd></dl>`;
const selected = publications.filter(p=>p.featured);
const home = `<section class="hero" id="about" aria-labelledby="name"><div class="hero-copy"><p class="eyebrow">Vision · Language · Physical AI</p><h1 id="name">Haotian Zhang</h1><p class="role">${esc(profile.role)} <span class="role-dot">·</span> <a href="${profile.organizationUrl}">${esc(profile.organization)}</a></p>
<p>I work on <strong>world foundation models</strong> and <strong>multimodal intelligence</strong> — building models that understand the world through vision and language.</p>
<p>At NVIDIA, I focus on world models for physical AI. Previously, I was a Senior Research Scientist at <a href="https://machinelearning.apple.com/">Apple</a>, working on multimodal foundation models, including <a href="https://arxiv.org/abs/2403.09611">MM1</a>, <a href="https://arxiv.org/abs/2409.20566">MM1.5</a>, and the <a href="https://github.com/apple-aiml-research/ml-ferret">Ferret</a> family. At Microsoft Research, I worked on <a href="https://github.com/microsoft/GLIP">GLIP and GLIPv2</a>.</p>
<p>I received my Ph.D. from the <a href="https://www.washington.edu/">University of Washington</a>, advised by <a href="https://people.ece.uw.edu/hwang/">Jenq-Neng Hwang</a>, and my B.S. from Shanghai Jiao Tong University.</p>
<div class="social-links" aria-label="Find me online"><a href="mailto:${esc(profile.email)}">Email <span class="arrow" aria-hidden="true">↗</span></a><a href="${esc(profile.scholar)}">Google Scholar <span class="arrow" aria-hidden="true">↗</span></a><a href="${esc(profile.github)}">GitHub <span class="arrow" aria-hidden="true">↗</span></a><a href="${esc(profile.linkedin)}">LinkedIn <span class="arrow" aria-hidden="true">↗</span></a></div></div>
<figure class="portrait"><img src="/assets/portrait.jpg" alt="Haotian Zhang at the Golden Gate Bridge" width="230" height="274" fetchpriority="high"><figcaption>“Be Boundless.”</figcaption></figure></section>
<div class="focus-strip"><span class="focus-label">Research focus</span><div class="focus-topics"><span>World models</span><span>Multimodal learning</span><span>Visual grounding</span><span>GUI agents</span></div></div>
<section class="section" id="recent-news" aria-labelledby="updates-title"><div class="section-heading"><h2 id="updates-title">Recent updates</h2></div>${news}</section>
<section class="section research-section" id="research" aria-labelledby="research-title"><span class="anchor-alias" id="featured"></span><span class="anchor-alias" id="publications"></span><div class="section-heading"><h2 id="research-title">Selected research</h2><a href="/publication/">All publications <span aria-hidden="true">↗</span></a></div><p class="section-intro">From grounded visual understanding to multimodal and world models.</p><ol class="publication-list">${selected.map(p=>paperRow(p)).join('')}</ol><div class="research-end"><span>More papers, collaborators, and research directions.</span><a href="/publication/">Explore the publication archive <span aria-hidden="true">→</span></a></div></section>
<section class="career-grid" id="experience" aria-label="Experience and education"><div><h2>Experience</h2>
${careerItem({mark:'N',organization:'NVIDIA',orgUrl:profile.organizationUrl,role:'Staff Research Scientist · Cosmos Lab',dates:'2026 – present',detail:'World foundation models for physical AI.'})}
${careerItem({mark:'A',style:'apple',organization:'Apple',orgUrl:'https://machinelearning.apple.com/',role:'Senior Research Scientist · AI/ML',dates:'2023 – 2025',detail:'Multimodal foundation models and visual grounding.'})}
${careerItem({mark:'M',style:'microsoft',organization:'Microsoft Research',orgUrl:'https://www.microsoft.com/en-us/research/',role:'Research Intern · Deep Learning',dates:'2021 – 2022',detail:'Grounded vision-language pre-training.'})}
</div><div><h2>Education</h2>
${careerItem({mark:'W',style:'uw',organization:'University of Washington',orgUrl:'https://www.washington.edu/',role:'Ph.D., Electrical &amp; Computer Engineering',dates:'2017 – 2022',detail:'Advisor: <a href="https://people.ece.uw.edu/hwang/">Jenq-Neng Hwang</a>'})}
${careerItem({mark:'W',style:'uw',organization:'University of Washington',orgUrl:'https://www.washington.edu/',role:'M.S., Applied Mathematics · 2021<br>M.S., Electrical &amp; Computer Engineering · 2019',dates:''})}
${careerItem({mark:'交',style:'sjtu',organization:'Shanghai Jiao Tong University',orgUrl:'https://en.sjtu.edu.cn/',role:'B.S., Nano &amp; Microelectronics',dates:'2017'})}
</div></section>
<section class="service" aria-labelledby="service-title"><h2 id="service-title">Community</h2><p>Co-organizer, <a href="https://computer-vision-in-the-wild.github.io/eccv-2022/">Computer Vision in the Wild workshop</a>, ECCV 2022. GLIP received a <a href="https://research.nvidia.com/person/haotian-zhang">CVPR 2022 Best Paper Finalist</a> recognition.</p></section>
<section class="contact" id="contact" aria-labelledby="contact-title"><div><h2 id="contact-title">Let’s connect.</h2><p>For research conversations and collaborations.</p></div><a href="mailto:${esc(profile.email)}">${esc(profile.email)} <span aria-hidden="true">↗</span></a></section>`;
await writeFile(path.join(out,'index.html'),layout({title:'Haotian Zhang · NVIDIA Cosmos',description:'Haotian Zhang is a Staff Research Scientist at NVIDIA Cosmos Lab, working on world foundation models, multimodal intelligence, and visual grounding.',body:home,active:'about'}));

const topics=[...new Set(publications.map(p=>p.topic))].sort();
const years=[...new Set(publications.map(p=>p.year))].sort((a,b)=>b-a);
const archive=`<section class="page-header"><a class="back-link" href="/">← Back to homepage</a><p class="eyebrow">Research archive</p><h1>Publications</h1><p>Work on world models, multimodal learning, visual grounding, and computer vision. For the latest citation record, visit <a href="${esc(profile.scholar)}">Google Scholar ↗</a>.</p></section>
<form class="filter-bar" data-publication-filters hidden role="search" aria-label="Filter publications"><div class="filter-field"><label for="paper-search">Search publications</label><input id="paper-search" type="search" placeholder="Title, author, or keyword…" autocomplete="off"></div><div class="filter-field"><label for="paper-topic">Research area</label><select id="paper-topic"><option value="">All areas</option>${topics.map(t=>`<option>${esc(t)}</option>`).join('')}</select></div><div class="filter-field"><label for="paper-year">Year</label><select id="paper-year"><option value="">All years</option>${years.map(y=>`<option>${y}</option>`).join('')}</select></div></form><p class="results-count" id="results-count" role="status" aria-live="polite">${publications.length} publications</p>
<ol class="publication-list archive">${publications.map(p=>paperRow(p,true)).join('')}</ol><div class="empty-state" id="empty-state" hidden><p>No publications match these filters.</p><button id="reset-filters" type="button">Clear all filters</button></div><div class="research-end"><a href="/">← Back to homepage</a><a href="${esc(profile.scholar)}">Google Scholar ↗</a></div>`;
await mkdir(path.join(out,'publication'),{recursive:true});
await writeFile(path.join(out,'publication/index.html'),layout({title:'Publications · Haotian Zhang',description:'Publications by Haotian Zhang on world models, multimodal intelligence, visual grounding, and computer vision.',pathname:'/publication/',body:archive,active:'research'}));

function bibtex(p) {
  const isPreprint=/arxiv|technical report/i.test(p.venue);
  const isJournal=isPreprint || /transactions|journal|IEEE TVT|IEEE TCSVT/i.test(p.venue);
  const preprintId = p.paper.match(/arxiv\.org\/abs\/([^?#]+)/)?.[1];
  const authors = p.id==='cosmos3'?'NVIDIA and others':p.authors.map(a=>a==='et al.'?'others':a).join(' and ');
  return `@${isJournal?'article':'inproceedings'}{${p.id.replace(/-/g,'')}${p.year},\n  title = {${p.title.replace(/[{}]/g,'')}},\n  author = {${authors}},\n  ${isJournal?'journal':'booktitle'} = {${isPreprint&&preprintId?`arXiv preprint arXiv:${preprintId}`:p.venue}},\n  year = {${p.year}},\n  url = {${p.paper}}\n}\n`;
}
for(const p of publications) {
  const dir=path.join(out,'publication',p.id);
  await mkdir(dir,{recursive:true});
  const bib=bibtex(p);
  await writeFile(path.join(dir,'cite.bib'),bib);
  const body=`<article class="paper-detail"><a class="back-link" href="/publication/">← All publications</a><div class="paper-meta"><span class="venue">${esc(p.venue)} ${p.year}</span>${p.award?`<span class="award">${esc(p.award)}</span>`:''}</div><h1>${esc(p.title)}</h1><p class="authors">${authorList(p,true)}</p>${links(p)}<p class="summary">${esc(p.summary)}</p>${p.image?`<img class="detail-image" src="/assets/papers/${esc(p.image)}" alt="${esc(p.imageAlt||p.title+' — overview figure')}" loading="lazy">`:''}<details class="citation"><summary>BibTeX citation</summary><pre>${esc(bib)}</pre></details></article>`;
  const structuredAuthors=p.authors.filter(name=>name!=='et al.');
  if(p.authorNote&&!structuredAuthors.includes('Haotian Zhang')) structuredAuthors.push('Haotian Zhang');
  await writeFile(path.join(dir,'index.html'),layout({title:`${p.title} · Haotian Zhang`,description:p.summary,pathname:`/publication/${p.id}/`,body,active:'research',schema:{'@context':'https://schema.org','@type':'ScholarlyArticle',name:p.title,url:p.paper,datePublished:p.date,author:structuredAuthors.map(name=>({'@type':name==='NVIDIA'?'Organization':'Person',name}))}}));
}

// Preserve legacy routes without re-publishing unverified or misattributed records.
const legacyDirectories=(await readdir(path.join(root,'content/publication'),{withFileTypes:true})).filter(d=>d.isDirectory()).map(d=>d.name);
for(const id of legacyDirectories.filter(id=>!ids.has(id))) {
  const dir=path.join(out,'publication',id);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),layout({title:'Publication archive · Haotian Zhang',description:'Find publications in the updated research archive.',pathname:'/publication/',body:'<section class="page-header"><h1>Publication archive</h1><p>This link is from an earlier version of the website. <a href="/publication/">Browse the updated publications →</a></p></section>',noindex:true}));
  const oldBib=path.join(root,'content/publication',id,'cite.bib');
  if(await exists(oldBib)) await cp(oldBib,path.join(dir,'cite.bib'));
}
await mkdir(path.join(out,'news'),{recursive:true});
await writeFile(path.join(out,'news/index.html'),layout({title:'Updates · Haotian Zhang',description:'Recent research updates from Haotian Zhang.',pathname:'/news/',body:`<section class="page-header"><a class="back-link" href="/">← Back to homepage</a><h1>Recent updates</h1>${news}</section>`}));
await writeFile(path.join(out,'404.html'),layout({title:'Page not found · Haotian Zhang',description:'This page may have moved. Visit the homepage or research archive.',pathname:'/404.html',body:'<section class="page-header"><p class="eyebrow">404</p><h1>A different path.</h1><p>This page may have moved. Find your way back to the <a href="/">homepage</a> or browse the <a href="/publication/">publication archive</a>.</p></section>',noindex:true}));
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${url('/sitemap.xml')}\n`);
const paths=['/','/publication/','/news/',...publications.map(p=>`/publication/${p.id}/`)];
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${esc(url(p))}</loc><lastmod>${profile.updated}</lastmod></url>`).join('')}</urlset>\n`);
console.log(`Built ${publications.length} verified publications (${selected.length} selected) and ${legacyDirectories.length} compatible legacy routes in public/.`);
