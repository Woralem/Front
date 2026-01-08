import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import orderRoutes from './routes/orders';
import statisticsRoutes from './routes/statistics';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: true,
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

// Public routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'CRM Pest Control API',
    version: '1.0.0',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/statistics', authMiddleware, statisticsRoutes);

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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });