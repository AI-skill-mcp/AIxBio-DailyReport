# 项目背景摘要 2026-10-16

## 已知背景

- 本次为首次开发会话；仓库只有原始 README.md 和 MIT LICENSE，没有历史开发日志。
- SSH 已读取 `AI-skill-mcp/AIxBio-DailyReport`，默认分支 main，起点提交 `2d4003c76c309b28e5fe768dd2263772aac7e279`。
- 用户要求 Astro + TypeScript + Tailwind 静态技术情报网站，GitHub Pages / Actions 与 bioinformatic.tech 自定义域名。
- 在新分支 `codex/aixbio-intelligence-site` 开发并提交 PR，保留原内容；历史新闻须核验后发布。
- 后续经用户网页登录确认仓库管理权限；用户明确要求改为公开，已完成，GitHub 连接器现可读且报告 push/admin 权限。

## 实施边界

- 建设每日简报、六层技术树、技术详情、机会雷达、全文搜索。
- JSON 为事实源，Markdown 为确定性生成的阅读档案；构建前校验来源、状态、关联和档案一致性。
- 不把旧对话中的提案或示例当作已核实新闻；无历史数据时明确显示空状态。
- 现有 ChatGPT 定时任务不在仓库中；本次提供数据接入标准，不声称已迁移任务。

## 本次已完成

- 全部网站页面、六层技术导航、Pagefind 中英文搜索和已发布档案下载；3 个一手来源核验的基础知识条目，无历史日报。
- Markdown/JSON Schema 校验、确定性生成和 14 个发布门禁测试；类型检查及静态构建通过。
- 独立集成副本验证日报、机会与下载完整链路，160 内部链接和 15 锚点有效，草稿未进入公开产物和搜索。
- Pages Source=GitHub Actions，Custom domain=bioinformatic.tech；用户仍需修改主域 A 与 www CNAME，DNS 生效后启用 HTTPS。
- 个人博客 ben-air.cn 与本站独立绑定域名，不互相冲突；未操作博客设置。
- 已推送开发分支并创建 PR #1：https://github.com/AI-skill-mcp/AIxBio-DailyReport/pull/1 。实现提交 99bda2b 的 GitHub Actions 校验/测试/构建全部成功，部署按 PR 条件跳过。尚未合并 main。
