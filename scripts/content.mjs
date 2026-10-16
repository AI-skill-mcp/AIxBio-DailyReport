import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { renderReport } from './render-report.mjs';

export { renderReport } from './render-report.mjs';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

/** Read a UTF-8 JSON file at path; return its parsed value or a labelled error. */
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`${path}: ${error.message}`); }
}

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
for (const name of ['daily-report', 'technology', 'knowledge']) {
  ajv.addSchema(readJson(join(repositoryRoot, 'schemas', `${name}.schema.json`)));
}
const schemaBase = 'https://bioinformatic.tech/schemas/';
const schemas = Object.fromEntries([
  ['report', 'daily-report.schema.json'], ['technology', 'technology.schema.json'],
  ['taxonomy', 'knowledge.schema.json#/definitions/taxonomy'],
  ['organizations', 'knowledge.schema.json#/definitions/organizations'],
  ['relationships', 'knowledge.schema.json#/definitions/relationships'],
].map(([key, ref]) => [key, ajv.getSchema(`${schemaBase}${ref}`)]));

/** Walk a directory without following symlinks; return sorted JSON file paths. */
function jsonFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Content symlinks are not supported: ${path}`);
    return entry.isDirectory() ? jsonFiles(path) : entry.name.endsWith('.json') ? [path] : [];
  }).sort();
}

/** Load source archives from root; preserve relative paths for date/ID checks. */
export function loadRepository(root = repositoryRoot) {
  return {
    taxonomy: readJson(join(root, 'knowledge/taxonomy.json')),
    organizations: readJson(join(root, 'knowledge/organizations.json')),
    relationships: readJson(join(root, 'knowledge/relationships.json')),
    technologies: jsonFiles(join(root, 'knowledge/technologies')).map((path) => ({ path: relative(root, path), data: readJson(path) })),
    reports: jsonFiles(join(root, 'reports')).map((path) => ({ path: relative(root, path), data: readJson(path) })),
  };
}

/** Convert an instant to the Asia/Shanghai calendar date, independent of host timezone. */
export function shanghaiDate(instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-');
}

/** Check IDs/keys for duplicates; append a diagnostic without changing the input. */
function unique(items, key, label, errors) {
  const seen = new Set();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) errors.push(`${label}: duplicate ${value}`);
    seen.add(value);
  }
}

/** Validate schemas and cross-file invariants; return all errors, never mutate data. */
export function validateData(data, { today = shanghaiDate() } = {}) {
  const errors = [];
  const valid = (kind, value, label) => {
    const check = schemas[kind];
    if (check(value)) return true;
    errors.push(...check.errors.map((error) => `${label}${error.instancePath}: ${error.message}`));
    return false;
  };
  const taxonomyValid = valid('taxonomy', data.taxonomy, 'taxonomy');
  const organizationsValid = valid('organizations', data.organizations, 'organizations');
  const relationshipsValid = valid('relationships', data.relationships, 'relationships');
  const techEntries = data.technologies.filter((entry) => valid('technology', entry.data, entry.path));
  const reportEntries = data.reports.filter((entry) => valid('report', entry.data, entry.path));
  if (!taxonomyValid || !organizationsValid || !relationshipsValid) return errors;
  const nodes = new Map(data.taxonomy.map((node) => [node.id, node]));
  const technologies = new Map(techEntries.map((entry) => [entry.data.id, entry.data]));
  const organizations = new Set(data.organizations.map((organization) => organization.id));
  unique(data.taxonomy, (node) => node.id, 'taxonomy', errors);
  unique(data.organizations, (organization) => organization.id, 'organizations', errors);
  unique(techEntries, (entry) => entry.data.id, 'technologies', errors);
  unique(reportEntries, (entry) => entry.data.date, 'reports', errors);
  for (const node of data.taxonomy) {
    const parent = nodes.get(node.parent_id);
    if (node.level === 1 ? node.parent_id !== null : !parent || parent.level !== node.level - 1) {
      errors.push(`taxonomy ${node.id}: parent must connect consecutive levels`);
    }
    if (node.level < 6 && !data.taxonomy.some((child) => child.parent_id === node.id)) {
      errors.push(`taxonomy ${node.id}: every branch must reach level 6`);
    }
  }

  /** Check an ordered six-level taxonomy path against parent links. */
  function checkPath(path, label) {
    path.forEach((id, index) => {
      const node = nodes.get(id);
      if (!node || node.level !== index + 1 || node.parent_id !== (index ? path[index - 1] : null)) {
        errors.push(`${label}: invalid taxonomy path at ${id}`);
      }
    });
  }

  /** Check technology references, optionally preventing self-references. */
  function checkRefs(ids, label, self) {
    for (const id of ids) {
      if (!technologies.has(id)) errors.push(`${label}: unknown technology ${id}`);
      if (id === self) errors.push(`${label}: self-reference ${id}`);
    }
  }

  /** Check evidence URL, dates, organizations and verified publication requirements. */
  function checkSources(sources, label, mustVerify, cutoff = today) {
    if (mustVerify && sources.length === 0) errors.push(`${label}: verified content requires sources`);
    unique(sources, (source) => {
      const url = new URL(source.url);
      return `${url.origin}${url.pathname}`;
    }, `${label} sources`, errors);
    for (const source of sources) {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) errors.push(`${label}: source must be a credential-free HTTPS URL`);
      if (source.published_at > cutoff || source.published_at > source.checked_at || source.checked_at > today) {
        errors.push(`${label}: source dates are incoherent or in the future`);
      }
      if (mustVerify && source.verification_status !== 'verified') errors.push(`${label}: published/verified content has pending source`);
      for (const id of source.organization_ids) {
        if (!organizations.has(id)) errors.push(`${label}: unknown organization ${id}`);
      }
    }
  }

  for (const { path, data: technology } of techEntries) {
    if (path !== `knowledge/technologies/${technology.id}.json`) errors.push(`${path}: technology ID must match its file path`);
    checkPath(technology.technology_path, path);
    checkRefs(technology.related_ids, path, technology.id);
    checkSources(technology.sources, path, true);
  }
  unique(data.relationships, (relation) => `${relation.source_id}:${relation.kind}:${relation.target_id}`, 'relationships', errors);
  for (const relation of data.relationships) {
    checkRefs([relation.source_id, relation.target_id], 'relationships');
    if (relation.source_id === relation.target_id) errors.push('relationships: self-reference');
  }
  const allArticles = [];
  const allOpportunities = [];
  for (const { path, data: report } of reportEntries) {
    const expectedPath = `reports/${report.date.slice(0, 4)}/${report.date.slice(5, 7)}/${report.date}.json`;
    if (path !== expectedPath) errors.push(`${path}: report date must match YYYY/MM/YYYY-MM-DD.json path`);
    if (report.date > today) errors.push(`${path}: future report date (Asia/Shanghai)`);
    for (const article of report.articles) {
      const label = `${path} ${article.id}`;
      allArticles.push(article);
      if (!article.id.startsWith(`${report.date.replaceAll('-', '')}-`) || article.id.endsWith('-000')) errors.push(`${label}: article ID must match report date and have a positive sequence`);
      if (article.event_date > report.date || article.event_date > today) errors.push(`${label}: event date is after report date or in the future`);
      if (report.status === 'published' && article.verification_status !== 'verified') errors.push(`${label}: published report contains pending article`);
      checkPath(article.technology_path, label);
      checkRefs(article.related_technology_ids, label);
      if (!article.related_technology_ids.some((id) => technologies.get(id)?.technology_path.join('/') === article.technology_path.join('/'))) {
        errors.push(`${label}: taxonomy path must match at least one related technology`);
      }
      checkSources(article.sources, label, report.status === 'published' || article.verification_status === 'verified', report.date);
      for (const opportunity of article.opportunities) {
        allOpportunities.push(opportunity);
        if (!opportunity.id.startsWith(`${article.id}-`)) errors.push(`${label}: opportunity ID must start with article ID`);
        checkRefs(opportunity.technology_ids, `${label} opportunity`);
        if (opportunity.technology_ids.some((id) => !article.related_technology_ids.includes(id))) errors.push(`${label}: opportunity technology must be linked by its article`);
      }
    }
  }
  unique(allArticles, (article) => article.id, 'articles', errors);
  unique(allOpportunities, (opportunity) => opportunity.id, 'opportunities', errors);
  return errors;
}

/** Load and validate archives at root; throw one readable error if any gate fails. */
export function validatedRepository(root = repositoryRoot, options) {
  const data = loadRepository(root);
  const errors = validateData(data, options);
  if (errors.length) throw new Error(`Content validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  return data;
}

