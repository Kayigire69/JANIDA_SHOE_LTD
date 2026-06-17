import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import authRoutes from './modules/auth/auth.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import productionRoutes from './modules/production/production.routes.js'
import batchRoutes from './modules/batch/batch.routes.js'
import inventoryRoutes from './modules/inventory/inventory.routes.js'
import qualityRoutes from './modules/quality/quality.routes.js'
import salesRoutes from './modules/sales/sales.routes.js'
import workforceRoutes from './modules/workforce/workforce.routes.js'
import equipmentRoutes from './modules/equipment/equipment.routes.js'
import securityRoutes from './modules/security/security.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/env.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smart-shoe-backend' })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/batch', batchRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/quality', qualityRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/workforce', workforceRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/admin', adminRoutes)
app.use(errorHandler)

export default app
