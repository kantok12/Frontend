import React from 'react';
import { Menu, Bell, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg border-b border-blue-500/20 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2.5 rounded-xl text-white hover:text-blue-100 hover:bg-white/10 transition-all duration-200"
          >
            <Menu size={20} />
          </button>

          {/* Desktop title */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sistema Integral de Servicios Internos
            </h1>
          </div>
        </div>


        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-white hover:text-blue-100 hover:bg-white/10 rounded-xl transition-all duration-200 group">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600"></span>
          </button>

          {/* Settings */}
          <button className="p-2.5 text-white hover:text-blue-100 hover:bg-white/10 rounded-xl transition-all duration-200">
            <Settings size={20} />
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3 pl-3 border-l border-white/20">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
              <User size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
