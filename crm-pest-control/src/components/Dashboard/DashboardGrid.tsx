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

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getOrdersForSlot = (date: Date, hour: number) => {
    const dateStr = formatDateISO(date);
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    return orders.filter(o => o.date === dateStr && o.time === timeStr);
  };

  const getOrderClasses = (order: Order) => {
    const base = 'order-card';
    if (order.status === 'cancelled') return `${base} order-cancelled`;
    if (order.status === 'completed') return `${base} order-completed`;
    return order.orderType === 'primary' ? `${base} order-primary` : `${base} order-secondary`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="w-full border-collapse min-w-[1400px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-50">
              <th className="border-b border-r border-gray-200 p-3 w-20 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Время
              </th>
              {dates.map((date, i) => (
                <th 
                  key={i} 
                  className={`
                    border-b border-r border-gray-200 p-3 text-center min-w-[160px]
                    ${isToday(date) ? 'bg-green-50' : 'bg-gray-50'}
                    ${isWeekend(date) ? 'bg-amber-50/50' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-semibold
                    ${isToday(date) ? 'text-green-700' : 'text-gray-900'}
                  `}>
                    {formatDate(date)}
                  </div>
                  <div className={`
                    text-xs mt-0.5
                    ${isToday(date) ? 'text-green-600 font-medium' : 'text-gray-400'}
                    ${isWeekend(date) ? 'text-amber-600' : ''}
                  `}>
                    {isToday(date) ? '● Сегодня' : WEEKDAYS[date.getDay()]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="group">
                <td className="border-b border-r border-gray-100 p-2 text-center bg-gray-50/50 sticky left-0 z-10">
                  <span className="text-sm font-medium text-gray-600">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </td>
                {dates.map((date, i) => {
                  const slotOrders = getOrdersForSlot(date, hour);
                  const dateStr = formatDateISO(date);
                  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                  
                  return (
                    <td
                      key={i}
                      className={`
                        border-b border-r border-gray-100 p-1.5 align-top
                        transition-colors duration-150 cursor-pointer
                        ${isToday(date) ? 'bg-green-50/30' : ''}
                        ${isWeekend(date) ? 'bg-amber-50/20' : ''}
                        ${slotOrders.length === 0 ? 'hover:bg-gray-50' : ''}
                      `}
                      onClick={() => slotOrders.length === 0 && onSlotClick(dateStr, timeStr)}
                    >
                      <div className="space-y-1.5 min-h-[40px]">
                        {slotOrders.map((order) => (
                          <div
                            key={order.id}
                            className={getOrderClasses(order)}
                            onClick={(e) => { e.stopPropagation(); onOrderClick(order); }}
                          >
                            <div className="font-medium truncate text-sm">
                              {order.clientName}
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-90 mt-0.5">
                              <span className="truncate">
                                {order.pest}
                              </span>
                              <span className="font-medium ml-2 flex-shrink-0">
                                {order.basePrice.toLocaleString()}₽
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}