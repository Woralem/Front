'use client';
import React, { useState, useEffect } from 'react';
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
  const { orders } = useOrderStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{date: string; time: string} | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const monthOrders = orders.filter(o => {
    const d = new Date(o.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    setShowCreateModal(true);
  };

  if (!mounted) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">🐜 CRM Дезинсекция</h1>
            <div className="flex gap-3">
              <Button onClick={() => { setSelectedSlot(null); setShowCreateModal(true); }} variant="success">
                + Создать заявку
              </Button>
              <Button onClick={() => setShowSearchModal(true)} variant="secondary">
                🔍 Поиск заявки
              </Button>
              <Button onClick={() => router.push('/statistics')} variant="primary">
                📊 Статистика
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-200 rounded-lg">◀</button>
            <h2 className="text-xl font-semibold">{months[month]} {year}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-200 rounded-lg">▶</button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Первичные</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"></span> Повторные</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 rounded"></span> Выполнены</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> Отменены</span>
          </div>
        </div>

        <div className="h-[calc^(100vh-200px^)] overflow-auto">
          <DashboardGrid
            dates={dates}
            orders={monthOrders}
            onOrderClick={setSelectedOrder}
            onSlotClick={handleSlotClick}
          />
        </div>
      </main>

      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedSlot(null); }}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot?.time}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectOrder={setSelectedOrder}
      />
    </div>
  );
}
