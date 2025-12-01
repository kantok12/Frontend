import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificacionesModal } from '../common/NotificacionesModal';
import { PersonalDetailModal } from '../personal/PersonalDetailModal';
import { usePersonalList } from '../../hooks/usePersonal';
import apiService from '../../services/api';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { Personal } from '../../types';

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

  const { notificaciones, marcarComoLeida, marcarComoLeidaOptimistic } = useNotificaciones();
  const [selectedPersonalGlobal, setSelectedPersonalGlobal] = useState<Personal | null>(null);
  const [showPersonalGlobalModal, setShowPersonalGlobalModal] = useState(false);

  // Listener global para navegación a documentos desde cualquier página
  // Debug: log imported components to detect undefined elements at runtime
  useEffect(() => {
    console.log('DEBUG Layout imports ->', {
      SidebarType: typeof Sidebar,
      HeaderType: typeof Header,
      NotificacionesModalType: typeof NotificacionesModal,
      PersonalDetailModalType: typeof PersonalDetailModal,
    });
  }, []);

  useEffect(() => {
    console.log('🌐 [GLOBAL] Configurando listener global para navegación a documentos');
    
    const handleOpenPersonalDetailModal = async (event: CustomEvent) => {
      const { personalId, rutPersona } = event.detail;
      console.log('🌐 [GLOBAL] Evento recibido para abrir modal:', { personalId, rutPersona });
      console.log('🌐 [GLOBAL] Página actual:', window.location.pathname);
      console.log('🌐 [GLOBAL] Timestamp:', new Date().toISOString());
      // Defensive guards: ignore malformed events or events fired from unrelated pages
      if ((!personalId && !rutPersona) || String(personalId).trim() === '' && String(rutPersona).trim() === '') {
        console.log('🌐 [GLOBAL] Evento ignorado: no contiene personalId ni rutPersona válidos');
        return;
      }
      // Do not open personal modal when we're on calendar/programacion pages — these can emit events unintentionally
      const path = window.location.pathname || '';
      if (path.startsWith('/calendario') || path.startsWith('/programacion') || path.startsWith('/agenda')) {
        console.log('🌐 [GLOBAL] Evento ignorado: actualmente en ruta de calendario/programación', path);
        return;
      }
      
      // Intentar abrir modal directo si tenemos la persona en cache (sin navegar)
      const rutToOpen = rutPersona || personalId;
      const found = personalData?.data?.items?.find((p: any) => p.rut === rutToOpen || String(p.id) === String(personalId) || p.rut?.replace(/[.-]/g, '') === String(rutToOpen).replace(/[.-]/g, ''));
      if (found) {
        console.log('🌐 [GLOBAL] Personal encontrado en Layout, abriendo modal directo:', found.rut || found.id);
        // Abrir modal de detalle directamente en Layout
        setSelectedPersonalGlobal(found as Personal);
        setShowPersonalGlobalModal(true);

        // Marcar notificaciones relacionadas como leídas
        (async () => {
          try {
            const related = (notificaciones || []).filter((n: any) => n.personal_id && (n.personal_id === found.rut || n.personal_id.replace(/[.-]/g, '') === String(found.rut).replace(/[.-]/g, '')));
            for (const r of related) {
              if (typeof marcarComoLeidaOptimistic === 'function') {
                await marcarComoLeidaOptimistic(r.id);
              } else {
                await marcarComoLeida.mutateAsync(r.id);
              }
            }
          } catch (err) {
            console.warn('Error marcando notificaciones relacionadas desde Layout:', err);
          }
        })();

        return;
      }

      // Si estamos en otra página y no encontramos la persona en cache, navegar como antes
      console.log('🌐 [GLOBAL] No encontrada en cache, intentando obtener por RUT/ID antes de navegar');

      // Intentar obtener la persona directamente desde API para abrir modal sin navegar
      const rutCandidate = rutPersona || personalId;
      try {
        if (rutCandidate && String(rutCandidate).trim() !== '') {
          const normalizedRut = String(rutCandidate).replace(/[.-]/g, '');
          console.log('🌐 [GLOBAL] Intentando getPersonalByRut con:', normalizedRut);
          const resp: any = await apiService.getPersonalByRut(normalizedRut);
          // Resp puede tener varias formas: { data: { items: [...] } } o { data: {...} } o ser la persona directa
          let fetched: any = null;
          if (resp?.data?.items && Array.isArray(resp.data.items) && resp.data.items.length > 0) fetched = resp.data.items[0];
          else if (resp?.data && (resp.data.id || resp.data.rut || resp.data.nombre)) fetched = resp.data;
          else if (Array.isArray(resp) && resp.length > 0) fetched = resp[0];

          if (fetched) {
            console.log('🌐 [GLOBAL] Persona obtenida por API, abriendo modal directo:', fetched.rut || fetched.id);
            setSelectedPersonalGlobal(fetched as Personal);
            setShowPersonalGlobalModal(true);

            // Marcar notificaciones relacionadas como leídas
            try {
              const related = (notificaciones || []).filter((n: any) => n.personal_id && (n.personal_id === fetched.rut || n.personal_id.replace(/[.-]/g, '') === String(fetched.rut).replace(/[.-]/g, '')));
              for (const r of related) {
                if (typeof marcarComoLeidaOptimistic === 'function') {
                  await marcarComoLeidaOptimistic(r.id);
                } else {
                  await marcarComoLeida.mutateAsync(r.id);
                }
              }
            } catch (err) {
              console.warn('Error marcando notificaciones relacionadas después de fetch:', err);
            }

            return;
          }
        }
      } catch (err) {
        console.warn('🌐 [GLOBAL] Error al obtener persona por API:', err);
      }

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
  }, [navigate, personalData, notificaciones, marcarComoLeida, refetchPersonal]);

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
      {/* PersonalDetailModal: render cuando Layout abre el detalle directamente */}
      <PersonalDetailModal
        personal={selectedPersonalGlobal}
        isOpen={showPersonalGlobalModal}
        onClose={() => { setShowPersonalGlobalModal(false); setSelectedPersonalGlobal(null); }}
        onUpdate={() => { if (selectedPersonalGlobal) refetchPersonal(); }}
      />
    </div>
  );
};
