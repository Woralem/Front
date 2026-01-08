import { create } from 'zustand';
import api, { Order, CreateOrderData, UpdateOrderData, StatisticsData } from '@/lib/api';

interface OrderStore {
  // State
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (year: number, month: number) => Promise<void>;
  fetchOrdersByDate: (date: string) => Promise<void>;
  createOrder: (data: CreateOrderData) => Promise<Order>;
  updateOrder: (id: string, data: UpdateOrderData) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  searchOrders: (phone?: string, address?: string, date?: string) => Promise<Order[]>;
  
  // Statistics
  statistics: StatisticsData | null;
  fetchStatistics: (year: number, month: number) => Promise<void>;
  fetchStatisticsByPeriod: (startDate: string, endDate: string) => Promise<void>;
  updateAdSpend: (date: string, amount: number) => Promise<void>;
  
  // Helpers
  clearError: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  statistics: null,

  fetchOrders: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.getOrders({ 
        year: year.toString(), 
        month: month.toString() 
      });
      set({ orders, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchOrdersByDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.getOrders({ date });
      set({ orders, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createOrder: async (data: CreateOrderData) => {
    set({ isLoading: true, error: null });
    try {
      const newOrder = await api.createOrder(data);
      set((state) => ({ 
        orders: [...state.orders, newOrder], 
        isLoading: false 
      }));
      return newOrder;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateOrder: async (id: string, data: UpdateOrderData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedOrder = await api.updateOrder(id, data);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        isLoading: false,
      }));
      return updatedOrder;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteOrder: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteOrder(id);
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchOrders: async (phone?: string, address?: string, date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.searchOrders({ phone, address, date });
      set({ isLoading: false });
      return orders;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  fetchStatistics: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const statistics = await api.getStatistics(year, month);
      set({ statistics, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStatisticsByPeriod: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const statistics = await api.getStatisticsByPeriod(startDate, endDate);
      set({ statistics, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateAdSpend: async (date: string, amount: number) => {
    try {
      await api.updateAdSpend(date, amount);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));