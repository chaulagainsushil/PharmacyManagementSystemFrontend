import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'PharmaCare PMS',
  description: 'Pharmacy Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: '12px', fontSize: '14px' },
              success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
              error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
