'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiHome, FiUsers, FiFileText, FiX, FiSettings } from 'react-icons/fi';
import { GiCorn, GiCow } from 'react-icons/gi';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'administrador';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Cultivos', href: '/cultivos', icon: GiCorn },
    { name: 'Ganado', href: '/ganado', icon: GiCow },
    { name: 'Registros', href: '/registros', icon: FiFileText },
    ...(isAdmin
      ? [{ name: 'Usuarios', href: '/usuarios', icon: FiUsers }]
      : []),
    { name: 'Configuración', href: '/settings', icon: FiSettings },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b min-h-[80px]">
            {isOpen ? (
              <>
                <div className="flex items-center flex-1 min-w-0">
                  <GiCorn className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <span className="block text-base font-bold text-gray-800 leading-tight">
                      Sistema Contable
                    </span>
                    <span className="block text-sm font-medium text-green-600 leading-tight">
                      Agropecuario
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
                  aria-label="Cerrar menú"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsOpen(true)}
                className="w-full flex justify-center text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Abrir menú"
              >
                <GiCorn className="h-8 w-8 text-green-600" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${
                    isOpen ? 'px-4' : 'px-3 justify-center'
                  } py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={!isOpen ? item.name : ''}
                >
                  <item.icon
                    className={`h-5 w-5 ${isOpen ? 'mr-3' : ''} ${
                      isActive ? 'text-green-600' : 'text-gray-500'
                    }`}
                  />
                  {isOpen && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className={`flex items-center ${!isOpen && 'justify-center'}`}>
              <div className="shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">
                    {user?.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              {isOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.nombre}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
