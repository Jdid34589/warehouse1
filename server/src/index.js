// server/src/index.js 启动入口：端口优先读云托管注入的 PORT，其次 8080；必须监听 0.0.0.0
// 若仅监听 127.0.0.1，容器外的云托管网关访问不到，任意路径都会返回 INVALID_PATH。
const app = require('./app')

const PORT = Number(process.env.PORT) || 8080
const HOST = '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`)
  console.log('[server] 根路径健康探测: GET /  |  探活: GET /healthz')
})

// 云托管缩容/发版会发送 SIGTERM：优雅关闭，避免请求被硬切断
const shutdown = (signal) => {
  console.log(`[server] 收到 ${signal}，开始优雅关闭`)
  server.close(() => {
    console.log('[server] 已关闭')
    process.exit(0)
  })
  // 兜底：10s 内未关闭则强制退出
  setTimeout(() => process.exit(1), 10000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection', reason)
})