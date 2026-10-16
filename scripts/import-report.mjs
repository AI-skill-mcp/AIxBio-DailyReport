import { closeSync, fstatSync, linkSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { loadRepository, repositoryRoot, validateData } from './content.mjs';

/** Check/create archive directories below root; reject file or symbolic-link traversal. */
function archiveDirectory(root, segments, create = false) {
  let directory = root;
  for (const segment of segments) {
    directory = join(directory, segment);
    let stat;
    try { stat = lstatSync(directory); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return;
      mkdirSync(directory);
      stat = lstatSync(directory);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe archive directory: ${directory}`);
  }
}

/** Run synchronous import work under an exclusive reports lock; release only our own inode. */
export function withImportLock(root, run) {
  const lock = join(root, 'reports/.import-report.lock');
  let descriptor;
  try { descriptor = openSync(lock, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Report import locked: reports/.import-report.lock exists. An import may be running or may have crashed; inspect it before removing a stale lock.');
    throw error;
  }
  try {
    writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() })}\n`);
    return run();
  } finally {
    try {
      const owned = fstatSync(descriptor);
      const current = lstatSync(lock);
      if (owned.dev === current.dev && owned.ino === current.ino) unlinkSync(lock);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    finally { closeSync(descriptor); }
  }
}

/** Validate a candidate against all archives, then atomically import JSON without overwriting a day. */
export function importReport({ file, root = repositoryRoot }) {
  const report = JSON.parse(readFileSync(file, 'utf8'));
  if (!report || typeof report.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(report.date)) {
    throw new Error('Candidate requires a YYYY-MM-DD date; output paths cannot be supplied.');
  }
  const actualRoot = realpathSync(root);
  archiveDirectory(actualRoot, ['reports']);
  return withImportLock(actualRoot, () => importCandidate(actualRoot, report));
}

/** Validate and atomically link a candidate while the caller holds the repository import lock. */
function importCandidate(actualRoot, report) {
  const segments = ['reports', report.date.slice(0, 4), report.date.slice(5, 7)];
  archiveDirectory(actualRoot, segments);
  const path = `${segments.join('/')}/${report.date}.json`;
  const destination = join(actualRoot, path);
  const data = loadRepository(actualRoot);
  const existing = data.reports.find((entry) => entry.path === path);
  const candidate = { ...data, reports: [...data.reports.filter((entry) => entry.path !== path), { path, data: report }] };
  const errors = validateData(candidate);
  if (errors.length) throw new Error(`Candidate validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  if (existing) {
    if (isDeepStrictEqual(existing.data, report)) return { status: 'unchanged', path };
    throw new Error(`Report conflict: ${path} already exists with different content; review an explicit revision instead.`);
  }

  archiveDirectory(actualRoot, segments, true);
  const staging = mkdtempSync(join(dirname(destination), '.import-report-'));
  try {
    const temporary = join(staging, 'candidate.tmp');
    writeFileSync(temporary, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    try { linkSync(temporary, destination); }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error(`Report conflict: ${path} appeared during import; rerun to compare safely.`);
      throw error;
    }
  } finally { rmSync(staging, { recursive: true, force: true }); }
  return { status: 'imported', path };
}

/** Import one candidate path for the CLI; fail without publishing or changing generated archives. */
function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || args[0].startsWith('-')) throw new Error('Usage: pnpm import:report <candidate.json>');
    const result = importReport({ file: resolve(args[0]) });
    console.log(`${result.status === 'imported' ? 'Imported' : 'Unchanged'} ${result.path}. Run pnpm generate, pnpm check, pnpm test and pnpm build before publishing.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
