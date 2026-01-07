// src/components/Dashboard/DashboardGrid.tsx
'use client';
import React from 'react';
import { Order } from '@/types';

interface Props {
  dates: Date[];
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onSlotClick: (date: string, time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DashboardGrid({ dates, orders, onOrderClick, onSlotClick }: Props) {
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getOrdersForSlot = (date: Date, hour: number) => {
    const dateStr = formatDateISO(date);
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    return orders.filter(o => o.date === dateStr && o.time === timeStr);
  };

  const getOrderColor = (order: Order) => {
    if (order.status === 'cancelled') return 'bg-red-500';
    if (order.status === 'completed') return 'bg-gray-400';
    return order.orderType === 'primary' ? 'bg-green-500' : 'bg-yellow-500';
  };

  return (
    <div className="overflow-auto bg-white rounded-xl shadow">
      <table className="w-full border-collapse min-w-[1200px]">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="border p-2 w-20 text-sm">Время</th>
            {dates.map((date, i) => (
              <th key={i} className="border p-2 text-sm min-w-[150px]">
                <div>{formatDate(date)}</div>
                <div className="text-xs text-gray-500">
                  {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td className="border p-2 text-center text-sm bg-gray-50">
                {hour.toString().padStart(2, '0')}:00
              </td>
              {dates.map((date, i) => {
                const slotOrders = getOrdersForSlot(date, hour);
                const dateStr = formatDateISO(date);
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                
                return (
                  <td
                    key={i}
                    className="border p-1 align-top hover:bg-gray-50 cursor-pointer"
                    onClick={() => slotOrders.length === 0 && onSlotClick(dateStr, timeStr)}
                  >
                    {slotOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`${getOrderColor(order)} text-white text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-90`}
                        onClick={(e) => { e.stopPropagation(); onOrderClick(order); }}
                      >
                        <div className="font-medium truncate">{order.clientName}</div>
                        <div className="truncate opacity-90">
                          {order.orderType === 'primary' ? 'Первичная' : 'Вторичная'} - {order.pest}
                        </div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}