# Shelter Web 前端

匿名小群社区的最小可用前端，基于 React + TypeScript + Vite 开发。

## 开发

```bash
npm install
npm run dev
```

默认服务监听 `http://localhost:5173`。如需修改后端地址，在项目根目录复制 `.env.example` 为 `.env` 并调整：

```
VITE_API_BASE=http://localhost:3000
```

启动步骤：

1. 启动 PostgreSQL 与 Redis（可使用项目根目录的 Docker Compose）。
2. 启动后端服务：`npm run dev`。
3. 在 `web/` 目录安装依赖并运行 `npm run dev`。

浏览器访问 `http://localhost:5173` 即可体验注册、发帖、浏览和小群互动流程。
