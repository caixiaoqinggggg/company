#!/bin/bash

# Singularity 部署脚本
# 支持构建和运行公司分析应用

set -e

# 配置
SINGULARITY_DIR="./singularity"
SINGULARITY_IMAGE="company-app.sif"
SINGULARITY_DEF="$SINGULARITY_DIR/company-app-alpine.def"
BACKEND_PORT="${BACKEND_PORT:-9080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 帮助信息
show_help() {
    cat << EOF
使用方法: $0 [命令] [选项]

命令:
    build       构建 Singularity 镜像
    run         运行容器
    shell       进入容器 shell
    clean       清理镜像文件
    help        显示帮助

选项:
    --sudo              使用 sudo 构建镜像
    --backend-port PORT 设置后端端口 (默认: 9080)
    --frontend-port PORT 设置前端端口 (默认: 3000)

示例:
    $0 build --sudo     # 构建镜像
    $0 run              # 运行容器（自动检测 IP）
    $0 shell            # 进入容器调试

注意:
    - 容器会自动检测宿主机 IP 地址
    - 前后端容器可以在同一台机器上正常通信
    - 无需 Docker 环境

EOF
}

# 检查 Singularity
check_singularity() {
    if ! command -v singularity &> /dev/null; then
        log_error "Singularity 未安装"
        echo "安装方法:"
        echo "  CentOS/RHEL: sudo yum install -y singularity"
        echo "  Ubuntu/Debian: sudo apt-get install -y singularity"
        exit 1
    fi
    log_info "Singularity 版本: $(singularity --version)"
}

# 构建镜像
build_image() {
    local use_sudo=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --sudo) use_sudo=true; shift ;;
            *) shift ;;
        esac
    done
    
    log_info "开始构建 Singularity 镜像..."
    
    if [ ! -f "$SINGULARITY_DEF" ]; then
        log_error "定义文件不存在: $SINGULARITY_DEF"
        exit 1
    fi
    
    if [ "$use_sudo" = true ]; then
        log_info "使用 sudo 构建..."
        sudo singularity build --force "$SINGULARITY_IMAGE" "$SINGULARITY_DEF"
    else
        log_info "尝试无 sudo 构建..."
        singularity build --force "$SINGULARITY_IMAGE" "$SINGULARITY_DEF" || {
            log_warn "需要 root 权限"
            log_info "请使用: $0 build --sudo"
            exit 1
        }
    fi
    
    if [ -f "$SINGULARITY_IMAGE" ]; then
        log_info "✓ 镜像构建成功: $SINGULARITY_IMAGE"
        log_info "镜像大小: $(du -h $SINGULARITY_IMAGE | cut -f1)"
    fi
}

# 运行容器
run_container() {
    local backend_port="$BACKEND_PORT"
    local frontend_port="$FRONTEND_PORT"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-port)
                backend_port="$2"
                shift 2
                ;;
            --frontend-port)
                frontend_port="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    if [ ! -f "$SINGULARITY_IMAGE" ]; then
        log_error "镜像不存在: $SINGULARITY_IMAGE"
        log_info "请先运行: $0 build --sudo"
        exit 1
    fi
    
    log_info "启动容器..."
    log_info "配置:"
    log_info "  - 前端端口: $frontend_port"
    log_info "  - 后端端口: $backend_port (自动检测 IP)"
    log_info "  - 访问地址: http://localhost:$frontend_port"
    echo
    
    # 运行容器（会自动检测 IP）
    singularity run \
        --env BACKEND_PORT="$backend_port" \
        --env APP_PORT="$frontend_port" \
        --bind "$frontend_port:$frontend_port" \
        "$SINGULARITY_IMAGE"
}

# 进入容器 shell
shell_container() {
    if [ ! -f "$SINGULARITY_IMAGE" ]; then
        log_error "镜像不存在: $SINGULARITY_IMAGE"
        log_info "请先运行: $0 build --sudo"
        exit 1
    fi
    
    log_info "进入容器 shell..."
    singularity shell "$SINGULARITY_IMAGE"
}

# 清理镜像
clean_image() {
    if [ -f "$SINGULARITY_IMAGE" ]; then
        log_info "删除镜像: $SINGULARITY_IMAGE"
        rm -f "$SINGULARITY_IMAGE"
        log_info "✓ 清理完成"
    else
        log_info "镜像不存在，无需清理"
    fi
}

# 主函数
main() {
    check_singularity
    
    case "${1:-help}" in
        build)
            shift
            build_image "$@"
            ;;
        run)
            shift
            run_container "$@"
            ;;
        shell)
            shell_container
            ;;
        clean)
            clean_image
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"