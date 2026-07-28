# 部署手册

> 适用：本机（macOS）→ GitHub + Vercel 部署流程
> 更新日期：2026-07-28

## 环境信息

| 项 | 值 |
|----|-----|
| GitHub 账号 | `clare-wang` |
| Vercel 账号 | `clare4` |
| SSH Key 路径 | `~/.ssh/id_ed25519` |
| 包管理器 | Bun |

---

## 一、前置准备（仅首次）

### 1.1 GitHub

- 账号：https://github.com/clare-wang
- SSH Key 已配置在 https://github.com/settings/keys
- SSH 公钥内容（如需重置）：
  ```
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIISqtFrWoLqwZP1diLX+yawDmUjPtQ8C7vkSfStj2BCM clare-wang@github
  ```
- 测试 SSH 连通性：`ssh -T git@github.com`（应返回 `Hi clare-wang!`）

### 1.2 Vercel

- 账号：https://vercel.com/clare4
- CLI 登录：`bun x vercel login`
- 测试登录状态：`bun x vercel whoami`

---

## 二、新项目部署流程

### 2.1 创建 GitHub 仓库

1. 浏览器访问 https://github.com/new
2. 填写仓库名（如 `my-project`）
3. 选择 Public
4. 点击 Create repository

### 2.2 推送代码

在项目目录下：

```bash
git init                                                # 如果还不是 git 仓库
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:clare-wang/<仓库名>.git
git branch -M main
git push -u origin main
```

### 2.3 部署到 Vercel

**方式一：首次部署用 CLI（推荐）**

```bash
cd <项目目录>
bun x vercel --yes --prod
```

> 注意：如果项目父目录含中文，需手动在 Vercel 网页端确认项目名。
> 部署后 CLI 会返回公网地址：`https://<项目名>-xxx.vercel.app`

**方式二：连接 Git 自动部署**

1. 打开 https://vercel.com/clare4
2. Add New → Project
3. Import 对应的 GitHub 仓库
4. 确认 Build Command（Next.js 默认为 `next build`）
5. Deploy

此后每次 `git push` 会自动触发部署。

---

## 三、常用命令速查

```bash
# 推送更新
git add . && git commit -m "描述" && git push

# 手动部署（跳过 Git，直接推送）
bun x vercel --prod

# 链接已有 Git 仓库到 Vercel
bun x vercel git connect

# 查看部署日志
bun x vercel logs <部署URL>

# 查看当前项目部署列表
bun x vercel list
```

---

## 四、网络注意事项

1. **GitHub HTTPS (443)** — 本机可能无法直连，使用 SSH 端口（22）推送代码
2. **npm 缓存权限** — 如遇 `EACCES` 错误，本机 npm 缓存被 root 污染，改用 `bun x` 代替 `npx`
3. **brew 安装大包** — 可能超时，优先下载预编译二进制（如 `gh` CLI 的 `.zip` release）到 `/tmp` 直接使用
4. **Vercel 构建** — 无网络限制，自动在美国节点构建

---

## 五、项目收录

| 项目 | GitHub | Vercel URL |
|------|--------|------------|
| `agent-platform`（井位部署智能决策平台） | [clare-wang/agent-platform](https://github.com/clare-wang/agent-platform) | [agent-platform-rouge-xi.vercel.app](https://agent-platform-rouge-xi.vercel.app) |

> 新部署项目后，在此表追加一行。
