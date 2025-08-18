# Singularity 部署

使用 Singularity 容器化部署，**无需 Docker 环境**。

## 快速开始

```bash
# 1. 构建镜像
./singularity.sh build --sudo

# 2. 运行应用（自动检测 IP 配置）
./singularity.sh run

# 3. 访问应用
# http://localhost:3000
```

## 特性

✅ **完全独立** - 不依赖 Docker  
✅ **自动配置** - 自动检测宿主机 IP，前后端容器自动通信  
✅ **简单部署** - 单个脚本完成所有操作  
✅ **安全运行** - 运行时不需要 root 权限  

## 文件结构

```
.
├── singularity.sh              # 主部署脚本
└── singularity/               # Singularity 配置目录
    ├── company-app-alpine.def  # 容器定义文件
    ├── microservices.sh        # 微服务部署脚本（可选）
    ├── README.md              # 详细文档
    └── QUICKSTART.md          # 快速指南
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

## 高级用法

如需微服务部署或更多配置，请查看 `singularity/README.md`。