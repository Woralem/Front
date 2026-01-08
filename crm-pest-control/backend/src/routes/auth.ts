import { Router, Request, Response } from 'express';
import { generateToken, verifyPassword, authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/auth/login - Вход
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Введите пароль' 
    });
  }

  if (!verifyPassword(password)) {
    return res.status(401).json({ 
      success: false, 
      error: 'Неверный пароль' 
    });
  }

  const token = generateToken('admin');
  
  res.json({ 
    success: true, 
    data: { 
      token,
      expiresIn: '7d'
    } 
  });
}));

// GET /api/auth/verify - Проверка токена
router.get('/verify', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ 
    success: true, 
    data: { 
      valid: true,
      userId: req.userId
    } 
  });
}));

// POST /api/auth/logout - Выход 
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Выход выполнен' });
}));

export default router;