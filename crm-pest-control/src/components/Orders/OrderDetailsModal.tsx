'use client';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { useOrderStore } from '@/store/orderStore';
import { Order } from '@/types';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIMES = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function OrderDetailsModal({ order, isOpen, onClose }: Props) {
  const { updateOrder, addOrder, deleteOrder } = useOrderStore();
  const [status, setStatus] = useState(order?.status || 'in_progress');
  const [completedForm, setCompletedForm] = useState({
    finalAmount: order?.finalAmount || 0,
    masterPercent: order?.masterPercent || 40,
    masterName: order?.masterName || '',
    masterContact: order?.masterContact || '',
    repeatDate: order?.repeatDate || '',
    repeatTime: order?.repeatTime || '09:00',
    completionComment: order?.completionComment || '',
  });
  const [cancelReason, setCancelReason] = useState(order?.cancelReason || '');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setCompletedForm({
        finalAmount: order.finalAmount || 0,
        masterPercent: order.masterPercent || 40,
        masterName: order.masterName || '',
        masterContact: order.masterContact || '',
        repeatDate: order.repeatDate || '',
        repeatTime: order.repeatTime || '09:00',
        completionComment: order.completionComment || '',
      });
      setCancelReason(order.cancelReason || '');
    }
  }, [order]);

  if (!order) return null;

  const masterIncome = (completedForm.finalAmount * completedForm.masterPercent) / 100;
  const cashDesk = completedForm.finalAmount - masterIncome;

  const handleSave = () => {
    const updates: Partial<Order> = { status };
    if (status === 'completed') {
      Object.assign(updates, {
        ...completedForm,
        masterIncome,
        cashDesk,
      });
      if (completedForm.repeatDate) {
        const repeatOrder: Order = {
          ...order,
          id: uuidv4(),
          orderType: 'secondary',
          date: completedForm.repeatDate,
          time: completedForm.repeatTime,
          status: 'in_progress',
          finalAmount: undefined,
          masterPercent: undefined,
          masterIncome: undefined,
          cashDesk: undefined,
          repeatDate: undefined,
          repeatTime: undefined,
          createdAt: new Date().toISOString(),
        };
        addOrder(repeatOrder);
      }
    }
    if (status === 'cancelled') {
      updates.cancelReason = cancelReason;
    }
    updateOrder(order.id, updates);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Удалить заказ?')) {
      deleteOrder(order.id);
      onClose();
    }
  };

  const statusColor = {
    in_progress: order.orderType === 'primary' ? 'bg-green-500' : 'bg-yellow-500',
    completed: 'bg-gray-400',
    cancelled: 'bg-red-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Детали заказа" size="lg">
      <div className="space-y-4">
        <div className={`${statusColor[status]} text-white p-4 rounded-lg`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{order.clientName}</h3>
              <p>{order.orderType === 'primary' ? 'Первичный' : 'Повторный'} - {order.pest}</p>
            </div>
            <span className="text-2xl font-bold">{order.basePrice.toLocaleString()} ₽</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div><span className="text-gray-500">Объект:</span> {order.objectType}</div>
          <div><span className="text-gray-500">Объем:</span> {order.volume}</div>
          <div><span className="text-gray-500">Дата:</span> {order.date}</div>
          <div><span className="text-gray-500">Время:</span> {order.time}</div>
          <div className="col-span-2"><span className="text-gray-500">Адрес:</span> {order.address}</div>
          <div className="col-span-2"><span className="text-gray-500">Телефоны:</span> {order.phones.join(', ')}</div>
          <div><span className="text-gray-500">Тип клиента:</span> {order.clientType === 'individual' ? 'Физ. лицо' : 'Юр. лицо'}</div>
          <div><span className="text-gray-500">Менеджер:</span> {order.manager}</div>
          {order.comment && <div className="col-span-2"><span className="text-gray-500">Комментарий:</span> {order.comment}</div>}
        </div>

        <Select
          label="Статус заказа"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          options={[
            { value: 'in_progress', label: 'В работе' },
            { value: 'completed', label: 'Выполнен' },
            { value: 'cancelled', label: 'Отменен' },
          ]}
        />

        {status === 'completed' && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-bold text-lg">Завершение заказа</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Итоговая сумма"
                type="number"
                value={completedForm.finalAmount}
                onChange={(e) => setCompletedForm({...completedForm, finalAmount: Number(e.target.value)})}
              />
              <Input
                label="Процент мастера ^(^)"
                type="number"
                value={completedForm.masterPercent}
                onChange={(e) => setCompletedForm({...completedForm, masterPercent: Number(e.target.value)})}
              />
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-gray-600">Доход мастера:</span>
                <span className="font-bold ml-2">{masterIncome.toLocaleString()} ₽</span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <span className="text-gray-600">Сдать в кассу:</span>
                <span className="font-bold ml-2">{cashDesk.toLocaleString()} ₽</span>
              </div>
              <Input label="Имя мастера" value={completedForm.masterName} onChange={(e) => setCompletedForm({...completedForm, masterName: e.target.value})} />
              <Input label="Контакт мастера" value={completedForm.masterContact} onChange={(e) => setCompletedForm({...completedForm, masterContact: e.target.value})} />
              <Input label="Дата повтора" type="date" value={completedForm.repeatDate} onChange={(e) => setCompletedForm({...completedForm, repeatDate: e.target.value})} />
              <Select label="Время повтора" value={completedForm.repeatTime} onChange={(e) => setCompletedForm({...completedForm, repeatTime: e.target.value})} options={TIMES.map(t => ({value: t, label: t}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
              <textarea value={completedForm.completionComment} onChange={(e) => setCompletedForm({...completedForm, completionComment: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} />
            </div>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Причина отмены</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Укажите причину отмены" />
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="danger" onClick={handleDelete}>Удалить</Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Отмена</Button>
            <Button variant="success" onClick={handleSave}>Сохранить</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
