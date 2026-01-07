// Определяем API URL
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Для Codespaces
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('.app.github.dev')) {
      const backendHost = hostname.replace('-3000.', '-5000.');
      return `https://${backendHost}/api`;
    }
  }
  
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  console.log(`📡 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const json: ApiResponse<T> = await response.json();
    
    console.log(`�� Response:`, json);

    if (!response.ok) {
      throw new Error(json.error || json.message || `HTTP ${response.status}`);
    }
    
    if (json.success === false) {
      throw new Error(json.error || 'API Error');
    }

    return json.data as T;
  } catch (error) {
    console.error(`❌ API Error:`, error);
    throw error;
  }
}

// Types
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
  createdAt: string;
}

export interface CreateOrderData {
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

export interface UpdateOrderData extends Partial<CreateOrderData> {
  status?: 'in_progress' | 'completed' | 'cancelled';
  finalAmount?: number;
  masterPercent?: number;
  repeatDate?: string;
  repeatTime?: string;
  masterName?: string;
  masterContact?: string;
  completionComment?: string;
  cancelReason?: string;
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

export interface TotalsStats {
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

export interface StatisticsData {
  daily: DailyStats[];
  totals: TotalsStats;
  plan: MonthlyPlan;
}

// API Methods
export const api = {
  // Health check
  health: () => fetch(`${API_URL.replace('/api', '')}/health`).then(r => r.json()),
  
  // Orders
  getOrders: (params?: { date?: string; month?: string; year?: string }) => {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString() : '';
    return fetchApi<Order[]>(`/orders${query ? `?${query}` : ''}`);
  },

  getOrder: (id: string) => fetchApi<Order>(`/orders/${id}`),

  createOrder: (data: CreateOrderData) => fetchApi<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateOrder: (id: string, data: UpdateOrderData) => fetchApi<Order>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteOrder: (id: string) => fetchApi<void>(`/orders/${id}`, {
    method: 'DELETE',
  }),

  searchOrders: (params: { phone?: string; address?: string; date?: string }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return fetchApi<Order[]>(`/orders/search/query?${query}`);
  },

  // Statistics
  getStatistics: (year: number, month: number) => 
    fetchApi<StatisticsData>(`/statistics/${year}/${month.toString().padStart(2, '0')}`),

  updateAdSpend: (date: string, amount: number) => fetchApi<void>('/statistics/ad-spend', {
    method: 'PUT',
    body: JSON.stringify({ date, amount }),
  }),
};

export default api;
