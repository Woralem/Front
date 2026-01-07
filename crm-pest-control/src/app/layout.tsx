import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM - Дезинсекция',
  description: 'CRM система для управления заказами дезинсекции',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
