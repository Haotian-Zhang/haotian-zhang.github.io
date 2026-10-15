# Haotian Zhang — research homepage

A small, responsive academic website for [haotian-zhang.github.io](https://haotian-zhang.github.io/). The design takes inspiration from [Jon Barron's research page](https://jonbarron.info/) and [Minimal Light](https://minimal-light-theme.yliu.me/), with an original implementation. It combines research publications with industry experience.

## Edit the site

- `site/data/profile.json`: affiliation, contact links, and last-updated date.
- `site/data/publications.json`: verified publication metadata, ordered authors, links, summaries, and source references. Set `featured: true` to show a paper on the homepage. `year` is the venue year; `date` is the original publication or submission date at its known precision.
- `scripts/build.mjs`: homepage biography, news, experience, education, page templates, and static generation.
- `site/assets/style.css`: layout, typography, and mobile styles.
- `site/assets/papers/provenance.json`: attribution and source information for research figures. Figures retain their original authors' rights.

The original Hugo content and uploaded CV remain in the repository as source history. They are not the current publication catalog. The older CV URL is preserved for compatibility, but the homepage does not advertise the outdated CV.

## Build and preview

Use Node.js 24 or newer. No package installation is required.

```sh
node scripts/build.mjs
node scripts/check.mjs
python3 -m http.server 8765 --directory public
```

Open `http://localhost:8765`. Serve the generated `public/` directory, since the site uses root-relative URLs. Do not open `index.html` directly from the filesystem.

All pages, publication details, and citations are static HTML/files. JavaScript only enhances the archive with search and filters. Instrument Serif and Manrope are self-hosted, with their OFL licenses in `site/assets/fonts/`. There are no third-party font requests, trackers, or runtime API dependencies.

## GitHub Pages

The workflow builds and checks pull requests and pushes to `main`. A successful `main` build publishes `public/` to the existing `gh-pages` branch. It can also be started manually from the Actions tab.

Keep **Settings → Pages → Deploy from a branch → `gh-pages` → `/ (root)`**. The workflow preserves the existing branch's history and uses the repository's built-in `GITHUB_TOKEN`. No new hosting service or secret is needed.

The previous deployment targeted the retired `ubuntu-20.04` runner and never started. The replacement uses `ubuntu-latest`, a pinned Node major version, and an independent validation job before publishing.

## Content verification

The October 2026 refresh checked all 42 former publication entries. The new catalog includes 32 verified works, adds Cosmos 3, repairs metadata and unrelated-paper links, and omits namesake or unsupported authorship records and a withdrawn submission. See `site/data/publication-audit.json` for the source-backed review. The large Cosmos 3 and Apple foundation-model reports use explicit team bylines; their supplied citations use abbreviated author lists.

Old `/publication/` URLs, existing citation downloads, `/news/`, `/uploads/resume.pdf`, and the Google verification file remain reachable. Legacy records excluded from the new catalog lead to the updated archive. Homepage anchors from the previous site are preserved.

The existing repository license is retained in `LICENSE.md`.
