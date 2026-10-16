# 开发记录 2026-10-16

## 背景与需求

按用户确认的方案建设 AI × Bio 技术情报网站及标准化档案，使用 GitHub Pages 部署到 bioinformatic.tech；开发分支和 PR 优先。

## 开发过程

### 仓库检查与隔离开发

- SSH 读取成功；仓库只有 README.md 和 LICENSE，工作区干净，无历史新闻与日志。
- 从 main 的 `2d4003c76c309b28e5fe768dd2263772aac7e279` 创建 `codex/aixbio-intelligence-site`。
- 读取备用 base.mdc，创建本地 `.cursor/rules/base.mdc` 软链接；不把机器绝对路径链接作为可移植配置提交。
- 保留现有 README 与许可证；未改动远程 main，GitHub 连接器 404，采用可用的 SSH 通道继续。

## 开发结果

持续追加已完成内容与验证结果。

### 网站环境与部署配置

- 建立 Astro 7.4.0、Tailwind 4.3.3、TypeScript、Pagefind 1.5.2 项目及 pnpm 锁文件，Node.js 24。
- 新增 PR 校验和 main 部署工作流，官方 Actions 固定完整提交 SHA，部署权限只授予部署作业。
- 新增域名配置与中文上线文档；CNAME 文件仅作声明，Actions 模式需在 Pages 设置手动绑定域名。
- 2026-10-16 查询：主域 A/AAAA 没有地址应答，www CNAME 为 ben-air.cn；未修改 DNS。
- SSH 身份确认为 Ben-unbelieveable；GitHub 连接器 404，内置浏览器未登录，PR 创建仍需可用的网页登录或 API 权限。

### 内容、页面与首轮验证

- 完成每日简报、技术树/详情、机会雷达、搜索、404、sitemap 以及公开日报 Markdown/JSON 下载端点。
- 初始基础知识为 AlphaFold 3、RFdiffusion、scGPT，共 3 条技术和 13 个六层分类节点；原始论文日期与核验日分开记录。没有编造历史日报或机会。
- JSON Schema + 跨文件语义门禁、确定性 Markdown/索引生成和 14 项原生测试通过；Astro 类型检查零错误、零警告。
- 实际构建发现 Markdown 端点导入模块时触发文件系统读取，已将纯 Markdown 渲染拆分为无副作用模块；随后完整构建与 Pagefind Extended 索引生成成功（9 页面，7 搜索索引页面）。
- 复查修复测试基准日期固定导致后续日报失败的问题，及仅被草稿引用的机构进入公开机构索引的问题；草稿专属机构回归用例通过。
- 该仓库原为私有且套餐不支持 Pages。用户明确要求改为公开；已在 GitHub 设置完成公开变更并确认页面显示 currently public，继续配置 Pages。

### 浏览器验收与远程设置完成

- GitHub Pages Source 已保存 GitHub Actions，Custom domain 已保存 bioinformatic.tech。DNS 校验未通过，HTTPS 因 DNS 未就绪而暂不可用；没有操作 ben-air.cn 的仓库或 DNS。
- GitHub 连接器现可读取仓库，确认 visibility=public 且具备 push/admin 权限。
- 本机预览 HTTP 200；浏览器验证 AlphaFold 和中文“单细胞”搜索，各返回相应技术详情及索引页；类型筛选可用。
- 手机视口 390×844 检查首页、导航、技术树，完整展开六层后页面宽度仍为 390，无横向溢出；技术详情正确显示原始发表日与核验日。
- 独立临时副本加入一份仅集成测试的 published 日报与 draft 标记：日报详情、md/json 下载、机会关联正常；160 内链和 15 锚点均有效；40 个网站文件和 13 个压缩搜索文件均无草稿标记，草稿搜索返回 0。测试数据未写回项目。
- 当前正式数据仍是 3 条基础技术、0 期日报。原 ChatGPT 定时任务尚未接入，未伪造自动采编结果。

### 开发分支与 PR 交付

- 实现提交 `99bda2bd46681745a38eed1a6deefa8448c130f9` 已推送到 codex/aixbio-intelligence-site；main 保持初始提交不变。
- 已创建 [PR #1：建设 AI × Bio 技术情报网站与可核验的每日档案](https://github.com/AI-skill-mcp/AIxBio-DailyReport/pull/1)，通过已登录网页提交；连接器可读但创建 PR 返回 403，未扩大连接器权限。
- GitHub Actions [首次运行 38862717001](https://github.com/AI-skill-mcp/AIxBio-DailyReport/actions/runs/38862717001)：锁文件安装、内容/类型校验、14 项测试、静态构建、上传产物全部 success；PR 部署作业按设计 skipped。
- 留待维护者审阅合并，以及域名服务商 DNS 配置与证书就绪后的 HTTPS 核对。
