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
- Pages Source=GitHub Actions，Custom domain=bioinformatic.tech；主域四条 GitHub Pages A 与 www CNAME 已配置，TTL 600。两个权威 DNS 和公共解析器已确认生效；DNS 检查通过，Enforce HTTPS 已启用。
- 个人博客 ben-air.cn 与本站独立绑定域名，不互相冲突；未操作博客设置。
- PR #1 已按用户授权合并，main 合并提交 36a9e594b394ca26c0fc4a91000de7a7afc7ac94；生产构建与 Pages 部署运行 38863512282、38864422060 均 success。2026-10-16 15:02（UTC+8）正常 TLS 校验通过，HTTPS 主域 200，HTTPS www 与两个 HTTP 地址均 301 到 HTTPS 主域。

## 当前开发任务

- 在 codex/daily-editorial-pipeline 分支接入原“AI × Bio 每日简报”任务，保留原调度，补充可靠归档与发布说明，并采编一期真实内容作端到端验证。
- 原任务 ID、时间和运行环境仍待从任务编辑页核实，不能把当前交互环境的 SSH 权限当作定时任务具备写入权限的证据。
- 已完成幂等导入、主来源事件去重与排他锁；26项测试和27文件Astro检查通过。首期2026-10-16含3条核验进展、1项编辑研究机会，知识共6条；PR #2检查后合并，main提交94d35d2437e67b861ccbf0e7bb830458fed3ce37，生产运行38868511868成功。正式日报及相关页HTTP 200，JSON/Markdown逐字节匹配源档案。
- 每日操作说明与持久任务指令已入库，但尚未修改原定时任务；用户已完成登录，任务列表仍停在加载画面，正在请求原编辑页链接。需核实其执行环境有实际写入与运行权限后完成保存和原环境试跑。
