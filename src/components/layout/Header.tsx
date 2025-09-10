import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-[#006BF7] to-[#00AAFF] shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-white hover:text-gray-200 hover:bg-white/20"
        >
          <Menu size={20} />
        </button>

        {/* Desktop title */}
        <h1 className="hidden lg:block text-xl font-semibold text-white">
          Sistema Integral de Gestión
        </h1>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-white hover:text-gray-200 hover:bg-white/20 rounded-md">
            <Bell size={20} />
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-black">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-white">{user?.email}</p>
            </div>
            <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center">
              <User size={16} className="text-black" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
