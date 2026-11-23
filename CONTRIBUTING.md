# Contributing to mushaf.js

Thank you for helping. Bug reports, fixes, documentation and ideas are all welcome.

## Reporting a problem

Open an issue with:

- what you expected and what happened instead,
- the page number (and surah:ayah or word) where you see it,
- your browser and version, and a screenshot if it's visual.

Rendering details matter in a mushaf. If a line, glyph, marker or highlight looks different
from the printed Madinah Mushaf, please mention the page and line, ideally with a photo or
scan of the printed page for comparison.

The Qur'an text, page layout and glyph codes come from
[QUL](https://qul.tarteel.ai/). If you find a mistake in the text itself, please report it
to us anyway; we'll check whether it comes from the source data.

## Development setup

You need Node.js 22 or newer.

```bash
git clone https://github.com/YouBar/mushaf-js.git
cd mushaf-js
npm ci
```

| Command | What it does |
|---------|--------------|
| `npm test` | Run the test suite (Vitest with jsdom) |
| `npm run typecheck` | Type-check all packages |
| `npm run build` | Build `packages/core` and `packages/vue` into `dist/` |
| `npm run build:browser -w packages/core` | Build the browser bundle (`dist/mushaf.min.js`) |
| `npm run docs:dev` | Run the documentation site locally |
| `npm run build-data` | Rebuild `data/pages/`, `page-index.json` and `quran-index.json` from `data/source/` |
| `npm run demo` | Serve the demo page at `http://localhost:8090/examples/basic.html` |

To check changes visually, build the core package and open the demo page, which uses the
local `data/` and `fonts/`:

```bash
npm run build -w packages/core
npm run demo
```

Pages 1–2 (centred lines), 9 and 582–604 (every kind of margin marker) are good pages to
check.

## Repository layout

```
packages/core     the library (TypeScript), published as `mushaf.js`
packages/vue      the Vue 3 component, published as `@mushafjs/vue`
data/source       original QUL data (not edited by hand)
data/pages        generated page files (001.json … 604.json)
fonts             QPC V2 page fonts, the basmala/title font and the surah banner
scripts           data build scripts and the demo server (TypeScript)
docs              documentation site (VitePress)
examples          a self-hosted demo page
```

## Making a change

1. Fork the repository and create a branch from `develop`.
2. Keep the change focused: one fix or feature per pull request.
3. Add or update tests for behaviour changes, and update the docs when the public API or
   options change.
4. Make sure `npm test`, `npm run typecheck` and `npm run build` pass.
5. Open a pull request against `develop`, describing what changed and why. Add a screenshot
   for visual changes.

### Code style

- TypeScript, no runtime dependencies in `packages/core`.
- Prefer clear names over comments. Add a comment only where the code can't explain itself,
  such as a font quirk or why something is measured instead of computed.
- Public options and methods get a short doc comment, since it shows up in editors.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add onRubClick callback
fix: keep the selection when clearing other highlights
docs: explain self-hosting the fonts
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

### Page data and fonts

`data/pages/` and the indexes are generated: change the scripts, not the generated files,
and include the regenerated files in your pull request. The hosted copies on
`cdn.mushafjs.com` are updated by the maintainers after a release.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
