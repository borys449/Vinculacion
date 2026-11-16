'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const typedUser = user as any;
    if (typedUser && (typedUser.tipo === 'administrador' || typedUser.role === 'admin')) {
      const fincaRegistrada = typedUser.finca?.poligonoPerimetro;
      if (!fincaRegistrada && typeof window !== 'undefined' && window.location.pathname !== '/admin/configurar-mapa') {
        router.push('/admin/configurar-mapa');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}