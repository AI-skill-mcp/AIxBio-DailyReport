# AIxBio-DailyReport
AI x Bioinformatic 方向交叉领域的前沿进展商业合作等相关知识库

## AI × Bio 技术情报网站

以中文为主的研究情报与技术知识网站，使用 Astro、TypeScript、Tailwind CSS 与 Pagefind，生成可部署到 GitHub Pages 的静态文件。目标域名为 [bioinformatic.tech](https://bioinformatic.tech)，实际是否上线以仓库 Actions 与 Pages 设置为准。

### 网站功能

- **每日简报**：按日期归档已核验内容，展示问题、方法、创新点、局限与一手来源。
- **六层技术树**：按领域、方向、任务、方法、技术与具体模型逐级浏览。
- **技术详情**：解释原理、适用场景、局限、关联技术和出处。
- **机会雷达**：从已发布简报提取研究与产品机会，保留证据与下一步。
- **全文搜索**：Pagefind 对构建结果生成中英文索引，无需后端。

仓库此前没有历史简报，没有将历史对话直接回填。首期为 [2026-10-16](reports/2026/10/2026-10-16.md)，收录近72小时内的3条核验进展及1项编辑研究机会；原有基础论文与当期新闻分别记录日期。

### 本地运行

安装 Node.js 24 以及 `package.json` 指定的 pnpm 后：

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm preview
```

开发页面可运行 `pnpm dev`。全文搜索索引在构建时生成，请使用 `pnpm build` 后的预览验证搜索。

### 档案与发布

`reports/YYYY/MM/YYYY-MM-DD.json` 是每日档案的事实源，Markdown 与索引由 `pnpm generate` 确定性生成。`pnpm check` 会拒绝无效来源、引用错误及过期的生成文件。只有满足发布门禁的内容才进入公开网站、搜索和下载档案。

- [内容标准、核验与新增日报](docs/content.md)
- [每日采编接入、重跑与失败处理](docs/daily-automation.md)
- [GitHub Pages、DNS 和 HTTPS 上线步骤](docs/deployment.md)
- [贡献流程](CONTRIBUTING.md)

```text
reports/                   每日 JSON / Markdown 配对档案
knowledge/                 六层分类、基础技术、组织与关系
schemas/                   JSON Schema
indexes/                   自动生成的时间轴与关联索引
scripts/                   校验、生成与发布门禁测试
src/                       Astro 页面与 TypeScript 数据接口
.github/workflows/         PR 验证、main 构建与 Pages 发布
dev_log/                   开发日志与背景摘要
```

PR 只运行验证与构建，合并至 `main` 后部署。仓库为原“AI × Bio 每日简报”任务提供 `pnpm import:report` 幂等归档和[持久任务指令](prompts/daily-report.md)；不新增重复定时器。原任务的保存及运行环境验证状态单独记录在[接入说明](docs/daily-automation.md)，不能将一次交互发布或提示词文件视为定时任务已启用的证据。

### 社区方案与维护

采用 [Astro 官方 GitHub Pages 方案](https://docs.astro.build/en/guides/deploy/github/)、[Tailwind 官方 Astro 集成](https://tailwindcss.com/docs/installation/framework-guides/astro)、[Pagefind 静态全文检索](https://pagefind.app/docs/) 和 Ajv JSON Schema 校验。它们适用于内容型静态站与版本化档案；内容量显著增加时需关注构建时间和搜索索引大小。依赖锁定版本，升级通过 PR 验证。
