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

### 按用户授权合并上线

- 用户明确要求直接合并推送并配置主域解析，已复核 PR #1 最新 head `6dd69183984d944d951b9f0ed68b6ac54b47da05` 的 Actions 为 success，且可合并。
- 通过已登录 GitHub 网页合并 PR #1，GitHub API 确认 merged=true；合并提交 `36a9e594b394ca26c0fc4a91000de7a7afc7ac94` 已进入 main，触发生产部署。
- 在当前任务工作目录同步仓库，读取当日摘要和日志；建立本机 base.mdc 规则软链接，不改 sources/ 只读参考材料。
- 修改前权威 DNS 复核：主域无 A/AAAA/CNAME，www 为 ben-air.cn，TTL 600；无主域旧地址需要覆盖。

### 主域 A 记录落地

- 阿里云云解析中新增 @ 的 A 记录：185.199.108.153、185.199.109.153、185.199.110.153、185.199.111.153，默认线路，轮询，TTL 10 分钟，全部启用。
- 两次确认后控制台记录数从 5 增至 9，四条新增记录创建时间为 2026-10-16 14:54:42（UTC+8）。原有 blog、smtp、pop3、www、mail 暂未改动；继续处理本站 www。

### DNS 与生产部署核验

- www CNAME 已从 ben-air.cn 改为 ai-skill-mcp.github.io，TTL 600，启用；控制台最新更新时间 2026-10-16 14:57:11（UTC+8）。没有操作 ben-air.cn 自身的域名或 DNS；bioinformatic.tech 的 blog、smtp、pop3、mail 记录保留。
- 两个权威 NS（dns11/dns12.hichina.com）与公共递归 1.1.1.1、8.8.8.8 均已确认四条 A 与新 www CNAME。部分本机递归仍有剩余 84 秒的旧 www 缓存，等待自然过期。
- GitHub [生产运行 38863512282](https://github.com/AI-skill-mcp/AIxBio-DailyReport/actions/runs/38863512282) 构建和部署作业全部 success。
- 主域 HTTP 200，www HTTP 301 到 http://bioinformatic.tech/；浏览器已在正式域名显示正确网站。
- GitHub Pages 已从“DNS 未正确配置”转为“尚未签发域名证书”，Enforce HTTPS 暂不可选；直接 HTTPS 正常校验报告 SAN 不匹配，未绕过 TLS 检查。

### HTTPS 完成与最终上线状态

- GitHub Pages 随后显示 DNS check successful，证书就绪；已勾选并保存 Enforce HTTPS。
- 2026-10-16 15:02:49–15:02:53（UTC+8）正常 TLS 验证通过：HTTPS 主域 200，HTTPS www 301 到 https://bioinformatic.tech/，HTTP 主域和 www 均 301 到相同 HTTPS 主域。
- 文档状态提交 4491b65bf4b95f61d926cdb0e3b0cbb94677ee50 已推送 main；运行 38864422060 的构建、校验与部署全部 success。
- 更新部署文档，移除旧的“尚需配置 DNS/证书”状态；合并、生产部署、主域解析、www 跳转、HTTPS 均已完成。
