import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar,
  Settings, 
  LogOut,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Personal', href: '/personal', icon: Users },
  { name: 'Servicios', href: '/servicios', icon: Settings },
  { name: 'Programación', href: '/calendario', icon: Calendar },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
        <div
    className={`fixed inset-y-0 left-0 z-50 w-48 bg-gradient-to-b from-[#D8D5EB] to-[#ABABAB] shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex justify-center items-center w-full">
              <img src={require('../../assets/logo.png')} alt="Logo" className="object-contain w-full h-full" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </div>
            <button
              onClick={onToggle}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item text-black hover-grow transition-all duration-200 stagger-item ${
                    isActive ? 'sidebar-item-active scale-105 shadow-md text-[#262626]' : 'sidebar-item-inactive hover:scale-105'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    // Cerrar sidebar en móvil al hacer clic
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <item.icon size={20} className="mr-3 transition-transform duration-200" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {/* Botón de cerrar sesión desactivado */}
            <button
              // onClick={logout}
              onClick={(e) => e.preventDefault()}
              className="sidebar-item sidebar-item-inactive w-full justify-start cursor-not-allowed opacity-50"
              disabled
            >
              <LogOut size={20} className="mr-3 transition-transform duration-200" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
