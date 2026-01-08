'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { useOrderStore } from '@/store/orderStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: string;
  selectedTime?: string;
}

const PESTS = ['Клопы', 'Тараканы', 'Муравьи', 'Крысы', 'Мыши', 'Моль', 'Блохи'];
const OBJECTS = ['Квартира', 'Дом', 'Офис', 'Склад', 'Ресторан', 'Магазин'];
const MANAGERS = ['Анастасия', 'Мария', 'Ольга', 'Екатерина'];
const TIMES = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function CreateOrderModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedDate, 
  selectedTime 
}: Props) {
  const { createOrder, isLoading } = useOrderStore();
  const [phones, setPhones] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    orderType: 'primary' as 'primary' | 'secondary',
    clientName: '',
    pest: 'Клопы',
    objectType: 'Квартира',
    volume: '',
    address: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: selectedTime || '09:00',
    basePrice: 0,
    clientType: 'individual' as 'individual' | 'legal',
    comment: '',
    manager: 'Анастасия',
  });

  useEffect(() => {
    if (selectedDate) setForm(f => ({ ...f, date: selectedDate }));
    if (selectedTime) setForm(f => ({ ...f, time: selectedTime }));
  }, [selectedDate, selectedTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.clientName.trim()) {
      setError('Введите имя клиента');
      return;
    }

    if (!form.address.trim()) {
      setError('Введите адрес');
      return;
    }

    try {
      await createOrder({
        ...form,
        phones: phones.filter(p => p.trim()),
      });
      
      // Reset form
      setForm({
        orderType: 'primary',
        clientName: '',
        pest: 'Клопы',
        objectType: 'Квартира',
        volume: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        basePrice: 0,
        clientType: 'individual',
        comment: '',
        manager: 'Анастасия',
      });
      setPhones(['']);
      
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addPhone = () => setPhones([...phones, '']);
  
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать заявку" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Order Type Toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, orderType: 'primary' })}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              form.orderType === 'primary'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🟢 Первичный
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, orderType: 'secondary' })}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              form.orderType === 'secondary'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🟡 Повторный
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Имя клиента *"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="Иванов Иван"
          />
          <Select
            label="Вредитель"
            value={form.pest}
            onChange={(e) => setForm({ ...form, pest: e.target.value })}
            options={PESTS.map(p => ({ value: p, label: p }))}
          />
          <Select
            label="Объект"
            value={form.objectType}
            onChange={(e) => setForm({ ...form, objectType: e.target.value })}
            options={OBJECTS.map(o => ({ value: o, label: o }))}
          />
          <Input
            label="Объем"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: e.target.value })}
            placeholder="2-комн. квартира"
          />
          <Input
            label="Дата"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Select
            label="Время"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            options={TIMES.map(t => ({ value: t, label: t }))}
          />
          <Input
            label="Базовая цена"
            type="number"
            value={form.basePrice || ''}
            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
            placeholder="5000"
          />
          <Select
            label="Тип клиента"
            value={form.clientType}
            onChange={(e) => setForm({ ...form, clientType: e.target.value as 'individual' | 'legal' })}
            options={[
              { value: 'individual', label: '👤 Физ. лицо' },
              { value: 'legal', label: '🏢 Юр. лицо' },
            ]}
          />
        </div>

        <Input
          label="Адрес *"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="г. Москва, ул. Мира 12, кв. 65"
        />

        {/* Phones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Телефоны</label>
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder="+7 (900) 123-45-67"
                className="flex-1"
              />
              {phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {index === phones.length - 1 && (
                <button
                  type="button"
                  onClick={addPhone}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <Select
          label="Менеджер"
          value={form.manager}
          onChange={(e) => setForm({ ...form, manager: e.target.value })}
          options={MANAGERS.map(m => ({ value: m, label: m }))}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Комментарий</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            rows={3}
            placeholder="Дополнительная информация..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="success" loading={isLoading}>
            Создать заказ
          </Button>
        </div>
      </form>
    </Modal>
  );
}