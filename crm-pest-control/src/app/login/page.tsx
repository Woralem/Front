'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/UI/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!password.trim()) {
      setLocalError('Введите пароль');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(password);
      router.push('/');
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🐜</div>
          <h1 className="text-2xl font-bold text-gray-800">CRM Дезинсекция</h1>
          <p className="text-gray-500 mt-2">Введите пароль для входа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {localError || error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="••••••••"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="success"
            className="w-full py-3 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}