/** Project validated archives to public data; drafts are excluded from every derived list. */
export function publicContent(data) {
  const errors = validateData(data);
  if (errors.length) throw new Error(`Cannot publish invalid content:\n${errors.join('\n')}`);
  const technologies = data.technologies.map((entry) => entry.data).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const reports = data.reports.map((entry) => entry.data).filter((report) => report.status === 'published').sort((a, b) => b.date.localeCompare(a.date));
  const articles = reports.flatMap((report) => report.articles.map((article) => ({ ...article, reportDate: report.date })));
  const opportunities = articles.flatMap((article) => article.opportunities.map((opportunity) => ({ ...opportunity, articleId: article.id, reportDate: article.reportDate })));
  return { taxonomy: data.taxonomy, technologies, reports, articles, opportunities };
}

/** Build deterministic public indexes from source records, excluding draft contributions. */
export function generatedFiles(data) {
  const content = publicContent(data);
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  const files = new Map(data.reports.map(({ path, data: report }) => [path.replace(/\.json$/, '.md'), renderReport(report, data.taxonomy)]));
  files.set('indexes/public-content.json', json(content));
  files.set('indexes/timeline.json', json(content.reports.map((report) => ({ date: report.date, title: report.title, article_ids: report.articles.map((article) => article.id) }))));
  files.set('indexes/technology-index.json', json(content.technologies.map((technology) => {
    const related = content.articles.filter((article) => article.related_technology_ids.includes(technology.id));
    return { id: technology.id, name: technology.name, technology_path: technology.technology_path, article_ids: related.map((article) => article.id), latest_report_date: related[0]?.reportDate ?? null };
  })));
  const publicOrganizationIds = new Set([...content.technologies, ...content.articles].flatMap((item) => item.sources.flatMap((source) => source.organization_ids)));
  files.set('indexes/organization-index.json', json(data.organizations.filter((organization) => publicOrganizationIds.has(organization.id)).sort((a, b) => a.id.localeCompare(b.id, 'en')).map((organization) => ({
    ...organization,
    technology_ids: content.technologies.filter((technology) => technology.sources.some((source) => source.organization_ids.includes(organization.id))).map((technology) => technology.id),
    article_ids: content.articles.filter((article) => article.sources.some((source) => source.organization_ids.includes(organization.id))).map((article) => article.id),
  }))));
  return files;
}
