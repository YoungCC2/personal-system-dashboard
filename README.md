# 个人成长与决策系统

用于展示教育观察、个人成长周报、行动卡和决策复盘的静态前端。

## 线上发布

推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages：

`https://youngcc2.github.io/personal-system-dashboard/`

GitHub Pages 托管的是本仓库中已提交的 `data/content.json`。本地采集任务完成后，Codex 调度器会运行：

```bash
npm run sync:dashboard -- --publish
```

脚本只在内容确实变化时暂存并提交 `data/content.json`，然后推送 `main`；GitHub Actions 随后自动构建和发布。其他工作区改动不会被脚本加入提交。

只在本地刷新数据、不提交或推送：

```bash
npm run sync:dashboard
```

## 本地开发

```bash
npm install
npm run dev
```

验证 GitHub Pages 的静态构建：

```bash
npm run build:pages
```

完整验证：

```bash
npm test
```
