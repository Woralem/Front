import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import orderRoutes from './routes/orders';
import statisticsRoutes from './routes/statistics';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`📁 Created uploads directory: ${UPLOADS_DIR}`);
}

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  const filePath = path.join(UPLOADS_DIR, req.path);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    return res.sendFile(filePath);
  }
  
  next();
});

app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  fallthrough: true,
}));

app.get('/debug/uploads', (_req: Request, res: Response) => {
  try {
    const exists = fs.existsSync(UPLOADS_DIR);
    const files = exists ? fs.readdirSync(UPLOADS_DIR) : [];
    
    res.json({
      success: true,
      data: {
        uploadsDir: UPLOADS_DIR,
        exists,
        fileCount: files.length,
        files: files.map(f => ({
          name: f,
          url: `/uploads/${f}`,
          size: fs.statSync(path.join(UPLOADS_DIR, f)).size,
        })),
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: (error as Error).message,
      uploadsDir: UPLOADS_DIR,
    });
  }
});

// Logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Public routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uploadsDir: UPLOADS_DIR,
    uploadsExists: fs.existsSync(UPLOADS_DIR),
  });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'CRM Pest Control API',
    version: '1.0.0',
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/statistics', authMiddleware, statisticsRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);

// Error handling
app.use(errorHandler);

// 404 - в самом конце
app.use((req: Request, res: Response) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
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

process.on('SIGINT', async () => { 
  await prisma.$disconnect(); 
  process.exit(0); 
});