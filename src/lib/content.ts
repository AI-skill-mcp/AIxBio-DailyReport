import generated from '../../indexes/public-content.json';

export interface TaxonomyNode {
  id: string;
  name: string;
  english_name: string;
  parent_id: string | null;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Source {
  title: string;
  url: string;
  publisher: string;
  type: 'paper' | 'official' | 'preprint';
  published_at: string;
  checked_at: string;
  verification_status: 'verified' | 'pending';
  verification_note: string;
  organization_ids: string[];
}

export interface Technology {
  id: string;
  name: string;
  english_name: string;
  summary: string;
  description: string;
  method: string;
  limitations: string;
  technology_path: string[];
  sources: Source[];
  related_ids: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  kind: 'research' | 'product' | 'startup';
  description: string;
  next_step: string;
  technology_ids: string[];
}

export interface Article {
  id: string;
  event_date: string;
  title: string;
  summary: string;
  category: string;
  technology_path: string[];
  related_technology_ids: string[];
  technical_details: { problem: string; method: string; innovation: string; limitations: string };
  opportunities: Opportunity[];
  sources: Source[];
  verification_status: 'verified' | 'pending';
  verification_note: string;
}

export interface Report {
  version: '1.0';
  report_type: 'AIxBio-Daily';
  date: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  articles: Article[];
}

export type PublishedArticle = Article & { reportDate: string };
export type PublishedOpportunity = Opportunity & { articleId: string; reportDate: string };

// Generated data is validated before every build; only its public projection is imported.
const content = generated as unknown as { taxonomy: TaxonomyNode[]; technologies: Technology[]; reports: Report[]; navigation: typeof import('../../knowledge/technology-navigation.json') };
export const taxonomy = content.taxonomy;
export const navigation = content.navigation;
export const technologies = content.technologies;
export const reports = content.reports.filter((report) => report.status === 'published').sort((a, b) => b.date.localeCompare(a.date));
export const articles: PublishedArticle[] = reports.flatMap((report) => report.articles.map((article) => ({ ...article, reportDate: report.date })));
export const opportunities: PublishedOpportunity[] = articles.flatMap((article) => article.opportunities.map((opportunity) => ({ ...opportunity, articleId: article.id, reportDate: article.reportDate })));
