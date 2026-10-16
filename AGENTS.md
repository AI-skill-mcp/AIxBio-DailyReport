# 项目协作规则

- 保留现有内容；使用开发分支与 PR，未经审阅不改远程 main。
- 先阅读 README.md、docs/content.md 与最近 dev_log 摘要及之后日志。
- 每次开发在 dev_log/AutoLogDate.YYYY-MM-DD.md 追加记录，并整理当日 AutoLogPreSummary.YYYY-MM-DD.md。
- JSON 为内容事实源；修改后运行 pnpm generate，再运行 pnpm check、pnpm test、pnpm build。
- 历史新闻核验后才能发布；草稿、pending/rejected 内容不能进入公开页面、搜索、下载或索引。
- 不凑新闻条数；无正式内容时保留真实空状态。
- 最少代码解决问题，不顺手重构。函数注释说明输入、输出与逻辑。
- 本机存在备用 /Users/guanyan/.agent/rules/rules/cursor/base.mdc 时，可在不覆盖已有文件的前提下建立 .cursor/rules/base.mdc 软链接并读取；机器绝对路径链接不提交。
