import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

interface MonthParams {
  year: string;
  month: string;
}

interface PeriodQuery {
  startDate?: string;
  endDate?: string;
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

// GET /api/statistics/period - Статистика за произвольный период
router.get('/period', asyncHandler(async (req: Request<{}, {}, {}, PeriodQuery>, res: Response) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'Укажите startDate и endDate' 
    });
  }

  const orders = await prisma.order.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'completed',
    },
  });

  const dailyStats = await prisma.dailyStats.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const start = new Date(startDate);
  const end = new Date(endDate);
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

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
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
      period: { startDate, endDate },
    },
  });
}));

// GET /api/statistics/:year/:month - Статистика за месяц
router.get('/:year/:month', asyncHandler(async (req: Request<MonthParams>, res: Response) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;
  
  const orders = await prisma.order.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'completed',
    },
  });
  
  const dailyStats = await prisma.dailyStats.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });
  
  let plan = await prisma.monthlyPlan.findUnique({
    where: {
      year_month: { year: parseInt(year), month: parseInt(month) },
    },
  });
  
  if (!plan) {
    plan = await prisma.monthlyPlan.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
      },
    });
  }
  
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

// PUT /api/statistics/ad-spend
router.put('/ad-spend', asyncHandler(async (req: Request<{}, {}, AdSpendBody>, res: Response) => {
  const { date, amount } = req.body;
  
  const stats = await prisma.dailyStats.upsert({
    where: { date },
    update: { adSpend: amount },
    create: { date, adSpend: amount },
  });
  
  res.json({ success: true, data: stats });
}));

// PUT /api/statistics/plan/:year/:month
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