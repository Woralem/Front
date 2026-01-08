'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Button from '@/components/UI/Button';
import { useOrderStore } from '@/store/orderStore';
import { useAuth } from '@/contexts/AuthContext';

function StatisticsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const { statistics, isLoading, fetchStatistics, updateAdSpend } = useOrderStore();
  const [currentDate, setCurrentDate] = useState(new Date());
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      initializedRef.current = false;
      fetchStatistics(year, month);
    }
  }, [year, month, mounted, fetchStatistics]);

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
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
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

  const getDayNetProfit = (day: typeof daily[0]) => {
    const adSpend = Number(localAdSpend[day.date]) || 0;
    return day.cashDesk - adSpend;
  };

  const hasDirtyFields = dirtyFieldsRef.current.size > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleBack} variant="secondary">
                ← Назад
              </Button>
              <h1 className="text-2xl font-bold">📊 Статистика</h1>
              {isLoading && (
                <span className="text-sm text-blue-600 animate-pulse">Загрузка...</span>
              )}
              {isSaving && (
                <span className="text-sm text-orange-600 animate-pulse">Сохранение...</span>
              )}
              {hasDirtyFields && !isSaving && (
                <span className="text-sm text-orange-600">● Есть несохранённые изменения</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-200 rounded text-xl"
                disabled={isSaving}
              >
                ◀
              </button>
              <span className="font-semibold min-w-[150px] text-center">
                {months[month - 1]} {year}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-200 rounded text-xl"
                disabled={isSaving}
              >
                ▶
              </button>
              <Button onClick={handleLogout} variant="danger">
                🚪 Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Daily Table */}
          <div className="col-span-2 bg-white rounded-xl shadow overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Дата</th>
                    <th className="p-2 text-center">Первички</th>
                    <th className="p-2 text-center">Повторы</th>
                    <th className="p-2 text-right">Сумма первичек</th>
                    <th className="p-2 text-right">Сумма повторов</th>
                    <th className="p-2 text-right">Всего</th>
                    <th className="p-2 text-right">В кассу</th>
                    <th className="p-2 text-center">Расход РК</th>
                    <th className="p-2 text-right">ЧП</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((day, i) => {
                    const dayNetProfit = getDayNetProfit(day);
                    const isDirty = dirtyFieldsRef.current.has(day.date);
                    
                    return (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-2">
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('ru-RU', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </td>
                        <td className="p-2 text-center">
                          {day.primaryCount || '-'}
                        </td>
                        <td className="p-2 text-center">
                          {day.secondaryCount || '-'}
                        </td>
                        <td className="p-2 text-right">
                          {day.primarySum ? `${day.primarySum.toLocaleString()} ₽` : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {day.secondarySum ? `${day.secondarySum.toLocaleString()} ₽` : '-'}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {day.totalSum ? `${day.totalSum.toLocaleString()} ₽` : '-'}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          {day.cashDesk ? `${day.cashDesk.toLocaleString()} ₽` : '-'}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`w-24 px-2 py-1 border rounded text-right text-sm 
                              ${isDirty ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                            value={localAdSpend[day.date] ?? ''}
                            onChange={(e) => handleAdSpendChange(day.date, e.target.value)}
                            onBlur={() => handleAdSpendBlur(day.date)}
                            placeholder="0"
                          />
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          dayNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dayNetProfit.toLocaleString()} ₽
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                  <tr>
                    <td className="p-2">ИТОГО</td>
                    <td className="p-2 text-center">{totals.primaryCount}</td>
                    <td className="p-2 text-center">{totals.secondaryCount}</td>
                    <td className="p-2 text-right">{totals.primarySum.toLocaleString()} ₽</td>
                    <td className="p-2 text-right">{totals.secondarySum.toLocaleString()} ₽</td>
                    <td className="p-2 text-right">{totals.totalSum.toLocaleString()} ₽</td>
                    <td className="p-2 text-right text-green-600">
                      {totals.cashDesk.toLocaleString()} ₽
                    </td>
                    <td className="p-2 text-right text-red-600">
                      {totals.adSpend.toLocaleString()} ₽
                    </td>
                    <td className={`p-2 text-right ${
                      totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {totals.netProfit.toLocaleString()} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Unit Economics */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-4 text-lg">📈 Юнит-экономика</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Всего заявок:</span>
                  <span className="font-bold">{totals.primaryCount + totals.secondaryCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Первичные:</span>
                  <span className="text-green-600">{totals.primaryCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Вторичные:</span>
                  <span className="text-yellow-600">{totals.secondaryCount}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Сумма всех:</span>
                  <span className="font-bold">{totals.totalSum.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Сдано в кассу:</span>
                  <span className="text-green-600">{totals.cashDesk.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Расход на рекламу:</span>
                  <span className="text-red-600">{totals.adSpend.toLocaleString()} ₽</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Чистая прибыль:</span>
                  <span className={`font-bold ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.netProfit.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Маржинальность:</span>
                  <span>{totals.totalSum ? Math.round((totals.netProfit / totals.totalSum) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Средний чек:</span>
                  <span>
                    {(totals.primaryCount + totals.secondaryCount) 
                      ? Math.round(totals.totalSum / (totals.primaryCount + totals.secondaryCount)).toLocaleString() 
                      : 0} ₽
                  </span>
                </div>
              </div>
            </div>

            {/* Plan vs Fact */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-4 text-lg">📋 План / Факт</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1"></th>
                    <th className="text-right py-1">План</th>
                    <th className="text-right py-1">Факт</th>
                    <th className="text-right py-1">%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2">Первички</td>
                    <td className="text-right text-gray-500">{plan.primaryCount}</td>
                    <td className="text-right">{totals.primaryCount}</td>
                    <td className="text-right">
                      <span className={getPercent(totals.primaryCount, plan.primaryCount) >= 100 ? 'text-green-600' : 'text-yellow-600'}>
                        {getPercent(totals.primaryCount, plan.primaryCount)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2">Повторы</td>
                    <td className="text-right text-gray-500">{plan.secondaryCount}</td>
                    <td className="text-right">{totals.secondaryCount}</td>
                    <td className="text-right">
                      <span className={getPercent(totals.secondaryCount, plan.secondaryCount) >= 100 ? 'text-green-600' : 'text-yellow-600'}>
                        {getPercent(totals.secondaryCount, plan.secondaryCount)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2">Выручка</td>
                    <td className="text-right text-gray-500">{(plan.totalSum / 1000).toFixed(0)}k</td>
                    <td className="text-right">{(totals.totalSum / 1000).toFixed(0)}k</td>
                    <td className="text-right">
                      <span className={getPercent(totals.totalSum, plan.totalSum) >= 100 ? 'text-green-600' : 'text-yellow-600'}>
                        {getPercent(totals.totalSum, plan.totalSum)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2">В кассу</td>
                    <td className="text-right text-gray-500">{(plan.cashDesk / 1000).toFixed(0)}k</td>
                    <td className="text-right">{(totals.cashDesk / 1000).toFixed(0)}k</td>
                    <td className="text-right">
                      <span className={getPercent(totals.cashDesk, plan.cashDesk) >= 100 ? 'text-green-600' : 'text-yellow-600'}>
                        {getPercent(totals.cashDesk, plan.cashDesk)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t font-bold">
                    <td className="py-2">ЧП</td>
                    <td className="text-right text-gray-500">{(plan.netProfit / 1000).toFixed(0)}k</td>
                    <td className="text-right">{(totals.netProfit / 1000).toFixed(0)}k</td>
                    <td className="text-right">
                      <span className={getPercent(totals.netProfit, plan.netProfit) >= 100 ? 'text-green-600' : 'text-yellow-600'}>
                        {getPercent(totals.netProfit, plan.netProfit)}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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