import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { generatedFiles, repositoryRoot, validatedRepository } from './content.mjs';

export { generatedFiles, publicContent, renderReport } from './content.mjs';

/** List generated Markdown archives recursively; return repository-relative paths. */
function reportMarkdown(root, directory = join(root, 'reports')) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? reportMarkdown(root, path) : /^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name) ? [relative(root, path)] : [];
  });
}

/** Generate or check derived files at root; never delete stale/orphan content silently. */
export function generate({ root = repositoryRoot, check = false } = {}) {
  const files = generatedFiles(validatedRepository(root));
  const stale = [];
  for (const path of reportMarkdown(root)) {
    if (!files.has(path)) throw new Error(`Orphan generated archive ${path}: restore its JSON or remove it explicitly.`);
  }
  for (const [path, content] of files) {
    const absolute = join(root, path);
    if (existsSync(absolute) && readFileSync(absolute, 'utf8') === content) continue;
    if (check) stale.push(path);
    else {
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, content);
    }
  }
  if (stale.length) throw new Error(`Generated files are stale. Run pnpm generate and commit:\n${stale.join('\n')}`);
  return files.size;
}

/** Run generation/check for the CLI and communicate a failing status to CI. */
function main() {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--check')) throw new Error('Usage: node scripts/generate.mjs [--check]');
    console.log(`${args.includes('--check') ? 'Checked' : 'Generated'} ${generate({ check: args.includes('--check') })} files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
