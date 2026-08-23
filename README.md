# 今日饮见 · Sip & Arcana

## 本地预览

直接打开 `index.html` 可以体验前端流程。部署到 Vercel 后，`/api/reading` 会自动调用智谱 GLM；本地文件模式会自动回退到内置模拟解读。

## Vercel 环境变量

在 Vercel Project Settings → Environment Variables 添加：

```text
ZHIPU_API_KEY=你的新智谱Key
```

不要把 Key 写进 `app.js`、HTML 或 Git 仓库。
