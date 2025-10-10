import React from 'react';
import { API_CONFIG, DEMO_CONFIG } from '../config/api';

// Datos mock para el modo demo
export const MOCK_DATA = {
  personal: [
    {
      id: '1',
      rut: '12345678-9',
      nombres: 'Juan Pérez',
      cargo: 'Supervisor',
      zona_geografica: 'Santiago',
      activo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      rut: '98765432-1',
      nombres: 'María González',
      cargo: 'Operador',
      zona_geografica: 'Valparaíso',
      activo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  carteras: [
    {
      id: 1,
      nombre: 'Cartera Norte',
      fecha_creacion: '2024-01-01T00:00:00Z',
      total_clientes: 3,
      total_nodos: 6
    },
    {
      id: 2,
      nombre: 'Cartera Sur',
      fecha_creacion: '2024-01-01T00:00:00Z',
      total_clientes: 2,
      total_nodos: 4
    },
    {
      id: 3,
      nombre: 'Cartera Centro',
      fecha_creacion: '2024-01-01T00:00:00Z',
      total_clientes: 4,
      total_nodos: 8
    }
  ],
  clientes: [
    {
      id: 1,
      nombre: 'Empresa Norte S.A.',
      cartera_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 2,
      nombre: 'Comercial Norte Ltda.',
      cartera_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 3,
      nombre: 'Servicios Norte',
      cartera_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 4,
      nombre: 'Empresa Sur S.A.',
      cartera_id: 2,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 5,
      nombre: 'Comercial Sur Ltda.',
      cartera_id: 2,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 6,
      nombre: 'Empresa Centro S.A.',
      cartera_id: 3,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 7,
      nombre: 'Comercial Centro Ltda.',
      cartera_id: 3,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 8,
      nombre: 'Servicios Centro',
      cartera_id: 3,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    },
    {
      id: 9,
      nombre: 'Industrias Centro',
      cartera_id: 3,
      created_at: '2024-01-01T00:00:00Z',
      total_nodos: 2
    }
  ],
  nodos: [
    {
      id: 1,
      nombre: 'Nodo Norte 1',
      cliente_id: 1,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      nombre: 'Nodo Norte 2',
      cliente_id: 1,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      nombre: 'Nodo Comercial Norte 1',
      cliente_id: 2,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      nombre: 'Nodo Comercial Norte 2',
      cliente_id: 2,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 5,
      nombre: 'Nodo Servicios Norte 1',
      cliente_id: 3,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 6,
      nombre: 'Nodo Servicios Norte 2',
      cliente_id: 3,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 7,
      nombre: 'Nodo Sur 1',
      cliente_id: 4,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 8,
      nombre: 'Nodo Sur 2',
      cliente_id: 4,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 9,
      nombre: 'Nodo Comercial Sur 1',
      cliente_id: 5,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 10,
      nombre: 'Nodo Comercial Sur 2',
      cliente_id: 5,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 11,
      nombre: 'Nodo Centro 1',
      cliente_id: 6,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 12,
      nombre: 'Nodo Centro 2',
      cliente_id: 6,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 13,
      nombre: 'Nodo Comercial Centro 1',
      cliente_id: 7,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 14,
      nombre: 'Nodo Comercial Centro 2',
      cliente_id: 7,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 15,
      nombre: 'Nodo Servicios Centro 1',
      cliente_id: 8,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 16,
      nombre: 'Nodo Servicios Centro 2',
      cliente_id: 8,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 17,
      nombre: 'Nodo Industrias Centro 1',
      cliente_id: 9,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 18,
      nombre: 'Nodo Industrias Centro 2',
      cliente_id: 9,
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  minimoPersonal: [
    {
      id: 1,
      servicio_id: 1,
      cartera_id: 1,
      minimo_personal: 3,
      descripcion: 'Mínimo para servicio demo',
      activo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  acuerdos: [
    {
      id: 1,
      nombre: 'Acuerdo Demo 2024',
      descripcion: 'Acuerdo de servicio demo',
      tipo_acuerdo: 'servicio',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      estado: 'activo',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
};

// Función para simular delay de red
const simulateNetworkDelay = (): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, DEMO_CONFIG.MOCK_DELAY);
  });
};

// Función para verificar si el backend está disponible
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend no disponible, usando modo demo:', error);
    return false;
  }
};

// Servicio de fallback que detecta automáticamente el modo
export class FallbackService {
  private static isBackendAvailable: boolean | null = null;
  private static lastCheck: number = 0;
  private static readonly CHECK_INTERVAL = 30000; // 30 segundos

  // Verificar disponibilidad del backend con cache
  static async isBackendHealthy(): Promise<boolean> {
    const now = Date.now();
    
    // Si ya verificamos recientemente, usar el resultado cacheado
    if (this.isBackendAvailable !== null && (now - this.lastCheck) < this.CHECK_INTERVAL) {
      return this.isBackendAvailable;
    }

    // Verificar disponibilidad
    this.isBackendAvailable = await checkBackendHealth();
    this.lastCheck = now;
    
    return this.isBackendAvailable;
  }

  // Obtener datos mock con paginación
  static async getMockData<T>(
    dataType: keyof typeof MOCK_DATA,
    params?: { limit?: number; offset?: number; search?: string }
  ): Promise<{ success: boolean; data: T[]; pagination?: any }> {
    await simulateNetworkDelay();
    
    let data = MOCK_DATA[dataType] as T[];
    
    // Aplicar búsqueda si se proporciona
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      data = data.filter((item: any) => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Aplicar paginación
    const limit = params?.limit || 10;
    const offset = params?.offset || 0;
    const paginatedData = data.slice(offset, offset + limit);
    
    return {
      success: true,
      data: paginatedData,
      pagination: {
        total: data.length,
        limit,
        offset
      }
    };
  }

  // Crear respuesta mock exitosa
  static async createMockResponse<T>(data: T): Promise<{ success: boolean; data: T; message?: string }> {
    await simulateNetworkDelay();
    return {
      success: true,
      data,
      message: 'Operación completada en modo demo'
    };
  }

  // Crear respuesta mock de error
  static async createMockError(message: string): Promise<{ success: boolean; data: null; message: string }> {
    await simulateNetworkDelay();
    return {
      success: false,
      data: null,
      message
    };
  }

  // Forzar verificación del backend
  static async forceBackendCheck(): Promise<boolean> {
    this.isBackendAvailable = null;
    this.lastCheck = 0;
    return await this.isBackendHealthy();
  }
}

// Hook para detectar modo demo
export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = React.useState<boolean>(true);
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkMode = async () => {
      setIsChecking(true);
      const isBackendHealthy = await FallbackService.isBackendHealthy();
      setIsDemoMode(!isBackendHealthy);
      setIsChecking(false);
    };

    checkMode();
  }, []);

  return { isDemoMode, isChecking };
};

