import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificacionesModal } from '../common/NotificacionesModal';
import { usePersonalList } from '../../hooks/usePersonal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNotificacionesOpen, setIsNotificacionesOpen] = useState(false);
  
  // Hook para navegación global
  const navigate = useNavigate();
  
  // Hook para obtener datos de personal (necesario para la búsqueda)
  const { data: personalData, refetch: refetchPersonal } = usePersonalList(1, 1000, '');

  // Listener global para navegación a documentos desde cualquier página
  useEffect(() => {
    console.log('🌐 [GLOBAL] Configurando listener global para navegación a documentos');
    
    const handleOpenPersonalDetailModal = async (event: CustomEvent) => {
      const { personalId, rutPersona } = event.detail;
      console.log('🌐 [GLOBAL] Evento recibido para abrir modal:', { personalId, rutPersona });
      console.log('🌐 [GLOBAL] Página actual:', window.location.pathname);
      console.log('🌐 [GLOBAL] Timestamp:', new Date().toISOString());
      
      // Si ya estamos en la página de personal, no hacer nada (dejamos que PersonalPage lo maneje)
      if (window.location.pathname === '/personal') {
        console.log('🌐 [GLOBAL] Ya estamos en /personal, dejando que PersonalPage maneje el evento');
        return;
      }
      
      // Si estamos en otra página, crear transición moderna
      console.log('🌐 [GLOBAL] Navegando desde', window.location.pathname, 'a /personal');
      
      // Crear overlay de transición moderna
      const createTransitionOverlay = () => {
        const overlay = document.createElement('div');
        overlay.id = 'navigation-transition-overlay';
        overlay.className = 'fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-[10000] flex items-center justify-center';
        overlay.style.cssText = `
          animation: fadeInScale 0.3s ease-out;
        `;
        
        // Contenido del overlay
        overlay.innerHTML = `
          <div class="text-center text-white">
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <h3 class="text-xl font-semibold mb-2">Navegando a documentos</h3>
            <p class="text-blue-100">Preparando información del personal...</p>
          </div>
        `;
        
        // Agregar estilos CSS para la animación
        if (!document.getElementById('transition-styles')) {
          const style = document.createElement('style');
          style.id = 'transition-styles';
          style.textContent = `
            @keyframes fadeInScale {
              0% {
                opacity: 0;
                transform: scale(0.9);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes fadeOutScale {
              0% {
                opacity: 1;
                transform: scale(1);
              }
              100% {
                opacity: 0;
                transform: scale(1.1);
              }
            }
            @keyframes fadeIn {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
            @keyframes slideInUp {
              0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
            .animate-slideInUp {
              animation: slideInUp 0.4s ease-out;
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        return overlay;
      };
      
      // Mostrar overlay de transición
      const overlay = createTransitionOverlay();
      
      // Navegar a la página de personal
      navigate('/personal');
      
      // Esperar a que se complete la navegación y luego abrir el modal
      setTimeout(() => {
        console.log('🌐 [GLOBAL] Re-disparando evento después de navegación (con delay extendido)');
        console.log('🌐 [GLOBAL] Nueva página actual:', window.location.pathname);
        
        const newEvent = new CustomEvent('openPersonalDetailModal', {
          detail: { 
            personalId, 
            rutPersona,
            timestamp: new Date().toISOString(),
            source: 'global-navigation',
            retryCount: 0
          }
        });
        
        console.log('🌐 [GLOBAL] Disparando nuevo evento:', newEvent.detail);
        window.dispatchEvent(newEvent);
        
        // Remover overlay después de un breve delay
        setTimeout(() => {
          if (overlay && overlay.parentNode) {
            overlay.style.animation = 'fadeOutScale 0.2s ease-in';
            setTimeout(() => {
              overlay.remove();
            }, 200);
          }
        }, 500);
      }, 800); // Reducir delay para transición más rápida
    };

    // Agregar listener global
    console.log('🌐 [GLOBAL] Agregando listener global');
    window.addEventListener('openPersonalDetailModal', handleOpenPersonalDetailModal as unknown as EventListener);

    // Cleanup
    return () => {
      console.log('🌐 [GLOBAL] Removiendo listener global');
      window.removeEventListener('openPersonalDetailModal', handleOpenPersonalDetailModal as unknown as EventListener);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isCollapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
              <Header
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                onNotificacionesToggle={() => setIsNotificacionesOpen(true)}
              />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de Notificaciones - Renderizado fuera del layout principal */}
      <NotificacionesModal
        isOpen={isNotificacionesOpen}
        onClose={() => setIsNotificacionesOpen(false)}
      />
    </div>
  );
};
