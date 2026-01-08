import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Требуется авторизация' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Недействительный токен' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Ошибка авторизации' 
    });
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyPassword = (password: string): boolean => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === adminPassword;
};