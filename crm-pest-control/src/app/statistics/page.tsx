'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Button from '@/components/UI/Button';
import { useOrderStore } from '@/store/orderStore';
import { useAuth } from '@/contexts/AuthContext';
import { DailyStats } from '@/lib/api';

type PeriodMode = 'month' | 'custom';

function StatisticsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { statistics, isLoading, fetchStatistics, fetchStatisticsByPeriod, updateAdSpend } = useOrderStore();
  
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [mounted, setMounted] = useState(false);
  
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyFieldsRef.current.size > 0) {
        saveAllDirtyFields();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveAllDirtyFields]);

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

  const setQuickPeriod = (type: 'today' | 'week') => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (type) {
      case 'today':
        start = now;
        end = now;
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
    }

    setCustomStart(start.toISOString().split('T')[0]);
    setCustomEnd(end.toISOString().split('T')[0]);
    setPeriodMode('custom');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
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

  const hasDirtyFields = dirtyFieldsRef.current.size > 0;

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: periodMode === 'custom' ? '2-digit' : undefined
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

  const hasData = totals.primaryCount > 0 || totals.secondaryCount > 0 || totals.totalSum > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-full mx-auto px-6 py-4">
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
                {hasDirtyFields && !isSaving && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Несохранённые изменения
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

      {/* Period Selector */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setPeriodMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 По месяцам
            </button>
            <button
              onClick={() => setPeriodMode('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodMode === 'custom' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📆 Произвольный период
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
              <div className="min-w-[180px] text-center">
                <span className="text-lg font-semibold text-gray-900">
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
                Текущий месяц
              </button>
            </div>
          ) : (
            <>
              {/* ✅ Улучшенные стили для выбора дат */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">С</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-44 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900
                               transition-all duration-200 cursor-pointer
                               hover:border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">по</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-44 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900
                               transition-all duration-200 cursor-pointer
                               hover:border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>
                <Button onClick={handleApplyPeriod} size="sm" variant="success" disabled={isLoading}>
                  Применить
                </Button>
              </div>
              <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
                <span className="text-sm text-gray-500">Быстрый выбор:</span>
                <button
                  onClick={() => setQuickPeriod('today')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
                >
                  Сегодня
                </button>
                <button
                  onClick={() => setQuickPeriod('week')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
                >
                  7 дней
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Daily Table */}
          <div className="col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Первич.
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          Повтор.
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Σ Первич.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Σ Повтор.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Всего</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">В кассу</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Расход РК</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ЧП</th>
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
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-center">
                            {day.primaryCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                {day.primaryCount}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {day.secondaryCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                                {day.secondaryCount}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {day.primarySum > 0 ? (
                              <span className="text-sm font-medium text-gray-900">{day.primarySum.toLocaleString()} ₽</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {day.secondarySum > 0 ? (
                              <span className="text-sm font-medium text-gray-900">{day.secondarySum.toLocaleString()} ₽</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {day.totalSum > 0 ? (
                              <span className="text-sm font-bold text-gray-900">{day.totalSum.toLocaleString()} ₽</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {day.cashDesk > 0 ? (
                              <span className="text-sm font-medium text-green-600">{day.cashDesk.toLocaleString()} ₽</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`
                                w-24 px-3 py-1.5 text-right text-sm rounded-lg border transition-all
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
                          <td className="px-4 py-3 text-right">
                            <span className={`
                              text-sm font-bold px-2 py-1 rounded-lg
                              ${dayNetProfit > 0 ? 'text-green-700 bg-green-50' : ''}
                              ${dayNetProfit < 0 ? 'text-red-700 bg-red-50' : ''}
                              ${dayNetProfit === 0 ? 'text-gray-400' : ''}
                            `}>
                              {dayNetProfit !== 0 ? `${dayNetProfit > 0 ? '+' : ''}${dayNetProfit.toLocaleString()} ₽` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer с итогами */}
              <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">ИТОГО за период</span>
                    {!hasData && (
                      <span className="text-xs text-gray-400">(нет данных)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Заявки */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Первичные:</span>
                        <span className="text-sm font-bold text-gray-900">{totals.primaryCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Повторные:</span>
                        <span className="text-sm font-bold text-gray-900">{totals.secondaryCount}</span>
                      </div>
                    </div>
                    
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    {/* Суммы */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Выручка: </span>
                        <span className="font-bold text-gray-900">{totals.totalSum.toLocaleString()} ₽</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">В кассу: </span>
                        <span className="font-bold text-green-600">{totals.cashDesk.toLocaleString()} ₽</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Реклама: </span>
                        <span className="font-bold text-red-600">{totals.adSpend.toLocaleString()} ₽</span>
                      </div>
                    </div>
                    
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    {/* Чистая прибыль */}
                    <div className={`
                      px-4 py-2 rounded-xl font-bold
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

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6">
            {periodMode === 'custom' && statistics?.period && (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Выбранный период</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {new Date(statistics.period.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {new Date(statistics.period.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-blue-100 text-sm">
                  {daily.length} дней в периоде
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium">Всего заявок</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {totals.primaryCount + totals.secondaryCount}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Средний чек</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {(totals.primaryCount + totals.secondaryCount) 
                    ? Math.round(totals.totalSum / (totals.primaryCount + totals.secondaryCount)).toLocaleString() 
                    : 0} ₽
                </div>
              </div>
            </div>

            {/* Unit Economics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Юнит-экономика
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Первичные заявки
                    </span>
                    <span className="font-semibold text-gray-900">{totals.primaryCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Повторные заявки
                    </span>
                    <span className="font-semibold text-gray-900">{totals.secondaryCount}</span>
                  </div>
                </div>
                
                <div className="h-px bg-gray-100"></div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Сумма первичных</span>
                    <span className="font-semibold text-gray-900">{totals.primarySum.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Сумма повторных</span>
                    <span className="font-semibold text-gray-900">{totals.secondarySum.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between py-2 bg-gray-50 -mx-5 px-5 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Общая выручка</span>
                    <span className="font-bold text-gray-900">{totals.totalSum.toLocaleString()} ₽</span>
                  </div>
                </div>
                
                <div className="h-px bg-gray-100"></div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Сдано в кассу</span>
                    <span className="font-semibold text-green-600">+{totals.cashDesk.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Расход на рекламу</span>
                    <span className="font-semibold text-red-600">−{totals.adSpend.toLocaleString()} ₽</span>
                  </div>
                </div>
                
                <div className={`
                  -mx-5 -mb-5 px-5 py-4 mt-4
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
            </div>

            {/* Additional metrics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Аналитика
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Маржинальность</span>
                  <span className={`font-semibold ${
                    totals.totalSum && (totals.netProfit / totals.totalSum) >= 0.2 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {totals.totalSum ? Math.round((totals.netProfit / totals.totalSum) * 100) : 0}%
                  </span>
                </div>
                {totals.adSpend > 0 && totals.primaryCount > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">CPL (цена лида)</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(totals.adSpend / totals.primaryCount).toLocaleString()} ₽
                    </span>
                  </div>
                )}
                {totals.adSpend > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">ROAS</span>
                    <span className={`font-semibold ${
                      (totals.totalSum / totals.adSpend) >= 3 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {(totals.totalSum / totals.adSpend).toFixed(1)}x
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Конверсия в повтор</span>
                  <span className="font-semibold text-gray-900">
                    {totals.primaryCount ? Math.round((totals.secondaryCount / totals.primaryCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Plan vs Fact */}
            {periodMode === 'month' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    План / Факт
                  </h3>
                </div>
                <div className="p-5">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="text-left py-2 font-medium">Показатель</th>
                        <th className="text-right py-2 font-medium">План</th>
                        <th className="text-right py-2 font-medium">Факт</th>
                        <th className="text-right py-2 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { label: 'Первичные', plan: plan.primaryCount, fact: totals.primaryCount, isCount: true },
                        { label: 'Повторные', plan: plan.secondaryCount, fact: totals.secondaryCount, isCount: true },
                        { label: 'Выручка', plan: plan.totalSum, fact: totals.totalSum },
                        { label: 'В кассу', plan: plan.cashDesk, fact: totals.cashDesk },
                        { label: 'Чистая прибыль', plan: plan.netProfit, fact: totals.netProfit, isBold: true },
                      ].map((row, i) => {
                        const percent = getPercent(row.fact, row.plan);
                        return (
                          <tr key={i} className={`border-t border-gray-50 ${row.isBold ? 'font-semibold' : ''}`}>
                            <td className="py-3 text-gray-700">{row.label}</td>
                            <td className="py-3 text-right text-gray-400">
                              {row.isCount ? row.plan : `${(row.plan / 1000).toFixed(0)}k`}
                            </td>
                            <td className="py-3 text-right text-gray-900">
                              {row.isCount ? row.fact : `${(row.fact / 1000).toFixed(0)}k`}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`
                                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${percent >= 100 ? 'bg-green-100 text-green-700' : ''}
                                ${percent >= 70 && percent < 100 ? 'bg-amber-100 text-amber-700' : ''}
                                ${percent < 70 ? 'bg-red-100 text-red-700' : ''}
                              `}>
                                {percent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Выполнение плана по прибыли</span>
                      <span className={`font-semibold ${
                        getPercent(totals.netProfit, plan.netProfit) >= 100 ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {getPercent(totals.netProfit, plan.netProfit)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          getPercent(totals.netProfit, plan.netProfit) >= 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${Math.min(getPercent(totals.netProfit, plan.netProfit), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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