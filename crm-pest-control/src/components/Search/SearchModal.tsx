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

  const typeLabels = { primary: 'Первичная', secondary: 'Вторичная' };
  const typeColors = { primary: 'text-green-600', secondary: 'text-yellow-600' };
  const statusLabels = { in_progress: '🔵', completed: '✅', cancelled: '❌' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск заявки" size="xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Search Form */}
        <div className="space-y-4">
          <Input
            label="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="89150155431"
          />
          <Input
            label="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Москва, ул..."
          />
          <Input
            label="Дата"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1" disabled={isLoading}>
              {isLoading ? 'Поиск...' : '🔍 Найти'}
            </Button>
            <Button variant="secondary" onClick={handleClear}>
              Очистить
            </Button>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="text-sm text-gray-500 mb-2">
            {searched ? `Найдено заявок: ${results.length}` : 'Введите параметры поиска'}
          </div>
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs">№</th>
                  <th className="px-3 py-2 text-left text-xs">Клиент</th>
                  <th className="px-3 py-2 text-left text-xs">Дата</th>
                  <th className="px-3 py-2 text-left text-xs">Тип</th>
                  <th className="px-3 py-2 text-right text-xs">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {results.map((order, i) => (
                  <tr
                    key={order.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelect(order)}
                  >
                    <td className="px-3 py-2 text-sm">{i + 1}</td>
                    <td className="px-3 py-2 text-sm">
                      {statusLabels[order.status]} {order.clientName}
                    </td>
                    <td className="px-3 py-2 text-sm">{order.date}</td>
                    <td className={`px-3 py-2 text-sm ${typeColors[order.orderType]}`}>
                      {typeLabels[order.orderType]}
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      {(order.finalAmount || order.basePrice).toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
                {searched && results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                      Заявки не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
