import React, { useState } from 'react';
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
  ChevronRight,
  Sparkles,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home, 
    color: 'from-blue-500 to-blue-600',
    description: 'Resumen general'
  },
  { 
    name: 'Personal', 
    href: '/personal', 
    icon: Users, 
    color: 'from-green-500 to-green-600',
    description: 'Gestión de empleados'
  },
  { 
    name: 'Servicios', 
    href: '/servicios', 
    icon: Settings, 
    color: 'from-purple-500 to-purple-600',
    description: 'Carteras y nodos'
  },
  { 
    name: 'Programación', 
    href: '/calendario', 
    icon: Calendar, 
    color: 'from-orange-500 to-orange-600',
    description: 'Planificación semanal'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  isCollapsed = false, 
  onCollapseToggle 
}) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl transform transition-all duration-500 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`relative border-b border-gray-100 ${isCollapsed ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-full">
                {/* Logo de la empresa */}
                <div className={`flex items-center justify-center ${
                  isCollapsed ? 'w-16 h-16' : 'w-32 h-32'
                }`}>
                  <img 
                    src={require('../../assets/logo.png')} 
                    alt="Logo Empresa" 
                    className={`object-contain ${isCollapsed ? 'w-14 h-14' : 'w-30 h-30'}`}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Botón de colapsar (solo desktop) */}
                {onCollapseToggle && (
                  <button
                    onClick={onCollapseToggle}
                    className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title={isCollapsed ? 'Expandir menú' : 'Minimizar menú'}
                  >
                    {isCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeft size={20} />}
                  </button>
                )}
                {/* Botón de cerrar (solo móvil) */}
                <button
                  onClick={onToggle}
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center rounded-xl transition-all duration-300 ease-out ${
                    isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 shadow-sm' 
                      : 'hover:bg-gray-50 hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  title={isCollapsed ? item.name : undefined}
                >
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
                  )}
                  
                  {/* Icon container */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${item.color} shadow-lg` 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <item.icon 
                      size={20} 
                      className={`transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                      }`} 
                    />
                  </div>
                  
                  {/* Text content - solo visible cuando no está colapsado */}
                  {!isCollapsed && (
                    <div className="ml-4 flex-1">
                      <div className={`font-semibold transition-colors duration-300 ${
                        isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {item.name}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        isActive ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-600'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                  
                  {/* Arrow indicator - solo visible cuando no está colapsado */}
                  {!isCollapsed && (
                    <ChevronRight 
                      size={16} 
                      className={`transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-500 translate-x-0' 
                          : 'text-gray-400 -translate-x-1 group-hover:translate-x-0 group-hover:text-gray-600'
                      }`} 
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl ${isCollapsed ? 'p-2' : 'p-4'}`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <LogOut size={16} className="text-white" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">Sesión Activa</div>
                    <div className="text-xs text-gray-500">Usuario conectado</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
