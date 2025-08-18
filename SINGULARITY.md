# Singularity 部署

使用 Singularity 容器化部署，基于 Docker Hub 镜像。

## 重要说明

- **不需要安装 Docker** - Singularity 直接从 Docker Hub 拉取镜像
- **Bootstrap: docker** - 使用 Docker Hub 的 node:18-alpine 作为基础镜像
- **自动处理** - Singularity 会自动转换 Docker 镜像格式

## 快速开始

```bash
# 1. 构建镜像（必须在项目根目录执行）
./singularity.sh build --sudo

# 2. 运行应用（自动检测 IP 配置）
./singularity.sh run

# 3. 访问应用
# http://localhost:3000
```

## 构建注意事项

⚠️ **必须在项目根目录执行构建命令**，因为需要访问以下文件：
- `package.json` 
- `pnpm-lock.yaml`
- `src/` 目录
- `public/` 目录
- 其他配置文件

如果缺少 `pnpm-lock.yaml`，脚本会自动尝试生成。

## 特性

✅ **完全独立** - 不依赖 Docker  
✅ **自动配置** - 自动检测宿主机 IP，前后端容器自动通信  
✅ **简单部署** - 单个脚本完成所有操作  
✅ **安全运行** - 运行时不需要 root 权限  

## 文件结构

```
.
├── singularity.sh      # 主部署脚本
├── company-app.def     # Singularity 定义文件
└── company-app.sif     # 构建后的镜像文件（构建后生成）
```

## 常用命令

```bash
# 构建镜像
./singularity.sh build --sudo

# 运行容器
./singularity.sh run

# 自定义端口
./singularity.sh run --backend-port 8080 --frontend-port 3001

# 调试模式
./singularity.sh shell

# 清理镜像
./singularity.sh clean

# 查看帮助
./singularity.sh help
```

## 故障排除

1. **构建失败**：确保在项目根目录执行，且有 `pnpm-lock.yaml` 文件
2. **网络问题**：检查防火墙设置，确保端口可访问
3. **权限问题**：构建需要 sudo，运行不需要