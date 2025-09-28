# 匿名小群组社区 MVP 项目骨架

一个面向匿名、小群组、去身份化讨论的社区服务端骨架。项目以 Fastify + Prisma + PostgreSQL (pgvector) 为基础，可在 Docker Compose 或本地 Node.js 环境中直接运行。

## 功能概览

- 匿名注册：生成不可逆影子 ID 和临时令牌
- 发帖：文本去个性化处理、内容审核占位、Redis 限流
- 帖子列表：仅返回 48 小时内有效的抹平文本
- 小群匹配：简单容量分配策略，群内帖子过滤
- 向量占位：提供 `/v1/posts/:id/vec` 接口写入伪向量
- 健康检查：`GET /health`

## 技术栈

- Node.js 20 + TypeScript
- Fastify (with @fastify/cors, @fastify/sensible)
- Prisma ORM + PostgreSQL + pgvector 扩展
- Redis 用于限流与风险埋点
- ESLint + Prettier 统一代码风格
- GitHub Actions 简易 CI（类型检查 + lint + 构建）

## 目录结构

```
.
├─ src/                # 应用源码
│  ├─ app.ts           # Fastify 实例构建、全局插件/错误处理
│  ├─ server.ts        # 启动入口，处理信号优雅退出
│  ├─ routes/          # 路由实现
│  ├─ services/        # 去个性化/审核/限流/分组逻辑
│  ├─ config/          # 环境变量校验、Redis 客户端
│  ├─ db/              # Prisma Client 实例
│  ├─ utils/           # 文本处理、日志、认证工具
│  └─ types/           # Fastify 类型扩展
├─ prisma/             # Prisma schema 与初始迁移
├─ docker/             # pgvector 初始化脚本
├─ docker-compose.yml  # 一键启动 app + postgres + redis
└─ Dockerfile          # 多阶段构建镜像
```

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务监听端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `CORS_ORIGIN` | `http://localhost:5173` | 允许的前端域名，逗号分隔 |
| `TOKEN_SECRET` | `replace-with-long-secret` | 令牌哈希盐，务必更换且保密 |
| `INTERNAL_API_TOKEN` | `replace-with-internal-token` | 内部向量接口的 Bearer Token |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/anon_mvp?schema=public` | Prisma/Postgres 连接串 |
| `REDIS_URL` | `redis://localhost:6379` | Redis 地址 |

> ⚠️ 影子 ID 与 token 通过单向哈希生成，不可逆。勿在响应中泄露用户自增 ID。

## 本地开发

### 先决条件

- Node.js 20+
- 本地 PostgreSQL（需启用 `pgvector` 扩展）
- 本地 Redis 7+

### 安装依赖与数据库同步

```bash
npm install
npm run db:push
```

如需生成新的迁移：

```bash
npm run db:migrate
```

打开 Prisma Studio：

```bash
npm run db:studio
```

### 启动开发服务器

```bash
npm run dev
```

服务默认监听 `http://localhost:3000`，保存源码将自动重启。

## 使用 Docker Compose

项目提供一键启动配置，包含应用、PostgreSQL (自动启用 pgvector) 与 Redis：

```bash
docker compose up --build
```

首次启动会执行 Prisma 迁移，请在容器内运行：

```bash
docker compose exec app npx prisma migrate deploy
```

## API 摘要

| 方法 | 路径 | 描述 |
| --- | --- | --- |
| `GET` | `/health` | 健康检查 |
| `POST` | `/v1/register` | 匿名注册，返回影子 ID + token |
| `POST` | `/v1/posts` | 发帖（需 Bearer Token），自动去个性化、审核、限流 |
| `GET` | `/v1/posts` | 拉取 48 小时内帖子，支持 `limit`/`cursor` |
| `POST` | `/v1/groups/join` | 加入/创建小群 (5–12 人容量策略) |
| `GET` | `/v1/groups/:id/posts` | 查看小群内帖子（需成员身份） |
| `POST` | `/v1/posts/:id/vec` | 写入伪向量，需 `x-internal-token` 头 |

## 安全与隐私说明

- 不采集精确地理位置、通讯录、相册等敏感数据
- 日志仅保留必要的技术指标（请求 ID、错误、Redis/DB 状态）
- Token 与影子 ID 均通过哈希生成，不可反解
- 文档预留“数据清除”接口说明：可在产品化阶段新增 `/v1/users/self-delete` 来调用异步擦除流程

## 常见问题

| 问题 | 排查思路 |
| --- | --- |
| 端口冲突 (`EADDRINUSE`) | 确认本地 3000/5432/6379 端口是否已被占用，必要时修改 `.env` 或 `docker-compose.yml` |
| `pgvector` 扩展失败 | 确认数据库用户具备超级权限；若本地 PostgreSQL 未安装，执行 `CREATE EXTENSION vector;` |
| Prisma 连接失败 | 检查 `DATABASE_URL` 是否正确、数据库是否启动；必要时运行 `npm run db:push` 重新同步 |
| Redis 连接失败 | 检查 `REDIS_URL`、确认服务运行；Docker 环境下确保网络未被占用 |

## 代码质量

- `npm run lint`：运行 ESLint
- `npm run format`：执行 Prettier 自动格式化
- GitHub Actions 会在 PR 中自动执行类型检查、lint 与构建

## 下一步建议

- 将伪向量写入替换为真实嵌入服务
- 实现内容审核回调与人工仲裁流程
- 增加风控指标（IP/ASN 黑名单、异常发帖频率）
- 加入数据清除接口与审计日志

