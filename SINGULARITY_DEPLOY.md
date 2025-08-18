# Singularity 容器部署方案

## 文件清单

| 文件 | 说明 |
|------|------|
| `singularity.sh` | 一键部署脚本 |
| `company-app.def` | 容器定义文件 |
| `SINGULARITY.md` | 使用文档 |

## 快速部署

```bash
# 1. 构建镜像（只需执行一次）
./singularity.sh build --sudo

# 2. 运行应用
./singularity.sh run

# 3. 访问
http://localhost:3000
```

## 核心特性

### 1. 自动 IP 检测
- 容器启动时自动检测宿主机 IP
- 前后端容器自动配置通信地址
- 无需手动配置网络

### 2. 基于 Docker Hub
- 使用 `node:18-alpine` 基础镜像
- 不需要本地安装 Docker
- Singularity 自动处理镜像转换

### 3. 环境变量配置
```bash
# 自定义后端端口
./singularity.sh run --backend-port 8080

# 自定义前端端口  
./singularity.sh run --frontend-port 3001

# 手动指定后端地址（可选）
singularity run --env API_BACKEND_URL=http://192.168.1.100:9080 company-app.sif
```

## 技术架构

```
┌─────────────────────────────────────┐
│      Singularity Container          │
├─────────────────────────────────────┤
│  nginx (前端服务)                    │
│    ├── 自动检测宿主机 IP             │
│    ├── 代理 /api 到后端              │
│    └── 服务静态文件                  │
├─────────────────────────────────────┤
│  supervisor (进程管理)               │
│    └── 管理 nginx 进程               │
├─────────────────────────────────────┤
│  Alpine Linux (基础系统)             │
└─────────────────────────────────────┘
```

## 构建流程

1. **拉取基础镜像**: Docker Hub → node:18-alpine
2. **安装依赖**: pnpm install
3. **构建前端**: pnpm run build
4. **配置服务**: nginx + supervisor
5. **打包 SIF**: 生成单文件镜像

## 常见问题

**Q: 为什么选择 Singularity？**
- 不需要 root 权限运行
- 适合 HPC/集群环境
- 单文件镜像便于分发

**Q: 需要 Docker 吗？**
- 不需要，Singularity 独立运行
- `Bootstrap: docker` 只是指定镜像源

**Q: 如何调试？**
```bash
# 进入容器 shell
./singularity.sh shell

# 查看 nginx 配置
cat /etc/nginx/http.d/default.conf

# 测试网络
wget -O- http://localhost:3000/health
```

## 部署检查清单

- [ ] 安装 Singularity 3.0+
- [ ] 项目根目录有 `pnpm-lock.yaml`
- [ ] 端口 3000 和 9080 可用
- [ ] 有 sudo 权限（仅构建时需要）

## 命令参考

```bash
# 构建
sudo singularity build company-app.sif company-app.def

# 运行
singularity run company-app.sif

# 实例模式
singularity instance start company-app.sif frontend
singularity instance list
singularity instance stop frontend

# 清理
rm -f company-app.sif
```