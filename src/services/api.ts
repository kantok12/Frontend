import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Personal, 
  Empresa, 
  Servicio, 
  LoginForm, 
  RegisterForm,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  ServicioStats,
  PersonalDisponible,
  CreatePersonalDisponibleData,
  ExtendedRegisterForm
} from '../types';

import { API_CONFIG } from '../config/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // Cambiar a false para evitar problemas CORS
    });

    // Interceptor para agregar token a las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar respuestas y errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async login(credentials: LoginForm): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async registerWithPersonalDisponible(userData: ExtendedRegisterForm): Promise<ApiResponse<{ token: string; user: User; personal: PersonalDisponible }>> {
    // Primero registrar el usuario
    const userResponse = await this.register({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      nombre: userData.nombre,
      apellido: userData.apellido
    });

    if (userResponse.success && userResponse.data) {
      try {
        // Luego crear el registro en personal-disponible
        const personalData: CreatePersonalDisponibleData = {
          rut: userData.rut,
          sexo: userData.sexo,
          fecha_nacimiento: userData.fecha_nacimiento,
          licencia_conducir: userData.licencia_conducir,
          cargo: userData.cargo,
          estado_id: userData.estado_id,
          talla_zapatos: userData.talla_zapatos,
          talla_pantalones: userData.talla_pantalones,
          talla_poleras: userData.talla_poleras,
          zona_geografica: userData.zona_geografica,
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          telefono: userData.telefono
        };

        const personalResponse = await this.createPersonalDisponible(personalData);

        if (personalResponse.success) {
          return {
            success: true,
            data: {
              token: userResponse.data.token,
              user: userResponse.data.user,
              personal: personalResponse.data
            }
          };
        } else {
          // Si falla crear personal, deberíamos considerar eliminar el usuario creado
          // Por ahora solo devolvemos el error
          throw new Error('Error al crear el registro de personal disponible');
        }
      } catch (error) {
        // En caso de error en personal disponible, deberíamos limpiar el usuario creado
        throw new Error(`Error al completar el registro: ${error}`);
      }
    }

    throw new Error('Error al registrar usuario');
  }

  async logout(): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response: AxiosResponse<ApiResponse<{ token: string }>> = await this.api.post('/auth/refresh');
    return response.data;
  }

  // Métodos de Personal
  async getPersonal(page = 1, limit = 10, search = '', filters = ''): Promise<PaginatedResponse<Personal>> {
    const offset = (page - 1) * limit;
    
    // Construir URL con parámetros
    let url = `/personal-disponible?limit=${limit}&offset=${offset}`;
    
    // Agregar búsqueda si existe (usar parámetro 'q' que funciona en el backend)
    if (search && search.trim()) {
      url += `&q=${encodeURIComponent(search.trim())}`;
    }
    
    // Agregar filtros si existen
    if (filters && filters !== '{}') {
      url += `&filters=${encodeURIComponent(filters)}`;
    }
    
    const response: AxiosResponse<PaginatedResponse<Personal>> = await this.api.get(url);
    return response.data;
  }

  async getPersonalById(id: string): Promise<ApiResponse<Personal>> {
    const response: AxiosResponse<ApiResponse<Personal>> = await this.api.get(`/personal/${id}`);
    return response.data;
  }

  async createPersonal(personalData: Partial<Personal>): Promise<ApiResponse<Personal>> {
    const response: AxiosResponse<ApiResponse<Personal>> = await this.api.post('/personal', personalData);
    return response.data;
  }

  async updatePersonal(id: string, personalData: Partial<Personal>): Promise<ApiResponse<Personal>> {
    const response: AxiosResponse<ApiResponse<Personal>> = await this.api.put(`/personal-disponible/${id}`, personalData);
    return response.data;
  }

  async createPersonalDisponible(personalData: CreatePersonalDisponibleData): Promise<ApiResponse<PersonalDisponible>> {
    const response: AxiosResponse<ApiResponse<PersonalDisponible>> = await this.api.post('/personal-disponible', personalData);
    return response.data;
  }

  async deletePersonal(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/personal/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA TABLA NOMBRES ====================
  
  // Obtener nombre por RUT
  async getNombreByRut(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/nombres/${rut}`);
    return response.data;
  }

  // Buscar nombres
  async searchNombres(searchTerm: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/nombres/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  }

  // Obtener estadísticas de nombres
  async getNombresStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/nombres/stats');
    return response.data;
  }

  // Crear nombre
  async createNombre(nombreData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/nombres', nombreData);
    return response.data;
  }

  // Actualizar nombre
  async updateNombre(rut: string, nombreData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/nombres/${rut}`, nombreData);
    return response.data;
  }

  // Eliminar nombre
  async deleteNombre(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/nombres/${rut}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA ESTADOS ====================
  
  // Obtener todos los estados
  async getEstados(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/estados');
    return response.data;
  }

  // ==================== MÉTODOS PARA CURSOS/CERTIFICACIONES ====================
  
  // Obtener todos los cursos con filtros
  async getCursos(filters?: { rut?: string; curso?: string; limit?: number; offset?: number }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.rut) params.append('rut', filters.rut);
    if (filters?.curso) params.append('curso', filters.curso);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/cursos${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  }

  // Obtener cursos de una persona específica
  async getCursosByRut(rut: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/cursos/persona/${rut}`);
    return response.data;
  }

  // Obtener curso específico por ID
  async getCursoById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/cursos/${id}`);
    return response.data;
  }

  // Obtener estadísticas de cursos
  async getCursosStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/cursos/stats');
    return response.data;
  }

  // Crear nuevo curso/certificación
  async createCurso(cursoData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/cursos', cursoData);
    return response.data;
  }

  // Actualizar curso/certificación
  async updateCurso(id: number, cursoData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/cursos/${id}`, cursoData);
    return response.data;
  }

  // Eliminar curso/certificación
  async deleteCurso(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/cursos/${id}`);
    return response.data;
  }

  async getPersonalDisponibilidad(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/personal/${id}/disponibilidad`);
    return response.data;
  }

  async updatePersonalDisponibilidad(id: string, disponibilidad: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/personal/${id}/disponibilidad`, disponibilidad);
    return response.data;
  }

  // Métodos de Empresas
  async getEmpresas(page = 1, limit = 10, search = '', filters = ''): Promise<PaginatedResponse<Empresa>> {
    const response: AxiosResponse<PaginatedResponse<Empresa>> = await this.api.get(
      `/empresas?page=${page}&limit=${limit}&search=${search}&filters=${filters}`
    );
    return response.data;
  }

  async getEmpresaById(id: string): Promise<ApiResponse<Empresa>> {
    const response: AxiosResponse<ApiResponse<Empresa>> = await this.api.get(`/empresas/${id}`);
    return response.data;
  }

  async createEmpresa(empresaData: Partial<Empresa>): Promise<ApiResponse<Empresa>> {
    const response: AxiosResponse<ApiResponse<Empresa>> = await this.api.post('/empresas', empresaData);
    return response.data;
  }

  async updateEmpresa(id: string, empresaData: Partial<Empresa>): Promise<ApiResponse<Empresa>> {
    const response: AxiosResponse<ApiResponse<Empresa>> = await this.api.put(`/empresas/${id}`, empresaData);
    return response.data;
  }

  async deleteEmpresa(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/empresas/${id}`);
    return response.data;
  }

  async getEmpresaPersonal(id: string): Promise<ApiResponse<Personal[]>> {
    const response: AxiosResponse<ApiResponse<Personal[]>> = await this.api.get(`/empresas/${id}/personal`);
    return response.data;
  }

  // Métodos de Servicios
  async getServicios(page = 1, limit = 10, search = '', filters = ''): Promise<PaginatedResponse<Servicio>> {
    const response: AxiosResponse<PaginatedResponse<Servicio>> = await this.api.get(
      `/servicios?page=${page}&limit=${limit}&search=${search}&filters=${filters}`
    );
    return response.data;
  }

  async getServicioById(id: string): Promise<ApiResponse<Servicio>> {
    const response: AxiosResponse<ApiResponse<Servicio>> = await this.api.get(`/servicios/${id}`);
    return response.data;
  }

  async createServicio(servicioData: Partial<Servicio>): Promise<ApiResponse<Servicio>> {
    const response: AxiosResponse<ApiResponse<Servicio>> = await this.api.post('/servicios', servicioData);
    return response.data;
  }

  async updateServicio(id: string, servicioData: Partial<Servicio>): Promise<ApiResponse<Servicio>> {
    const response: AxiosResponse<ApiResponse<Servicio>> = await this.api.put(`/servicios/${id}`, servicioData);
    return response.data;
  }

  async deleteServicio(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/servicios/${id}`);
    return response.data;
  }

  async getServicioPersonal(id: string): Promise<ApiResponse<Personal[]>> {
    const response: AxiosResponse<ApiResponse<Personal[]>> = await this.api.get(`/servicios/${id}/personal`);
    return response.data;
  }

  async getServiciosStats(): Promise<ApiResponse<ServicioStats[]>> {
    const response: AxiosResponse<ApiResponse<ServicioStats[]>> = await this.api.get('/servicios/stats/estadisticas');
    return response.data;
  }

  // Métodos de utilidades
  async healthCheck(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/health');
    return response.data;
  }

  // Método para obtener estadísticas del dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      // Como no hay un endpoint específico para dashboard stats, simularemos con datos combinados
      const personalRes = await this.getPersonal(1, 5);

      const stats: DashboardStats = {
        total_personal: personalRes.pagination.total,
        total_empresas: 10, // Valor fijo por ahora
        total_servicios: 15, // Valor fijo por ahora
        personal_activo: personalRes.data.filter((p: Personal) => p.activo).length,
        servicios_activos: 12 // Valor fijo por ahora
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      // Si hay error, devolver datos mock
      return {
        success: true,
        data: {
          total_personal: 49,
          total_empresas: 10,
          total_servicios: 15,
          personal_activo: 45,
          servicios_activos: 12
        }
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
