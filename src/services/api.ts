/* eslint-disable no-console */
// Import axios ESM build to avoid bundlers resolving the `.cjs` file as a static asset.
// Import only the types for TypeScript correctness.
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
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
  ExtendedRegisterForm,
  Cliente,
  Nodo,
  Cartera
} from '../types';

import { API_CONFIG, FILE_CONFIG } from '../config/api';

// Helper: normaliza un tipo de documento para comparaciones tolerantes
function normalizeTipo(input: any): string {
  if (!input && input !== 0) return '';
  let s = String(input).toLowerCase().trim();
  // Normalizar acentos (NFKD) y eliminar marcas diacríticas
  s = s.normalize ? s.normalize('NFKD').replace(/\p{Diacritic}/gu, '') : s;
  // Reemplazar cualquier carácter no alfanumérico por underscore
  s = s.replace(/[^a-z0-9]+/g, '_');
  // Quitar underscores extra al inicio/fin y colapsar múltiples
  s = s.replace(/^_+|_+$/g, '').replace(/_+/g, '_');
  return s;
}

// Note: tests that mock axios can still mock the module name 'axios'.

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Some environments may provide an axios-like object without `create`.
    // Prefer `axios.create(...)` when available, otherwise use the imported axios directly
    // and ensure it has `defaults` and `interceptors` shape expected by the rest of the class.
    const axiosLib = axios;
    // Defensive check: axios should be an object or function with a `create` method.
    if (!axiosLib || (typeof axiosLib !== 'object' && typeof axiosLib !== 'function')) {
      // Common cause: build resolved axios to a static asset (string path) or it's missing.
      // Throw a descriptive error to help debugging instead of attempting to mutate a primitive.
      // eslint-disable-next-line no-console
      console.error('ApiService - invalid axios import:', axiosLib);
      throw new Error([
        'Invalid `axios` import detected. Expected axios module (object/function),',
        `but got a value of type '${typeof axiosLib}'. This often happens when webpack resolves 'axios' to a static asset or when axios is not installed.`,
        'Remedies: (1) ensure `axios` is installed (`npm install axios`),',
        "(2) check your project for files named 'axios.*' that could shadow the package import,", 
        "(3) check webpack aliases or module resolution that may map 'axios' to an asset.",
      ].join(' '));
    }

    if (axiosLib && typeof axiosLib.create === 'function') {
      this.api = axiosLib.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: false,
      });
    } else if (axiosLib) {
      // Use axiosLib directly as a fallback. Attach minimal defaults/interceptors if missing.
      this.api = axiosLib;
      if (typeof this.api !== 'object' && typeof this.api !== 'function') {
        // Shouldn't happen due to the guard above, but keep defensive fallback
        throw new Error('Axios import is present but is not usable as HTTP client. See console for details.');
      }
      if (!this.api.defaults) {
        this.api.defaults = { baseURL: API_CONFIG.BASE_URL, withCredentials: false } as any;
      }
      if (!this.api.interceptors) {
        this.api.interceptors = { request: { use: () => {} }, response: { use: () => {} } } as any;
      }
    } else {
      throw new Error('Axios is not available in this environment');
    }

    // Mostrar baseURL en consola al iniciar el cliente API para diagnóstico
    // (ayuda a verificar que el frontend está llamando al backend correcto)
    try {
      // eslint-disable-next-line no-console
      console.log('ApiService - baseURL:', (this.api.defaults && this.api.defaults.baseURL) || API_CONFIG.BASE_URL, 'withCredentials:', (this.api.defaults && this.api.defaults.withCredentials));
    } catch (e) {
      // ignore logging errors
    }

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
        // Manejar errores 401 (no autorizado)
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        // Filtrar errores 404 de imágenes de perfil para evitar spam en consola
        if (error.response?.status === 404 && 
            error.config?.url?.includes('/personal/') && 
            error.config?.url?.includes('/image')) {
          // No loguear estos errores ya que son esperados cuando no hay imagen
          // Crear un error silencioso que no se muestre en consola
          const silentError = new Error('No image found');
          silentError.name = 'SilentError';
          return Promise.reject(silentError);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async login(credentials: LoginForm): Promise<{ message: string; user: User; token: string }> {
    const response: AxiosResponse<{ message: string; user: User; token: string }> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<{ message: string; user: User; token: string }> {
    const response: AxiosResponse<{ message: string; user: User; token: string }> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<{
    id: number;
    rut: string;
    nombres: string;
    apellidos: string;
    email: string;
    cargo: string;
    cartera_id: number;
    cartera_nombre: string;
    activo: boolean;
    fecha_creacion: string;
    ultimo_acceso: string;
  }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/auth/me');
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

    // userResponse es { message: string; user: User; token: string }
    if (userResponse && userResponse.user && userResponse.token) {
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
              token: userResponse.token,
              user: userResponse.user,
              personal: personalResponse.data
            }
          };
        } else {
          // Si falla crear personal, deberíamos considerar eliminar el usuario creado
          // Por ahora solo devolemos el error
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


  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response: AxiosResponse<ApiResponse<{ token: string }>> = await this.api.post('/auth/refresh');
    return response.data;
  }

  // Métodos de Personal
  async getPersonal(page = 1, limit = 10, search = '', filters = ''): Promise<PaginatedResponse<Personal>> {
    const offset = (page - 1) * limit;
    
    // Si hay búsqueda, obtener TODOS los registros y filtrar en el frontend
    if (search && search.trim()) {
      console.log('🔍 Realizando búsqueda global obteniendo todos los registros:', search.trim());
      try {
        // Obtener TODOS los registros sin paginación para poder filtrar
        const allPersonalResponse = await this.api.get(`/personal-disponible?limit=1000&offset=0`);
        console.log('🔍 Todos los registros obtenidos:', allPersonalResponse.data);
        
        if (allPersonalResponse.data.success && allPersonalResponse.data.data) {
          const allPersonal = allPersonalResponse.data.data;
          const searchTerm = search.trim().toLowerCase();
          
          // Filtrar en el frontend por múltiples campos
          const filteredPersonal = allPersonal.filter((persona: any) => {
            const rut = (persona.rut || '').toLowerCase();
            const nombres = (persona.nombres || '').toLowerCase();
            const cargo = (persona.cargo || '').toLowerCase();
            const zona = (persona.zona_geografica || '').toLowerCase();
            
            return rut.includes(searchTerm) || 
                   nombres.includes(searchTerm) || 
                   cargo.includes(searchTerm) || 
                   zona.includes(searchTerm);
          });
          
          console.log('🔍 Personal filtrado (total):', filteredPersonal.length);
          console.log('🔍 Término de búsqueda:', searchTerm);
          console.log('🔍 Resultados encontrados:', filteredPersonal.map((p: any) => ({ rut: p.rut, nombres: p.nombres })));
          
          // Aplicar paginación manual a los resultados filtrados
          const startIndex = offset;
          const endIndex = startIndex + limit;
          const paginatedData = filteredPersonal.slice(startIndex, endIndex);
          
          console.log('🔍 Datos paginados:', {
            total: filteredPersonal.length,
            startIndex,
            endIndex,
            paginatedCount: paginatedData.length
          });
          
          return {
            success: true,
            data: paginatedData,
            pagination: {
              total: filteredPersonal.length,
              limit: limit,
              offset: offset
            }
          };
        }
      } catch (error) {
        console.warn('⚠️ Error en búsqueda global:', error);
        throw error;
      }
    }
    
    // Búsqueda normal sin filtros o si falló la búsqueda global
    let url = `/personal-disponible?limit=${limit}&offset=${offset}`;
    
    // Agregar filtros si existen
    if (filters && filters !== '{}') {
      url += `&filters=${encodeURIComponent(filters)}`;
    }
    
    console.log('🌐 URL de búsqueda normal:', url);
    try {
      const response: AxiosResponse<PaginatedResponse<Personal>> = await this.api.get(url);
      console.log('📊 Respuesta de búsqueda normal:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Error en búsqueda normal:', error);
      throw error;
    }
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
    console.log('🌐 Haciendo petición a /estados con params:', params);
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/estados', { params });
    console.log('✅ Respuesta de /estados:', response.data);
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
  async downloadDocumento(id: number): Promise<{ blob: Blob; filename: string }> {
    try {
      console.log('🌐 API - Descargando documento ID:', id);
      console.log('🔗 API - URL base:', API_CONFIG.BASE_URL);
      
      // Intentar con el endpoint principal
      let response: any = undefined;
      try {
        console.log('🔍 API - Intentando con /documentos/:id/descargar');
        response = await this.api.get(`/documentos/${id}/descargar`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/octet-stream, application/pdf, */*'
          }
        });
      } catch (firstError: any) {
        console.warn('⚠️ API - Primer intento falló, probando rutas alternativas');
        
        // Intentar rutas alternativas
        const alternativeRoutes = [
          `/documentos/${id}/download`,
          `/documentos/download/${id}`,
          `/api/documentos/${id}/descargar`,
          `/api/documentos/${id}/download`
        ];
        
        let success = false;
        for (const route of alternativeRoutes) {
          try {
            console.log(`🔍 API - Intentando con ${route}`);
            response = await this.api.get(route, {
              responseType: 'blob',
              headers: {
                'Accept': 'application/octet-stream, application/pdf, */*'
              }
            });
            console.log(`✅ API - Éxito con ${route}`);
            success = true;
            break;
          } catch (altError) {
            console.log(`❌ API - Falló con ${route}`);
            continue;
          }
        }
        
        if (!success || !response) {
          throw firstError;
        }
      }
      
      if (!response) {
        throw new Error('No se pudo obtener respuesta del servidor');
      }
      
      // Extraer nombre del archivo de los headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `documento_${id}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // Decodificar si viene en UTF-8
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // Si falla la decodificación, usar el nombre tal cual
          }
        }
      }
      
      console.log('📁 API - Nombre del archivo:', filename);
      console.log('📦 API - Tipo de blob:', response.data.type);
      console.log('📦 API - Tamaño del blob:', response.data.size, 'bytes');
      
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }
      
      return {
        blob: response.data,
        filename: filename
      };
    } catch (error: any) {
      console.error('❌ API - Error en descarga del documento:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      throw error;
    }
  }

  // Eliminar documento
  async deleteDocumento(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/documentos/${id}`);
    return response.data;
  }

  // Eliminar documento y, si aplica, su archivo en Google Drive (intentos con fallbacks)
  async deleteDocumentoAndDrive(id: number, driveFileId?: string): Promise<ApiResponse<any>> {
    // Intento principal: pedir al backend que elimine registro y archivo en Drive en una sola llamada
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/documentos/${id}?delete_drive=1`);
      return response.data;
    } catch (primaryError: any) {
      console.warn('⚠️ Intento inicial de deleteDocumentoAndDrive falló, haciendo fallback:', primaryError?.message || primaryError);

      // Fallback 1: intentar eliminar solo el registro
      try {
        const respRegistro: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/documentos/${id}`);
        console.log('✅ Registro eliminado en backend:', respRegistro.data);
      } catch (deleteRegistroError: any) {
        console.error('❌ Error al eliminar registro de documento:', deleteRegistroError);
        // Si falla eliminar el registro, devolver el error original
        throw primaryError;
      }

      // Si no hay driveFileId, devolvemos éxito por haber eliminado el registro
      if (!driveFileId) {
        return {
          success: true,
          data: null,
          message: 'Registro eliminado. No se proporcionó drive_file_id para eliminar en Drive.'
        } as ApiResponse<any>;
      }

      // Fallback 2: intentar eliminar archivo en Drive vía endpoints alternativos del backend
      // Intento: DELETE /documentos/drive/:driveId
      try {
        const respDriveDelete: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/documentos/drive/${encodeURIComponent(driveFileId)}`);
        console.log('✅ Archivo en Drive eliminado vía /documentos/drive/:', respDriveDelete.data);
        return {
          success: true,
          data: null,
          message: 'Registro y archivo en Drive eliminados (vía /documentos/drive/:id)'
        } as ApiResponse<any>;
      } catch (driveDeleteError1: any) {
        console.warn('⚠️ Eliminación en Drive vía /documentos/drive/:id falló:', driveDeleteError1?.message || driveDeleteError1);
      }

      // Intento: POST /documentos/drive-delete { drive_file_id }
      try {
        const respDriveDelete2: AxiosResponse<ApiResponse<any>> = await this.api.post('/documentos/drive-delete', { drive_file_id: driveFileId });
        console.log('✅ Archivo en Drive eliminado vía /documentos/drive-delete:', respDriveDelete2.data);
        return respDriveDelete2.data;
      } catch (driveDeleteError2: any) {
        console.warn('⚠️ Eliminación en Drive vía /documentos/drive-delete falló:', driveDeleteError2?.message || driveDeleteError2);
        // Finalmente retornamos éxito parcial: registro eliminado, pero archivo en Drive no pudo ser eliminado por los endpoints disponibles
        return {
          success: false,
          data: null,
          message: 'Registro eliminado, pero no se pudo eliminar el archivo en Drive. Por favor elimínelo manualmente si es necesario.'
        } as ApiResponse<any>;
      }
    }
  }

  // Actualizar documento
  async updateDocumento(id: number, data: any): Promise<ApiResponse<any>> {
    // Si hay un archivo, usar FormData
    if (data.archivo) {
      const formData = new FormData();
      
      // Agregar campos de texto
      if (data.nombre_documento) formData.append('nombre_documento', data.nombre_documento);
      if (data.tipo_documento) formData.append('tipo_documento', data.tipo_documento);
      if (data.fecha_emision) formData.append('fecha_emision', data.fecha_emision);
      if (data.fecha_vencimiento) formData.append('fecha_vencimiento', data.fecha_vencimiento);
      if (data.dias_validez) formData.append('dias_validez', data.dias_validez.toString());
      if (data.estado_documento) formData.append('estado_documento', data.estado_documento);
      if (data.institucion_emisora) formData.append('institucion_emisora', data.institucion_emisora);
      
      // Agregar archivo
      formData.append('archivo', data.archivo);
      
      const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/documentos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Si no hay archivo, enviar como JSON
      const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/documentos/${id}`, data);
      return response.data;
    }
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
      const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PARA IMÁGENES DE PERFIL ====================
  
  // Subir imagen de perfil
  async uploadProfileImage(rut: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the main axios instance (this.api) so interceptors (Authorization) are applied.
      // Provide a longer timeout for uploads via request config.
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/personal/${rut}/upload`, formData, {
        headers: {
          // Let axios set the multipart boundary automatically, do not set full Content-Type string
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds for profile image uploads
      });

      console.log('✅ Imagen de perfil subida exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al subir imagen de perfil:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS ALTERNATIVOS PARA PROFILE-PHOTOS (backend variant) ====================

  // POST /api/profile-photos/:rut/upload
  async uploadProfilePhoto(rut: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/profile-photos/${rut}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });
      console.log('✅ uploadProfilePhoto response:', response.data);
      return response.data;
    } catch (error: any) {
      console.warn('⚠️ uploadProfilePhoto failed, will surface error to caller:', error?.message || error);
      throw error;
    }
  }

  // GET /api/profile-photos/:rut/image
  async getProfilePhoto(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/profile-photos/${rut}/image`);
    return response.data;
  }

  // GET /api/profile-photos/:rut/image/download
  async downloadProfilePhoto(rut: string): Promise<{ blob: Blob; filename: string }> {
    const response: any = await this.api.get(`/profile-photos/${rut}/image/download`, { responseType: 'blob' });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `profile_${rut}.png`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) filename = match[1].replace(/['"]/g, '');
    }
    return { blob: response.data, filename };
  }

  // DELETE /api/profile-photos/:rut/image
  async deleteProfilePhoto(rut: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/profile-photos/${rut}/image`);
    return response.data;
  }

  // GET /api/users/me/photo (convenience endpoint for authenticated user)
  async getUsersMePhoto(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/users/me/photo');
    return response.data;
  }

  // Obtener imagen de perfil
  async getProfileImage(rut: string): Promise<ApiResponse<any>> {
    try {
      const url = `/personal/${rut}/image/download`;
      console.log('🖼️ API - getProfileImage URL:', url, 'Base URL:', this.api.defaults.baseURL);
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get(url);
      console.log('🖼️ API - getProfileImage response:', response.data);
      return response.data;
    } catch (error: any) {
      // Si es un error 404, significa que no hay imagen de perfil, esto es normal
      if (error.response?.status === 404) {
        // No loguear este error ya que es esperado cuando no hay imagen
        return {
          success: false,
          message: 'No se encontró imagen de perfil',
          data: null
        };
      }
      // Para otros errores, los mostramos como warnings, no como errores críticos
      console.warn('⚠️ No se pudo obtener imagen de perfil para RUT:', rut, error.message);
      return {
        success: false,
        message: 'Error al obtener imagen de perfil',
        data: null
      };
    }
  }

  // Verificar si existe imagen de perfil sin generar errores 404 en consola
  async checkProfileImageExists(rut: string): Promise<boolean> {
    try {
      const response = await this.api.head(`/personal/${rut}/image`);
      return response.status === 200;
    } catch (error: any) {
      // Si es 404, no existe la imagen
      if (error.response?.status === 404) {
        return false;
      }
      // Para otros errores, asumir que no existe
      return false;
    }
  }

  // Descargar imagen de perfil
  async downloadProfileImage(rut: string): Promise<Blob> {
    try {
      const response = await this.api.get(`/personal/${rut}/image`, {
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
      const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/personal/${rut}/image`);
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
  async assignClienteToPersona(rut: string, clienteId: number, options?: { enforce?: boolean }): Promise<ApiResponse<any>> {
    const payload: any = { cliente_id: clienteId };
    if (options && typeof options.enforce !== 'undefined') payload.enforce = options.enforce;
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/asignaciones/persona/${rut}/clientes`, payload);
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      // Si el backend devuelve 409 con un payload explicativo, devolverlo para manejo uniforme en frontend
      if (status === 409 && err.response?.data) {
        return err.response.data as ApiResponse<any>;
      }
      throw err;
    }
  }

  // Wrapper que normaliza la respuesta de assignClienteToPersona para uso en UI
  // Devuelve un objeto uniforme: { ok: boolean, code?: string, message?: string, payload?: any }
  async assignClienteToPersonaSafe(rut: string, clienteId: number, options?: { enforce?: boolean }): Promise<{ ok: boolean; code?: string; message?: string; payload?: any }> {
    try {
      const resp: any = await this.assignClienteToPersona(rut, clienteId, options);

      // resp puede venir ya como ApiResponse o como body con payload
      const code = resp?.code || resp?.data?.code;
      const message = resp?.message || resp?.data?.message || (resp?.data && typeof resp.data === 'string' ? resp.data : undefined);
      const payload = resp?.payload || resp?.data?.payload || resp?.data || resp;

      // Si el backend devolvió un código de error o success === false, marcar ok=false
      const ok = !(resp && ((resp.success === false) || (resp?.code && String(resp.code).toLowerCase().includes('prereq'))));

      return { ok, code, message, payload };
    } catch (err: any) {
      // Si assignClienteToPersona lanza (no 409), propagar como error para manejo superior
      throw err;
    }
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
 
  // ==================== MÉTODOS PARA PRERREQUISITOS DE CLIENTE ====================
  // GET /prerequisitos/clientes/:clienteId
  async getClientePrerequisitos(clienteId: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/prerequisitos/clientes/${clienteId}`);
    return response.data;
  }

  // POST /prerequisitos/clientes/:clienteId { requisitos: [...] }
  async upsertClientePrerequisitos(clienteId: number, requisitos: Array<{ tipo_documento: string; obligatorio: boolean; dias_validez?: number }>): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/prerequisitos/clientes/${clienteId}`, { requisitos });
    return response.data;
  }

  // GET /prerequisitos/clientes/:clienteId/match?rut=:rut
  async matchPrerequisitosCliente(clienteId: number, rut: string): Promise<ApiResponse<any>> {
    const verbose = String(process.env.REACT_APP_PREREQ_VERBOSE_LOG || '').toLowerCase() === 'true';
    const tag = '[prereq-match]';
    try {
      if (verbose) console.debug(`${tag} Attempting server match for clienteId=${clienteId} rut=${rut}`);
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/prerequisitos/clientes/${clienteId}/match`, { params: { rut } });
      if (verbose) console.debug(`${tag} Server match succeeded for clienteId=${clienteId} rut=${rut}`);
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (verbose) console.debug(`${tag} Server match failed with status=${status} for clienteId=${clienteId} rut=${rut}`);

      // Si no existe endpoint de match en backend (404), intentar varios fallbacks.
      if (status === 404) {
        // Fallback 1: algunos servidores aceptan el match como query sobre el recurso base
        try {
          if (verbose) console.debug(`${tag} Trying alt1: GET /prerequisitos/clientes/${clienteId}?rut=${rut}&match=1`);
          const alt1: AxiosResponse<ApiResponse<any>> = await this.api.get(`/prerequisitos/clientes/${clienteId}`, { params: { rut, match: 1 } });
          if (verbose) console.debug(`${tag} alt1 succeeded for clienteId=${clienteId} rut=${rut}`);
          return alt1.data;
        } catch (err2: any) {
          if (verbose) console.debug(`${tag} alt1 failed: ${err2?.response?.status || err2?.message || err2}`);
          // Fallback 2: ruta alternativa sin el prefijo /prerequisitos
          try {
            if (verbose) console.debug(`${tag} Trying alt2: GET /clientes/${clienteId}/match?rut=${rut}`);
            const alt2: AxiosResponse<ApiResponse<any>> = await this.api.get(`/clientes/${clienteId}/match`, { params: { rut } });
            if (verbose) console.debug(`${tag} alt2 succeeded for clienteId=${clienteId} rut=${rut}`);
            return alt2.data;
          } catch (err3: any) {
            if (verbose) console.debug(`${tag} alt2 failed: ${err3?.response?.status || err3?.message || err3}`);
            // Fallback 3: si el backend no soporta match endpoints, realizar el cálculo en el cliente
            try {
              if (verbose) console.debug(`${tag} Using local fallback for clienteId=${clienteId} rut=${rut}`);

              // Intentar obtener los prerrequisitos del cliente; si el endpoint no existe devolvemos
              // una respuesta clara en vez de seguir haciendo requests que provoquen 404 repetidos.
              let requisitosResp: any;
              try {
                requisitosResp = await this.getClientePrerequisitos(clienteId);
              } catch (reqErr: any) {
                const reqStatus = reqErr?.response?.status;
                if (reqStatus === 404) {
                  if (verbose) console.debug(`${tag} No prerrequisitos endpoint for clienteId=${clienteId} (404)`);
                  return {
                    success: false,
                    message: 'No se encontraron prerrequisitos definidos para este cliente en el backend',
                    data: { clienteId, rut }
                  } as ApiResponse<any>;
                }
                // Otros errores: rethrow
                throw reqErr;
              }

              const requisitos = ((requisitosResp as any)?.data) || (requisitosResp as any) || [];

              // Obtener documentos de la persona
              const docsResp = await this.getDocumentosByPersona(rut);
              const documentos = ((docsResp as any)?.data) || (docsResp as any) || [];

              // Normalizar tipos requeridos y tipos presentes con función tolerante
              const rawReqs = Array.isArray(requisitos) ? requisitos : ((requisitos as any)?.requisitos || []);
              const tiposRequeridos: string[] = rawReqs.map((r: any) => normalizeTipo(r.tipo_documento || r.tipo || r.nombre_documento || '')).filter(Boolean);
              const rawDocs = Array.isArray(documentos) ? documentos : ((documentos as any)?.data || []);

              // Excluir documentos vencidos al considerar tipos presentes.
              const now = Date.now();
              const validDocs = rawDocs.filter((d: any) => {
                // Preferir campo booleano `vencido` si existe
                if (typeof d.vencido === 'boolean') return d.vencido === false;
                // Si hay fecha de vencimiento, compararla
                if (d.fecha_vencimiento) {
                  const t = Date.parse(d.fecha_vencimiento);
                  if (!isNaN(t)) return t > now;
                }
                // Si no hay información, asumir válido
                return true;
              });

              const tiposPresentes: string[] = validDocs.map((d: any) => normalizeTipo(d.tipo_documento || d.tipo || d.nombre_documento || '')).filter(Boolean);

              const faltantes = tiposRequeridos.filter((t: string) => !tiposPresentes.includes(t));

              const result = {
                success: true,
                data: {
                  rut,
                  clienteId,
                  requisitos,
                  documentos: rawDocs,
                  documentos_validos: validDocs,
                  faltantes,
                  cumple: faltantes.length === 0,
                  required_count: tiposRequeridos.length,
                  provided_count: tiposPresentes.length
                }
              } as ApiResponse<any>;

              if (verbose) console.debug(`${tag} Local fallback result for clienteId=${clienteId} rut=${rut}: cumple=${result.data.cumple} faltantes=${result.data.faltantes.length}`);
              return result;
            } catch (localErr: any) {
              if (verbose) console.error(`${tag} Local fallback error:`, localErr);
              // Si falla el fallback local, propagar el error del intento local
              throw localErr || err;
            }
          }
        }
      }
      // Para otros errores (500, timeout, etc.) dejar que se propaguen
      if (verbose) console.debug(`${tag} Propagating non-404 error for clienteId=${clienteId} rut=${rut}`);
      throw err;
    }
  }

  // POST /prerequisitos/clientes/:clienteId/match  (batch)
  // body: { ruts: string[], requireAll?: boolean, includeGlobal?: boolean }
  // Fallback: if server doesn't support batch, call matchPrerequisitosCliente for each rut
  async matchPrerequisitosClienteBatch(clienteId: number, ruts: string[], options?: { requireAll?: boolean; includeGlobal?: boolean }): Promise<ApiResponse<any[]>> {
    try {
      const payload: any = { ruts };
      if (typeof options?.requireAll !== 'undefined') payload.requireAll = options?.requireAll;
      if (typeof options?.includeGlobal !== 'undefined') payload.includeGlobal = options?.includeGlobal;
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.post(`/prerequisitos/clientes/${clienteId}/match`, payload);
      return response.data;
    } catch (err: any) {
      console.warn('⚠️ matchPrerrequisitosClienteBatch - batch endpoint not available, falling back to per-rut requests', err?.message || err);

      // Antes de lanzar N requests por rut, comprobar si existen prerrequisitos para este cliente.
      try {
        await this.getClientePrerequisitos(clienteId);
      } catch (pErr: any) {
        const status = pErr?.response?.status;
        if (status === 404) {
          // Si no hay endpoint de prerrequisitos, devolver una respuesta informativa para todo el batch
          const data = ruts.map(rut => ({ rut, success: false, message: 'No se encontraron prerrequisitos definidos para este cliente en el backend' }));
          return { success: false, data } as unknown as ApiResponse<any[]>;
        }
        // Si otro error ocurrió al obtener prerrequisitos, seguir con el fallback por rut
      }

      // Fallback: call single-match endpoint per rut sequentially (or in parallel)
      const promises = ruts.map(rut => this.matchPrerequisitosCliente(clienteId, rut).then(res => ({ rut, data: res })).catch(e => ({ rut, error: e })));
      const settled = await Promise.all(promises);
      // Normalize fallback response to ApiResponse-like array
      const data = settled.map((s: any) => {
        if (s.error) return { rut: s.rut, success: false, error: s.error };
        return { rut: s.rut, success: s.data?.success ?? true, data: s.data?.data ?? s.data };
      });
      return { success: true, data } as unknown as ApiResponse<any[]>;
    }
  }

  // ==================== MÉTODOS PARA PROGRAMACIÓN SEMANAL ====================
  // GET /programacion?cartera_id=:id&semana=:fecha
  async getProgramacionPorCartera(carteraId: number, semana?: string, fecha?: string): Promise<ApiResponse<any>> {
    const params: any = { cartera_id: carteraId };
    if (semana) params.semana = semana;
    if (fecha) params.fecha = fecha;
    
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/programacion', { params });
    return response.data;
  }

  // GET /programacion/persona/:rut?semanas=:num
  async getProgramacionPersona(rut: string, semanas: number = 4): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/programacion/persona/${rut}?semanas=${semanas}`);
    return response.data;
  }

  // GET /programacion/verificar - Verificar si existe programación
  async verificarProgramacion(rut: string, carteraId: number, semanaInicio: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      rut,
      cartera_id: carteraId.toString(),
      semana_inicio: semanaInicio
    });
    
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/programacion/verificar?${params}`);
    return response.data;
  }

  // POST /programacion
  async crearProgramacion(programacion: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/programacion', programacion);
    return response.data;
  }

  // PUT /programacion/:id
  async actualizarProgramacion(id: number, updates: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/programacion/${id}`, updates);
    return response.data;
  }

  // DELETE /programacion/:id
  async eliminarProgramacion(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/programacion/${id}`);
    return response.data;
  }

  // GET /programacion/semana/:fecha
  async getProgramacionSemana(fecha: string): Promise<ApiResponse<any>> {
    console.log('🔍 Obteniendo programación de toda la semana para fecha:', fecha);
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/programacion/semana/${fecha}`);
    console.log('📊 Respuesta de programación semanal:', response.data);
    return response.data;
  }

  // ==================== MÉTODOS PARA DOCUMENTOS VENCIDOS ====================
  // GET /documentos/vencidos
  async getDocumentosVencidos(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/documentos/vencidos');
    return response.data;
  }

  // GET /documentos/vencer
  async getDocumentosPorVencer(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/documentos/vencer');
    return response.data;
  }

  // PUT /documentos/:id - Actualizar documento con fechas de validez
  async actualizarDocumento(id: number, datos: {
    fecha_emision?: string;
    fecha_vencimiento?: string;
    dias_validez?: number;
    estado_documento?: string;
    institucion_emisora?: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/documentos/${id}`, datos);
    return response.data;
  }

  // ==================== MÉTODOS PARA MÍNIMO PERSONAL ====================
  
  // GET /api/servicios/minimo-personal
  async getMinimoPersonal(params?: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    servicio_id?: number;
    cartera_id?: number;
    cliente_id?: number;
    nodo_id?: number;
  }): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/servicios/minimo-personal', { params });
    return response.data;
  }

  // POST /api/servicios/minimo-personal
  async createMinimoPersonal(data: {
    servicio_id: number;
    cartera_id: number;
    cliente_id?: number;
    nodo_id?: number;
    minimo_personal: number;
    descripcion?: string;
    activo?: boolean;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicios/minimo-personal', data);
    return response.data;
  }

  // GET /api/servicios/minimo-personal/:id
  async getMinimoPersonalById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/minimo-personal/${id}`);
    return response.data;
  }

  // PUT /api/servicios/minimo-personal/:id
  async updateMinimoPersonal(id: number, data: {
    servicio_id?: number;
    cartera_id?: number;
    cliente_id?: number;
    nodo_id?: number;
    minimo_personal?: number;
    descripcion?: string;
    activo?: boolean;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/servicios/minimo-personal/${id}`, data);
    return response.data;
  }

  // DELETE /api/servicios/minimo-personal/:id
  async deleteMinimoPersonal(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/servicios/minimo-personal/${id}`);
    return response.data;
  }

  // GET /api/servicios/minimo-personal/:id/calcular
  async calcularMinimoPersonal(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/minimo-personal/${id}/calcular`);
    return response.data;
  }

  // ==================== MÉTODOS PARA ACUERDOS ====================
  
  // GET /api/servicios/acuerdos
  async getAcuerdos(params?: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    tipo_acuerdo?: string;
    estado?: string;
  }): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/servicios/acuerdos', { params });
    return response.data;
  }

  // POST /api/servicios/acuerdos
  async createAcuerdo(data: {
    nombre: string;
    descripcion?: string;
    tipo_acuerdo: 'servicio' | 'personal' | 'cliente' | 'general';
    fecha_inicio: string;
    fecha_fin: string;
    condiciones?: string;
    observaciones?: string;
    estado?: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicios/acuerdos', data);
    return response.data;
  }

  // GET /api/servicios/acuerdos/:id
  async getAcuerdoById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicios/acuerdos/${id}`);
    return response.data;
  }

  // PUT /api/servicios/acuerdos/:id
  async updateAcuerdo(id: number, data: {
    nombre?: string;
    descripcion?: string;
    tipo_acuerdo?: 'servicio' | 'personal' | 'cliente' | 'general';
    fecha_inicio?: string;
    fecha_fin?: string;
    condiciones?: string;
    observaciones?: string;
    estado?: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/servicios/acuerdos/${id}`, data);
    return response.data;
  }

  // DELETE /api/servicios/acuerdos/:id
  async deleteAcuerdo(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/servicios/acuerdos/${id}`);
    return response.data;
  }

  // GET /api/servicios/acuerdos/vencer
  async getAcuerdosVencer(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/servicios/acuerdos/vencer');
    return response.data;
  }

  // POST /api/servicios/acuerdos/:id/activar
  async activarAcuerdo(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/servicios/acuerdos/${id}/activar`);
    return response.data;
  }

  // POST /api/servicios/acuerdos/:id/desactivar
  async desactivarAcuerdo(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/servicios/acuerdos/${id}/desactivar`);
    return response.data;
  }

  // ==================== MÉTODOS PARA PROGRAMACIÓN OPTIMIZADA ====================
  
  // GET /api/programacion-optimizada
  async getProgramacionOptimizada(params: {
    cartera_id: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    semana?: string;
    fecha?: string;
  }): Promise<ApiResponse<any>> {
    console.log('🔄 Consultando programación optimizada:', {
      endpoint: '/programacion-optimizada',
      params,
      baseURL: this.api.defaults.baseURL
    });
    
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/programacion-optimizada', { params });
      console.log('✅ Respuesta de programación optimizada:', response.data);
      
      // Si no hay datos de programación, inicializar estructura
      if (!response.data?.data?.programacion) {
        console.log('⚠️ No hay datos de programación, inicializando estructura');
        return {
          success: true,
          data: {
            cartera: {
              id: params.cartera_id,
              nombre: ''
            },
            programacion: [],
            filters: params,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error consultando programación optimizada:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  // POST /api/programacion-optimizada
  async crearProgramacionOptimizada(payload: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/programacion-optimizada', payload);
    return response.data;
  }

  // DELETE /api/programacion-optimizada/:id
  async deleteProgramacionOptimizada(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/programacion-optimizada/${id}`);
    return response.data;
  }

  // GET /api/programacion-optimizada/calendario
  async getCalendarioOptimizado(params: {
    cartera_id: number;
    mes?: number;
    año?: number;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/programacion-optimizada/calendario', { params });
    return response.data;
  }

  // GET /api/programacion-optimizada/:id
  async getProgramacionOptimizadaById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/programacion-optimizada/${id}`);
    return response.data;
  }

  // PUT /api/programacion-optimizada/:id
  async actualizarProgramacionOptimizada(id: number, data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/programacion-optimizada/${id}`, data);
    return response.data;
  }

  // DELETE /api/programacion-optimizada/:id
  async eliminarProgramacionOptimizada(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/programacion-optimizada/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA PROGRAMACIÓN SEMANAL SIMPLIFICADA ====================
  
  // GET /api/programacion-semanal
  async getProgramacionSemanal(params: {
    cartera_id: number;
    fecha_inicio: string;
    fecha_fin: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/programacion-semanal', { params });
    return response.data;
  }

  // POST /api/programacion-semanal
  async crearProgramacionSemanal(data: {
    rut: string;
    cartera_id: number;
    cliente_id?: number;
    nodo_id?: number;
    fecha_trabajo: string;
    horas_estimadas?: number;
    observaciones?: string;
    estado?: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/programacion-semanal', data);
    return response.data;
  }

  // DELETE /api/programacion-semanal/:id
  async eliminarProgramacionSemanal(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/programacion-semanal/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA PERSONAL POR CLIENTE ====================
  
  // GET /api/personal-por-cliente
  async getPersonalPorCliente(params?: {
    cliente_id?: number;
    cartera_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    activo?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/personal-por-cliente', { params });
    return response.data;
  }

  // GET /api/personal-por-cliente/:cliente_id
  async getPersonalPorClienteId(clienteId: number, params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    activo?: boolean;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/personal-por-cliente/${clienteId}`, { params });
    return response.data;
  }

  // GET /api/personal-por-cliente/resumen
  async getResumenPersonalPorCliente(params?: {
    cartera_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/personal-por-cliente/resumen', { params });
    return response.data;
  }

  // Registrar un documento que existe en almacenamiento externo (p.e. Google Drive)
  // POST /api/documentos/registrar-existente
  async registerExistingDocument(payload: any): Promise<ApiResponse<any>> {
    try {
      // Extraer y mapear los campos del objeto file al formato que espera el backend
      const file = payload.file || {};
      const mappedPayload = {
        rut_persona: payload.rut_persona || payload.rut || payload.rut_person || null,
        nombre_documento: payload.nombre_documento || payload.nombre || null,
        // Si no se especifica, usar 'otro' para cumplir con backend que suele requerir tipo
        tipo_documento: payload.tipo_documento || 'otro',
        // Campos extraídos del objeto file (variantes posibles)
        nombre_archivo: file.nombre_archivo || file.nombre_original || file.name || file.title || file.filename || null,
        nombre_original: file.nombre_original || file.name || file.title || null,
        drive_file_id: file.drive_file_id || file.id || file.fileId || file.driveId || null,
  ruta_local: file.ruta_local || file.ruta || file.path || file.drive_path || file.webViewLink || (file.drive_file_id ? `drive://${file.drive_file_id}` : null),
        tipo_mime: file.tipo_mime || file.mimeType || file.type || null,
        tamano_bytes: file.tamaño_bytes || file.size || file.bytes || null,
        // Metadatos opcionales
        descripcion: payload.descripcion || null,
        fecha_emision: payload.fecha_emision || null,
        fecha_vencimiento: payload.fecha_vencimiento || null,
        dias_validez: payload.dias_validez || null,
        estado_documento: payload.estado_documento || null,
        institucion_emisora: payload.institucion_emisora || null,
      };

      // Normalizar tipo_documento a valores permitidos por el backend
      const normalizeTipo = (t: any) => {
        if (!t) return null;
        const s = String(t).toLowerCase().trim();
        const map: Record<string, string> = {
          'epp': 'certificado_seguridad',
          'eps': 'certificado_seguridad',
          'seguridad': 'certificado_seguridad',
          'curso': 'certificado_curso',
          'certificacion': 'certificado_curso',
          'certificación': 'certificado_curso',
          'diploma': 'diploma',
          'contrato': 'certificado_laboral',
          'laboral': 'certificado_laboral',
          'licencia': 'licencia_conducir',
          'licencia_conducir': 'licencia_conducir',
          'medico': 'certificado_medico',
          'certificado_medico': 'certificado_medico',
          'vencimiento': 'certificado_vencimiento',
          'certificado_vencimiento': 'certificado_vencimiento',
          'otro': 'otro'
        };
        return map[s] || (['certificado_curso','diploma','certificado_laboral','certificado_medico','licencia_conducir','certificado_seguridad','certificado_vencimiento','otro'].includes(s) ? s : null);
      };

      // Validar campos requeridos antes de enviar para evitar 400 genéricos
      const missing: string[] = [];
      if (!mappedPayload.rut_persona) missing.push('rut_persona');
      if (!mappedPayload.nombre_archivo) missing.push('nombre_archivo');
      if (!mappedPayload.ruta_local) missing.push('ruta_local');
      if (!mappedPayload.nombre_documento) {
        // fallback: si no hay nombre_documento, usar nombre_archivo
        mappedPayload.nombre_documento = mappedPayload.nombre_archivo || null;
      }
      // Normalize tipo_documento and ensure it matches backend allowed values
      const normalizedTipo = normalizeTipo(mappedPayload.tipo_documento);
      mappedPayload.tipo_documento = normalizedTipo || 'otro';

      if (missing.length > 0) {
        const err = new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
        // adjuntar info para debugging
        // @ts-ignore
        err.payload = mappedPayload;
        throw err;
      }

      // Log claro en stringified form para poder ver en consola incluso si el object tiene referencias
      try {
        console.log('📤 Payload mapeado para registrar-existente:', JSON.stringify(mappedPayload));
      } catch (e) {
        console.log('📤 Payload mapeado para registrar-existente (raw):', mappedPayload);
      }

      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/documentos/registrar-existente', mappedPayload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al registrar documento existente:', error?.message || error);
      try { console.error('❌ Payload original:', JSON.stringify(payload)); } catch (e) { console.error('❌ Payload original (raw):', payload); }
      try { console.error('❌ Respuesta del servidor:', JSON.stringify(error.response?.data)); } catch (e) { console.error('❌ Respuesta del servidor (raw):', error.response?.data); }
      throw error;
    }
  }

  // ==================== MÉTODOS PARA COMPATIBILIDAD ====================

  // GET /api/programacion-compatibilidad
  async getProgramacionCompatibilidad(params: {
    cartera_id: number;
    semana: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/programacion-compatibilidad', { params });
    return response.data;
  }

  // POST /api/programacion-compatibilidad
  async crearProgramacionCompatibilidad(data: {
    rut: string;
    cartera_id: number;
    cliente_id?: number;
    nodo_id?: number;
    semana_inicio: string;
    lunes?: boolean;
    martes?: boolean;
    miercoles?: boolean;
    jueves?: boolean;
    viernes?: boolean;
    sabado?: boolean;
    domingo?: boolean;
    horas_estimadas?: number;
    observaciones?: string;
    estado?: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/programacion-compatibilidad', data);
    return response.data;
  }

  // ==================== MÉTODOS PARA CARPETAS PERSONAL ====================
  
  // GET /api/carpetas-personal
  async getCarpetasPersonal(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/carpetas-personal');
    return response.data;
  }

  // ==================== MÉTODOS PARA AUDITORÍA ====================

  // GET /api/auditoria/dashboard - Obtener dashboard de actividad
  async getAuditoriaDashboard(params?: {
    limit?: number;
    es_critico?: boolean;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/auditoria/dashboard', { params });
    return response.data;
  }

  // GET /api/auditoria/historial/:tabla/:id - Ver historial de un registro específico
  async getAuditoriaHistorial(tabla: string, id: string | number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/auditoria/historial/${tabla}/${id}`);
    return response.data;
  }

  // GET /api/auditoria/estadisticas - Obtener estadísticas de los últimos 30 días
  async getAuditoriaEstadisticas(params?: {
    periodo?: number;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/auditoria/estadisticas', { params });
    return response.data;
  }

  // GET /api/auditoria/notificaciones - Ver notificaciones no leídas
  async getAuditoriaNotificaciones(params?: {
    leida?: boolean;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/auditoria/notificaciones', { params });
    return response.data;
  }

  // GET /api/carpetas-personal/:id
  async getCarpetaPersonalById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/carpetas-personal/${id}`);
    return response.data;
  }

  // POST /api/carpetas-personal
  async crearCarpetaPersonal(data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/carpetas-personal', data);
    return response.data;
  }

  // PUT /api/carpetas-personal/:id
  async actualizarCarpetaPersonal(id: number, data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/carpetas-personal/${id}`, data);
    return response.data;
  }

  // DELETE /api/carpetas-personal/:id
  async eliminarCarpetaPersonal(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/carpetas-personal/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA AUDITORÍA ====================
  
  // GET /api/auditoria
  async getAuditoria(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/auditoria');
    return response.data;
  }

  // GET /api/auditoria/:id
  async getAuditoriaById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/auditoria/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA SERVICIO ====================
  
  // GET /api/servicio
  async getServicios(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/servicio');
    return response.data;
  }

  // GET /api/servicio/:id
  async getServicioById(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/servicio/${id}`);
    return response.data;
  }

  // POST /api/servicio
  async crearServicio(data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/servicio', data);
    return response.data;
  }

  // PUT /api/servicio/:id
  async actualizarServicio(id: number, data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/servicio/${id}`, data);
    return response.data;
  }

  // DELETE /api/servicio/:id
  async eliminarServicio(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/servicio/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA PRERREQUISITOS ====================
  
  // GET /api/prerequisitos/clientes/:cliente_id
  async getPrerrequisitosByCliente(clienteId: number): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/prerequisitos/clientes/${clienteId}`);
    return response.data;
  }

  // GET /api/prerrequisitos/globales
  async getGlobalPrerrequisitos(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/prerequisitos/globales');
    return response.data;
  }

  // GET /api/prerrequisitos
  async getPrerrequisitos(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/prerequisitos');
    return response.data;
  }

  // POST /api/prerrequisitos
  async crearPrerrequisito(data: any): Promise<ApiResponse<any>> {
    const payload = { ...data };
    // Si cliente_id es null, el backend puede rechazarlo. Lo eliminamos si es el caso.
    if (payload.cliente_id === null) {
      delete payload.cliente_id;
    }
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/prerequisitos', payload);
    return response.data;
  }

  // PUT /api/prerrequisitos/:id
  async actualizarPrerrequisito(id: number, data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put(`/prerequisitos/${id}`, data);
    return response.data;
  }

  // DELETE /api/prerrequisitos/:id
  async eliminarPrerrequisito(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/prerequisitos/${id}`);
    return response.data;
  }

  // ==================== MÉTODOS PARA MIGRACIÓN ====================
  
  // GET /api/migration
  async getMigrationStatus(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/migration');
    return response.data;
  }

  // POST /api/migration
  async runMigration(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/migration');
    return response.data;
  }

  // ==================== MÉTODOS PARA BELRAY ====================
  
  // GET /api/belray
  async getBelray(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/belray');
    return response.data;
  }

  // POST /api/belray
  async crearBelray(data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/belray', data);
    return response.data;
  }

  // ==================== MÉTODOS DE BÚSQUEDA GLOBAL ====================

  // GET /api/search/personal?q=query (búsqueda global de personal)
  async searchPersonalGlobal(query: string): Promise<Personal[]> {
    try {
      const response: AxiosResponse<ApiResponse<Personal[]>> = await this.api.get(`/search/personal?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error buscando personal:', error);
      return [];
    }
  }

  // GET /api/search/clientes?q=query
  async searchClientesGlobal(query: string): Promise<Cliente[]> {
    try {
      const response: AxiosResponse<ApiResponse<Cliente[]>> = await this.api.get(`/search/clientes?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error buscando clientes:', error);
      return [];
    }
  }

  // GET /api/search/nodos?q=query
  async searchNodosGlobal(query: string): Promise<Nodo[]> {
    try {
      const response: AxiosResponse<ApiResponse<Nodo[]>> = await this.api.get(`/search/nodos?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error buscando nodos:', error);
      return [];
    }
  }

  // GET /api/search/carteras?q=query
  async searchCarterasGlobal(query: string): Promise<Cartera[]> {
    try {
      const response: AxiosResponse<ApiResponse<Cartera[]>> = await this.api.get(`/search/carteras?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error buscando carteras:', error);
      return [];
    }
  }

  // GET /api/search/global?q=query (búsqueda unificada)
  async searchGlobal(query: string): Promise<{
    personal: Personal[];
    clientes: Cliente[];
    nodos: Nodo[];
    carteras: Cartera[];
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        personal: Personal[];
        clientes: Cliente[];
        nodos: Nodo[];
        carteras: Cartera[];
      }>> = await this.api.get(`/search/global?q=${encodeURIComponent(query)}`);
      return response.data.data || {
        personal: [],
        clientes: [],
        nodos: [],
        carteras: []
      };
    } catch (error) {
      console.error('Error en búsqueda global:', error);
      return {
        personal: [],
        clientes: [],
        nodos: [],
        carteras: []
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
