#!/bin/bash

# Singularity 微服务部署脚本
# 支持多个后端服务的容器化部署

set -e

# 配置文件路径
CONFIG_FILE="${CONFIG_FILE:-services.conf}"
PID_DIR="${PID_DIR:-./.pids}"
LOG_DIR="${LOG_DIR:-./.logs}"
INSTANCE_PREFIX="${INSTANCE_PREFIX:-svc}"

# 创建必要目录
mkdir -p "$PID_DIR" "$LOG_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }
log_service() { echo -e "${CYAN}[$1]${NC} $2"; }

# 创建默认服务配置文件
create_default_config() {
    cat > "$CONFIG_FILE" << 'EOF'
# Singularity 微服务配置文件
# 格式: SERVICE_NAME|IMAGE_FILE|PORT|ENV_VARS|DEPENDENCIES

# 前端服务
frontend|company-app.sif|3000|APP_PORT=3000,API_BACKEND_URL=http://localhost:9080|api-gateway

# API 网关
api-gateway|gateway.sif|9080|PORT=9080,AUTH_SERVICE=http://localhost:9081,USER_SERVICE=http://localhost:9082,DATA_SERVICE=http://localhost:9083|

# 认证服务
auth-service|auth.sif|9081|PORT=9081,DB_HOST=localhost,DB_PORT=5432|

# 用户服务  
user-service|user.sif|9082|PORT=9082,DB_HOST=localhost,DB_PORT=5432|auth-service

# 数据分析服务
data-service|data.sif|9083|PORT=9083,REDIS_HOST=localhost,REDIS_PORT=6379|

# 数据库（如果也是容器化的）
#postgres|postgres.sif|5432|POSTGRES_PASSWORD=secret|
#redis|redis.sif|6379||
EOF
    log_info "已创建默认配置文件: $CONFIG_FILE"
}

