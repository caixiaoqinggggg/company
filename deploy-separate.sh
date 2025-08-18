#!/bin/bash

# 创建共享网络（如果不存在）
docker network create company-shared-network 2>/dev/null || true

# 启动后端容器
docker run -d \
  --name company-backend \
  --network company-shared-network \
  -p 9080:9080 \
  your-backend-image:latest

# 启动前端容器
docker run -d \
  --name company-frontend \
  --network company-shared-network \
  -p 3000:80 \
  -e API_BACKEND_URL=http://company-backend:9080 \
  company-analysis:latest