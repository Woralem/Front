'use client';

import React, { useRef, useState } from 'react';
import { api, BASE_URL } from '@/lib/api';

interface FileUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}

export default function FileUpload({ value, onChange, label }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      const filename = value.split('/').pop();
      if (filename) {
        try {
          await api.deleteFile(filename);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      onChange(undefined);
    }
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {value ? (
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 flex items-center gap-1">
              ✅ Файл загружен
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Удалить
            </button>
          </div>
          
          {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <a href={getFullUrl(value)} target="_blank" rel="noopener noreferrer">
              <img
                src={getFullUrl(value)}
                alt="Превью"
                className="max-h-40 rounded border cursor-pointer hover:opacity-80"
              />
            </a>
          ) : (
            <a
              href={getFullUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              📄 Открыть файл
            </a>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${isUploading 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-sm text-gray-500">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📷</div>
              <div className="text-sm text-gray-600">
                Нажмите для загрузки фото договора
              </div>
              <div className="text-xs text-gray-400 mt-1">
                JPG, PNG, PDF до 10MB
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}