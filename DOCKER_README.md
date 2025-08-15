# Docker 部署指南

本项目已配置 Docker 支持，可以方便地进行容器化部署，并支持灵活配置后端 API 地址。

## 快速开始

### 1. 环境准备

确保已安装：
- Docker
- Docker Compose

### 2. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改后端 API 地址：

```env
# 应用端口
APP_PORT=3000

# 后端 API 地址（修改为你的实际地址）
API_BACKEND_URL=http://your-backend-server:9080
```

### 3. 构建和运行

使用 Docker Compose 构建并启动应用：

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

应用将在 `http://localhost:3000` 上运行（端口取决于 APP_PORT 配置）。

## 仅使用 Docker（不使用 Docker Compose）

### 构建镜像

```bash
docker build -t company-analysis:latest .
```

### 运行容器

```bash
docker run -d \
  --name company-app \
  -p 3000:80 \
  -e API_BACKEND_URL=http://your-backend-server:9080 \
  company-analysis:latest
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 使用阶段 |
|--------|------|--------|----------|
| `APP_PORT` | 应用访问端口 | 3000 | 运行时 |
| `API_BACKEND_URL` | 后端 API 服务地址 | http://192.168.80.12:9080 | 运行时 |
| `VITE_API_BASE_URL` | 前端 API 请求前缀 | /api | 构建时 |

### 架构说明

1. **多阶段构建**：使用 Node.js 构建应用，使用 Nginx 运行应用，减小镜像体积
2. **动态配置**：通过环境变量在运行时配置后端 API 地址，无需重新构建
3. **反向代理**：Nginx 将 `/api` 请求代理到配置的后端服务器
4. **静态资源优化**：配置了 gzip 压缩和缓存策略

### 自定义配置

#### 修改 Nginx 配置

如需自定义 Nginx 配置，修改 `nginx.conf.template` 文件。

#### 修改构建参数

在构建时传入不同的参数：

```bash
docker build \
  --build-arg VITE_API_BASE_URL=/custom-api \
  -t company-analysis:custom .
```

## 生产环境部署建议

1. **使用 HTTPS**：在生产环境中配置 SSL 证书
2. **配置域名**：修改 Nginx server_name 配置
3. **日志管理**：配置日志轮转和持久化
4. **健康检查**：添加健康检查端点
5. **资源限制**：在 docker-compose.yml 中配置资源限制

```yaml
services:
  company-app:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 故障排查

### 查看容器日志

```bash
docker-compose logs company-app
```

### 进入容器调试

```bash
docker exec -it company-analysis-app sh
```

### 检查 Nginx 配置

```bash
docker exec company-analysis-app cat /etc/nginx/conf.d/default.conf
```

### 常见问题

1. **API 请求失败**：检查 `API_BACKEND_URL` 是否正确配置
2. **端口冲突**：修改 `APP_PORT` 为其他可用端口
3. **构建失败**：确保 pnpm-lock.yaml 文件存在且完整

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```