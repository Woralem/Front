import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Интерфейсы
interface MonthParams {
  year: string;
  month: string;
}

interface AdSpendBody {
  date: string;
  amount: number;
}

interface PlanBody {
  primaryCount?: number;
  secondaryCount?: number;
  primarySum?: number;
  secondarySum?: number;
  totalSum?: number;
  cashDesk?: number;
  adSpend?: number;
  netProfit?: number;
}

// GET /api/statistics/:year/:month - Статистика за месяц
router.get('/:year/:month', asyncHandler(async (req: Request<MonthParams>, res: Response) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;
  
  // Get all completed orders for the month
  const orders = await prisma.order.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'completed',
    },
  });
  
  // Get daily ad spend
  const dailyStats = await prisma.dailyStats.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });
  
  // Get monthly plan
  let plan = await prisma.monthlyPlan.findUnique({
    where: {
      year_month: { year: parseInt(year), month: parseInt(month) },
    },
  });
  
  // Create default plan if not exists
  if (!plan) {
    plan = await prisma.monthlyPlan.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
      },
    });
  }
  
  // Calculate daily statistics
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const dailyData: Array<{
    date: string;
    primaryCount: number;
    secondaryCount: number;
    primarySum: number;
    secondarySum: number;
    totalSum: number;
    cashDesk: number;
    adSpend: number;
    netProfit: number;
  }> = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayOrders = orders.filter(o => o.date === dateStr);
    const dayAdSpend = dailyStats.find(s => s.date === dateStr)?.adSpend || 0;
    
    const primary = dayOrders.filter(o => o.orderType === 'primary');
    const secondary = dayOrders.filter(o => o.orderType === 'secondary');
    
    const primarySum = primary.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const secondarySum = secondary.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const cashDesk = dayOrders.reduce((sum, o) => sum + (o.cashDesk || 0), 0);
    
    dailyData.push({
      date: dateStr,
      primaryCount: primary.length,
      secondaryCount: secondary.length,
      primarySum,
      secondarySum,
      totalSum: primarySum + secondarySum,
      cashDesk,
      adSpend: dayAdSpend,
      netProfit: cashDesk - dayAdSpend,
    });
  }
  
  // Calculate totals
  const totals = dailyData.reduce((acc, day) => ({
    primaryCount: acc.primaryCount + day.primaryCount,
    secondaryCount: acc.secondaryCount + day.secondaryCount,
    primarySum: acc.primarySum + day.primarySum,
    secondarySum: acc.secondarySum + day.secondarySum,
    totalSum: acc.totalSum + day.totalSum,
    cashDesk: acc.cashDesk + day.cashDesk,
    adSpend: acc.adSpend + day.adSpend,
    netProfit: acc.netProfit + day.netProfit,
  }), {
    primaryCount: 0,
    secondaryCount: 0,
    primarySum: 0,
    secondarySum: 0,
    totalSum: 0,
    cashDesk: 0,
    adSpend: 0,
    netProfit: 0,
  });
  
  res.json({
    success: true,
    data: {
      daily: dailyData,
      totals,
      plan,
    },
  });
}));

// PUT /api/statistics/ad-spend - Обновить расходы на рекламу
router.put('/ad-spend', asyncHandler(async (req: Request<{}, {}, AdSpendBody>, res: Response) => {
  const { date, amount } = req.body;
  
  const stats = await prisma.dailyStats.upsert({
    where: { date },
    update: { adSpend: amount },
    create: { date, adSpend: amount },
  });
  
  res.json({ success: true, data: stats });
}));

// PUT /api/statistics/plan/:year/:month - Обновить план
router.put('/plan/:year/:month', asyncHandler(async (req: Request<MonthParams, {}, PlanBody>, res: Response) => {
  const { year, month } = req.params;
  
  const plan = await prisma.monthlyPlan.upsert({
    where: {
      year_month: { year: parseInt(year), month: parseInt(month) },
    },
    update: req.body,
    create: {
      year: parseInt(year),
      month: parseInt(month),
      ...req.body,
    },
  });
  
  res.json({ success: true, data: plan });
}));

export default router;