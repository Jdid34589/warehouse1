# ===== 运行镜像：精简 alpine，仅装生产依赖 =====
FROM node:20-alpine
WORKDIR /app

# 时区（日志时间与国内一致）
ENV TZ=Asia/Shanghai \
    NODE_ENV=production \
    PORT=8080

# 先装依赖，利用镜像层缓存
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

COPY src ./src

# 容器内非 root 运行（node 镜像自带 node 用户）
USER node

# 云托管按此端口探测；如控制台改为 80，改 EXPOSE 与 ENV PORT 即可
EXPOSE 8080

# 健康探测（可选，云托管控制台的健康检查优先级更高）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]