/* eslint-disable no-console */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Personal, 
  LoginForm, 
  RegisterForm,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  PersonalDisponible,
  CreatePersonalDisponibleData,
  ExtendedRegisterForm
} from '../types';

import { API_CONFIG, FILE_CONFIG } from '../config/api';

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
    const response: AxiosResponse<ApiResponse<Personal>> = await this.api.get(`/personal-disponible/${id}`);
    return response.data;
  }


  async updatePersonal(id: string, personalData: Partial<Personal>): Promise<ApiResponse<Personal>> {
    // eslint-disable-next-line no-console
    console.log('🌐 Actualizando personal en endpoint principal:', {
      id,
      personalData,
      url: `/personal-disponible/${id}`
    });
    try {
      const response: AxiosResponse<ApiResponse<Personal>> = await this.api.put(`/personal-disponible/${id}`, personalData);
      // eslint-disable-next-line no-console
      console.log('✅ Respuesta exitosa del endpoint principal:', response.data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error en endpoint principal:', error);
      // eslint-disable-next-line no-console
      console.error('❌ Datos enviados:', JSON.stringify({ id, personalData }, null, 2));
      // eslint-disable-next-line no-console
      console.error('❌ Error response:', (error as any).response?.data);
      throw error;
    }
  }

  async createPersonalDisponible(personalData: CreatePersonalDisponibleData): Promise<ApiResponse<PersonalDisponible>> {
    // eslint-disable-next-line no-console
    console.log('🌐 Creando personal disponible con datos:', JSON.stringify(personalData, null, 2));
    try {
      const response: AxiosResponse<ApiResponse<PersonalDisponible>> = await this.api.post('/personal-disponible', personalData);
      // eslint-disable-next-line no-console
      console.log('✅ Personal creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error al crear personal:', error);
      // eslint-disable-next-line no-console
      console.error('❌ Datos enviados:', JSON.stringify(personalData, null, 2));
      throw error;
    }
  }

  async deletePersonal(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/personal-disponible/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA NOMBRES ====================
  
  // Crear nombre en la tabla nombres
  async createNombre(nombreData: any): Promise<ApiResponse<any>> {
    console.log('🌐 Creando nombre en tabla nombres:', nombreData);
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/nombres', nombreData);
      console.log('✅ Nombre creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear nombre:', error);
      throw error;
    }
  }

  // Actualizar nombre en la tabla nombres
  async updateNombre(rut: string, nombreData: any): Promise<ApiResponse<any>> {
    console.log('🌐 Actualizando nombre en tabla nombres para RUT:', rut, nombreData);
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/nombres/${rut}`, nombreData);
      console.log('✅ Nombre actualizado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar nombre:', error);
      throw error;
    }
  }

  // Obtener nombre por RUT
  async getNombreByRut(rut: string): Promise<ApiResponse<any>> {
    console.log('🌐 Obteniendo nombre para RUT:', rut);
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/nombres/${rut}`);
      console.log('✅ Nombre obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener nombre:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PARA PERSONAL DISPONIBLE (CORREGIDOS) ====================
  
  // Obtener personal por RUT (usando el endpoint correcto)
  async getPersonalByRut(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/personal-disponible/${rut}`);
    return response.data;
  }

  // Buscar personal (usando el endpoint correcto con filtros)
  async searchPersonal(searchTerm: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/personal-disponible?search=${encodeURIComponent(searchTerm)}`);
    return response.data;
  }

  // Obtener estadísticas de personal (usando el endpoint correcto)
  async getPersonalStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/personal-disponible/stats/cargos');
    return response.data;
  }

  // Crear personal (usando el endpoint correcto)
  async createPersonal(nombreData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/personal-disponible', nombreData);
    return response.data;
  }

  // Actualizar personal (usando el endpoint correcto)
  async updatePersonalData(rut: string, nombreData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/personal-disponible/${rut}`, nombreData);
    return response.data;
  }

  // Eliminar personal (usando el endpoint correcto)
  async deletePersonalData(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/personal-disponible/${rut}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA ESTADOS ====================
  
  // Obtener todos los estados (con soporte para paginación y búsqueda)
  async getEstados(params?: { limit?: number; offset?: number; search?: string }): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/estados', { params });
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
    // eslint-disable-next-line no-console
    console.log('🌐 Haciendo petición a /cursos/persona/' + rut);
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/cursos/persona/${rut}`);
      // eslint-disable-next-line no-console
      console.log('✅ Respuesta de cursos para RUT', rut, ':', response.data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error en getCursosByRut para RUT', rut, ':', error);
      throw error;
    }
  }

  // Obtener curso específico por ID
  async getCursoById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/cursos/${id}`);
    return response.data;
  }

  // Crear nuevo curso/certificación
  async createCurso(cursoData: any): Promise<ApiResponse<any>> {
    // eslint-disable-next-line no-console
    console.log('🌐 Creando curso con datos:', JSON.stringify(cursoData, null, 2));
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/cursos', cursoData);
      // eslint-disable-next-line no-console
      console.log('✅ Curso creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error al crear curso:', error);
      // eslint-disable-next-line no-console
      console.error('❌ Datos enviados:', JSON.stringify(cursoData, null, 2));
      // eslint-disable-next-line no-console
      console.error('❌ Error response:', (error as any).response?.data);
      throw error;
    }
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

  // Obtener cursos vencidos
  async getCursosVencidos(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/cursos/vencidos');
    return response.data;
  }

  // Obtener alertas de cursos
  async getCursosAlertas(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/cursos/alertas');
    return response.data;
  }

  // Obtener cursos por vencer
  async getCursosPorVencer(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/cursos/vencer');
    return response.data;
  }

  // Obtener estadísticas de vencimiento
  async getCursosEstadisticasVencimiento(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/cursos/estadisticas-vencimiento');
    return response.data;
  }

  async getPersonalDisponibilidad(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/personal-disponible/${id}/disponibilidad`);
    return response.data;
  }

  async updatePersonalDisponibilidad(id: string, disponibilidad: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/personal-disponible/${id}/disponibilidad`, disponibilidad);
    return response.data;
  }


  // Métodos de utilidades
  async healthCheck(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/health');
    return response.data;
  }

  // ==================== MÉTODOS PARA SERVICIOS/CARTERAS ====================

  // Obtener todos los clientes de una cartera específica
  async getClientesByCartera(carteraId: string): Promise<ApiResponse<any[]>> {
    const carteraResponse = await this.getCartera(parseInt(carteraId));
    if (carteraResponse.success && carteraResponse.data?.clientes) {
      return {
        success: true,
        data: carteraResponse.data.clientes
      };
    }
    return {
      success: false,
      data: [],
      message: 'No se pudieron obtener los clientes'
    };
  }

  // ==================== MÉTODOS PARA DOCUMENTOS ====================
  
  // Obtener todos los documentos con filtros
  async getDocumentos(filters?: { 
    rut_persona?: string;
    tipo_documento?: string;
    nombre_documento?: string;
    limit?: number; 
    offset?: number; 
    search?: string 
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.rut_persona) params.append('rut_persona', filters.rut_persona);
    if (filters?.tipo_documento) params.append('tipo_documento', filters.tipo_documento);
    if (filters?.nombre_documento) params.append('nombre_documento', filters.nombre_documento);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/documentos${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  }

  // Subir documento
  async uploadDocumento(documentoData: FormData): Promise<ApiResponse<any>> {
    // Debug: Log del FormData que se está enviando
    const archivo = documentoData.get('archivo');
    console.log('🔍 Enviando FormData al backend:', {
      hasFile: documentoData.has('archivo'),
      personal_id: documentoData.get('personal_id'),
      nombre_documento: documentoData.get('nombre_documento'),
      tipo_documento: documentoData.get('tipo_documento'),
      archivo_name: archivo instanceof File ? archivo.name : 'No file',
      archivo_size: archivo instanceof File ? archivo.size : 'No file',
      archivo_type: archivo instanceof File ? archivo.type : 'No file'
    });
    
    // Log de todos los campos del FormData
    console.log('🔍 Todos los campos del FormData:');
    const entries = Array.from(documentoData.entries());
    entries.forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    try {
      // Crear una instancia de axios específica para uploads sin headers por defecto
      const uploadApi = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: FILE_CONFIG.UPLOAD_TIMEOUT, // Timeout específico para archivos grandes
        withCredentials: false,
      });
      
      const response: AxiosResponse<ApiResponse<any>> = await uploadApi.post('/documentos', documentoData, {
        headers: {
          // No establecer Content-Type para que axios lo establezca automáticamente con boundary
        },
      });
      console.log('✅ Respuesta exitosa del backend:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en uploadDocumento:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  // Obtener documento por ID
  async getDocumentoById(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/documentos/${id}`);
    return response.data;
  }

  // Obtener documentos por persona (RUT)
  async getDocumentosByPersona(rut: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/documentos/persona/${rut}`);
    return response.data;
  }

  // Nota: No hay endpoint específico para documentos de cursos
  // Los documentos se obtienen por persona y se filtran por tipo

  // Descargar documento
  async downloadDocumento(id: number): Promise<Blob> {
    const response = await this.api.get(`/documentos/${id}/descargar`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Eliminar documento
  async deleteDocumento(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/documentos/${id}`);
    return response.data;
  }

  // Obtener tipos de documentos disponibles
  async getTiposDocumentos(): Promise<ApiResponse<any[]>> {
    console.log('🌐 Haciendo petición a /documentos/tipos');
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/documentos/tipos');
      console.log('✅ Respuesta de tipos de documentos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en getTiposDocumentos:', error);
      throw error;
    }
  }

  // Obtener formatos de archivo soportados
  async getFormatosArchivo(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/documentos/formatos');
    return response.data;
  }

  // ==================== MÉTODOS PARA ÁREA DE SERVICIO ====================
  
  // Obtener personal del área de servicio
  async getAreaServicioPersonal(filters?: { 
    cargo?: string;
    zona?: string;
    limit?: number; 
    offset?: number; 
    search?: string 
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.cargo) params.append('cargo', filters.cargo);
    if (filters?.zona) params.append('zona', filters.zona);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/area-servicio${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  }

  // Obtener estadísticas del área de servicio
  async getAreaServicioStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/area-servicio/stats');
    return response.data;
  }

  // Obtener cargos disponibles
  async getCargosDisponibles(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/area-servicio/cargos');
    return response.data;
  }

  // Obtener zonas geográficas
  async getZonasGeograficas(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/area-servicio/zonas');
    return response.data;
  }

  // Obtener personal por cargo
  async getPersonalByCargo(cargo: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/area-servicio/cargo/${cargo}`);
    return response.data;
  }

  // Obtener personal por zona
  async getPersonalByZona(zona: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/area-servicio/zona/${zona}`);
    return response.data;
  }

  // Obtener personal disponible para servicio
  async getPersonalDisponibleServicio(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/area-servicio/disponibles');
    return response.data;
  }

  // ==================== MÉTODOS PARA MIGRACIÓN ====================
  
  // Verificar estado de migración
  async getMigrationStatus(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/migration/status');
    return response.data;
  }

  // Ejecutar migración
  async runMigration(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/migration/run');
    return response.data;
  }

  // ==================== MÉTODOS PARA BACKUP ====================
  
  // Obtener lista de backups
  async getBackups(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/backup');
    return response.data;
  }

  // Crear nuevo backup
  async createBackup(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/backup');
    return response.data;
  }

  // Descargar backup específico
  async downloadBackup(filename: string): Promise<Blob> {
    const response = await this.api.get(`/backup/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Eliminar backup específico
  async deleteBackup(filename: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/backup/${filename}`);
    return response.data;
  }

  // Obtener información del sistema de backups
  async getBackupInfo(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/backup/info');
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

  // ==================== MÉTODOS PARA IMÁGENES DE PERFIL ====================
  
  // Subir imagen de perfil
  async uploadProfileImage(rut: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadApi = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: 30000, // 30 segundos para imágenes
        withCredentials: false,
      });

      const response: AxiosResponse<ApiResponse<any>> = await uploadApi.post(`/personal/${rut}/profile-image`, formData, {
        headers: {
          // No establecer Content-Type para que axios lo establezca automáticamente con boundary
        },
      });
      
      console.log('✅ Imagen de perfil subida exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al subir imagen de perfil:', error);
      throw error;
    }
  }

  // Obtener imagen de perfil
  async getProfileImage(rut: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/personal/${rut}/profile-image`);
      return response.data;
    } catch (error: any) {
      // Si es un error 404, significa que no hay imagen de perfil, no es un error crítico
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'No se encontró imagen de perfil',
          data: null
        };
      }
      // Para otros errores, los mostramos como warnings, no como errores críticos
      console.warn('⚠️ No se pudo obtener imagen de perfil para RUT:', rut);
      return {
        success: false,
        message: 'Error al obtener imagen de perfil',
        data: null
      };
    }
  }

  // Descargar imagen de perfil
  async downloadProfileImage(rut: string): Promise<Blob> {
    try {
      const response = await this.api.get(`/personal/${rut}/profile-image/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al descargar imagen de perfil:', error);
      throw error;
    }
  }

  // Eliminar imagen de perfil
  async deleteProfileImage(rut: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/personal/${rut}/profile-image`);
      console.log('✅ Imagen de perfil eliminada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al eliminar imagen de perfil:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PARA PROGRAMACIÓN/EVENTOS ====================
  
  async getEventos(queryParams?: string): Promise<PaginatedResponse<any[]>> {
    try {
      const response = await this.api.get(`/programacion/eventos${queryParams ? `?${queryParams}` : ''}`);
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener eventos:', error);
      return {
        success: false,
        data: [],
        message: 'Error al obtener eventos',
        pagination: { total: 0, offset: 0, limit: 10 }
      };
    }
  }

  async getEventoById(eventoId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/programacion/eventos/${eventoId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener evento:', error);
      return {
        success: false,
        data: null,
        message: 'Error al obtener evento'
      };
    }
  }

  async createEvento(eventoData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/programacion/eventos', eventoData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Evento creado exitosamente'
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear evento:', error);
      return {
        success: false,
        data: null,
        message: 'Error al crear evento'
      };
    }
  }

  async updateEvento(eventoId: string, eventoData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/programacion/eventos/${eventoId}`, eventoData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Evento actualizado exitosamente'
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al actualizar evento:', error);
      return {
        success: false,
        data: null,
        message: 'Error al actualizar evento'
      };
    }
  }

  async deleteEvento(eventoId: string): Promise<ApiResponse<null>> {
    try {
      await this.api.delete(`/programacion/eventos/${eventoId}`);
      return {
        success: true,
        data: null,
        message: 'Evento eliminado exitosamente'
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al eliminar evento:', error);
      return {
        success: false,
        data: null,
        message: 'Error al eliminar evento'
      };
    }
  }

  async getProgramacionStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/programacion/stats');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener estadísticas de programación:', error);
      return {
        success: false,
        data: null,
        message: 'Error al obtener estadísticas'
      };
    }
  }

  // ==================== MÉTODOS PARA SERVICIOS ====================
  
  // Carteras
  async getCarteras(params?: { limit?: number; offset?: number; search?: string }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/servicios/carteras', { params });
    return response.data;
  }

  async getCartera(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/carteras/${id}`);
    return response.data;
  }

  async createCartera(data: { name: string }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicios/carteras', data);
    return response.data;
  }

  // Clientes
  async getClientes(params?: { limit?: number; offset?: number; search?: string; cartera_id?: number }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/servicios/clientes', { params });
    return response.data;
  }

  async getCliente(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/clientes/${id}`);
    return response.data;
  }

  async createCliente(data: { nombre: string; cartera_id: number; region_id?: number }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicios/clientes', data);
    return response.data;
  }

  // Nodos
  async getNodos(params?: { limit?: number; offset?: number; search?: string; cliente_id?: number; cartera_id?: number }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/servicios/nodos', { params });
    return response.data;
  }

  async getNodo(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/nodos/${id}`);
    return response.data;
  }

  async createNodo(data: { nombre: string; cliente_id: number }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicios/nodos', data);
    return response.data;
  }

  // Estructura y Estadísticas
  async getEstructura(params?: { cartera_id?: number; cliente_id?: number }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/servicios/estructura', { params });
    return response.data;
  }

  async getEstadisticasServicios(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/servicios/estadisticas');
    return response.data;
  }

  // ==================== MÉTODOS PARA ASIGNACIONES ====================
  // Base: http://192.168.10.194:3000/api/asignaciones (compartimos el mismo baseURL configurado)

  // Obtener asignaciones por RUT
  async getAsignacionesByRut(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/asignaciones/persona/${rut}`);
    return response.data;
  }

  // Crear asignación a cartera (idempotente)
  async assignCarteraToPersona(rut: string, carteraId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/asignaciones/persona/${rut}/carteras`, { cartera_id: carteraId });
    return response.data;
  }

  // Eliminar asignación de cartera
  async unassignCarteraFromPersona(rut: string, carteraId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/asignaciones/persona/${rut}/carteras/${carteraId}`);
    return response.data;
  }

  // Crear asignación a cliente (idempotente)
  async assignClienteToPersona(rut: string, clienteId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/asignaciones/persona/${rut}/clientes`, { cliente_id: clienteId });
    return response.data;
  }

  // Eliminar asignación de cliente
  async unassignClienteFromPersona(rut: string, clienteId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/asignaciones/persona/${rut}/clientes/${clienteId}`);
    return response.data;
  }

  // Crear asignación a nodo (idempotente)
  async assignNodoToPersona(rut: string, nodoId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/asignaciones/persona/${rut}/nodos`, { nodo_id: nodoId });
    return response.data;
  }

  // Eliminar asignación de nodo
  async unassignNodoFromPersona(rut: string, nodoId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/asignaciones/persona/${rut}/nodos/${nodoId}`);
    return response.data;
  }

  // Listados inversos
  async getPersonalByCartera(id: number): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/asignaciones/carteras/${id}/personal`);
    return response.data;
  }

  async getPersonalByCliente(id: number): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/asignaciones/clientes/${id}/personal`);
    return response.data;
  }

  async getPersonalByNodo(id: number): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/asignaciones/nodos/${id}/personal`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
