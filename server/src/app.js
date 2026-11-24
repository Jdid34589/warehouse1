// server/src/app.js Express 应用装配：中间件 → 根路径/健康检查 → 业务路由 → 404 → 错误处理
// 路由顺序说明（INVALID_PATH 排查要点）：
//   1) 根路径 GET / 必须在任何 app.use('*') / 404 兜底之前注册，否则会被兜底吞掉；
//   2) 健康检查 /healthz 保持"零依赖"（不查数据库、不调外部服务），避免探活误判；
//   3) 业务路由统一挂在 /api 前缀下（与根路径互不影响），未命中再进 404。
const express = require('express')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', true) // 云托管网关会加一层代理，便于取真实 IP/协议

// —— 基础中间件 ——
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))

// 极简访问日志（云托管日志里可据此确认网关是否打到本服务）
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`)
  })
  next()
})

// —— 根路径与健康检查（最先注册，保证 / 一定能命中）——
app.get('/', (req, res) => {
  res.type('text/plain; charset=utf-8').send('Service is running')
})

app.get('/healthz', (req, res) => {
  res.json({ status: 'UP', time: new Date().toISOString(), uptime: Math.round(process.uptime()) })
})

// —— 业务路由（示例，后续按需挂载）——
const api = express.Router()
api.get('/ping', (req, res) => res.json({ ok: true, pong: Date.now() }))
app.use('/api', api)

// —— 404：统一 JSON，避免网关把空响应误判 ——
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: 'Not Found', path: req.originalUrl })
})

// —— 错误处理：必须 4 个参数，且放在最后 ——
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] 未捕获异常', err)
  res.status(err && err.status ? err.status : 500).json({
    code: err && err.code ? err.code : 500,
    msg: '服务异常，请稍后重试'
  })
})

module.exports = app