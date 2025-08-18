# Singularity 容器化部署

## 快速开始

本项目支持使用 Singularity 进行容器化部署，**完全不需要 Docker**。

### 自动 IP 检测功能

前端容器会**自动检测宿主机 IP**，无需手动配置即可与后端通信：

- 自动识别 Singularity 容器环境
- 自动获取宿主机 IP 地址
- 自动配置 nginx 代理到正确的后端地址

### 1. 安装 Singularity（只需这一个依赖）

```bash
# CentOS/RHEL
sudo yum install -y epel-release
sudo yum install -y singularity

# Ubuntu/Debian  
sudo apt-get update
sudo apt-get install -y singularity
```

### 2. 构建镜像

```bash
# 构建应用镜像（基于 Alpine Linux，不依赖 Docker）
sudo singularity build company-app.sif company-app-alpine.def
```

### 3. 运行应用

```bash
# 最简单的方式 - 自动检测所有配置
singularity run company-app.sif

# 指定后端端口（IP 自动检测）
singularity run --env BACKEND_PORT=8080 company-app.sif

# 完全手动指定（如需要）
singularity run --env API_BACKEND_URL=http://192.168.80.12:9080 company-app.sif
```

容器启动时会显示：
```
检测到 Singularity 容器环境
自动设置后端地址为: http://192.168.1.100:9080
```

## 使用脚本自动化

### 单服务部署

```bash
# 使用提供的脚本
./singularity-start.sh build --sudo  # 构建
./singularity-start.sh run           # 运行
```

### 多服务部署（前后端分离）

```bash
# 使用部署脚本管理多个容器
./singularity-deploy.sh start-all    # 启动所有服务
./singularity-deploy.sh status       # 查看状态
./singularity-deploy.sh stop-all     # 停止所有
```

### 微服务架构（多个后端）

```bash
# 编辑服务配置
vi services.conf

# 使用微服务脚本
./singularity-microservices.sh start  # 启动所有微服务
./singularity-microservices.sh status # 查看服务状态
./singularity-microservices.sh health # 健康检查
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `company-app-alpine.def` | Singularity 定义文件（基于 Alpine Linux） |
| `singularity-start.sh` | 单服务启动脚本 |
| `singularity-deploy.sh` | 前后端分离部署脚本 |
| `singularity-microservices.sh` | 微服务架构部署脚本 |
| `services.conf` | 微服务配置文件（自动生成） |

## 核心优势

1. **完全独立**：不需要 Docker，不需要守护进程
2. **安全性高**：运行不需要 root 权限
3. **HPC 友好**：原生支持集群环境
4. **单文件镜像**：SIF 文件便于分发和管理
5. **资源占用少**：没有额外的守护进程开销

## 网络通信

当多个 Singularity 容器需要通信时：

1. **默认方案**：使用主机网络，通过 localhost 通信
2. **推荐方案**：使用 Singularity 实例模式
3. **高级方案**：使用主机 IP 或网络命名空间

详细说明见 `SINGULARITY_README.md`。

## 故障排除

```bash
# 检查 Singularity 版本
singularity --version

# 测试镜像
singularity test company-app.sif

# 进入容器调试
singularity shell company-app.sif

# 查看运行日志
./singularity-deploy.sh logs
```

## 注意事项

- 构建镜像需要 sudo 权限
- 运行容器不需要 sudo
- 默认使用主机网络
- 端口需要在主机上可用