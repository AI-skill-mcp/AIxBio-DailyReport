import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../schemas/technology-navigation.schema.json' with { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const checkShape = ajv.compile(schema);

/** Validate navigation and one-to-one technology memberships; return diagnostics without mutating inputs. */
export function validateNavigation(navigation, technologyIds) {
  if (!checkShape(navigation)) return checkShape.errors.map((error) => `navigation${error.instancePath}: ${error.message}`);
  if (!Array.isArray(technologyIds) || technologyIds.some((id) => typeof id !== 'string')) return ['navigation: technologyIds must be an array of strings'];
  const errors = [];
  const known = new Set(technologyIds);
  const memberships = new Map(technologyIds.map((id) => [id, []]));
  const nodes = new Set();
  if (known.size !== technologyIds.length) errors.push('navigation: duplicate technology IDs in inventory');

  /** Record one hierarchy node ID and reject collisions across all three levels. */
  function checkNode(node) {
    if (nodes.has(node.id)) errors.push(`navigation: duplicate node ID ${node.id}`);
    nodes.add(node.id);
  }

  for (const domain of navigation.domains) {
    checkNode(domain);
    for (const route of domain.routes) {
      checkNode(route);
      for (const entry of route.entries) {
        checkNode(entry);
        for (const member of entry.members) {
          if (!known.has(member.technology_id)) errors.push(`navigation ${entry.id}: unknown technology ${member.technology_id}`);
          else memberships.get(member.technology_id).push(entry.id);
        }
      }
    }
  }
  for (const [id, entries] of memberships) {
    if (entries.length === 0) errors.push(`navigation: missing membership for technology ${id}`);
    if (entries.length > 1) errors.push(`navigation: duplicate membership for technology ${id} in ${entries.join(', ')}`);
  }
  return errors;
}

/** Flatten valid navigation into self-contained domain/route/entry indexes while preserving source order. */
export function navigationIndex(navigation) {
  const domains = [];
  const routes = [];
  const entries = [];
  for (const domain of navigation.domains) {
    domains.push({ id: domain.id, name: domain.name, english_name: domain.english_name, description: domain.description, route_ids: domain.routes.map((route) => route.id) });
    for (const route of domain.routes) {
      routes.push({ id: route.id, name: route.name, english_name: route.english_name, description: route.description, domain_id: domain.id, entry_ids: route.entries.map((entry) => entry.id) });
      for (const entry of route.entries) {
        entries.push({
          id: entry.id, name: entry.name, description: entry.description,
          domain_id: domain.id, domain_name: domain.name, domain_english_name: domain.english_name,
          route_id: route.id, route_name: route.name, route_english_name: route.english_name,
          path: [domain.id, route.id, entry.id], name_path: [domain.name, route.name, entry.name],
          research_object: entry.research_object, primary_output: entry.primary_output,
          discriminator: entry.discriminator, boundary: entry.boundary,
          technology_ids: entry.members.map((member) => member.technology_id),
          members: entry.members.map((member) => ({ ...member })),
        });
      }
    }
  }
  return { version: navigation.version, updated_at: navigation.updated_at, domains, routes, entries };
}

/** Escape source prose for a readable Markdown index, preventing embedded HTML or Markdown links. */
function markdown(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\\`*_[\]#|]/g, '\\$&');
}

/** Render valid navigation as a deterministic domain overview followed by classification decision details. */
export function renderNavigationIndex(navigation) {
  const lines = [
    '<!-- Generated from knowledge/technology-navigation.json. Do not edit by hand. -->',
    '# 三级技术导航索引', '', `版本：${navigation.version} · 更新日期：${navigation.updated_at}`, '',
    '后续情报优先按本清单匹配主要研究对象与交付结果。', '',
    '差异明显时先更新knowledge/technology-navigation.json，写清最具辨识特点与相邻类边界，再补充技术归属并重建索引。', '',
    '详细流程见[分类流程](../docs/classification.md)。', '',
    '## 领域与路线概览', '',
  ];
  for (const domain of navigation.domains) {
    lines.push(`- **${markdown(domain.name)}**（${markdown(domain.english_name)}，${domain.id}）：${markdown(domain.description)}`);
    if (!domain.routes.length) lines.push('  - 暂无已收录路线；新增内容前先明确核心技术与分类边界。');
    for (const route of domain.routes) lines.push(`  - ${markdown(route.name)}（${markdown(route.english_name)}，${route.id}）：${markdown(route.description)}`);
  }
  lines.push('', '## 核心技术条目', '');
  for (const entry of navigationIndex(navigation).entries) {
    lines.push(`### ${markdown(entry.name)}`, '', `路径：${entry.name_path.map(markdown).join(' → ')}`, '', `索引 ID：${entry.id}`, '',
      markdown(entry.description), '', `- **研究对象**：${markdown(entry.research_object)}`,
      `- **主要产出**：${markdown(entry.primary_output)}`, `- **最具辨识特点**：${markdown(entry.discriminator)}`,
      `- **分类边界**：${markdown(entry.boundary)}`, '- **已挂接技术**：');
    for (const member of entry.members) lines.push(`  - [${member.technology_id}](../knowledge/technologies/${member.technology_id}.json)：${markdown(member.role)}`);
    if (!entry.members.length) lines.push('  - 暂无已挂接技术；后续情报先按研究对象、产出与边界匹配。');
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
