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

编辑 `.env` 文件，根据你的部署方式配置后端 API 地址：

```env
# 应用端口
APP_PORT=3000

# 后端 API 地址配置（根据部署方式选择）：
# 1. 前后端同一 docker-compose 部署
API_BACKEND_URL=http://backend:9080

# 2. 分别部署但在同一 Docker 网络
# API_BACKEND_URL=http://container-name:9080

# 3. 使用宿主机地址（Linux）
# API_BACKEND_URL=http://172.17.0.1:9080

# 4. 使用宿主机地址（Docker Desktop）
# API_BACKEND_URL=http://host.docker.internal:9080
```

### 3. 构建和运行

#### 方式一：前后端一起部署（推荐）

使用完整的 docker-compose 配置：

```bash
# 使用包含前后端的完整配置
cp docker-compose.full.yml docker-compose.yml

# 修改后端镜像名称（编辑 docker-compose.yml）
# 将 your-backend-image:latest 替换为实际的后端镜像

# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 方式二：仅部署前端

使用默认的 docker-compose 配置：

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

#### 方式一：与后端容器在同一网络

```bash
# 创建共享网络
docker network create company-network

# 假设后端容器已在运行（名称为 backend-container）
docker run -d \
  --name backend-container \
  --network company-network \
  -p 9080:9080 \
  your-backend-image:latest

# 运行前端容器
docker run -d \
  --name company-app \
  --network company-network \
  -p 3000:80 \
  -e API_BACKEND_URL=http://backend-container:9080 \
  company-analysis:latest
```

#### 方式二：使用宿主机地址

```bash
# Linux 环境
docker run -d \
  --name company-app \
  -p 3000:80 \
  -e API_BACKEND_URL=http://172.17.0.1:9080 \
  company-analysis:latest

# Docker Desktop (Mac/Windows)
docker run -d \
  --name company-app \
  -p 3000:80 \
  -e API_BACKEND_URL=http://host.docker.internal:9080 \
  company-analysis:latest
```

## 容器间通信配置

### 网络架构选择

#### 1. Bridge 网络（推荐）
容器间使用服务名或容器名通信：

```yaml
# docker-compose.yml
services:
  backend:
    container_name: company-backend
    # ...
  
  frontend:
    environment:
      API_BACKEND_URL: http://backend:9080  # 使用服务名
      # 或
      # API_BACKEND_URL: http://company-backend:9080  # 使用容器名
```

#### 2. Host 网络模式
容器直接使用宿主机网络（仅 Linux）：

```bash
docker run --network host ...
# 可以使用 localhost:9080 访问后端
```

#### 3. 跨主机部署
使用实际 IP 地址或域名：

```env
API_BACKEND_URL=http://192.168.1.100:9080
# 或
API_BACKEND_URL=https://api.example.com
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 使用阶段 |
|--------|------|--------|----------|
| `APP_PORT` | 应用访问端口 | 3000 | 运行时 |
| `API_BACKEND_URL` | 后端 API 服务地址 | http://backend:9080 | 运行时 |
| `VITE_API_BASE_URL` | 前端 API 请求前缀 | /api | 构建时 |

### 后端地址配置示例

| 部署方式 | API_BACKEND_URL 配置值 | 说明 |
|---------|------------------------|------|
| 同一 docker-compose | `http://backend:9080` | 使用服务名 |
| 同一 Docker 网络 | `http://container-name:9080` | 使用容器名 |
| Linux Docker | `http://172.17.0.1:9080` | Docker 默认网桥 |
| Docker Desktop | `http://host.docker.internal:9080` | Mac/Windows |
| 跨主机 | `http://192.168.1.100:9080` | 实际 IP 地址 |

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

1. **API 请求失败**
   - 检查 `API_BACKEND_URL` 是否正确配置
   - 确认前后端容器在同一网络
   - 使用 `docker network ls` 查看网络
   - 使用 `docker network inspect <network-name>` 检查容器是否在网络中

2. **容器间无法通信**
   ```bash
   # 测试容器间连通性
   docker exec company-app ping backend-container
   
   # 检查容器网络
   docker inspect company-app | grep NetworkMode
   ```

3. **端口冲突**：修改 `APP_PORT` 为其他可用端口

4. **构建失败**：确保 pnpm-lock.yaml 文件存在且完整

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```