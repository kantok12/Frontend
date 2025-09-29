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
  ExtendedRegisterForm,
  Cartera,
  CarteraEstadisticas,
  Cliente,
  ClienteEstadisticas,
  Nodo,
  NodoEstadisticas,
  Documento,
  FormatoDocumento,
  DocumentoUpload,
  Curso,
  CreateCursoData,
  UpdateCursoData
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
      withCredentials: false, // Configurado para trabajar con el backend local
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
    const response: AxiosResponse<ApiResponse<Personal>> = await this.api.put(`/personal-disponible/${id}`, personalData);
    return response.data;
  }

  async updatePersonalDisponible(id: string, personalData: Partial<PersonalDisponible>): Promise<ApiResponse<PersonalDisponible>> {
    const response: AxiosResponse<ApiResponse<PersonalDisponible>> = await this.api.put(`/personal-disponible/${id}`, personalData);
    return response.data;
  }

  async createPersonalDisponible(personalData: CreatePersonalDisponibleData): Promise<ApiResponse<PersonalDisponible>> {
    const response: AxiosResponse<ApiResponse<PersonalDisponible>> = await this.api.post('/personal-disponible', personalData);
    return response.data;
  }

  async deletePersonal(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/personal-disponible/${id}`);
    return response.data;
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
  
  // Obtener todos los estados
  async getEstados(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/estados');
    return response.data;
  }

  // ==================== MÉTODOS PARA CURSOS/CERTIFICACIONES ====================
  
  // Listar todos los cursos
  async getCursos(): Promise<ApiResponse<Curso[]>> {
    const response: AxiosResponse<ApiResponse<Curso[]>> = await this.api.get('/cursos');
    return response.data;
  }

  // Obtener cursos de una persona específica
  async getCursosByRut(rut: string): Promise<ApiResponse<Curso[]>> {
    const response: AxiosResponse<ApiResponse<Curso[]>> = await this.api.get(`/cursos/persona/${rut}`);
    return response.data;
  }

  // Obtener curso específico por ID
  async getCursoById(id: number): Promise<ApiResponse<Curso>> {
    const response: AxiosResponse<ApiResponse<Curso>> = await this.api.get(`/cursos/${id}`);
    return response.data;
  }

  // Crear nuevo curso
  async createCurso(cursoData: CreateCursoData): Promise<ApiResponse<Curso>> {
    const response: AxiosResponse<ApiResponse<Curso>> = await this.api.post('/cursos', cursoData);
    return response.data;
  }

  // Actualizar curso
  async updateCurso(id: number, cursoData: UpdateCursoData): Promise<ApiResponse<Curso>> {
    const response: AxiosResponse<ApiResponse<Curso>> = await this.api.put(`/cursos/${id}`, cursoData);
    return response.data;
  }

  // Eliminar curso (soft delete)
  async deleteCurso(id: number): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/cursos/${id}`);
    return response.data;
  }

  // Obtener cursos vencidos
  async getCursosVencidos(): Promise<ApiResponse<Curso[]>> {
    const response: AxiosResponse<ApiResponse<Curso[]>> = await this.api.get('/cursos/vencidos');
    return response.data;
  }

  // Obtener alertas de cursos
  async getCursosAlertas(): Promise<ApiResponse<Curso[]>> {
    const response: AxiosResponse<ApiResponse<Curso[]>> = await this.api.get('/cursos/alertas');
    return response.data;
  }

  // Obtener cursos por vencer
  async getCursosPorVencer(): Promise<ApiResponse<Curso[]>> {
    const response: AxiosResponse<ApiResponse<Curso[]>> = await this.api.get('/cursos/vencer');
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

  // ==================== MÉTODOS PARA CARTERAS ====================
  
  // Listar todas las carteras
  async getCarteras(): Promise<ApiResponse<Cartera[]>> {
    const response: AxiosResponse<ApiResponse<Cartera[]>> = await this.api.get('/carteras');
    return response.data;
  }

  // Obtener cartera por ID
  async getCarteraById(id: string): Promise<ApiResponse<Cartera>> {
    const response: AxiosResponse<ApiResponse<Cartera>> = await this.api.get(`/carteras/${id}`);
    return response.data;
  }

  // Crear nueva cartera
  async createCartera(carteraData: { nombre: string; descripcion?: string }): Promise<ApiResponse<Cartera>> {
    const response: AxiosResponse<ApiResponse<Cartera>> = await this.api.post('/carteras', carteraData);
    return response.data;
  }

  // Actualizar cartera
  async updateCartera(id: string, carteraData: { nombre: string; descripcion?: string }): Promise<ApiResponse<Cartera>> {
    const response: AxiosResponse<ApiResponse<Cartera>> = await this.api.put(`/carteras/${id}`, carteraData);
    return response.data;
  }

  // Eliminar cartera
  async deleteCartera(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/carteras/${id}`);
    return response.data;
  }

  // Obtener estadísticas de cartera
  async getCarteraEstadisticas(id: string): Promise<ApiResponse<CarteraEstadisticas>> {
    const response: AxiosResponse<ApiResponse<CarteraEstadisticas>> = await this.api.get(`/carteras/${id}/estadisticas`);
    return response.data;
  }

  // ==================== MÉTODOS PARA CLIENTES ====================
  
  // Listar todos los clientes
  async getClientes(): Promise<ApiResponse<Cliente[]>> {
    const response: AxiosResponse<ApiResponse<Cliente[]>> = await this.api.get('/clientes');
    return response.data;
  }

  // Obtener cliente por ID
  async getClienteById(id: string): Promise<ApiResponse<Cliente>> {
    const response: AxiosResponse<ApiResponse<Cliente>> = await this.api.get(`/clientes/${id}`);
    return response.data;
  }

  // Crear nuevo cliente
  async createCliente(clienteData: { nombre: string; email?: string; telefono?: string; cartera_id: number }): Promise<ApiResponse<Cliente>> {
    const response: AxiosResponse<ApiResponse<Cliente>> = await this.api.post('/clientes', clienteData);
    return response.data;
  }

  // Actualizar cliente
  async updateCliente(id: string, clienteData: { nombre: string; email?: string; telefono?: string; cartera_id: number }): Promise<ApiResponse<Cliente>> {
    const response: AxiosResponse<ApiResponse<Cliente>> = await this.api.put(`/clientes/${id}`, clienteData);
    return response.data;
  }

  // Eliminar cliente
  async deleteCliente(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/clientes/${id}`);
    return response.data;
  }

  // Obtener estadísticas de cliente
  async getClienteEstadisticas(id: string): Promise<ApiResponse<ClienteEstadisticas>> {
    const response: AxiosResponse<ApiResponse<ClienteEstadisticas>> = await this.api.get(`/clientes/${id}/estadisticas`);
    return response.data;
  }

  // ==================== MÉTODOS PARA NODOS ====================
  
  // Listar todos los nodos
  async getNodos(): Promise<ApiResponse<Nodo[]>> {
    const response: AxiosResponse<ApiResponse<Nodo[]>> = await this.api.get('/nodos');
    return response.data;
  }

  // Obtener nodo por ID
  async getNodoById(id: string): Promise<ApiResponse<Nodo>> {
    const response: AxiosResponse<ApiResponse<Nodo>> = await this.api.get(`/nodos/${id}`);
    return response.data;
  }

  // Crear nuevo nodo
  async createNodo(nodoData: { nombre: string; descripcion?: string; cliente_id: number; ubicacion?: string; estado: 'activo' | 'inactivo' | 'mantenimiento' }): Promise<ApiResponse<Nodo>> {
    const response: AxiosResponse<ApiResponse<Nodo>> = await this.api.post('/nodos', nodoData);
    return response.data;
  }

  // Actualizar nodo
  async updateNodo(id: string, nodoData: { nombre: string; descripcion?: string; cliente_id: number; ubicacion?: string; estado: 'activo' | 'inactivo' | 'mantenimiento' }): Promise<ApiResponse<Nodo>> {
    const response: AxiosResponse<ApiResponse<Nodo>> = await this.api.put(`/nodos/${id}`, nodoData);
    return response.data;
  }

  // Eliminar nodo
  async deleteNodo(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/nodos/${id}`);
    return response.data;
  }

  // Obtener nodos por cliente
  async getNodosByCliente(clienteId: string): Promise<ApiResponse<Nodo[]>> {
    const response: AxiosResponse<ApiResponse<Nodo[]>> = await this.api.get(`/nodos/cliente/${clienteId}`);
    return response.data;
  }

  // Obtener estadísticas de nodos
  async getNodosEstadisticas(): Promise<ApiResponse<NodoEstadisticas>> {
    const response: AxiosResponse<ApiResponse<NodoEstadisticas>> = await this.api.get('/nodos/estadisticas');
    return response.data;
  }

  // ==================== MÉTODOS PARA DOCUMENTOS ====================
  
  // Subir archivo
  async uploadDocumento(documentoData: DocumentoUpload): Promise<ApiResponse<Documento>> {
    const formData = new FormData();
    formData.append('archivo', documentoData.archivo);
    formData.append('rut_persona', documentoData.rut_persona);
    formData.append('nombre_documento', documentoData.nombre_documento);
    formData.append('tipo_documento', documentoData.tipo_documento);
    if (documentoData.descripcion) {
      formData.append('descripcion', documentoData.descripcion);
    }

    const response: AxiosResponse<ApiResponse<Documento>> = await this.api.post('/documentos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Listar todos los documentos con paginación
  async getDocumentos(page: number = 1, limit: number = 10): Promise<ApiResponse<Documento[]>> {
    const response: AxiosResponse<ApiResponse<Documento[]>> = await this.api.get(`/documentos?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Obtener tipos de documentos válidos
  async getTiposDocumentos(): Promise<ApiResponse<string[]>> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/documentos/tipos');
    return response.data;
  }

  // Obtener formatos soportados
  async getFormatosDocumentos(): Promise<ApiResponse<FormatoDocumento[]>> {
    const response: AxiosResponse<ApiResponse<FormatoDocumento[]>> = await this.api.get('/documentos/formatos');
    return response.data;
  }

  // Obtener documentos por persona
  async getDocumentosByPersona(rut: string): Promise<ApiResponse<Documento[]>> {
    const response: AxiosResponse<ApiResponse<Documento[]>> = await this.api.get(`/documentos/persona/${rut}`);
    return response.data;
  }

  // Obtener documentos por nombre de curso
  async getDocumentosByCurso(nombreCurso: string): Promise<ApiResponse<Documento[]>> {
    const response: AxiosResponse<ApiResponse<Documento[]>> = await this.api.get(`/documentos/curso/${encodeURIComponent(nombreCurso)}`);
    return response.data;
  }

  // Obtener documento por ID
  async getDocumentoById(id: string): Promise<ApiResponse<Documento>> {
    const response: AxiosResponse<ApiResponse<Documento>> = await this.api.get(`/documentos/${id}`);
    return response.data;
  }

  // Descargar archivo
  async downloadDocumento(id: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/documentos/${id}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Eliminar documento
  async deleteDocumento(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/documentos/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
