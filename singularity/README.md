# Singularity 部署指南

本文档说明如何使用 Singularity 容器化技术部署公司分析应用。

## 重要说明

**Singularity 完全独立于 Docker！**
- 不需要安装 Docker
- 不需要 Docker 守护进程
- 可以在没有 Docker 的环境中运行
- 本项目使用基于 Alpine Linux 的原生 Singularity 镜像

**自动 IP 检测功能**
- 前端容器自动检测宿主机 IP
- 无需手动配置即可与后端通信
- 支持同机器多容器部署

## 前置要求

1. **安装 Singularity**
   ```bash
   # CentOS/RHEL
   sudo yum install -y singularity
   
   # Ubuntu/Debian
   sudo apt-get install -y singularity
   
   # 或从源码安装（推荐版本 3.8+）
   # 参考: https://docs.sylabs.io/guides/latest/user-guide/quick_start.html
   ```

2. **验证安装**
   ```bash
   singularity --version
   ```

## 快速开始

### 使用自动化脚本

提供了 `singularity-start.sh` 脚本简化操作：

```bash
# 查看帮助
./singularity-start.sh help

# 构建镜像（需要 root 权限）
./singularity-start.sh build --sudo

# 运行容器
./singularity-start.sh run

# 自定义后端地址运行
./singularity-start.sh run --backend-url http://192.168.80.12:9080

# 进入容器调试
./singularity-start.sh shell

# 清理镜像
./singularity-start.sh clean
```

### 手动构建和运行

1. **构建镜像**
   ```bash
   # 需要 root 权限构建（基于 Alpine Linux，不依赖 Docker）
   sudo singularity build company-app.sif company-app-alpine.def
   ```

2. **运行容器**
   ```bash
   # 基本运行
   singularity run company-app.sif
   
   # 配置后端地址
   singularity run --env API_BACKEND_URL=http://192.168.80.12:9080 company-app.sif
   
   # 绑定端口（如果需要不同端口）
   singularity run --env APP_PORT=8080 --bind 8080:8080 company-app.sif
   ```

3. **调试模式**
   ```bash
   # 进入容器 shell
   singularity shell company-app.sif
   
   # 执行特定命令
   singularity exec company-app.sif nginx -v
   ```

## 配置说明

### 环境变量

- `API_BACKEND_URL`: 后端 API 地址（默认: http://localhost:9080）
- `APP_PORT`: 应用监听端口（默认: 3000）

### 定义文件结构

`company-app-alpine.def` 包含以下主要部分：

- **Bootstrap**: 基于 Singularity Library 的 Alpine Linux 镜像
- **%files**: 复制应用源代码
- **%post**: 构建步骤（安装依赖、构建前端、配置 nginx）
- **%environment**: 默认环境变量
- **%runscript**: 容器启动脚本
- **%labels**: 容器元数据
- **%help**: 使用说明

**注意**: 使用 `Bootstrap: library` 而不是 `Bootstrap: docker`，完全不依赖 Docker。

## 高级配置

### 1. 持久化存储

如需持久化日志或数据：

```bash
# 创建本地目录
mkdir -p ./logs

# 运行时绑定目录
singularity run --bind ./logs:/var/log/nginx company-app.sif
```

### 2. 网络配置

Singularity 默认使用主机网络，无需额外配置。如需隔离网络：

```bash
# 使用网络命名空间（需要 root）
sudo singularity run --net --network-args "portmap=3000:3000/tcp" company-app.sif
```

### 3. 资源限制

```bash
# 限制内存使用
singularity run --memory 2g company-app.sif

# 限制 CPU
singularity run --cpus 2 company-app.sif
```

### 4. 集群部署

在 HPC 集群环境中使用 SLURM：

```bash
#!/bin/bash
#SBATCH --job-name=company-app
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=4G

module load singularity
singularity run --env API_BACKEND_URL=$BACKEND_URL company-app.sif
```

## 故障排除

### 1. 构建失败

```bash
# 检查权限
ls -la company-app.def

# 使用 --sandbox 模式调试
sudo singularity build --sandbox company-app-sandbox company-app.def
singularity shell --writable company-app-sandbox
```

### 2. 运行时错误

```bash
# 查看详细日志
singularity run --debug company-app.sif

# 检查容器内部
singularity exec company-app.sif ls -la /usr/share/nginx/html
singularity exec company-app.sif cat /etc/nginx/conf.d/default.conf
```

### 3. 网络连接问题

```bash
# 测试后端连接
singularity exec company-app.sif wget -O- http://192.168.80.12:9080/api/health

# 检查 DNS
singularity exec company-app.sif nslookup backend-server
```

