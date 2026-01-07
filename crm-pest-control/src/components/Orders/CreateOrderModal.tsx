'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  selectedTime?: string;
}

const PESTS = ['Клопы', 'Тараканы', 'Муравьи', 'Крысы', 'Мыши', 'Моль', 'Блохи'];
const OBJECTS = ['Квартира', 'Дом', 'Офис', 'Склад', 'Ресторан', 'Магазин'];
const MANAGERS = ['Анастасия', 'Мария', 'Ольга', 'Екатерина'];
const TIMES = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function CreateOrderModal({ isOpen, onClose, selectedDate, selectedTime }: Props) {
  const { addOrder } = useOrderStore();
  const [phones, setPhones] = useState<string[]>(['']);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      id: uuidv4(),
      ...form,
      phones: phones.filter(p => p.trim()),
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    };
    addOrder(order);
    onClose();
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
  };

  const addPhone = () => setPhones([...phones, '']);
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать заявку" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Тип заказа"
            value={form.orderType}
            onChange={(e) => setForm({ ...form, orderType: e.target.value as any })}
            options={[
              { value: 'primary', label: '🟢 Первичный' },
              { value: 'secondary', label: '🟡 Повторный' },
            ]}
          />
          <Input
            label="Имя клиента"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            required
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
            placeholder="2ккв"
          />
          <Input
            label="Дата"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Время"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            options={TIMES.map(t => ({ value: t, label: t }))}
          />
          <Input
            label="Цена базы"
            type="number"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
          />
          <Select
            label="Тип клиента"
            value={form.clientType}
            onChange={(e) => setForm({ ...form, clientType: e.target.value as any })}
            options={[
              { value: 'individual', label: 'Физ. лицо' },
              { value: 'legal', label: 'Юр. лицо' },
            ]}
          />
          <Select
            label="Менеджер"
            value={form.manager}
            onChange={(e) => setForm({ ...form, manager: e.target.value })}
            options={MANAGERS.map(m => ({ value: m, label: m }))}
          />
        </div>
        <Input
          label="Адрес"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Москва, ул Мира 12, под 1, этаж 3, кв 65"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Телефоны</label>
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="89675456789"
              />
              {index === phones.length - 1 && (
                <button type="button" onClick={addPhone} className="px-3 py-2 bg-gray-200 rounded-lg">+</button>
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="success">Создать заказ</Button>
        </div>
      </form>
    </Modal>
  );
}
