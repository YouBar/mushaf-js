/**
 * Runs as `prepack` in packages/core and packages/vue: puts README.md and LICENSE in the
 * package directory, with relative links rewritten to absolute URLs so they work on
 * npmjs.com. Docs pages link to mushafjs.com, other repo files to GitHub.
 *
 *   tsx ../../scripts/package-readme.ts [readme source, relative to the repo root]
 *
 * Without an argument only LICENSE is copied (the package keeps its own tracked README).
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/YouBar/mushaf-js';
const SITE = 'https://mushafjs.com';
const BRANCH = 'develop';

const pkgDir = process.cwd();
copyFileSync(join(ROOT, 'LICENSE'), join(pkgDir, 'LICENSE'));
if (!process.argv[2]) {
  console.log(`package-readme: LICENSE → ${relative(ROOT, pkgDir)}/`);
  process.exit(0);
}
const source = join(ROOT, process.argv[2]);
const sourceDir = relative(ROOT, dirname(source));

/** Absolute URL for a link found in `source`, or undefined to leave it alone. */
function absolutize(link: string): string | undefined {
  if (/^([a-z]+:|#|\/\/)/i.test(link)) return undefined;
  const [path, hash = ''] = link.split('#');
  const repoPath = posix.normalize(posix.join(sourceDir.split('\\').join('/'), path));
  const anchor = hash ? `#${hash}` : '';

  // docs/public/* is served from the site root; docs/**/*.md are site pages.
  if (repoPath.startsWith('docs/public/')) return `${SITE}/${repoPath.slice('docs/public/'.length)}`;
  if (repoPath.startsWith('docs/') && repoPath.endsWith('.md')) {
    const page = repoPath.slice('docs/'.length, -'.md'.length).replace(/(^|\/)index$/, '$1');
    return `${SITE}/${page}${anchor}`;
  }
  const kind = /\.(png|jpe?g|gif|svg|webp)$/i.test(repoPath) ? 'raw' : repoPath.endsWith('/') ? 'tree' : 'blob';
  return `${REPO}/${kind}/${BRANCH}/${repoPath.replace(/\/$/, '')}${anchor}`;
}

const rewrite = (_: string, before: string, link: string, after: string) =>
  `${before}${absolutize(link) ?? link}${after}`;

const readme = readFileSync(source, 'utf8')
  .replace(/(\]\()([^)\s]+)(\))/g, rewrite) // [text](link)
  .replace(/(\b(?:src|href)=")([^"]+)(")/g, rewrite); // <img src="…">, <a href="…">

writeFileSync(join(pkgDir, 'README.md'), readme);
console.log(`package-readme: ${relative(ROOT, source)} → ${relative(ROOT, pkgDir)}/README.md (+ LICENSE)`);
