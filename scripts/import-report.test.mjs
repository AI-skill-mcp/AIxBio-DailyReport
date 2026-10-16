import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { loadRepository, repositoryRoot, sourceIdentity, validateData } from './content.mjs';
import { importReport, withImportLock } from './import-report.mjs';

/** Build synthetic historical candidate content; this data never enters the real archive. */
function report(date = '2025-01-01') {
  const technology = loadRepository().technologies.find((entry) => entry.data.id === 'alphafold-3').data;
  const source = { ...technology.sources[0], published_at: '2024-05-08', checked_at: '2024-05-09', url: 'https://example.org/verified-paper' };
  return {
    version: '1.0', report_type: 'AIxBio-Daily', date, title: 'Synthetic import fixture', summary: 'Test-only report.', status: 'published',
    articles: [{
      id: `${date.replaceAll('-', '')}-001`, event_date: '2024-05-08', title: 'Test-only event', summary: 'Synthetic article.', category: 'Structure prediction',
      technology_path: technology.technology_path, related_technology_ids: [technology.id],
      technical_details: { problem: 'Test problem', method: 'Test method', innovation: 'Test innovation', limitations: 'Test limitation' },
      opportunities: [], sources: [source], verification_status: 'verified', verification_note: 'Synthetic evidence, only used by tests.',
    }],
  };
}

/** Run a test in an isolated repository and remove all temporary content afterward. */
async function withRepository(run) {
  const workspace = mkdtempSync(join(tmpdir(), 'aixbio-import-'));
  const root = join(workspace, 'repository');
  const file = join(workspace, 'candidate.json');
  mkdirSync(root);
  cpSync(join(repositoryRoot, 'knowledge'), join(root, 'knowledge'), { recursive: true });
  mkdirSync(join(root, 'reports'));
  mkdirSync(join(root, 'indexes'));
  writeFileSync(join(root, 'indexes/sentinel.json'), '{"unchanged":true}\n');
  try { await run({ root, file, workspace }); }
  finally { rmSync(workspace, { recursive: true, force: true }); }
}

/** Snapshot file paths and bytes recursively to detect any unintended archive writes. */
function snapshot(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? snapshot(root, path) : [[relative(root, path), readFileSync(path, 'utf8')]];
  }).sort(([a], [b]) => a.localeCompare(b));
}

test('import is atomic and same-day reruns ignore formatting/key order without rewriting', () => withRepository(({ root, file }) => {
  const candidate = report();
  writeFileSync(file, JSON.stringify(candidate));
  assert.deepEqual(importReport({ root, file }), { status: 'imported', path: 'reports/2025/01/2025-01-01.json' });
  const first = snapshot(root);
  writeFileSync(file, JSON.stringify(Object.fromEntries(Object.entries(candidate).reverse()), null, 4));
  assert.equal(importReport({ root, file }).status, 'unchanged');
  assert.deepEqual(snapshot(root), first);
  assert.deepEqual(readdirSync(join(root, 'reports/2025/01')), ['2025-01-01.json']);
}));

test('same-day changed content conflicts and preserves every existing file', () => withRepository(({ root, file }) => {
  const candidate = report();
  writeFileSync(file, JSON.stringify(candidate));
  importReport({ root, file });
  const before = snapshot(root);
  candidate.summary = 'Different content must be reviewed explicitly.';
  writeFileSync(file, JSON.stringify(candidate));
  assert.throws(() => importReport({ root, file }), /Report conflict/);
  assert.deepEqual(snapshot(root), before);
}));

test('invalid candidate or pre-existing repository semantics fail before any archive write', () => withRepository(({ root, file }) => {
  const candidate = report();
  candidate.articles[0].verification_status = 'pending';
  writeFileSync(file, JSON.stringify(candidate));
  const before = snapshot(root);
  assert.throws(() => importReport({ root, file }), /published report contains pending article/);
  assert.deepEqual(snapshot(root), before);
  writeFileSync(file, JSON.stringify(report()));
  const taxonomy = JSON.parse(readFileSync(join(root, 'knowledge/taxonomy.json'), 'utf8'));
  taxonomy[1].parent_id = 'unknown';
  writeFileSync(join(root, 'knowledge/taxonomy.json'), JSON.stringify(taxonomy));
  const invalid = snapshot(root);
  assert.throws(() => importReport({ root, file }), /parent must connect/);
  assert.deepEqual(snapshot(root), invalid);
}));

test('dates cannot traverse output paths and archive symlinks cannot redirect writes', () => withRepository(({ root, file, workspace }) => {
  const candidate = report();
  candidate.date = '../../outside';
  writeFileSync(file, JSON.stringify(candidate));
  const before = snapshot(root);
  assert.throws(() => importReport({ root, file }), /YYYY-MM-DD/);
  assert.deepEqual(snapshot(root), before);
  const outside = join(workspace, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, join(root, 'reports/2025'), 'dir');
  writeFileSync(file, JSON.stringify(report()));
  assert.throws(() => importReport({ root, file }), /Unsafe archive directory/);
  assert.deepEqual(readdirSync(outside), []);
}));

test('write conflict cleans staging and creates no partial JSON/Markdown/index files', () => withRepository(({ root, file }) => {
  mkdirSync(join(root, 'reports/2025/01/2025-01-01.json'), { recursive: true });
  const before = snapshot(root);
  writeFileSync(file, JSON.stringify(report()));
  assert.throws(() => importReport({ root, file }), /appeared during import/);
  assert.deepEqual(snapshot(root), before);
  assert.deepEqual(readdirSync(join(root, 'reports/2025/01')), ['2025-01-01.json']);
}));

