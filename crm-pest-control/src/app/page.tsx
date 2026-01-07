// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/UI/Button';
import DashboardGrid from '@/components/Dashboard/DashboardGrid';
import CreateOrderModal from '@/components/Orders/CreateOrderModal';
import OrderDetailsModal from '@/components/Orders/OrderDetailsModal';
import SearchModal from '@/components/Search/SearchModal';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const { orders, isLoading, error, fetchOrders, clearError } = useOrderStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Загрузка заказов при изменении месяца
  const loadOrders = useCallback(() => {
    fetchOrders(year, month + 1);
  }, [fetchOrders, year, month]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Автообновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    setShowCreateModal(true);
  };

  const handleOrderCreated = () => {
    setShowCreateModal(false);
    setSelectedSlot(null);
    loadOrders();
  };

  const handleOrderUpdated = () => {
    setSelectedOrder(null);
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">🐜 CRM Дезинсекция</h1>
              {isLoading && (
                <span className="text-sm text-blue-600 animate-pulse">Загрузка...</span>
              )}
              {error && (
                <span className="text-sm text-red-600 cursor-pointer" onClick={clearError}>
                  ⚠️ {error}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => { setSelectedSlot(null); setShowCreateModal(true); }} 
                variant="success"
              >
                + Создать заявку
              </Button>
              <Button onClick={() => setShowSearchModal(true)} variant="secondary">
                🔍 Поиск
              </Button>
              <Button onClick={() => router.push('/statistics')} variant="primary">
                📊 Статистика
              </Button>
              <Button onClick={loadOrders} variant="secondary" disabled={isLoading}>
                🔄
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg text-xl"
            >
              ◀
            </button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {months[month]} {year}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-200 rounded-lg text-xl"
            >
              ▶
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg"
            >
              Сегодня
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span> Первичные ({orders.filter(o => o.orderType === 'primary' && o.status === 'in_progress').length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-500 rounded"></span> Повторные ({orders.filter(o => o.orderType === 'secondary' && o.status === 'in_progress').length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-400 rounded"></span> Выполнены ({orders.filter(o => o.status === 'completed').length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded"></span> Отменены ({orders.filter(o => o.status === 'cancelled').length})
            </span>
          </div>
        </div>

        <div className="h-[calc(100vh-200px)] overflow-auto">
          <DashboardGrid
            dates={dates}
            orders={orders}
            onOrderClick={setSelectedOrder}
            onSlotClick={handleSlotClick}
          />
        </div>
      </main>

      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedSlot(null); }}
        onSuccess={handleOrderCreated}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot?.time}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onSuccess={handleOrderUpdated}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectOrder={setSelectedOrder}
      />
    </div>
  );
}