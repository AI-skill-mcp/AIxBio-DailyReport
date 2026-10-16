import type { APIRoute } from 'astro';
import { reports, taxonomy } from '../../../lib/content';
import { renderReport } from '../../../../scripts/render-report.mjs';

/** Expose Markdown downloads only for reports in the validated public projection. */
export function getStaticPaths() {
  return reports.map((report) => ({
    params: { path: `${report.date.slice(0, 4)}/${report.date.slice(5, 7)}/${report.date}` },
    props: { report },
  }));
}

/** Render the same Markdown archive used by the repository generation pipeline. */
export const GET: APIRoute = ({ props }) => new Response(renderReport(props.report, taxonomy), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