test('URL identity removes tracking/fragments, sorts query keys and preserves meaningful parameters', () => {
  assert.equal(sourceIdentity('https://EXAMPLE.org:443/paper/?utm_source=x#section'), 'https://example.org/paper');
  assert.equal(sourceIdentity('https://example.org/paper?b=2&a=1&fbclid=tracking'), 'https://example.org/paper?a=1&b=2');
  assert.notEqual(sourceIdentity('https://example.org/paper?id=1'), sourceIdentity('https://example.org/paper?id=2'));
  assert.equal(sourceIdentity('https://example.org/%65vent/%7euser'), 'https://example.org/event/~user');
  assert.equal(sourceIdentity('https://example.org/event%2fpart'), 'https://example.org/event%2Fpart');
  assert.notEqual(sourceIdentity('https://example.org/event%2Fpart'), sourceIdentity('https://example.org/event/part'));
});

test('published duplicates are rejected across report dates after URL normalization, without writes', () => withRepository(({ root, file }) => {
  writeFileSync(file, JSON.stringify(report()));
  importReport({ root, file });
  const before = snapshot(root);
  const duplicate = report('2025-01-02');
  duplicate.articles[0].sources[0].url = 'https://EXAMPLE.org:443/%76erified-paper/?utm_medium=email#abstract';
  writeFileSync(file, JSON.stringify(duplicate));
  assert.throws(() => importReport({ root, file }), /duplicate published event/);
  assert.deepEqual(snapshot(root), before);
}));

test('independent primary events may share a background source without being treated as duplicate news', () => withRepository(({ root, file }) => {
  const first = report();
  const background = { ...first.articles[0].sources[0], url: 'https://example.org/background-paper' };
  first.articles[0].sources.push(background);
  writeFileSync(file, JSON.stringify(first));
  importReport({ root, file });
  const second = report('2025-01-02');
  second.articles[0].sources[0].url = 'https://example.org/independent-event';
  second.articles[0].sources.push(background);
  writeFileSync(file, JSON.stringify(second));
  assert.equal(importReport({ root, file }).status, 'imported');
  assert.deepEqual(validateData(loadRepository(root)), []);
}));

test('existing or stale locks reject imports without changing files or deleting another owner lock', () => withRepository(({ root, file }) => {
  const lock = join(root, 'reports/.import-report.lock');
  writeFileSync(lock, 'retained lock metadata');
  writeFileSync(file, JSON.stringify(report()));
  const before = snapshot(root);
  assert.throws(() => importReport({ root, file }), /may have crashed; inspect it/);
  assert.deepEqual(snapshot(root), before);
}));

test('validation failures release the owned lock and replacement locks are never deleted', () => withRepository(({ root, file }) => {
  const lock = join(root, 'reports/.import-report.lock');
  const invalid = report();
  invalid.articles[0].verification_status = 'pending';
  writeFileSync(file, JSON.stringify(invalid));
  assert.throws(() => importReport({ root, file }), /Candidate validation failed/);
  assert.equal(existsSync(lock), false);
  withImportLock(root, () => {
    unlinkSync(lock);
    writeFileSync(lock, 'replacement owner');
  });
  assert.equal(readFileSync(lock, 'utf8'), 'replacement owner');
}));

test('concurrent importer is rejected until the owning process releases its repository lock', { timeout: 10000 }, () => withRepository(async ({ root, file }) => {
  writeFileSync(file, JSON.stringify(report('2025-01-02')));
  const module = new URL('./import-report.mjs', import.meta.url).href;
  const code = `import { withImportLock } from ${JSON.stringify(module)}; import { readFileSync } from 'node:fs'; withImportLock(${JSON.stringify(root)}, () => { process.stdout.write('locked\\n'); readFileSync(0); });`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['pipe', 'pipe', 'pipe'] });
  const exited = once(child, 'exit');
  try {
    await Promise.race([once(child.stdout, 'data'), exited.then(([status]) => { throw new Error(`Lock holder exited early: ${status}`); })]);
    const held = snapshot(root);
    assert.throws(() => importReport({ root, file }), /Report import locked/);
    assert.deepEqual(snapshot(root), held);
  } finally { child.stdin.end(); await exited; }
  assert.equal(existsSync(join(root, 'reports/.import-report.lock')), false);
  assert.equal(importReport({ root, file }).status, 'imported');
}));

test('draft duplicates remain reviewable and a supported different event date remains publishable', () => withRepository(({ root, file }) => {
  writeFileSync(file, JSON.stringify(report()));
  importReport({ root, file });
  const draft = report('2025-01-02');
  draft.status = 'draft';
  writeFileSync(file, JSON.stringify(draft));
  assert.equal(importReport({ root, file }).status, 'imported');
  const update = report('2025-01-03');
  update.articles[0].event_date = '2025-01-02';
  update.articles[0].sources[0].published_at = '2025-01-02';
  update.articles[0].sources[0].checked_at = '2025-01-03';
  update.articles[0].verification_note = 'Synthetic fixture for a supported new version, distinct event date.';
  writeFileSync(file, JSON.stringify(update));
  assert.equal(importReport({ root, file }).status, 'imported');
  assert.deepEqual(validateData(loadRepository(root)), []);
}));
