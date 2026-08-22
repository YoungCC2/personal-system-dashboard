# 个人成长与决策系统

用于展示教育与成长的每日外部信号、周报、行动卡和决策复盘的静态前端。

## 展示范围与隐私边界

GitHub Pages 是公开展示层，数据生成脚本采用明确白名单：

- 发布：`education/inbox/`、`growth/inbox/`、`education/weekly/`、`growth/weekly/`、`decisions.md`
- 不发布：`growth/daily/`、英语学习资料、历史归档、系统配置和其他本地文件

`growth/daily/` 被视为个人实践输入，默认不进入公开仓库。新增展示目录前必须先检查隐私与公开发布边界。

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

完整验证（包含每日素材完整性、公开白名单、动态周报识别和 Pages 构建）：

```bash
npm test
```
