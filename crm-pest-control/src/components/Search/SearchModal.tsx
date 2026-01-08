'use client';

import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectOrder }: Props) {
  const { searchOrders, isLoading } = useOrderStore();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const found = await searchOrders(
      phone || undefined,
      address || undefined,
      date || undefined
    );
    setResults(found);
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelect = (order: Order) => {
    onSelectOrder(order);
    onClose();
  };

  const handleClear = () => {
    setPhone('');
    setAddress('');
    setDate('');
    setResults([]);
    setSearched(false);
  };

  const getStatusBadge = (order: Order) => {
    const styles = {
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels = {
      in_progress: 'В работе',
      completed: 'Выполнен',
      cancelled: 'Отменён',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[order.status]}`}>
        {labels[order.status]}
      </span>
    );
  };

  const getTypeBadge = (order: Order) => {
    return order.orderType === 'primary' 
      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Первичная</span>
      : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Повторная</span>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск заявки" size="xl">
      <div className="grid grid-cols-5 gap-6">
        {/* Search Form */}
        <div className="col-span-2 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
            </h3>
            
            <Input
              label="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="+7 900 123-45-67"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
            
            <Input
              label="Адрес"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Москва, ул. Мира..."
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            
            <Input
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSearch} 
                variant="success"
                className="flex-1" 
                loading={isLoading}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              >
                Найти
              </Button>
              <Button variant="secondary" onClick={handleClear}>
                Сбросить
              </Button>
            </div>
          </div>
          
          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Подсказки</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Можно искать по части номера телефона</li>
              <li>• Поиск по адресу нечувствителен к регистру</li>
              <li>• Нажмите Enter для быстрого поиска</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">
              {searched ? `Найдено: ${results.length}` : 'Результаты поиска'}
            </h3>
          </div>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-[450px] overflow-y-auto scrollbar-thin">
              {results.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelect(order)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{order.clientName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">{order.address}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{order.date}</div>
                          <div className="text-xs text-gray-500">{order.time}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getTypeBadge(order)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(order)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-gray-900">
                            {(order.finalAmount || order.basePrice).toLocaleString()} ₽
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  {searched ? (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-center">Заявки не найдены</p>
                      <p className="text-sm text-gray-400 text-center mt-1">Попробуйте изменить параметры поиска</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-center">Введите параметры поиска</p>
                      <p className="text-sm text-gray-400 text-center mt-1">и нажмите "Найти"</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}