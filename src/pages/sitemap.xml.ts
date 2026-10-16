import type { APIRoute } from 'astro';
import { reports, technologies } from '../lib/content';

/** List discoverable public routes; drafts never enter this generated sitemap. */
export const GET: APIRoute = () => {
  const paths = ['/', '/daily/', '/technology/', '/opportunities/',
    ...technologies.map((technology) => `/technology/${technology.id}/`),
    ...reports.map((report) => `/daily/${report.date}/`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>https://bioinformatic.tech${path}</loc></url>`).join('\n')}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