## 性能优化

1. **镜像优化**
   - 使用多阶段构建减小镜像体积
   - 清理不必要的文件和缓存

2. **缓存配置**
   ```bash
   # 设置 Singularity 缓存目录
   export SINGULARITY_CACHEDIR=/path/to/cache
   ```

3. **并发配置**
   - 调整 nginx worker 进程数
   - 优化连接池设置

## 安全建议

1. **镜像签名**
   ```bash
   # 生成密钥对
   singularity key newpair
   
   # 签名镜像
   singularity sign company-app.sif
   
   # 验证签名
   singularity verify company-app.sif
   ```

2. **运行时安全**
   - 避免以 root 用户运行容器
   - 使用只读绑定挂载
   - 限制容器权限

## 与 Docker 对比

| 特性 | Docker | Singularity |
|------|--------|-------------|
| Root 权限 | 运行需要 | 运行不需要 |
| 镜像格式 | 分层 | 单文件 SIF |
| 网络隔离 | 默认隔离 | 默认共享主机 |
| HPC 支持 | 有限 | 原生支持 |
| 安全性 | 需要 daemon | 无 daemon |

## 多容器部署（前后端分离）

当前后端都使用 Singularity 容器时，需要注意网络配置：

### 网络通信方案

1. **主机网络模式（最简单）**
   ```bash
   # 前后端都使用主机网络，通过 localhost 通信
   ./singularity-deploy.sh start-all --network-mode host
   ```
   - 优点：配置简单，性能好
   - 缺点：端口可能冲突

2. **Singularity 实例模式（推荐）**
   ```bash
   # 使用实例管理容器
   ./singularity-deploy.sh start-all --network-mode instance
   ```
   - 优点：容器管理方便，支持服务发现
   - 缺点：需要 Singularity 3.1+

3. **使用主机 IP 地址**
   ```bash
   # 获取主机 IP
   HOST_IP=$(hostname -I | awk '{print $1}')
   
   # 启动时指定
   singularity run --env API_BACKEND_URL=http://${HOST_IP}:9080 company-app.sif
   ```

### 解决 localhost 访问问题

**问题**：前后端容器间使用 localhost 可能无法通信

**解决方案**：

1. **使用 --net 参数共享网络命名空间**
   ```bash
   # 后端
   singularity instance start --net backend.sif backend
   
   # 前端（共享后端的网络）
   singularity run --net --env API_BACKEND_URL=http://localhost:9080 frontend.sif
   ```

2. **使用 Unix Socket**
   ```bash
   # 创建共享目录
   mkdir -p /tmp/shared-sockets
   
   # 启动容器时绑定
   singularity run --bind /tmp/shared-sockets:/var/run backend.sif
   singularity run --bind /tmp/shared-sockets:/var/run frontend.sif
   ```

3. **使用环境变量动态配置**
   ```bash
   # 自动检测并设置
   if [ -n "$SINGULARITY_CONTAINER" ]; then
       # 在容器内，使用主机 IP
       API_URL="http://$(ip route | grep default | awk '{print $3}'):9080"
   else
       # 在主机上，使用 localhost
       API_URL="http://localhost:9080"
   fi
   ```

### 使用部署脚本

提供了 `singularity-deploy.sh` 简化多容器管理：

```bash
# 查看帮助
./singularity-deploy.sh help

# 启动前后端（自动处理网络）
./singularity-deploy.sh start-all

# 使用实例模式
./singularity-deploy.sh start-all --network-mode instance

# 自定义端口
./singularity-deploy.sh start-all --backend-port 8080 --frontend-port 3001

# 查看状态
./singularity-deploy.sh status

# 查看日志
./singularity-deploy.sh logs frontend
./singularity-deploy.sh logs backend

# 测试网络连接
./singularity-deploy.sh network-test

# 停止所有服务
./singularity-deploy.sh stop-all
```

## 常见问题

**Q: 为什么选择 Singularity？**
A: Singularity 特别适合 HPC 环境，不需要 root 权限运行，更安全。

**Q: 如何从 Docker 镜像转换？**
A: Singularity 可以直接使用 Docker 镜像：
```bash
singularity pull docker://nginx:alpine
```

**Q: 镜像文件可以共享吗？**
A: 是的，SIF 文件是单个文件，可以轻松复制和分发。

**Q: 前后端容器如何通信？**
A: 推荐使用主机网络模式或 Singularity 实例模式，详见多容器部署章节。

## 支持

如有问题，请查看：
- [Singularity 官方文档](https://docs.sylabs.io/)
- [项目 Issues](https://github.com/your-repo/issues)
- 联系运维团队