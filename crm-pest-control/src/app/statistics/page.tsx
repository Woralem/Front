'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Button from '@/components/UI/Button';
import { useOrderStore } from '@/store/orderStore';
import { useAuth } from '@/contexts/AuthContext';
import { DailyStats } from '@/lib/api';

type PeriodMode = 'month' | 'custom';
type MobileTab = 'table' | 'summary';

function StatisticsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { statistics, isLoading, fetchStatistics, fetchStatisticsByPeriod, updateAdSpend } = useOrderStore();
  
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('table');
  
  const [localAdSpend, setLocalAdSpend] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);
  const dirtyFieldsRef = useRef<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const monthsShort = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
  ];

  useEffect(() => {
    if (!customStart && !customEnd) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setCustomStart(firstDay.toISOString().split('T')[0]);
      setCustomEnd(lastDay.toISOString().split('T')[0]);
    }
  }, [customStart, customEnd]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(() => {
    if (!mounted) return;
    
    initializedRef.current = false;
    
    if (periodMode === 'month') {
      fetchStatistics(year, month);
    } else if (customStart && customEnd) {
      fetchStatisticsByPeriod(customStart, customEnd);
    }
  }, [mounted, periodMode, year, month, customStart, customEnd, fetchStatistics, fetchStatisticsByPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (statistics?.daily && !initializedRef.current) {
      const adSpendMap: Record<string, string> = {};
      statistics.daily.forEach(day => {
        adSpendMap[day.date] = day.adSpend ? day.adSpend.toString() : '';
      });
      setLocalAdSpend(adSpendMap);
      initializedRef.current = true;
      dirtyFieldsRef.current.clear();
    }
  }, [statistics]);

  const saveAllDirtyFields = useCallback(async () => {
    const dirtyDates = Array.from(dirtyFieldsRef.current);
    if (dirtyDates.length === 0) return;

    setIsSaving(true);

    try {
      for (const date of dirtyDates) {
        const value = Number(localAdSpend[date]) || 0;
        await updateAdSpend(date, value);
      }
      dirtyFieldsRef.current.clear();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, [localAdSpend, updateAdSpend]);

  const handleAdSpendChange = (date: string, value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    setLocalAdSpend(prev => ({ ...prev, [date]: cleanValue }));
    dirtyFieldsRef.current.add(date);
  };

  const handleAdSpendBlur = async (date: string) => {
    if (!dirtyFieldsRef.current.has(date)) return;

    const value = Number(localAdSpend[date]) || 0;
    
    try {
      await updateAdSpend(date, value);
      dirtyFieldsRef.current.delete(date);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const changeMonth = async (delta: number) => {
    await saveAllDirtyFields();
    setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));
  };

  const handleApplyPeriod = async () => {
    await saveAllDirtyFields();
    loadData();
  };

  const handleBack = async () => {
    await saveAllDirtyFields();
    router.push('/');
  };

  const handleLogout = async () => {
    await saveAllDirtyFields();
    logout();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const daily = statistics?.daily || [];
  
  const calculateTotals = () => {
    let primaryCount = 0, secondaryCount = 0;
    let primarySum = 0, secondarySum = 0, totalSum = 0;
    let cashDesk = 0, adSpend = 0;

    daily.forEach(day => {
      primaryCount += day.primaryCount;
      secondaryCount += day.secondaryCount;
      primarySum += day.primarySum;
      secondarySum += day.secondarySum;
      totalSum += day.totalSum;
      cashDesk += day.cashDesk;
      adSpend += Number(localAdSpend[day.date]) || 0;
    });

    return {
      primaryCount,
      secondaryCount,
      primarySum,
      secondarySum,
      totalSum,
      cashDesk,
      adSpend,
      netProfit: cashDesk - adSpend,
    };
  };

  const totals = calculateTotals();

  const plan = statistics?.plan || {
    primaryCount: 30,
    secondaryCount: 15,
    primarySum: 800000,
    secondarySum: 150000,
    totalSum: 950000,
    cashDesk: 600000,
    adSpend: 300000,
    netProfit: 300000,
  };

  const getPercent = (fact: number, planValue: number) => 
    planValue ? Math.round((fact / planValue) * 100) : 0;

  const getDayNetProfit = (day: DailyStats) => {
    const adSpend = Number(localAdSpend[day.date]) || 0;
    return day.cashDesk - adSpend;
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
    });
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header - Desktop */}
      <header className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Статистика</h1>
                  <p className="text-xs text-gray-500">Аналитика и отчёты</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    Загрузка...
                  </div>
                )}
                {isSaving && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    <div className="w-3 h-3 rounded-full border-2 border-orange-600 border-t-transparent animate-spin"></div>
                    Сохранение...
                  </div>
                )}
              </div>
            </div>
            
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
      </header>

      {/* Header - Mobile */}
      <header className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-30 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg text-gray-500 active:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span className="font-semibold text-gray-900">Статистика</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {(isLoading || isSaving) && (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              )}
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

      {/* Period Selector - Desktop */}
      <div className="hidden sm:block bg-white border-b border-gray-100 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4 lg:gap-6 flex-wrap">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setPeriodMode('month')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Месяц
            </button>
            <button
              onClick={() => setPeriodMode('custom')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodMode === 'custom' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📆 Период
            </button>
          </div>

          {periodMode === 'month' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                disabled={isSaving}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-[140px] lg:min-w-[180px] text-center">
                <span className="text-base lg:text-lg font-semibold text-gray-900">
                  {months[month - 1]} {year}
                </span>
              </div>
              <button
                onClick={() => changeMonth(1)}
                disabled={isSaving}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Сейчас
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">С</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">по</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <Button onClick={handleApplyPeriod} size="sm" variant="success" disabled={isLoading}>
                Применить
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Period Selector - Mobile */}
      <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-3 space-y-3">
        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setPeriodMode('month')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              periodMode === 'month' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            📅 Месяц
          </button>
          <button
            onClick={() => setPeriodMode('custom')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              periodMode === 'custom' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            📆 Период
          </button>
        </div>

        {periodMode === 'month' ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              disabled={isSaving}
              className="p-2 rounded-lg text-gray-500 active:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-center"
            >
              <span className="text-base font-semibold text-gray-900">
                {monthsShort[month - 1]} {year}
              </span>
            </button>
            
            <button
              onClick={() => changeMonth(1)}
              disabled={isSaving}
              className="p-2 rounded-lg text-gray-500 active:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">С</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">По</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>
            <Button onClick={handleApplyPeriod} variant="success" className="w-full" disabled={isLoading}>
              Применить
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMobileTab('table')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mobileTab === 'table' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            📋 Таблица
          </button>
          <button
            onClick={() => setMobileTab('summary')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mobileTab === 'summary' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            📈 Итоги
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 lg:p-6">
        {/* Desktop Layout */}
        <div className="hidden sm:grid grid-cols-12 gap-4 lg:gap-6">
          {/* Daily Table */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ежедневная статистика
                </h2>
                <span className="text-sm text-gray-500">{daily.length} дней</span>
              </div>
              
              <div className="overflow-auto scrollbar-thin" style={{ maxHeight: '600px' }}>
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-3 lg:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          1°
                        </span>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          2°
                        </span>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Всего</th>
                      <th className="px-3 lg:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Касса</th>
                      <th className="px-3 lg:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Реклама</th>
                      <th className="px-3 lg:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ЧП</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daily.map((day, i) => {
                      const dayNetProfit = getDayNetProfit(day);
                      const isDirty = dirtyFieldsRef.current.has(day.date);
                      const dayHasData = day.primaryCount > 0 || day.secondaryCount > 0;
                      
                      return (
                        <tr 
                          key={i} 
                          className={`
                            transition-colors
                            ${isToday(day.date) ? 'bg-blue-50/50' : ''}
                            ${isWeekend(day.date) && !isToday(day.date) ? 'bg-gray-50/50' : ''}
                            ${dayHasData ? 'hover:bg-gray-50' : ''}
                          `}
                        >
                          <td className="px-3 lg:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isToday(day.date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                {formatDisplayDate(day.date)}
                              </span>
                              {isToday(day.date) && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
                                  Сегодня
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-3 text-center">
                            {day.primaryCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                {day.primaryCount}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 lg:px-4 py-3 text-center">
                            {day.secondaryCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                                {day.secondaryCount}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 lg:px-4 py-3 text-right">
                            {day.totalSum > 0 ? (
                              <span className="text-sm font-bold text-gray-900">{day.totalSum.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 lg:px-4 py-3 text-right">
                            {day.cashDesk > 0 ? (
                              <span className="text-sm font-medium text-green-600">{day.cashDesk.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 lg:px-4 py-3">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`
                                w-20 lg:w-24 px-2 lg:px-3 py-1.5 text-right text-sm rounded-lg border transition-all
                                focus:outline-none focus:ring-2
                                ${isDirty 
                                  ? 'border-orange-300 bg-orange-50 focus:ring-orange-500/20 focus:border-orange-500' 
                                  : 'border-gray-200 bg-white focus:ring-blue-500/20 focus:border-blue-500'
                                }
                              `}
                              value={localAdSpend[day.date] ?? ''}
                              onChange={(e) => handleAdSpendChange(day.date, e.target.value)}
                              onBlur={() => handleAdSpendBlur(day.date)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 lg:px-4 py-3 text-right">
                            <span className={`
                              text-sm font-bold px-2 py-1 rounded-lg
                              ${dayNetProfit > 0 ? 'text-green-700 bg-green-50' : ''}
                              ${dayNetProfit < 0 ? 'text-red-700 bg-red-50' : ''}
                              ${dayNetProfit === 0 ? 'text-gray-400' : ''}
                            `}>
                              {dayNetProfit !== 0 ? `${dayNetProfit > 0 ? '+' : ''}${dayNetProfit.toLocaleString()}` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer с итогами */}
              <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 lg:px-4 lg:py-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-700">ИТОГО</span>
                  
                  <div className="flex flex-wrap items-center gap-3 lg:gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm font-bold text-gray-900">{totals.primaryCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span className="text-sm font-bold text-gray-900">{totals.secondaryCount}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Касса: </span>
                      <span className="font-bold text-green-600">{totals.cashDesk.toLocaleString()} ₽</span>
                    </div>
                    
                    <div className={`
                      px-3 py-1.5 rounded-lg font-bold text-sm
                      ${totals.netProfit > 0 ? 'bg-green-100 text-green-700' : ''}
                      ${totals.netProfit < 0 ? 'bg-red-100 text-red-700' : ''}
                      ${totals.netProfit === 0 ? 'bg-gray-200 text-gray-600' : ''}
                    `}>
                      ЧП: {totals.netProfit >= 0 ? '+' : ''}{totals.netProfit.toLocaleString()} ₽
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4 lg:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <span className="text-sm font-medium">Заявок</span>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {totals.primaryCount + totals.secondaryCount}
                </div>
              </div>
              
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <span className="text-sm font-medium">Ср. чек</span>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {(totals.primaryCount + totals.secondaryCount) 
                    ? Math.round(totals.totalSum / (totals.primaryCount + totals.secondaryCount)).toLocaleString() 
                    : 0} ₽
                </div>
              </div>
            </div>

            {/* Unit Economics */}
            <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 lg:px-5 py-3 lg:py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Юнит-экономика</h3>
              </div>
              <div className="p-4 lg:p-5 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Выручка</span>
                  <span className="font-semibold text-gray-900">{totals.totalSum.toLocaleString()} ₽</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Сдано в кассу</span>
                  <span className="font-semibold text-green-600">+{totals.cashDesk.toLocaleString()} ₽</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Реклама</span>
                  <span className="font-semibold text-red-600">−{totals.adSpend.toLocaleString()} ₽</span>
                </div>
                
                <div className={`
                  -mx-4 lg:-mx-5 -mb-4 lg:-mb-5 px-4 lg:px-5 py-3 lg:py-4 mt-4
                  ${totals.netProfit >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}
                `}>
                  <div className="flex items-center justify-between text-white">
                    <span className="font-medium">Чистая прибыль</span>
                    <span className="text-xl lg:text-2xl font-bold">
                      {totals.netProfit >= 0 ? '+' : ''}{totals.netProfit.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          {mobileTab === 'table' ? (
            /* Mobile Table */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-auto touch-scroll" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Дата</th>
                      <th className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                      </th>
                      <th className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500">
                        <span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span>
                      </th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">Касса</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Рекл.</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500">ЧП</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daily.map((day, i) => {
                      const dayNetProfit = getDayNetProfit(day);
                      const isDirty = dirtyFieldsRef.current.has(day.date);
                      
                      return (
                        <tr 
                          key={i} 
                          className={`
                            ${isToday(day.date) ? 'bg-blue-50/50' : ''}
                            ${isWeekend(day.date) && !isToday(day.date) ? 'bg-gray-50/30' : ''}
                          `}
                        >
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-medium ${isToday(day.date) ? 'text-blue-600' : 'text-gray-900'}`}>
                              {formatDisplayDate(day.date)}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {day.primaryCount > 0 ? (
                              <span className="text-sm font-medium text-green-700">{day.primaryCount}</span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {day.secondaryCount > 0 ? (
                              <span className="text-sm font-medium text-amber-700">{day.secondaryCount}</span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            {day.cashDesk > 0 ? (
                              <span className="text-sm font-medium text-green-600">{(day.cashDesk / 1000).toFixed(0)}k</span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`
                                w-16 px-2 py-1 text-right text-sm rounded-lg border transition-all
                                focus:outline-none
                                ${isDirty 
                                  ? 'border-orange-300 bg-orange-50' 
                                  : 'border-gray-200 bg-white'
                                }
                              `}
                              value={localAdSpend[day.date] ?? ''}
                              onChange={(e) => handleAdSpendChange(day.date, e.target.value)}
                              onBlur={() => handleAdSpendBlur(day.date)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`
                              text-sm font-bold
                              ${dayNetProfit > 0 ? 'text-green-700' : ''}
                              ${dayNetProfit < 0 ? 'text-red-700' : ''}
                              ${dayNetProfit === 0 ? 'text-gray-400' : ''}
                            `}>
                              {dayNetProfit !== 0 ? `${dayNetProfit > 0 ? '+' : ''}${(dayNetProfit / 1000).toFixed(0)}k` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm font-bold">{totals.primaryCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      <span className="text-sm font-bold">{totals.secondaryCount}</span>
                    </div>
                  </div>
                  <div className={`
                    px-3 py-1 rounded-lg font-bold text-sm
                    ${totals.netProfit > 0 ? 'bg-green-100 text-green-700' : ''}
                    ${totals.netProfit < 0 ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    ЧП: {totals.netProfit >= 0 ? '+' : ''}{(totals.netProfit / 1000).toFixed(0)}k ₽
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Summary */
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Всего заявок</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totals.primaryCount + totals.secondaryCount}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {totals.primaryCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      {totals.secondaryCount}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Средний чек</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(totals.primaryCount + totals.secondaryCount) 
                      ? Math.round(totals.totalSum / (totals.primaryCount + totals.secondaryCount)).toLocaleString() 
                      : 0} ₽
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Финансы</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Общая выручка</span>
                    <span className="font-semibold text-gray-900">{totals.totalSum.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Первичные</span>
                    <span className="font-medium text-gray-700">{totals.primarySum.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Повторные</span>
                    <span className="font-medium text-gray-700">{totals.secondarySum.toLocaleString()} ₽</span>
                  </div>
                  
                  <div className="h-px bg-gray-100 my-2"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Сдано в кассу</span>
                    <span className="font-semibold text-green-600">+{totals.cashDesk.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Расход на рекламу</span>
                    <span className="font-semibold text-red-600">−{totals.adSpend.toLocaleString()} ₽</span>
                  </div>
                </div>
                
                {/* Net Profit */}
                <div className={`
                  px-4 py-4
                  ${totals.netProfit >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}
                `}>
                  <div className="flex items-center justify-between text-white">
                    <span className="font-medium">Чистая прибыль</span>
                    <span className="text-2xl font-bold">
                      {totals.netProfit >= 0 ? '+' : ''}{totals.netProfit.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Аналитика</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Маржинальность</span>
                    <span className={`font-semibold ${
                      totals.totalSum && (totals.netProfit / totals.totalSum) >= 0.2 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {totals.totalSum ? Math.round((totals.netProfit / totals.totalSum) * 100) : 0}%
                    </span>
                  </div>
                  {totals.adSpend > 0 && totals.primaryCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CPL (цена лида)</span>
                      <span className="font-semibold text-gray-900">
                        {Math.round(totals.adSpend / totals.primaryCount).toLocaleString()} ₽
                      </span>
                    </div>
                  )}
                  {totals.adSpend > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ROAS</span>
                      <span className={`font-semibold ${
                        (totals.totalSum / totals.adSpend) >= 3 ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {(totals.totalSum / totals.adSpend).toFixed(1)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <ProtectedRoute>
      <StatisticsContent />
    </ProtectedRoute>
  );
}