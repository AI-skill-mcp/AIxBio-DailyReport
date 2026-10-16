# 内容标准与发布流程

日报 JSON 是编辑源；Markdown、时间轴、技术索引、机构索引和网站数据由同一份 JSON 确定性生成。网站展示的是已发布内容的投影，不直接导入原始日报目录。

首期2026-10-16包含3条经过一手来源核验的进展，事件发生于10月14—15日。AlphaFold 3、RFdiffusion 与 scGPT 是经过原始论文核验的基础技术条目，并非当前新闻或历史简报。未取得可核验资料的历史对话内容不回填。

## 目录与版本

- 日报：`reports/YYYY/MM/YYYY-MM-DD.json`，格式版本 `1.0`。
- 生成的可读档案：相邻的 `YYYY-MM-DD.md`。草稿也可在仓库内生成 Markdown，但不会进入网站。
- 分类树：`knowledge/taxonomy.json`，节点为数组，六层连续父子关系。
- 技术：`knowledge/technologies/{id}.json`，只收录有已核验来源的基础知识。
- 机构与技术关系：`knowledge/organizations.json`、`knowledge/relationships.json`。
- 生成的索引：`indexes/`。`public-content.json` 只含公开技术知识和已发布日报。
- 格式定义：`schemas/daily-report.schema.json`、`schemas/technology.schema.json`、`schemas/knowledge.schema.json`。

分类树使用 JSON，便于以同一套 Schema/Ajv 工具检查，不额外引入 YAML 解析依赖。六层依次代表科学领域、生命科学方向、研究对象、任务、技术路线和具体方法族；技术条目关联恰好六个节点 ID，不用标题代替引用。

## 新建与核验日报

1. 在开发分支新建当天或历史日期的 JSON，先设 `status: "draft"`。日期按 Asia/Shanghai 解释，禁止未来日报日期，包括手工输入的草稿。
2. 阅读论文、作者或机构原文，核对标题、事件发生日、来源在线发表日、方法、适用范围和局限。搜索摘要只能用于发现来源；转载或生成式总结不能替代一手核验。
3. 每条文章记录 `event_date`（有来源支持的事件日）、来源的 `published_at`（来源在线发表日）、`checked_at`（实际核验日）。历史事件可以在今天核验，不能把今天的核验日期冒充事件或发表日期。论文的在线发表日与期刊刊期要区分。
4. 写清 `verification_note`：核对了哪些原文部分、哪些说法仍有限制。预印本来源标为 `type: "preprint"`；`verified` 表示来源与表述已核对，不表示同行评审或实验结论已被独立复现。
5. 完成整期核验后改为 `published`。已发布日报包含 1–5 条真实内容，所有文章与所有来源必须为 `verified`；不为凑五条而补虚构或重复新闻。
6. 候选先保存在仓库外，通过 `pnpm import:report /absolute/path/to/candidate.json` 校验并导入。同日相同内容返回 `unchanged`，不同内容报冲突；修订已有档案须在 PR 中明确编辑并说明。运行生成、检查与构建，将 JSON、生成的 Markdown 和索引一起提交 PR，审阅通过后发布。

```sh
pnpm generate
pnpm validate
pnpm check
pnpm test
pnpm build
```

空草稿的最小骨架如下。替换日期并保存到对应路径；这只是格式示例，不是可发布新闻。

```json
{
  "version": "1.0",
  "report_type": "AIxBio-Daily",
  "date": "2026-10-16",
  "title": "AI × Bio 每日简报 · 2026-10-16",
  "summary": "待完成来源核验后填写。",
  "status": "draft",
  "articles": []
}
```

文章必填 `id`、`event_date`、`title`、`summary`、`category`、`technology_path`、`related_technology_ids`、`technical_details`、`opportunities`、`sources`、`verification_status` 和 `verification_note`。文章 ID 格式为 `YYYYMMDD-001`，后三位序号从 001 开始，日期必须等于报告日期。`technical_details` 分别写问题、方法、创新和局限。`opportunities` 可为空；非空时须标明 `research`、`product` 或 `startup`，写清编辑判断与可执行的下一步，不能把推测当作已发生事实。

来源必填标题、HTTPS 链接、发布者、`type`、三个核验字段与 `organization_ids`。第一条 `sources[0]` 是本次事件主来源，背景引用放在后面。没有确认的机构关联使用空数组。来源发布日期不得晚于报告日期或核验日期，核验日期不得晚于今天。已核验文章至少有一个来源，所有来源均需核验。核验状态与说明由编辑负责，校验脚本不会联网替代事实核查。

## 引用完整性与发布隔离

校验同时检查 JSON Schema 与跨文件约束：真实日历日期，路径和 ID 一致，全局文章与机会 ID 唯一，来源不重复，已发布文章的规范化主来源 URL 与事件日不重复，分类树连续六层、无环和悬空父节点，技术与机构引用存在，技术关系不重复且不自引用，文章分类对应至少一个关联技术，机会只关联所属文章的技术。不同网址指向同一事件的情况仍须编辑检查。

`scripts/validate.mjs` 导出校验函数便于后续导入工具复用；`scripts/generate.mjs --check` 只检查，不修改文件。修改 JSON 后未重新生成 Markdown/索引会导致检查失败；发现缺少 JSON 的孤立 Markdown 会报错，防止静默覆盖或删除既有内容。

网站只消费 `indexes/public-content.json` 的公开投影。草稿的标题、文章、机会和机构索引贡献均被排除。站点的归档下载也必须基于公开的 `reports` 导出生成，禁止把整个 `reports/` 复制到 `public/`。撤回日报时改回 `draft`，重新生成索引并完整构建；不要保留先前手工复制的公开文件。Git 仓库内的草稿并非保密存储。

本仓库不存储未经授权转载的全文或论文图片。需要配图时，使用有明确许可的资源并记录出处与许可，或制作标明为示意图的原创图。图像不是日报发布的必填项。

## 每日任务接入边界

已建立的 Actions 负责校验、测试、构建和部署，采编由原 ChatGPT 定时任务执行，不另建重复定时器。接入入口、重跑、失败处理与任务执行环境要求见 [每日采编说明](daily-automation.md)，持久指令见 [任务提示词](../prompts/daily-report.md)。任务必须实际具备仓库写入与执行权限；只有保存原任务并在其运行环境中验证后，才能确认无人值守接入成功。来源无法核实时跳过或保留草稿并报告缺口，不依赖浏览器对话历史自动写入 GitHub。
