import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, DailyStats, MonthlyPlan } from '@/types';

interface OrderStore {
  orders: Order[];
  dailyAdSpend: Record<string, number>;
  monthlyPlan: MonthlyPlan;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrdersByDate: (date: string) => Order[];
  getOrdersByMonth: (year: number, month: number) => Order[];
  searchOrders: (phone?: string, address?: string, date?: string) => Order[];
  setDailyAdSpend: (date: string, amount: number) => void;
  setMonthlyPlan: (plan: Partial<MonthlyPlan>) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      dailyAdSpend: {},
      monthlyPlan: {
        primaryCount: 30,
        secondaryCount: 15,
        primarySum: 800000,
        secondarySum: 150000,
        totalSum: 950000,
        cashDesk: 600000,
        adSpend: 300000,
        netProfit: 300000,
      },
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (id, updatedOrder) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o)),
        })),
      deleteOrder: (id) =>
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
      getOrdersByDate: (date) => get().orders.filter((o) => o.date === date),
      getOrdersByMonth: (year, month) =>
        get().orders.filter((o) => {
          const d = new Date(o.date);
          return d.getFullYear() === year && d.getMonth() === month;
        }),
      searchOrders: (phone, address, date) =>
        get().orders.filter((o) => {
          if (phone && !o.phones.some((p) => p.includes(phone))) return false;
          if (address && !o.address.toLowerCase().includes(address.toLowerCase())) return false;
          if (date && o.date !== date) return false;
          return true;
        }),
      setDailyAdSpend: (date, amount) =>
        set((state) => ({ dailyAdSpend: { ...state.dailyAdSpend, [date]: amount } })),
      setMonthlyPlan: (plan) =>
        set((state) => ({ monthlyPlan: { ...state.monthlyPlan, ...plan } })),
    }),
    { name: 'crm-orders' }
  )
);
