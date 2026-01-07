'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectOrder }: Props) {
  const { searchOrders } = useOrderStore();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState<Order[]>([]);

  const handleSearch = () => {
    const found = searchOrders(phone || undefined, address || undefined, date || undefined);
    setResults(found);
  };

  const typeLabels = { primary: 'Первичная', secondary: 'Вторичная' };
  const typeColors = { primary: 'text-green-600', secondary: 'text-yellow-600' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск заявки" size="xl">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="89150155431" />
          <Input label="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button onClick={handleSearch} className="w-full">Найти</Button>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-2">Найдено заявок: {results.length}</div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">№</th>
                  <th className="px-3 py-2 text-left">Клиент</th>
                  <th className="px-3 py-2 text-left">Дата</th>
                  <th className="px-3 py-2 text-left">Тип</th>
                  <th className="px-3 py-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {results.map((order, i) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => { onSelectOrder(order); onClose(); }}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{order.clientName}</td>
                    <td className="px-3 py-2">{order.date}</td>
                    <td className={`px-3 py-2 ${typeColors[order.orderType]}`}>{typeLabels[order.orderType]}</td>
                    <td className="px-3 py-2 text-right">{(order.finalAmount || order.basePrice).toLocaleString()} ₽</td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">Заявки не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
