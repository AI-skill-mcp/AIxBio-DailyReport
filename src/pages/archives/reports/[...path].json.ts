import type { APIRoute } from 'astro';
import { reports } from '../../../lib/content';

/** Expose JSON downloads only for reports in the validated public projection. */
export function getStaticPaths() {
  return reports.map((report) => ({
    params: { path: `${report.date.slice(0, 4)}/${report.date.slice(5, 7)}/${report.date}` },
    props: { report },
  }));
}

/** Return one published report as a portable, formatted JSON archive. */
export const GET: APIRoute = ({ props }) => new Response(`${JSON.stringify(props.report, null, 2)}\n`, {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
