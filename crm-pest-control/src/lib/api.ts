const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
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

const getBaseUrl = (): string => {
  return API_URL.replace('/api', '');
};

export const BASE_URL = getBaseUrl();

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('crm_token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('crm_token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('crm_token');
  }
};

export const hasToken = (): boolean => {
  return !!getToken();
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Сессия истекла');
    }

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

async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await response.json();
  
  if (!response.ok || json.success === false) {
    throw new Error(json.error || 'Ошибка загрузки файла');
  }

  return json.data;
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
  contractPhoto?: string;
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
  plan?: MonthlyPlan;
  period?: { startDate: string; endDate: string };
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface UploadResponse {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
}

// API Methods
export const api = {
  // Auth
  login: (password: string) => fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }, false),

  verifyToken: () => fetchApi<{ valid: boolean }>('/auth/verify'),

  logout: () => {
    removeToken();
    return Promise.resolve();
  },
  
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

  // Upload
  uploadFile,
  
  deleteFile: (filename: string) => fetchApi<void>(`/upload/${filename}`, {
    method: 'DELETE',
  }),

  // Statistics
  getStatistics: (year: number, month: number) => 
    fetchApi<StatisticsData>(`/statistics/${year}/${month.toString().padStart(2, '0')}`),

  getStatisticsByPeriod: (startDate: string, endDate: string) =>
    fetchApi<StatisticsData>(`/statistics/period?startDate=${startDate}&endDate=${endDate}`),

  updateAdSpend: (date: string, amount: number) => fetchApi<void>('/statistics/ad-spend', {
    method: 'PUT',
    body: JSON.stringify({ date, amount }),
  }),
};

export default api;