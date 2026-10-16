import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { generatedFiles, loadRepository, publicContent, renderReport, repositoryRoot, shanghaiDate, validateData } from './content.mjs';
import { generate } from './generate.mjs';

const today = '2026-10-16';

/** Return independent valid source data plus one synthetic test-only published report. */
function fixture() {
  const data = structuredClone(loadRepository());
  // Keep test-only dates independent of future additions to the real knowledge archive.
  for (const { data: technology } of data.technologies) {
    for (const source of technology.sources) {
      source.published_at = '2024-01-01';
      source.checked_at = '2024-01-02';
    }
  }
  const technology = data.technologies.find((entry) => entry.data.id === 'alphafold-3').data;
  data.reports = [{ path: 'reports/2025/01/2025-01-01.json', data: {
    version: '1.0', report_type: 'AIxBio-Daily', date: '2025-01-01', title: 'Test-only report', summary: 'Synthetic fixture, never committed to reports.', status: 'published',
    articles: [{
      id: '20250101-001', event_date: '2024-05-08', title: 'Fixture article', summary: 'Fixture summary', category: 'Structure prediction',
      technology_path: technology.technology_path, related_technology_ids: [technology.id],
      technical_details: { problem: 'Fixture problem', method: 'Fixture method', innovation: 'Fixture innovation', limitations: 'Fixture limitations' },
      opportunities: [{ id: '20250101-001-research', title: 'Fixture opportunity', kind: 'research', description: 'Fixture analysis', next_step: 'Fixture action', technology_ids: [technology.id] }],
      sources: structuredClone(technology.sources), verification_status: 'verified', verification_note: 'Test-only evidence fixture',
    }],
  } }];
  return data;
}

/** Assert a mutation is rejected with the intended diagnostic. */
function rejected(mutate, pattern) {
  const data = fixture();
  mutate(data);
  assert.match(validateData(data, { today }).join('\n'), pattern);
}

test('source archive and complete published fixture pass validation', () => {
  assert.deepEqual(validateData(loadRepository(), { today: shanghaiDate() }), []);
  assert.deepEqual(validateData(fixture(), { today }), []);
});

test('Asia/Shanghai date switches at 16:00 UTC', () => {
  assert.equal(shanghaiDate(new Date('2026-10-15T15:59:59Z')), '2026-10-15');
  assert.equal(shanghaiDate(new Date('2026-10-15T16:00:00Z')), '2026-10-16');
});

test('published reports reject pending articles and pending evidence', () => {
  rejected((data) => { data.reports[0].data.articles[0].verification_status = 'pending'; }, /published report contains pending article/);
  rejected((data) => { data.reports[0].data.articles[0].sources[0].verification_status = 'pending'; }, /pending source/);
  rejected((data) => { data.reports[0].data.articles[0].sources = []; }, /requires sources/);
});

test('published report accepts 1–5 items and rejects empty or padded six-item reports', () => {
  rejected((data) => { data.reports[0].data.articles = []; }, /fewer than 1/);
  rejected((data) => { data.reports[0].data.articles = Array(6).fill(data.reports[0].data.articles[0]); }, /more than 5/);
});

test('future reports are rejected, including manual draft records', () => {
  rejected((data) => { data.reports[0].data.date = '2026-10-17'; data.reports[0].data.status = 'draft'; }, /future report date/);
});

test('report path, article ID, and event date must match the archive date', () => {
  rejected((data) => { data.reports[0].path = 'reports/2025/02/2025-01-01.json'; }, /must match YYYY/);
  rejected((data) => { data.reports[0].data.articles[0].id = '20250102-001'; }, /article ID must match/);
  rejected((data) => { data.reports[0].data.articles[0].event_date = '2025-01-02'; }, /event date is after/);
  rejected((data) => { data.reports[0].data.date = '2025-02-30'; }, /must match format/);
});

test('evidence requires coherent publication/check/report dates and notes', () => {
  rejected((data) => { data.reports[0].data.articles[0].sources[0].published_at = '2025-01-02'; }, /source dates are incoherent/);
  rejected((data) => { data.technologies[0].data.sources[0].checked_at = '2026-10-17'; }, /source dates are incoherent/);
  rejected((data) => { data.technologies[0].data.sources[0].checked_at = '2020-01-01'; }, /source dates are incoherent/);
  rejected((data) => { data.reports[0].data.articles[0].sources[0].verification_note = ' '; }, /must match pattern/);
});

test('foundational knowledge also rejects pending, duplicate, or unsafe evidence', () => {
  rejected((data) => { data.technologies[0].data.sources[0].verification_status = 'pending'; }, /pending source/);
  rejected((data) => { data.technologies[0].data.sources.push(structuredClone(data.technologies[0].data.sources[0])); }, /duplicate https/);
  rejected((data) => { data.technologies[0].data.sources[0].url = 'javascript:alert(1)'; }, /must match pattern/);
  rejected((data) => { data.technologies[0].data.sources[0].url = 'https://name:secret@example.com/paper'; }, /credential-free/);
});

test('duplicate article/technology/taxonomy/opportunity IDs are rejected', () => {
  rejected((data) => { data.reports[0].data.articles.push(structuredClone(data.reports[0].data.articles[0])); }, /articles: duplicate/);
  rejected((data) => { data.technologies.push(structuredClone(data.technologies[0])); }, /technologies: duplicate/);
  rejected((data) => { data.taxonomy.push(structuredClone(data.taxonomy[0])); }, /taxonomy: duplicate/);
  rejected((data) => { data.reports[0].data.articles[0].opportunities.push(structuredClone(data.reports[0].data.articles[0].opportunities[0])); }, /opportunities: duplicate/);
});

