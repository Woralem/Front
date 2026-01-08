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
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (file: File) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };
  const handleRemove = () => {
    onChange(undefined);
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {value ? (
        <div className="relative group rounded-xl border-2 border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-300">
          <div className="flex items-start gap-4">
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <a href={getFullUrl(value)} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={getFullUrl(value)}
                  alt="Превью"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Файл загружен
              </div>
              <a
                href={getFullUrl(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate block mt-1"
              >
                Открыть файл →
              </a>
            </div>
            
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Удалить файл"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`
            relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
            transition-all duration-200
            ${dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
              </div>
              <span className="mt-3 text-sm text-gray-500">Загрузка файла...</span>
            </div>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-700">
                Перетащите файл сюда или <span className="text-green-600">выберите</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                PNG, JPG, PDF до 10MB
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}