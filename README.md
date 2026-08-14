# 个人成长与决策系统

用于展示教育观察、个人成长周报、行动卡和决策复盘的静态前端。

## 线上发布

推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages：

`https://youngcc2.github.io/personal-system-dashboard/`

GitHub Pages 托管的是本仓库中已提交的 `data/content.json`。本地采集任务完成后，在 `web/` 中运行 `npm run content`，提交并推送更新后的数据文件，线上页面就会自动刷新。

## 本地开发

```bash
npm install
npm run dev
```

验证 GitHub Pages 的静态构建：

```bash
npm run build:pages
```
