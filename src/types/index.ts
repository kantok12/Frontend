// Interfaces principales del sistema

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'user';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  nombres?: string; // Campo adicional para nombres completos del backend
  rut: string;
  fecha_nacimiento: string;
  cargo: string;
  empresa_id: string;
  servicio_id: string;
  email?: string;
  activo: boolean;
  sexo: 'M' | 'F';
  licencia_conducir: string;
  talla_zapatos: string;
  talla_pantalones: string;
  talla_poleras: string;
  zona_geografica: string;
  estado_id: number;
  estado_nombre?: string;
  comentario_estado: string;
  ubicacion?: Ubicacion;
  contacto?: Contacto;
  contacto_emergencia?: ContactoEmergencia;
  formacion?: Formacion;
  licencias?: Licencia[];
  condicion_salud?: CondicionSalud;
  disponibilidad?: Disponibilidad;
  empresa?: {
    id: string;
    nombre: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  rut_empresa: string;
  direccion: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_horas?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Curso {
  id: number;
  personal_id: string;
  nombre_curso: string;
  fecha_obtencion: string;
  institucion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horas_academicas?: number;
  tipo_curso?: string;
  certificado?: boolean;
  observaciones?: string;
  activo: boolean;
  personal?: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
  };
  created_at: string;
  updated_at: string;
}

// Interfaces auxiliares
export interface Ubicacion {
  direccion: string;
  ciudad: string;
  region: string;
  codigo_postal?: string;
}

export interface Contacto {
  email: string;
  telefono: string;
  celular?: string;
}

export interface ContactoEmergencia {
  nombre: string;
  relacion: string;
  telefono: string;
  email?: string;
}

export interface Formacion {
  nivel_educacion: string;
  titulo?: string;
  institucion?: string;
  año_graduacion?: number;
}

export interface Licencia {
  tipo: string;
  numero: string;
  fecha_vencimiento: string;
  activa: boolean;
}

export interface CondicionSalud {
  alergias?: string[];
  condiciones_medicas?: string[];
  medicamentos?: string[];
}

export interface Disponibilidad {
  dias_semana: string[];
  horario_inicio: string;
  horario_fin: string;
  disponible: boolean;
}

// Interfaces para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
  message?: string;
}

// Interfaces para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
}

// Interface para personal disponible
export interface PersonalDisponible {
  id?: string;
  rut: string;
  sexo: 'M' | 'F';
  fecha_nacimiento: string;
  licencia_conducir: string;
  cargo: string;
  estado_id: number;
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
  zona_geografica?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePersonalDisponibleData {
  rut: string;
  sexo: 'M' | 'F';
  fecha_nacimiento: string;
  licencia_conducir: string;
  cargo: string;
  estado_id: number;
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
  zona_geografica?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
}

// Interface extendida para el registro que incluye datos de personal disponible
export interface ExtendedRegisterForm extends RegisterForm {
  rut: string;
  sexo: 'M' | 'F';
  fecha_nacimiento: string;
  licencia_conducir: string;
  cargo: string;
  estado_id: number;
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
  zona_geografica?: string;
  telefono?: string;
}

export interface PersonalForm {
  nombre: string;
  apellido: string;
  rut: string;
  fecha_nacimiento: string;
  cargo: string;
  empresa_id: string;
  servicio_id: string;
  activo: boolean;
}

// Interfaces para datos de creación y actualización
export interface CreatePersonalData {
  nombre: string;
  apellido: string;
  rut: string;
  fecha_nacimiento: string;
  cargo: string;
  empresa_id: string;
  servicio_id: string;
  activo: boolean;
  sexo: 'M' | 'F';
  licencia_conducir: string;
  talla_zapatos: string;
  talla_pantalones: string;
  talla_poleras: string;
  zona_geografica: string;
}

export interface UpdatePersonalData {
  nombre?: string;
  apellido?: string;
  rut?: string;
  fecha_nacimiento?: string;
  cargo?: string;
  empresa_id?: string;
  servicio_id?: string;
  activo?: boolean;
  sexo?: 'M' | 'F';
  licencia_conducir?: string;
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
  zona_geografica?: string;
  estado_id?: number;
  comentario_estado?: string;
}

export interface CreateServicioData {
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_horas?: number;
  activo: boolean;
}

export interface UpdateServicioData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  duracion_horas?: number;
  activo?: boolean;
}

