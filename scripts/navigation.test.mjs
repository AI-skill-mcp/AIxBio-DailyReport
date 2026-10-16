import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { navigationIndex, renderNavigationIndex, validateNavigation } from './navigation.mjs';
import { generate } from './generate.mjs';
import { repositoryRoot } from './content.mjs';

/** Return an independent two-technology hierarchy plus one deliberately empty domain. */
function fixture() {
  return {
    version: '1.0', updated_at: '2026-10-16', domains: [
      { id: 'molecular-design', name: '分子设计', english_name: 'Molecular Design', description: '分子研究方向。', routes: [
        { id: 'structure-evaluation', name: '结构与评测', english_name: 'Structure & Evaluation', description: '区分预测与评测。', entries: [
          { id: 'structure-methods', name: '结构预测', description: '预测给定分子的结构。', research_object: '分子复合物', primary_output: '预测结构', discriminator: '直接产出预测坐标。', boundary: '不包含只评价预测的项目。', members: [{ technology_id: 'alpha', role: '预测模型' }] },
          { id: 'blind-assessment', name: '盲测评估', description: '评价模型提交。', research_object: '提交与实验参照', primary_output: '评价结果', discriminator: '向参测者隐藏实验参照。', boundary: '不作为被测预测模型。', members: [{ technology_id: 'beta', role: '评测方法' }] },
        ] },
      ] },
      { id: 'cell-systems', name: '细胞与系统建模', english_name: 'Cell & Systems Modeling', description: '预留独立领域。', routes: [] },
    ],
  };
}

test('navigation allows empty domains while covering every known technology exactly once', () => {
  const navigation = fixture();
  const before = structuredClone(navigation);
  assert.deepEqual(validateNavigation(navigation, ['alpha', 'beta']), []);
  assert.deepEqual(navigation, before);
});

test('unknown, omitted and repeated technology memberships are rejected', () => {
  const unknown = fixture();
  unknown.domains[0].routes[0].entries[0].members[0].technology_id = 'unknown';
  assert.match(validateNavigation(unknown, ['alpha', 'beta']).join('\n'), /unknown technology unknown/);
  assert.match(validateNavigation(unknown, ['alpha', 'beta']).join('\n'), /missing membership for technology alpha/);
  const duplicate = fixture();
  duplicate.domains[0].routes[0].entries[1].members.push({ technology_id: 'alpha', role: '重复挂接' });
  assert.match(validateNavigation(duplicate, ['alpha', 'beta']).join('\n'), /duplicate membership for technology alpha/);
});

test('node IDs are globally unique across domains, routes and entries', () => {
  const navigation = fixture();
  navigation.domains[0].routes[0].entries[0].id = 'cell-systems';
  assert.match(validateNavigation(navigation, ['alpha', 'beta']).join('\n'), /duplicate node ID cell-systems/);
});

test('classification requires object, output, distinguishing feature and boundary', () => {
  for (const field of ['research_object', 'primary_output', 'discriminator', 'boundary']) {
    const navigation = fixture();
    navigation.domains[0].routes[0].entries[0][field] = ' ';
    assert.match(validateNavigation(navigation, ['alpha', 'beta']).join('\n'), new RegExp(`${field}: must match pattern`));
  }
  const missing = fixture();
  delete missing.domains[0].routes[0].entries[0].discriminator;
  assert.match(validateNavigation(missing, ['alpha', 'beta']).join('\n'), /required property 'discriminator'/);
});

test('routes need entries; unpopulated entries are allowed while existing technologies still need membership', () => {
  const noEntries = fixture();
  noEntries.domains[0].routes[0].entries = [];
  assert.match(validateNavigation(noEntries, ['alpha', 'beta']).join('\n'), /entries: must NOT have fewer than 1 items/);
  const noMembers = fixture();
  noMembers.domains[0].routes[0].entries[0].members = [];
  assert.match(validateNavigation(noMembers, ['alpha', 'beta']).join('\n'), /missing membership for technology alpha/);
  const expanded = fixture();
  expanded.domains[0].routes[0].entries.push({ ...expanded.domains[0].routes[0].entries[0], id: 'new-method-family', members: [] });
  assert.deepEqual(validateNavigation(expanded, ['alpha', 'beta']), []);
});

test('standalone JSON retains all domains/routes and flattened classification decision fields', () => {
  const navigation = fixture();
  const index = navigationIndex(navigation);
  assert.deepEqual(index.domains[1], { id: 'cell-systems', name: '细胞与系统建模', english_name: 'Cell & Systems Modeling', description: '预留独立领域。', route_ids: [] });
  assert.deepEqual(index.routes[0].entry_ids, ['structure-methods', 'blind-assessment']);
  assert.deepEqual(index.entries[0].path, ['molecular-design', 'structure-evaluation', 'structure-methods']);
  assert.deepEqual(index.entries[0].technology_ids, ['alpha']);
  for (const field of ['research_object', 'primary_output', 'discriminator', 'boundary']) assert.equal(index.entries[0][field], navigation.domains[0].routes[0].entries[0][field]);
  index.entries[0].members[0].role = 'changed copy';
  assert.equal(navigation.domains[0].routes[0].entries[0].members[0].role, '预测模型');
});

test('Markdown is deterministic, starts with domain overview, and escapes source markup', () => {
  const navigation = fixture();
  navigation.domains[0].routes[0].entries[0].discriminator = '<script>test</script> [external]';
  const markdown = renderNavigationIndex(navigation);
  assert.equal(markdown, renderNavigationIndex(structuredClone(navigation)));
  assert.ok(markdown.indexOf('领域与路线概览') < markdown.indexOf('核心技术条目'));
  assert.match(markdown, /暂无已收录路线/);
  assert.match(markdown, /&lt;script&gt;/);
  assert.match(markdown, /最具辨识特点/);
  assert.match(markdown, /分类边界/);
  assert.match(markdown, /后续情报优先按本清单匹配主要研究对象与交付结果/);
  assert.match(markdown, /\.\.\/docs\/classification\.md/);
});

test('generation checks reject stale navigation JSON and Markdown after the source changes', () => {
  const root = mkdtempSync(join(tmpdir(), 'aixbio-navigation-'));
  try {
    cpSync(join(repositoryRoot, 'knowledge'), join(root, 'knowledge'), { recursive: true });
    mkdirSync(join(root, 'reports'));
    assert.equal(generate({ root }), 6);
    assert.equal(generate({ root, check: true }), 6);
    const path = join(root, 'knowledge/technology-navigation.json');
    const navigation = JSON.parse(readFileSync(path, 'utf8'));
    navigation.domains[0].routes[0].entries[0].discriminator += ' 更新后的区分说明。';
    writeFileSync(path, JSON.stringify(navigation));
    assert.throws(() => generate({ root, check: true }), /indexes\/technology-navigation\.json[\s\S]*indexes\/technology-navigation\.md/);
    generate({ root });
    assert.equal(generate({ root, check: true }), 6);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
