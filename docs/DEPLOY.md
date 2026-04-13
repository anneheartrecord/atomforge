# AtomForge 部署指南

## 部署架构

- **托管平台**: Cloudflare Pages
- **自定义域名**: `atomforge.charles-cheng.com`
- **DNS**: Cloudflare（域名已托管在 Cloudflare，配置零摩擦）
- **CI/CD**: GitHub Actions → Cloudflare Pages

## 为什么选 Cloudflare Pages

`charles-cheng.com` 的域名注册和 DNS 都在 Cloudflare 上（NS: `decker.ns.cloudflare.com` / `ophelia.ns.cloudflare.com`）。选 Cloudflare Pages 的理由：

1. DNS 在同一平台，添加子域名记录无需跨服务操作
2. 自动 HTTPS，无需手动申请证书
3. 全球 CDN 边缘节点，无冷启动
4. 免费额度足够（每月 500 次构建，无限带宽）

## 前置条件

- Cloudflare 账号（已有，管理 `charles-cheng.com`）
- GitHub 仓库已推送代码
- 以下 Secrets 配置到 GitHub 仓库的 `Settings → Secrets and variables → Actions`

## 第一步：创建 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `My Profile → API Tokens → Create Token`
3. 使用 **Custom token** 模板，权限配置：
   - `Account` → `Cloudflare Pages` → `Edit`
4. 复制生成的 Token

## 第二步：获取 Account ID

1. 在 Cloudflare Dashboard 首页，点击任意域名
2. 右侧栏可看到 **Account ID**（32 位十六进制字符串）

## 第三步：配置 GitHub Secrets

在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中添加：

| Secret 名称 | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 第一步创建的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 第二步获取的 Account ID |
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |

## 第四步：首次部署

首次需要手动创建 Cloudflare Pages 项目：

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录
wrangler login

# 本地构建
npm run build

# 创建项目并首次部署
wrangler pages deploy dist --project-name=atomforge
```

之后 push 到 `main` 分支会自动触发 GitHub Actions 部署。

## 第五步：绑定自定义域名

1. 进入 Cloudflare Dashboard → `Workers & Pages` → 选择 `atomforge` 项目
2. 点击 `Custom domains` → `Set up a custom domain`
3. 输入 `atomforge.charles-cheng.com`
4. Cloudflare 会自动添加 CNAME 记录（因为 DNS 在同一账号下），点击确认即可
5. 等待 SSL 证书自动签发（通常几分钟内完成）

## 第六步：配置环境变量（可选）

如果不想通过 GitHub Actions 构建时注入环境变量，也可以直接在 Cloudflare Pages 中配置：

1. 进入项目 → `Settings` → `Environment variables`
2. 分别添加 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 等变量
3. 注意：Vite 的环境变量在**构建时**注入，所以修改后需要重新触发部署

## SPA 路由说明

项目使用 React Router，已通过 `_redirects` 文件配置 SPA fallback：

```
/*  /index.html  200
```

所有非静态资源的请求都会回退到 `index.html`，确保客户端路由正常工作。

## 本地验证构建

```bash
npm run build
npm run preview
```

访问 `http://localhost:4173` 确认构建产物正常。

## 故障排查

| 问题 | 解决方案 |
|---|---|
| 部署成功但页面空白 | 检查 `dist/` 中是否有 `index.html`，确认 `base` 配置为 `/` |
| API 请求失败 | 确认环境变量已正确配置，Vite 环境变量必须以 `VITE_` 开头 |
| 自定义域名不生效 | 在 Cloudflare DNS 确认 CNAME 记录是否存在，等待 DNS 传播 |
| GitHub Actions 失败 | 检查 Secrets 是否正确配置，特别是 `CLOUDFLARE_API_TOKEN` 权限 |
