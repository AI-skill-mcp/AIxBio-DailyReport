/** Escape untrusted prose for generated Markdown; links are supplied separately. */
function markdown(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\\`*_[\]#|]/g, '\\$&');
}

/** Render validated report/taxonomy JSON to deterministic LF Markdown without filesystem access. */
export function renderReport(report, taxonomy) {
  const names = new Map(taxonomy.map((node) => [node.id, node.name]));
  const lines = [
    '<!-- Generated from the adjacent JSON. Do not edit by hand. -->',
    `# ${markdown(report.title)}`, '',
    `报告日期：${report.date}（Asia/Shanghai） · 状态：${report.status === 'published' ? '已发布' : '草稿，未发布'}`, '',
    markdown(report.summary), '',
  ];
  for (const article of report.articles) {
    lines.push(`## ${markdown(article.title)}`, '', `条目 ID：${article.id} · 事件日期：${article.event_date} · 核验：${article.verification_status}`, '',
      markdown(article.summary), '', `技术路径：${article.technology_path.map((id) => markdown(names.get(id) ?? id)).join(' → ')}`, '',
      `关联技术：${article.related_technology_ids.join('、')}`, '', '### 技术解读', '');
    for (const [key, label] of [['problem', '问题'], ['method', '方法'], ['innovation', '创新'], ['limitations', '局限']]) {
      lines.push(`- **${label}**：${markdown(article.technical_details[key])}`);
    }
    lines.push('', '### 机会与下一步', '');
    if (!article.opportunities.length) lines.push('本条未提出新的机会建议。');
    for (const opportunity of article.opportunities) {
      lines.push(`- **${markdown(opportunity.title)}**（${opportunity.kind}）：${markdown(opportunity.description)} 下一步：${markdown(opportunity.next_step)}`);
    }
    lines.push('', '### 来源与核验', '', `核验说明：${markdown(article.verification_note)}`, '');
    for (const source of article.sources) {
      const url = new URL(source.url).href.replaceAll('(', '%28').replaceAll(')', '%29');
      lines.push(`- [${markdown(source.title)}](${url}) · ${markdown(source.publisher)} · ${source.type} · 发布 ${source.published_at} · 核验 ${source.checked_at} · ${source.verification_status}`, `  核验记录：${markdown(source.verification_note)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