test('taxonomy levels/parent links, technology references and relationships are checked', () => {
  rejected((data) => { data.taxonomy[1].parent_id = 'missing'; }, /parent must connect/);
  rejected((data) => { data.technologies[0].data.technology_path[5] = 'ai-science'; }, /must NOT have duplicate items|invalid taxonomy path/);
  rejected((data) => { data.technologies[0].data.related_ids = ['missing']; }, /unknown technology/);
  rejected((data) => { data.reports[0].data.articles[0].related_technology_ids = ['scgpt']; }, /taxonomy path must match/);
  rejected((data) => { data.relationships = [{ source_id: 'alphafold-3', target_id: 'missing', kind: 'complements' }]; }, /unknown technology/);
  rejected((data) => { data.relationships = Array(2).fill({ source_id: 'alphafold-3', target_id: 'scgpt', kind: 'complements' }); }, /relationships: duplicate/);
  rejected((data) => { data.technologies[0].data.sources[0].organization_ids = ['missing']; }, /unknown organization/);
});

test('opportunities must belong to the article and use its linked technologies', () => {
  rejected((data) => { data.reports[0].data.articles[0].opportunities[0].id = 'unrelated'; }, /opportunity ID must start/);
  rejected((data) => { data.reports[0].data.articles[0].opportunities[0].technology_ids = ['scgpt']; }, /opportunity technology must be linked/);
});

test('drafts cannot leak into public reports, articles, opportunities, or any index', () => {
  const data = fixture();
  const draft = structuredClone(data.reports[0]);
  draft.path = 'reports/2025/01/2025-01-02.json';
  draft.data.date = '2025-01-02';
  draft.data.title = 'SECRET DRAFT';
  draft.data.status = 'draft';
  const article = draft.data.articles[0];
  article.id = '20250102-001';
  article.title = 'SECRET DRAFT ARTICLE';
  article.verification_status = 'pending';
  data.organizations.push({ id: 'draft-only-org', name: 'SECRET DRAFT ORGANIZATION', english_name: 'SECRET DRAFT ORGANIZATION', url: 'https://secret-draft.example.com/' });
  article.sources[0].organization_ids = ['draft-only-org'];
  article.sources[0].verification_status = 'pending';
  article.opportunities[0].id = '20250102-001-research';
  article.opportunities[0].title = 'SECRET DRAFT OPPORTUNITY';
  data.reports.push(draft);
  assert.deepEqual(validateData(data, { today }), []);
  const publicData = publicContent(data);
  assert.equal(publicData.reports.length, 1);
  assert.equal(publicData.articles.length, 1);
  assert.equal(publicData.opportunities.length, 1);
  assert.equal(JSON.stringify(publicData).includes('SECRET DRAFT'), false);
  for (const [path, text] of generatedFiles(data)) {
    if (path.startsWith('indexes/')) assert.equal(text.includes('SECRET DRAFT'), false, path);
  }
  const organizationIndex = generatedFiles(data).get('indexes/organization-index.json');
  assert.equal(organizationIndex.includes('draft-only-org'), false);
  assert.equal(organizationIndex.includes('secret-draft.example.com'), false);
  assert.equal(organizationIndex.includes('google-deepmind'), true);
  assert.throws(() => publicContent({ ...data, reports: [{ ...data.reports[0], data: { ...data.reports[0].data, articles: [] } }] }), /Cannot publish invalid content/);
});

test('Markdown rendering is deterministic, complete and escapes markup', () => {
  const data = fixture();
  const report = data.reports[0].data;
  report.articles[0].title = '<script>alert(1)</script> [link]';
  report.articles[0].sources[0].url = 'https://example.com/paper(version)';
  const rendered = renderReport(report, data.taxonomy);
  assert.equal(rendered, renderReport(structuredClone(report), data.taxonomy));
  assert.match(rendered, /&lt;script&gt;/);
  assert.match(rendered, /事件日期：2024-05-08/);
  assert.match(rendered, /核验记录/);
  assert.match(rendered, /Fixture limitations/);
  assert.match(rendered, /Fixture opportunity/);
  assert.match(rendered, /paper%28version%29/);
});

test('generation is idempotent; check mode catches edited/stale Markdown and orphan archives', () => {
  const root = mkdtempSync(join(tmpdir(), 'aixbio-content-'));
  try {
    cpSync(join(repositoryRoot, 'knowledge'), join(root, 'knowledge'), { recursive: true });
    mkdirSync(join(root, 'reports'), { recursive: true });
    const { path, data: report } = fixture().reports[0];
    const jsonPath = join(root, path);
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(report));
    assert.equal(generate({ root }), 5);
    const first = [...generatedFiles(loadRepository(root))].map(([path]) => [path, readFileSync(join(root, path), 'utf8')]);
    assert.equal(generate({ root, check: true }), 5);
    assert.equal(generate({ root }), 5);
    for (const [path, text] of first) assert.equal(readFileSync(join(root, path), 'utf8'), text);
    writeFileSync(jsonPath.replace(/\.json$/, '.md'), 'edited independently');
    assert.throws(() => generate({ root, check: true }), /Generated files are stale/);
    generate({ root });
    writeFileSync(join(root, 'reports/2025/01/2025-01-02.md'), 'orphan');
    assert.throws(() => generate({ root }), /Orphan generated archive/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
