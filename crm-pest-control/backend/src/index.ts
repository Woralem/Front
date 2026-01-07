import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import orderRoutes from './routes/orders';
import statisticsRoutes from './routes/statistics';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// CORS - разрешаем все origins для Codespaces
app.use(cors({
  origin: true, // Разрешить все origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'CRM Pest Control API',
    version: '1.0.0',
    endpoints: {
      orders: '/api/orders',
      statistics: '/api/statistics/:year/:month',
    }
  });
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/statistics', statisticsRoutes);

// Error handling
app.use(errorHandler);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /api`);
      console.log(`   GET  /api/orders`);
      console.log(`   POST /api/orders`);
      console.log(`   GET  /api/statistics/:year/:month`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