# 解析服务配置
parse_service_config() {
    local line="$1"
    
    # 跳过注释和空行
    [[ "$line" =~ ^#.*$ ]] && return 1
    [[ -z "$line" ]] && return 1
    
    # 解析配置行
    IFS='|' read -r name image port env_vars deps <<< "$line"
    
    # 导出为全局变量
    export SERVICE_NAME="$name"
    export SERVICE_IMAGE="$image"
    export SERVICE_PORT="$port"
    export SERVICE_ENV="$env_vars"
    export SERVICE_DEPS="$deps"
    
    return 0
}

# 获取服务状态
get_service_status() {
    local service_name="$1"
    local instance_name="${INSTANCE_PREFIX}-${service_name}"
    
    # 检查 Singularity 实例
    if singularity instance list | grep -q "$instance_name"; then
        echo "running (instance)"
        return 0
    fi
    
    # 检查 PID 文件
    local pid_file="${PID_DIR}/${service_name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "running (pid: $pid)"
            return 0
        fi
    fi
    
    echo "stopped"
    return 1
}

# 等待服务启动
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local max_wait="${3:-30}"
    
    log_service "$service_name" "等待服务启动 (端口: $port)..."
    
    local count=0
    while [ $count -lt $max_wait ]; do
        if nc -z localhost "$port" 2>/dev/null; then
            log_service "$service_name" "✓ 服务已就绪"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo
    
    log_warn "服务 $service_name 启动超时"
    return 1
}

# 启动单个服务
start_service() {
    local service_name="$1"
    local use_instance="${2:-true}"
    
    log_info "启动服务: $service_name"
    
    # 从配置文件读取服务信息
    while IFS= read -r line; do
        if parse_service_config "$line"; then
            if [ "$SERVICE_NAME" = "$service_name" ]; then
                break
            fi
        fi
    done < "$CONFIG_FILE"
    
    if [ -z "$SERVICE_NAME" ]; then
        log_error "未找到服务配置: $service_name"
        return 1
    fi
    
    # 检查镜像文件
    if [ ! -f "$SERVICE_IMAGE" ]; then
        log_error "镜像文件不存在: $SERVICE_IMAGE"
        return 1
    fi
    
    # 检查服务是否已运行
    if get_service_status "$service_name" | grep -q "running"; then
        log_warn "服务已在运行: $service_name"
        return 0
    fi
    
    # 启动依赖服务
    if [ -n "$SERVICE_DEPS" ]; then
        IFS=',' read -ra DEPS <<< "$SERVICE_DEPS"
        for dep in "${DEPS[@]}"; do
            log_service "$service_name" "检查依赖: $dep"
            if ! get_service_status "$dep" | grep -q "running"; then
                log_service "$service_name" "启动依赖服务: $dep"
                start_service "$dep" "$use_instance"
            fi
        done
    fi
    
    # 构建环境变量参数
    local env_args=""
    if [ -n "$SERVICE_ENV" ]; then
        IFS=',' read -ra ENVS <<< "$SERVICE_ENV"
        for env in "${ENVS[@]}"; do
            env_args="$env_args --env $env"
        done
    fi
    
    # 启动服务
    if [ "$use_instance" = "true" ]; then
        # 使用 Singularity 实例
        local instance_name="${INSTANCE_PREFIX}-${service_name}"
        
        log_service "$service_name" "启动实例: $instance_name"
        singularity instance start \
            $env_args \
            --bind "${SERVICE_PORT}:${SERVICE_PORT}" \
            "$SERVICE_IMAGE" "$instance_name"
        
        log_service "$service_name" "✓ 实例已启动"
    else
        # 使用后台进程
        local log_file="${LOG_DIR}/${service_name}.log"
        local pid_file="${PID_DIR}/${service_name}.pid"
        
        log_service "$service_name" "启动进程..."
        nohup singularity run \
            $env_args \
            "$SERVICE_IMAGE" > "$log_file" 2>&1 &
        
        echo $! > "$pid_file"
        log_service "$service_name" "✓ 进程已启动 (PID: $(cat $pid_file))"
    fi
    
    # 等待服务就绪
    if [ -n "$SERVICE_PORT" ]; then
        wait_for_service "$service_name" "$SERVICE_PORT"
    fi
    
    return 0
}

# 停止单个服务
stop_service() {
    local service_name="$1"
    
    log_info "停止服务: $service_name"
    
    # 停止实例
    local instance_name="${INSTANCE_PREFIX}-${service_name}"
    if singularity instance list | grep -q "$instance_name"; then
        singularity instance stop "$instance_name"
        log_service "$service_name" "实例已停止"
    fi
    
    # 停止进程
    local pid_file="${PID_DIR}/${service_name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            log_service "$service_name" "进程已停止 (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi
}

# 启动所有服务
start_all_services() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_warn "配置文件不存在，创建默认配置..."
        create_default_config
    fi
    
    log_info "========================================="
    log_info "启动所有服务"
    log_info "========================================="
    
    # 读取并启动所有服务
    while IFS= read -r line; do
        if parse_service_config "$line"; then
            start_service "$SERVICE_NAME"
        fi
    done < "$CONFIG_FILE"
    
    log_info "========================================="
    log_info "所有服务启动完成"
    log_info "========================================="
    
    show_status
}

# 停止所有服务
stop_all_services() {
    log_info "停止所有服务..."
    
    # 停止所有实例
    for instance in $(singularity instance list | grep "^${INSTANCE_PREFIX}-" | awk '{print $1}'); do
        singularity instance stop "$instance"
    done
    
    # 停止所有进程
    for pid_file in "${PID_DIR}"/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
            fi
            rm -f "$pid_file"
        fi
    done
    
    log_info "所有服务已停止"
}

# 显示服务状态
show_status() {
    echo
    echo -e "${CYAN}服务状态:${NC}"
    echo "----------------------------------------"
    printf "%-20s %-30s %-10s %s\n" "服务名称" "镜像" "端口" "状态"
    echo "----------------------------------------"
    
    while IFS= read -r line; do
        if parse_service_config "$line"; then
            local status=$(get_service_status "$SERVICE_NAME")
            local status_color="${GREEN}"
            if [[ "$status" == "stopped" ]]; then
                status_color="${RED}"
            fi
            printf "%-20s %-30s %-10s ${status_color}%s${NC}\n" \
                "$SERVICE_NAME" "$SERVICE_IMAGE" "$SERVICE_PORT" "$status"
        fi
    done < "$CONFIG_FILE"
    echo "----------------------------------------"
}

# 查看服务日志
show_logs() {
    local service_name="$1"
    
    if [ -z "$service_name" ]; then
        # 显示所有日志
        tail -f "${LOG_DIR}"/*.log 2>/dev/null || log_error "没有日志文件"
    else
        # 显示特定服务日志
        local log_file="${LOG_DIR}/${service_name}.log"
        if [ -f "$log_file" ]; then
            tail -f "$log_file"
        else
            log_error "日志文件不存在: $log_file"
        fi
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    echo
    
    while IFS= read -r line; do
        if parse_service_config "$line"; then
            echo -n "检查 $SERVICE_NAME (端口: $SERVICE_PORT)... "
            
            if [ -n "$SERVICE_PORT" ]; then
                if nc -z localhost "$SERVICE_PORT" 2>/dev/null; then
                    echo -e "${GREEN}✓ 健康${NC}"
                else
                    echo -e "${RED}✗ 不可达${NC}"
                fi
            else
                echo -e "${YELLOW}- 无端口${NC}"
            fi
        fi
    done < "$CONFIG_FILE"
}

# 服务依赖图
show_dependencies() {
    echo -e "${CYAN}服务依赖关系:${NC}"
    echo
    
    while IFS= read -r line; do
        if parse_service_config "$line"; then
            if [ -n "$SERVICE_DEPS" ]; then
                echo "$SERVICE_NAME -> $SERVICE_DEPS"
            else
                echo "$SERVICE_NAME (无依赖)"
            fi
        fi
    done < "$CONFIG_FILE"
}

# 显示帮助
show_help() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start [service]     启动服务（不指定则启动所有）
    stop [service]      停止服务（不指定则停止所有）
    restart [service]   重启服务
    status              显示所有服务状态
    logs [service]      查看服务日志
    health              健康检查
    deps                显示服务依赖
    config              创建默认配置文件
    help                显示帮助

Options:
    --config FILE       指定配置文件 (默认: services.conf)
    --instance          使用实例模式 (默认)
    --process           使用进程模式

Examples:
    # 启动所有服务
    $0 start
    
    # 启动特定服务
    $0 start frontend
    
    # 查看状态
    $0 status
    
    # 查看特定服务日志
    $0 logs api-gateway
    
    # 健康检查
    $0 health

Configuration File Format:
    SERVICE_NAME|IMAGE_FILE|PORT|ENV_VARS|DEPENDENCIES
    
    Example:
    frontend|app.sif|3000|API_URL=http://localhost:9080|api-gateway
    api-gateway|gateway.sif|9080|DB_HOST=localhost|database

EOF
}

# 主函数
main() {
    # 检查 Singularity
    if ! command -v singularity &> /dev/null; then
        log_error "Singularity 未安装"
        exit 1
    fi
    
    # 解析全局选项
    while [[ $# -gt 0 ]] && [[ "$1" == --* ]]; do
        case $1 in
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 执行命令
    case "${1:-help}" in
        start)
            if [ -n "$2" ]; then
                start_service "$2"
            else
                start_all_services
            fi
            ;;
        stop)
            if [ -n "$2" ]; then
                stop_service "$2"
            else
                stop_all_services
            fi
            ;;
        restart)
            if [ -n "$2" ]; then
                stop_service "$2"
                sleep 2
                start_service "$2"
            else
                stop_all_services
                sleep 2
                start_all_services
            fi
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        health)
            health_check
            ;;
        deps)
            show_dependencies
            ;;
        config)
            create_default_config
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

# 执行主函数
main "$@"