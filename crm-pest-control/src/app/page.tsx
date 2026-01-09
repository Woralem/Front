'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Button from '@/components/UI/Button';
import DashboardGrid from '@/components/Dashboard/DashboardGrid';
import CreateOrderModal from '@/components/Orders/CreateOrderModal';
import OrderDetailsModal from '@/components/Orders/OrderDetailsModal';
import SearchModal from '@/components/Search/SearchModal';
import MobileNavbar from '@/components/UI/MobileNavbar';
import { useOrderStore } from '@/store/orderStore';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';

function DashboardContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { orders, isLoading, error, fetchOrders, clearError } = useOrderStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const monthsShort = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
  ];

  const loadOrders = useCallback(() => {
    fetchOrders(year, month + 1);
  }, [fetchOrders, year, month]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(loadOrders, 30000);
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Stats
  const stats = {
    primary: orders.filter(o => o.orderType === 'primary' && o.status === 'in_progress').length,
    secondary: orders.filter(o => o.orderType === 'secondary' && o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Desktop Header */}
      <header className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <span className="text-xl">🐜</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CRM Дезинсекция</h1>
                  <p className="text-xs text-gray-500">Управление заказами</p>
                </div>
              </div>
              
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                  Обновление...
                </div>
              )}
              
              {error && (
                <button
                  onClick={clearError}
                  className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </button>
              )}
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => { setSelectedSlot(null); setShowCreateModal(true); }} 
                variant="success"
                icon="+"
              >
                Создать заявку
              </Button>
              <Button onClick={() => setShowSearchModal(true)} variant="secondary" icon="🔍">
                Поиск
              </Button>
              <Button onClick={() => router.push('/statistics')} variant="secondary" icon="📊">
                Статистика
              </Button>
              <div className="w-px h-8 bg-gray-200"></div>
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Обновить"
              >
                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Выход"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-30 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-base">🐜</span>
              </div>
              <span className="font-semibold text-gray-900">CRM</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              )}
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="p-2 rounded-lg text-gray-500 active:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 active:bg-red-50 active:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Subheader */}
      <div className="hidden sm:block bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {months[month]} {year}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              Сегодня
            </button>
          </div>
          
          {/* Stats badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium text-green-700">Первичные</span>
              <span className="text-sm font-bold text-green-800">{stats.primary}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              <span className="text-sm font-medium text-amber-700">Повторные</span>
              <span className="text-sm font-bold text-amber-800">{stats.secondary}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full"></span>
              <span className="text-sm font-medium text-gray-600">Выполнены</span>
              <span className="text-sm font-bold text-gray-800">{stats.completed}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              <span className="text-sm font-medium text-red-700">Отменены</span>
              <span className="text-sm font-bold text-red-800">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Month Navigation */}
      <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 -ml-2 rounded-lg text-gray-500 active:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="flex-1 text-center"
          >
            <span className="text-base font-semibold text-gray-900">
              {monthsShort[month]} {year}
            </span>
          </button>
          
          <button
            onClick={() => changeMonth(1)}
            className="p-2 -mr-2 rounded-lg text-gray-500 active:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Stats */}
        <div className="flex items-center justify-center gap-4 mt-2 pb-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{stats.primary}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{stats.secondary}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="text-xs text-gray-600">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{stats.cancelled}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="p-4 sm:p-6">
        <DashboardGrid
          dates={dates}
          orders={orders}
          onOrderClick={setSelectedOrder}
          onSlotClick={handleSlotClick}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavbar
        onCreateClick={() => { setSelectedSlot(null); setShowCreateModal(true); }}
        onSearchClick={() => setShowSearchModal(true)}
        onStatsClick={() => router.push('/statistics')}
      />

      {/* Modals */}
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}