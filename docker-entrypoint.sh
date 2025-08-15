#!/bin/sh

# 替换 nginx 配置中的环境变量
echo "Configuring nginx with API_BACKEND_URL: ${API_BACKEND_URL}"
envsubst '${API_BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# 打印最终的 nginx 配置（用于调试）
echo "Generated nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# 启动 nginx
exec "$@"