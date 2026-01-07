'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/UI/Button';
import { useOrderStore } from '@/store/orderStore';

export default function StatisticsPage() {
  const router = useRouter();
  const { orders, dailyAdSpend, monthlyPlan, setDailyAdSpend } = useOrderStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  const getDayStats = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayOrders = orders.filter(o => o.date === dateStr && o.status === 'completed');
    const primary = dayOrders.filter(o => o.orderType === 'primary');
    const secondary = dayOrders.filter(o => o.orderType === 'secondary');
    const primarySum = primary.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const secondarySum = secondary.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const cashDesk = dayOrders.reduce((sum, o) => sum + (o.cashDesk || 0), 0);
    const adSpend = dailyAdSpend[dateStr] || 0;
    return {
      date: dateStr,
      primaryCount: primary.length,
      secondaryCount: secondary.length,
      primarySum,
      secondarySum,
      totalSum: primarySum + secondarySum,
      cashDesk,
      adSpend,
      netProfit: cashDesk - adSpend,
    };
  };

  const allStats = Array.from({ length: daysInMonth }, (_, i) => getDayStats(i + 1));
  const totals = allStats.reduce((acc, s) => ({
    primaryCount: acc.primaryCount + s.primaryCount,
    secondaryCount: acc.secondaryCount + s.secondaryCount,
    primarySum: acc.primarySum + s.primarySum,
    secondarySum: acc.secondarySum + s.secondarySum,
    totalSum: acc.totalSum + s.totalSum,
    cashDesk: acc.cashDesk + s.cashDesk,
    adSpend: acc.adSpend + s.adSpend,
    netProfit: acc.netProfit + s.netProfit,
  }), { primaryCount: 0, secondaryCount: 0, primarySum: 0, secondarySum: 0, totalSum: 0, cashDesk: 0, adSpend: 0, netProfit: 0 });

  const getPercent = (fact: number, plan: number) => plan ? Math.round((fact / plan) * 100) : 0;

  if (!mounted) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/')} variant="secondary">← Назад</Button>
              <h1 className="text-2xl font-bold">📊 Статистика</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-200 rounded">◀</button>
              <span className="font-semibold">{months[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-200 rounded">▶</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Дата</th>
                  <th className="p-2">Первички</th>
                  <th className="p-2">Повторы</th>
                  <th className="p-2">Сумма первичек</th>
                  <th className="p-2">Сумма повторов</th>
                  <th className="p-2">Всего</th>
                  <th className="p-2">В кассу</th>
                  <th className="p-2">Расход РК</th>
                  <th className="p-2">ЧП</th>
                </tr>
              </thead>
              <tbody>
                {allStats.map((s, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">{(i + 1).toString().padStart(2, '0')}.{(month + 1).toString().padStart(2, '0')}</td>
                    <td className="p-2 text-center">{s.primaryCount || '-'}</td>
                    <td className="p-2 text-center">{s.secondaryCount || '-'}</td>
                    <td className="p-2 text-right">{s.primarySum ? s.primarySum.toLocaleString() + ' ₽' : '-'}</td>
                    <td className="p-2 text-right">{s.secondarySum ? s.secondarySum.toLocaleString() + ' ₽' : '-'}</td>
                    <td className="p-2 text-right font-medium">{s.totalSum ? s.totalSum.toLocaleString() + ' ₽' : '-'}</td>
                    <td className="p-2 text-right text-green-600">{s.cashDesk ? s.cashDesk.toLocaleString() + ' ₽' : '-'}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border rounded text-right"
                        value={s.adSpend || ''}
                        onChange={(e) => setDailyAdSpend(s.date, Number(e.target.value))}
                        placeholder="0"
                      />
                    </td>
                    <td className={`p-2 text-right font-medium ${s.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.netProfit.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="p-2">ИТОГО</td>
                  <td className="p-2 text-center">{totals.primaryCount}</td>
                  <td className="p-2 text-center">{totals.secondaryCount}</td>
                  <td className="p-2 text-right">{totals.primarySum.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{totals.secondarySum.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{totals.totalSum.toLocaleString()} ₽</td>
                  <td className="p-2 text-right text-green-600">{totals.cashDesk.toLocaleString()} ₽</td>
                  <td className="p-2 text-right text-red-600">{totals.adSpend.toLocaleString()} ₽</td>
                  <td className={`p-2 text-right ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.netProfit.toLocaleString()} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-4">Юнит-экономика</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Всего заявок:</span><span className="font-bold">{totals.primaryCount + totals.secondaryCount}</span></div>
                <div className="flex justify-between"><span>Первичные:</span><span>{totals.primaryCount}</span></div>
                <div className="flex justify-between"><span>Вторичные:</span><span>{totals.secondaryCount}</span></div>
                <hr/>
                <div className="flex justify-between"><span>Сумма всех:</span><span className="font-bold">{totals.totalSum.toLocaleString()} ₽</span></div>
                <div className="flex justify-between"><span>Сдано в кассу:</span><span className="text-green-600">{totals.cashDesk.toLocaleString()} ₽</span></div>
                <div className="flex justify-between"><span>Расход на рекламу:</span><span className="text-red-600">{totals.adSpend.toLocaleString()} ₽</span></div>
                <hr/>
                <div className="flex justify-between"><span>Маржинальность:</span><span className="font-bold">{totals.netProfit.toLocaleString()} ₽</span></div>
                <div className="flex justify-between"><span>Маржинальность %:</span><span>{totals.totalSum ? Math.round((totals.netProfit / totals.totalSum) * 100) : 0}%</span></div>
                <div className="flex justify-between"><span>Ср. чек:</span><span>{totals.primaryCount + totals.secondaryCount ? Math.round(totals.totalSum / (totals.primaryCount + totals.secondaryCount)).toLocaleString() : 0} ₽</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-4">План / Факт</h3>
              <table className="w-full text-sm">
                <thead><tr><th></th><th>План</th><th>Факт</th><th>%</th></tr></thead>
                <tbody>
                  <tr><td>Первички</td><td>{monthlyPlan.primaryCount}</td><td>{totals.primaryCount}</td><td>{getPercent(totals.primaryCount, monthlyPlan.primaryCount)}%</td></tr>
                  <tr><td>Повторы</td><td>{monthlyPlan.secondaryCount}</td><td>{totals.secondaryCount}</td><td>{getPercent(totals.secondaryCount, monthlyPlan.secondaryCount)}%</td></tr>
                  <tr><td>Выручка</td><td>{(monthlyPlan.totalSum/1000).toFixed(0)}k</td><td>{(totals.totalSum/1000).toFixed(0)}k</td><td>{getPercent(totals.totalSum, monthlyPlan.totalSum)}%</td></tr>
                  <tr><td>В кассу</td><td>{(monthlyPlan.cashDesk/1000).toFixed(0)}k</td><td>{(totals.cashDesk/1000).toFixed(0)}k</td><td>{getPercent(totals.cashDesk, monthlyPlan.cashDesk)}%</td></tr>
                  <tr className="font-bold"><td>ЧП</td><td>{(monthlyPlan.netProfit/1000).toFixed(0)}k</td><td>{(totals.netProfit/1000).toFixed(0)}k</td><td>{getPercent(totals.netProfit, monthlyPlan.netProfit)}%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
