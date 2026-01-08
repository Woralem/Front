// src/components/Orders/OrderDetailsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import FileUpload from '@/components/UI/FileUpload';
import { useOrderStore } from '@/store/orderStore';
import { Order, BASE_URL } from '@/lib/api';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIMES = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export default function OrderDetailsModal({ order, isOpen, onClose, onSuccess }: Props) {
  const { updateOrder, deleteOrder, isLoading } = useOrderStore();
  const [status, setStatus] = useState(order?.status || 'in_progress');
  const [error, setError] = useState<string | null>(null);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  
  const [completedForm, setCompletedForm] = useState({
    finalAmount: 0,
    masterPercent: 40,
    masterName: '',
    masterContact: '',
    repeatDate: '',
    repeatTime: '09:00',
    completionComment: '',
    contractPhoto: '',
  });
  
  const [cancelReason, setCancelReason] = useState('');

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  useEffect(() => {
    if (order?.contractPhoto) {
      setFileExists(null);
      
      const checkFile = async () => {
        try {
          const response = await fetch(getFullUrl(order.contractPhoto!), { method: 'HEAD' });
          setFileExists(response.ok);
        } catch {
          setFileExists(false);
        }
      };
      
      checkFile();
    } else {
      setFileExists(null);
    }
  }, [order?.contractPhoto]);

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
        contractPhoto: order.contractPhoto || '',
      });
      setCancelReason(order.cancelReason || '');
    }
  }, [order]);

  if (!order) return null;

  const masterIncome = (completedForm.finalAmount * completedForm.masterPercent) / 100;
  const cashDesk = completedForm.finalAmount - masterIncome;

  const handleSave = async () => {
    setError(null);
    
    try {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        Object.assign(updates, completedForm);
      }
      
      if (status === 'cancelled') {
        updates.cancelReason = cancelReason;
      }
      
      await updateOrder(order.id, updates);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await deleteOrder(order.id);
        onSuccess?.();
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const getStatusStyles = () => {
    if (status === 'cancelled') return 'from-red-500 to-red-600';
    if (status === 'completed') return 'from-gray-400 to-gray-500';
    return order.orderType === 'primary' 
      ? 'from-green-500 to-emerald-600' 
      : 'from-amber-400 to-amber-500';
  };

  const statusLabels = {
    in_progress: 'В работе',
    completed: 'Выполнен',
    cancelled: 'Отменён',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Детали заказа" size="lg">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Header Card */}
        <div className={`bg-gradient-to-br ${getStatusStyles()} text-white p-6 rounded-2xl shadow-lg`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  {order.orderType === 'primary' ? 'Первичный' : 'Повторный'}
                </span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  {statusLabels[status]}
                </span>
              </div>
              <h3 className="text-2xl font-bold">{order.clientName}</h3>
              <p className="opacity-90 mt-1">
                {order.pest} • {order.objectType}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{order.basePrice.toLocaleString()} ₽</div>
              <div className="text-sm opacity-75 mt-1">базовая цена</div>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Информация
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Объём:</span>
                <span className="font-medium">{order.volume || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Дата:</span>
                {/* ✅ Форматированная дата */}
                <span className="font-medium">{formatDate(order.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Время:</span>
                <span className="font-medium">{order.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Тип клиента:</span>
                <span className="font-medium">{order.clientType === 'individual' ? 'Физ. лицо' : 'Юр. лицо'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Менеджер:</span>
                <span className="font-medium">{order.manager}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Контакты
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Адрес:</span>
                <p className="font-medium mt-0.5">{order.address}</p>
              </div>
              <div>
                <span className="text-gray-500">Телефоны:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {order.phones.map((phone, i) => (
                    <a 
                      key={i}
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comment */}
        {order.comment && (
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Комментарий
            </h4>
            <p className="text-blue-800 text-sm">{order.comment}</p>
          </div>
        )}

        {/* Contract photo for completed orders */}
        {order.contractPhoto && order.status === 'completed' && (
          <div className={`rounded-xl p-4 ${fileExists === false ? 'bg-red-50' : 'bg-green-50'}`}>
            <h4 className={`font-medium flex items-center gap-2 mb-3 ${fileExists === false ? 'text-red-900' : 'text-green-900'}`}>
              <svg className={`w-5 h-5 ${fileExists === false ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Договор
            </h4>
            
            {fileExists === null && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
                Проверка файла...
              </div>
            )}
            
            {fileExists === false && (
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Файл не найден. Загрузите новый файл в форме ниже.</span>
              </div>
            )}
            
            {fileExists === true && (
              <>
                {order.contractPhoto.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <a href={getFullUrl(order.contractPhoto)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getFullUrl(order.contractPhoto)}
                      alt="Договор"
                      className="max-h-40 rounded-xl border border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a
                    href={getFullUrl(order.contractPhoto)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 hover:underline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Открыть документ
                  </a>
                )}
              </>
            )}
          </div>
        )}

        {/* Status Selector */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Изменить статус</h4>
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setStatus('in_progress')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                status === 'in_progress'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              В работе
            </button>
            <button
              type="button"
              onClick={() => setStatus('completed')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                status === 'completed'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Выполнен
            </button>
            <button
              type="button"
              onClick={() => setStatus('cancelled')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                status === 'cancelled'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Отменён
            </button>
          </div>
        </div>

        {/* Completed Form */}
        {status === 'completed' && (
          <div className="bg-green-50 rounded-2xl p-6 space-y-4 animate-fade-in">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Завершение заказа
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Итоговая сумма"
                type="number"
                value={completedForm.finalAmount || ''}
                onChange={(e) => setCompletedForm({ ...completedForm, finalAmount: Number(e.target.value) })}
                placeholder="0"
              />
              <Input
                label="Процент мастера (%)"
                type="number"
                value={completedForm.masterPercent}
                onChange={(e) => setCompletedForm({ ...completedForm, masterPercent: Number(e.target.value) })}
              />
            </div>
            
            {/* Calculated values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="text-sm text-gray-500 mb-1">Доход мастера</div>
                <div className="text-2xl font-bold text-gray-900">{masterIncome.toLocaleString()} ₽</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="text-sm text-gray-500 mb-1">Сдать в кассу</div>
                <div className="text-2xl font-bold text-green-600">{cashDesk.toLocaleString()} ₽</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Имя мастера"
                value={completedForm.masterName}
                onChange={(e) => setCompletedForm({ ...completedForm, masterName: e.target.value })}
                placeholder="Иван Петров"
              />
              <Input
                label="Контакт мастера"
                value={completedForm.masterContact}
                onChange={(e) => setCompletedForm({ ...completedForm, masterContact: e.target.value })}
                placeholder="+7 900 123-45-67"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Дата повторного визита"
                type="date"
                value={completedForm.repeatDate}
                onChange={(e) => setCompletedForm({ ...completedForm, repeatDate: e.target.value })}
              />
              <Select
                label="Время повторного визита"
                value={completedForm.repeatTime}
                onChange={(e) => setCompletedForm({ ...completedForm, repeatTime: e.target.value })}
                options={TIMES.map(t => ({ value: t, label: t }))}
              />
            </div>
            
            <div className="space-y-2">
              {fileExists === false && completedForm.contractPhoto && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <FileUpload
                label="Фото договора"
                value={fileExists === false ? '' : completedForm.contractPhoto}
                onChange={(url) => setCompletedForm({ ...completedForm, contractPhoto: url || '' })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Комментарий</label>
              <textarea
                value={completedForm.completionComment}
                onChange={(e) => setCompletedForm({ ...completedForm, completionComment: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                rows={2}
                placeholder="Заметки по выполнению..."
              />
            </div>
          </div>
        )}

        {/* Cancelled Form */}
        {status === 'cancelled' && (
          <div className="bg-red-50 rounded-2xl p-6 animate-fade-in">
            <h4 className="font-semibold text-red-900 flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Причина отмены
            </h4>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              rows={3}
              placeholder="Укажите причину отмены заказа..."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={isLoading}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Удалить
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSave} loading={isLoading}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}