import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

const deleteFileIfExists = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return;
  
  try {
    const filename = fileUrl.split('/').pop();
    if (!filename || filename === '.gitkeep') return;
    
    const filePath = path.join(UPLOADS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted old file: ${filename}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Интерфейсы для типизации
interface OrderQuery {
  date?: string;
  month?: string;
  year?: string;
  status?: string;
}

interface SearchQuery {
  phone?: string;
  address?: string;
  date?: string;
}

interface CreateOrderBody {
  orderType: 'primary' | 'secondary';
  clientName: string;
  pest: string;
  objectType: string;
  volume?: string;
  address: string;
  date: string;
  time: string;
  basePrice?: number;
  phones?: string[];
  clientType: 'individual' | 'legal';
  comment?: string;
  manager: string;
}

interface UpdateOrderBody extends Partial<CreateOrderBody> {
  status?: 'in_progress' | 'completed' | 'cancelled';
  finalAmount?: number;
  masterPercent?: number;
  masterIncome?: number;
  cashDesk?: number;
  repeatDate?: string;
  repeatTime?: string;
  masterName?: string;
  masterContact?: string;
  completionComment?: string;
  contractPhoto?: string;
  cancelReason?: string;
}

// GET /api/orders - Получить все заказы
router.get('/', asyncHandler(async (req: Request<{}, {}, {}, OrderQuery>, res: Response) => {
  const { date, month, year, status } = req.query;
  
  const where: {
    date?: string | { gte: string; lte: string };
    status?: string;
  } = {};
  
  if (date) {
    where.date = date;
  }
  
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    where.date = { gte: startDate, lte: endDate };
  }
  
  if (status) {
    where.status = status;
  }
  
  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  
  const ordersWithParsedPhones = orders.map(order => ({
    ...order,
    phones: JSON.parse(order.phones),
  }));
  
  res.json({ success: true, data: ordersWithParsedPhones });
}));

router.get('/search/query', asyncHandler(async (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {
  const { phone, address, date } = req.query;
  
  const where: {
    phones?: { contains: string };
    address?: { contains: string };
    date?: string;
  } = {};
  
  if (phone) {
    where.phones = { contains: phone };
  }
  
  if (address) {
    where.address = { contains: address };
  }
  
  if (date) {
    where.date = date;
  }
  
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ 
    success: true, 
    data: orders.map(o => ({ ...o, phones: JSON.parse(o.phones) })) 
  });
}));

// GET /api/orders/:id - Получить заказ по ID
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
  });
  
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  
  res.json({ 
    success: true, 
    data: { ...order, phones: JSON.parse(order.phones) } 
  });
}));

// POST /api/orders - Создать заказ
router.post('/', asyncHandler(async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  const {
    orderType,
    clientName,
    pest,
    objectType,
    volume,
    address,
    date,
    time,
    basePrice,
    phones,
    clientType,
    comment,
    manager,
  } = req.body;
  
  const order = await prisma.order.create({
    data: {
      id: uuidv4(),
      orderType,
      clientName,
      pest,
      objectType,
      volume: volume || '',
      address,
      date,
      time,
      basePrice: basePrice || 0,
      phones: JSON.stringify(phones || []),
      clientType,
      comment: comment || '',
      manager,
      status: 'in_progress',
    },
  });
  
  res.status(201).json({ 
    success: true, 
    data: { ...order, phones: JSON.parse(order.phones) } 
  });
}));

// PUT /api/orders/:id - Обновить заказ
router.put('/:id', asyncHandler(async (req: Request<{ id: string }, {}, UpdateOrderBody>, res: Response) => {
  const { id } = req.params;
  const updateData: Record<string, unknown> = { ...req.body };
  
  const currentOrder = await prisma.order.findUnique({ where: { id } });
  
  if (!currentOrder) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  
  if (
    updateData.contractPhoto !== undefined && 
    currentOrder.contractPhoto && 
    updateData.contractPhoto !== currentOrder.contractPhoto
  ) {
    deleteFileIfExists(currentOrder.contractPhoto);
  }
  
  if (updateData.phones && Array.isArray(updateData.phones)) {
    updateData.phones = JSON.stringify(updateData.phones);
  }
  
  if (
    updateData.status === 'completed' && 
    typeof updateData.finalAmount === 'number' && 
    typeof updateData.masterPercent === 'number'
  ) {
    updateData.masterIncome = (updateData.finalAmount * updateData.masterPercent) / 100;
    updateData.cashDesk = updateData.finalAmount - (updateData.masterIncome as number);
  }
  
  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });
  
  if (updateData.repeatDate && updateData.status === 'completed') {
    await prisma.order.create({
      data: {
        id: uuidv4(),
        orderType: 'secondary',
        clientName: currentOrder.clientName,
        pest: currentOrder.pest,
        objectType: currentOrder.objectType,
        volume: currentOrder.volume,
        address: currentOrder.address,
        date: updateData.repeatDate as string,
        time: (updateData.repeatTime as string) || '09:00',
        basePrice: currentOrder.basePrice,
        phones: currentOrder.phones,
        clientType: currentOrder.clientType,
        comment: '',
        manager: currentOrder.manager,
        status: 'in_progress',
      },
    });
  }
  
  res.json({ 
    success: true, 
    data: { ...order, phones: JSON.parse(order.phones) } 
  });
}));

// DELETE /api/orders/:id - Удалить заказ
router.delete('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
  });
  
  if (order?.contractPhoto) {
    deleteFileIfExists(order.contractPhoto);
  }
  
  await prisma.order.delete({
    where: { id: req.params.id },
  });
  
  res.json({ success: true, message: 'Order deleted' });
}));

export default router;