export interface CreateCursoData {
  rut_persona?: string; // Para crear desde el modal
  personal_id?: string; // Para crear directamente
  nombre_curso: string;
  fecha_obtencion: string;
  institucion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horas_academicas?: number;
  tipo_curso?: string;
  certificado?: boolean;
  observaciones?: string;
  activo?: boolean;
}

export interface UpdateCursoData {
  personal_id?: string;
  nombre_curso?: string;
  fecha_obtencion?: string;
  institucion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horas_academicas?: number;
  tipo_curso?: string;
  certificado?: boolean;
  observaciones?: string;
  activo?: boolean;
}

export interface EmpresaForm {
  nombre: string;
  rut_empresa: string;
  direccion: string;
  email?: string;
  telefono?: string;
}

export interface ServicioForm {
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_horas?: number;
  activo: boolean;
}

// Interfaces para filtros
export interface PersonalFilters {
  search?: string;
  empresa_id?: string;
  servicio_id?: string;
  activo?: boolean;
}

export interface EmpresaFilters {
  search?: string;
}

export interface ServicioFilters {
  search?: string;
  activo?: boolean;
}

// Interfaces para estadísticas
export interface DashboardStats {
  total_personal: number;
  total_empresas: number;
  total_servicios: number;
  personal_activo: number;
  servicios_activos: number;
}

export interface ServicioStats {
  servicio_id: string;
  nombre: string;
  total_personal: number;
  precio_promedio: number;
}

export interface CursoStats {
  total_cursos: number;
  cursos_activos: number;
  promedio_horas: number;
  tipos_curso: { [key: string]: number };
}

// Interfaces para validaciones y errores
export interface ValidationErrors {
  [key: string]: string | undefined;
  general?: string;
  nombre?: string;
  apellido?: string;
  rut?: string;
  fecha_nacimiento?: string;
  cargo?: string;
  sexo?: string;
  licencia_conducir?: string;
  zona_geografica?: string;
  estado_id?: string;
  comentario_estado?: string;
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
}

// Interfaces para Carteras
export interface Cartera {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_creacion: string;
  total_clientes: string;
  clientes?: Cliente[];
  estadisticas?: CarteraEstadisticas;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  cartera_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarteraEstadisticas {
  total_clientes: number;
  clientes_activos: number;
  servicios_activos: number;
  ingresos_totales: number;
  ultima_actualizacion: string;
}

export interface Nodo {
  id: number;
  nombre: string;
  descripcion?: string;
  cliente_id: number;
  ubicacion?: string;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  created_at: string;
  updated_at: string;
}

export interface ClienteEstadisticas {
  total_nodos: number;
  nodos_activos: number;
  nodos_inactivos: number;
  nodos_mantenimiento: number;
  ultima_actualizacion: string;
}

export interface NodoEstadisticas {
  total_nodos: number;
  nodos_activos: number;
  nodos_inactivos: number;
  nodos_mantenimiento: number;
  clientes_con_nodos: number;
  ultima_actualizacion: string;
}

// ==================== INTERFACES PARA DOCUMENTOS ====================
export interface Documento {
  id: number;
  rut_persona: string;
  nombre_documento: string;
  tipo_documento: string;
  nombre_archivo: string;
  nombre_original: string;
  tipo_mime: string;
  tamaño_bytes: number;
  descripcion?: string;
  fecha_subida: string;
  subido_por: string;
  nombre_persona: string;
  cargo: string;
  zona_geografica?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion?: string;
  requerido: boolean;
}

export interface FormatoDocumento {
  extension: string;
  mime_type: string;
  descripcion: string;
  tamaño_maximo: number;
}

export interface DocumentoUpload {
  archivo: File;
  rut_persona: string;
  nombre_documento: string;
  tipo_documento: string;
  descripcion?: string;
}

export interface DocumentosResponse {
  success: boolean;
  data: Documento[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    offset: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface DocumentoResponse {
  success: boolean;
  data: Documento;
  message?: string;
}

export interface TiposDocumentosResponse {
  success: boolean;
  data: string[];
  message?: string;
}

export interface FormatosDocumentosResponse {
  success: boolean;
  data: FormatoDocumento[];
  message?: string;
}

// Funciones de validación
export interface ValidatePersonalDataResult {
  isValid: boolean;
  errors: ValidationErrors;
}
