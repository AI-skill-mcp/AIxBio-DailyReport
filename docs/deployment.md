# GitHub Pages 与自定义域名部署

目标仓库：[AI-skill-mcp/AIxBio-DailyReport](https://github.com/AI-skill-mcp/AIxBio-DailyReport)。目标地址：[https://bioinformatic.tech](https://bioinformatic.tech)。本文说明代码合并后的上线步骤；提交这些配置不代表网站已经部署，也不代表 DNS 已经生效。

### 本次已完成的远程设置（2026-10-16）

- 按用户明确要求，将仓库从私有改为公开，解除当前套餐对私有仓库 Pages 的限制。
- Pages 的 Source 已保存为 **GitHub Actions**。
- Custom domain 已保存为 **bioinformatic.tech**；DNS 尚待域名服务商配置，因此 HTTPS 暂不可用。
- 网站开发代码通过 PR 审阅，未合并前不会发布。下面的设置步骤保留供重建或排错参考。

个人博客的 `ben-air.cn` 与本站的 `bioinformatic.tech` 可以由不同仓库独立绑定。每个账号可有一个用户或组织主页，每个仓库可有一个项目站，项目站可单独设置域名。修改 `www.bioinformatic.tech` 的解析不改变 `ben-air.cn` 自身的 DNS。[GitHub 站点类型](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[项目站独立域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)

## 构建与发布

项目使用 Astro 生成静态网站，构建产物位于 `dist/`。本地与 GitHub Actions 均使用 Node.js 24，以及 `package.json` 的 `packageManager` 字段指定的 pnpm 版本。须同时提交 `pnpm-lock.yaml`，避免构建时重新解析依赖。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

`.github/workflows/pages.yml` 的行为如下：

- 指向 `main` 的 PR：安装依赖、校验、测试、构建并上传产物，供审阅；不部署网站。
- 推送到 `main`：所有检查通过后，发布本次构建的 `dist/`。
- 手动运行：构建所选分支；只有选择 `main` 才会部署。
- 构建作业仅有 `contents: read`；部署作业有 `pages: write`、`id-token: write`，使用 `github-pages` 环境。检出代码时不保留认证凭据。

采用 GitHub 与 pnpm 官方开源 Actions，并固定完整提交 SHA，旁注对应版本。升级时先核对官方 release、提交及运行环境，再通过 PR 更新 SHA。固定版本减少上游标签变动的影响，但仍需维护依赖与 Actions 的安全更新。部署使用 GitHub 自动提供的令牌，无需添加个人访问令牌。[GitHub 自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 用户需要完成的 GitHub 设置

1. 审阅并合并开发 PR。确认站点内容及历史新闻的核验记录，再允许其进入 `main`。
2. 打开[仓库 Pages 设置](https://github.com/AI-skill-mcp/AIxBio-DailyReport/settings/pages)，将 **Build and deployment → Source** 选择为 **GitHub Actions**。配置发布源需要仓库管理员或维护者权限。
3. 在仓库 **Settings → Environments → github-pages** 限制仅 `main` 可部署；若组织要求，可加审批规则。组织若限制 Actions，需要允许本工作流使用的官方 Actions。
4. 在 Pages 设置的 **Custom domain** 填写 `bioinformatic.tech` 并保存，再修改 DNS。设置自定义域名需要仓库管理员权限。
5. 合并会触发发布；如果首次发布因 Pages 尚未启用而失败，在设置完成后重新运行，或在 **Actions → 校验与部署 AI × Bio → Run workflow** 选择 `main`。

`public/CNAME` 记录预期域名，并随 Astro 构建复制到产物。GitHub Actions 发布模式下，GitHub 不以此文件绑定域名；**必须完成 Pages 设置或调用 GitHub Pages API**。不要因为文件已存在就认为域名已绑定。[发布源与 CNAME 的限制](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Astro 的 `site` 应为 `https://bioinformatic.tech`，自定义主域名的 `base` 应为 `/`。若临时改用默认项目地址 `https://AI-skill-mcp.github.io/AIxBio-DailyReport/`，还需配套调整 `site`、`base` 与内部链接；当前域名配置不能直接当作默认项目路径使用。[Astro 官方 Pages 指南](https://docs.astro.build/en/guides/deploy/github/)

## 用户需要完成的 DNS 设置

2026-10-16 的公共 DNS 查询结果：`bioinformatic.tech` 的 `A`、`AAAA` 查询均为 `NOERROR` 且没有地址应答；`www.bioinformatic.tech` 当前 `CNAME` 为 `ben-air.cn`。本次未修改这些记录，尚需用户将下列网站解析配置到 GitHub Pages。

在域名服务商控制台先检查现有记录，保留邮件等无关用途的记录。为以下网站主机替换冲突的旧解析，不配置通配符。

- 主机 `@`，类型 `A`，分别添加四条：
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- 若启用 IPv6，主机 `@`，类型 `AAAA`，分别添加四条：
  - `2606:50c0:8000::153`
  - `2606:50c0:8001::153`
  - `2606:50c0:8002::153`
  - `2606:50c0:8003::153`
- 主机 `www`，类型 `CNAME`，值 `AI-skill-mcp.github.io`。不要附加仓库名，也不要指向 `bioinformatic.tech`。

服务商支持 `ALIAS`/`ANAME` 时，可用 `@ → AI-skill-mcp.github.io` 替代主域的上述地址记录。正确配置主域和 `www` 后，Pages 会将 `www.bioinformatic.tech` 重定向至设置中的主域。DNS 传播可能需要最多 24 小时。[GitHub 官方 DNS 地址与操作说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

建议组织所有者先在 **AI-skill-mcp → Settings → Pages → Add a domain** 验证 `bioinformatic.tech`：按 GitHub 显示的值创建 TXT 记录，再点 **Verify**，并保留 TXT。值由 GitHub 生成，不应自行编造；组织验证覆盖其直接子域。[组织域名验证说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)

## HTTPS 与上线核对

DNS 检查通过后，GitHub 会自动申请 TLS 证书。待 Pages 中 **Enforce HTTPS** 可选时勾选；该选项可能需要最多 24 小时才出现。若证书一直未签发，检查主域与 `www` 是否存在冲突记录，并查看 Pages 的 DNS 检查结果。[HTTPS 配置与排错](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

用户可在本地核对解析：

```sh
dig bioinformatic.tech +noall +answer -t A
dig bioinformatic.tech +noall +answer -t AAAA
dig www.bioinformatic.tech +noall +answer -t CNAME
```

最后确认 `main` 的构建和部署均成功，访问主域、`www` 重定向、每日简报、技术详情、机会雷达、搜索及移动端页面，并检查 CSS、脚本、档案下载是否正常。上线结果以 Actions 成功记录、Pages 设置与实际访问为准。

## 日常内容更新

每日任务应先创建 Markdown/JSON 配对档案与来源核验记录，通过校验后提交开发分支及 PR；合并后才触发网站发布。此 Pages 工作流只负责校验和部署，未接通 ChatGPT 定时任务的新闻检索、仓库写入、重试或告警链路。历史新闻必须重新核验，不能把聊天记录中的标题或日期直接当作已确认事实发布。
