export interface Order {
  id: string;
  orderType: 'primary' | 'secondary';
  clientName: string;
  pest: string;
  objectType: string;
  volume: string;
  address: string;
  date: string;
  time: string;
  basePrice: number;
  phones: string[];
  clientType: 'individual' | 'legal';
  comment: string;
  manager: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  // Completed order fields
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
  // Cancelled order fields
  cancelReason?: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  primaryCount: number;
  secondaryCount: number;
  primarySum: number;
  secondarySum: number;
  totalSum: number;
  cashDesk: number;
  adSpend: number;
  netProfit: number;
}

export interface MonthlyPlan {
  primaryCount: number;
  secondaryCount: number;
  primarySum: number;
  secondarySum: number;
  totalSum: number;
  cashDesk: number;
  adSpend: number;
  netProfit: number;
}
