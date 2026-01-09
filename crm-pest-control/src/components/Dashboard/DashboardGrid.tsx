'use client';
import React, { useRef, useEffect, useState } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayIndex = dates.findIndex(d => isToday(d));
      if (todayIndex > -1) {
        const scrollLeft = todayIndex * (isMobile ? 120 : 160);
        scrollRef.current.scrollLeft = scrollLeft - (isMobile ? 40 : 100);
      }
    }
  }, [dates, isMobile]);

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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        ref={scrollRef}
        className="overflow-auto scrollbar-thin touch-scroll" 
        style={{ maxHeight: isMobile ? 'calc(100vh - 240px)' : 'calc(100vh - 220px)' }}
      >
        <table className="w-full border-collapse" style={{ minWidth: isMobile ? `${dates.length * 120}px` : `${dates.length * 160}px` }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-50">
              <th className="border-b border-r border-gray-200 p-2 sm:p-3 w-14 sm:w-20 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-30">
                <span className="hidden sm:inline">Время</span>
                <span className="sm:hidden">⏰</span>
              </th>
              {dates.map((date, i) => (
                <th 
                  key={i} 
                  className={`
                    border-b border-r border-gray-200 p-2 sm:p-3 text-center
                    ${isMobile ? 'min-w-[120px]' : 'min-w-[160px]'}
                    ${isToday(date) ? 'bg-green-50' : 'bg-gray-50'}
                    ${isWeekend(date) && !isToday(date) ? 'bg-amber-50/50' : ''}
                  `}
                >
                  <div className={`
                    text-xs sm:text-sm font-semibold
                    ${isToday(date) ? 'text-green-700' : 'text-gray-900'}
                  `}>
                    {formatDate(date)}
                  </div>
                  <div className={`
                    text-[10px] sm:text-xs mt-0.5
                    ${isToday(date) ? 'text-green-600 font-medium' : 'text-gray-400'}
                    ${isWeekend(date) && !isToday(date) ? 'text-amber-600' : ''}
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
                <td className="border-b border-r border-gray-100 p-1.5 sm:p-2 text-center bg-gray-50/50 sticky left-0 z-10">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
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
                        border-b border-r border-gray-100 p-1 sm:p-1.5 align-top
                        transition-colors duration-150
                        ${isToday(date) ? 'bg-green-50/30' : ''}
                        ${isWeekend(date) && !isToday(date) ? 'bg-amber-50/20' : ''}
                      `}
                      onClick={() => slotOrders.length === 0 && onSlotClick(dateStr, timeStr)}
                    >
                      <div className="space-y-1 sm:space-y-1.5 min-h-[36px] sm:min-h-[40px]">
                        {slotOrders.map((order) => (
                          <div
                            key={order.id}
                            className={getOrderClasses(order)}
                            onClick={(e) => { e.stopPropagation(); onOrderClick(order); }}
                          >
                            <div className="font-medium truncate text-xs sm:text-sm">
                              {order.clientName}
                            </div>
                            <div className="flex items-center justify-between text-[10px] sm:text-xs opacity-90 mt-0.5">
                              <span className="truncate">
                                {order.pest}
                              </span>
                              <span className="font-medium ml-1 sm:ml-2 flex-shrink-0">
                                {isMobile 
                                  ? `${Math.round(order.basePrice / 1000)}k` 
                                  : `${order.basePrice.toLocaleString()}₽`
                                }
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