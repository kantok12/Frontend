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
  profile_image_url?: string;
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
  fecha_inicio?: string; // Fecha de inicio del curso
  fecha_fin?: string; // Fecha de finalización del curso
  fecha_vencimiento?: string; // Fecha de vencimiento del certificado
  estado?: string; // Estado del curso (default: 'completado')
  institucion?: string; // Institución que otorga el curso
  descripcion?: string; // Descripción del curso
  // Campos legacy (mantener para compatibilidad)
  fecha_obtencion?: string;
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

// Interfaz para documentos según la API real del backend
export interface Documento {
  id: number;
  rut_persona: string;
  nombre_documento: string;
  tipo_documento: string;
  nombre_archivo: string;
  nombre_original: string;
  tipo_mime: string;
  tamaño_bytes: number;
  ruta_archivo: string;
  descripcion?: string;
  fecha_subida: string;
  subido_por: string;
}

// Tipos de documentos disponibles (según backend)
export interface TipoDocumento {
  label: string;
  value: string;
}

// Formatos de archivo soportados
export interface FormatoArchivo {
  extension: string;
  tipo_mime: string;
  descripcion: string;
  activo: boolean;
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

// Interfaces específicas para respuestas según documentación de la API
export interface CursosResponse {
  success: boolean;
  data: {
    persona: {
      rut: string;
      nombre: string;
      cargo: string;
      zona_geografica: string;
    } | null;
    cursos: Curso[];
  };
  message?: string;
}

export interface DocumentosResponse {
  success: boolean;
  data: Documento[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface ProfileImageResponse {
  success: boolean;
  data: {
    profile_image_url: string;
    rut: string;
    filename?: string;
    size?: number;
    mimetype?: string;
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
  profile_image_url?: string;
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
  nombres?: string; // Campo combinado de nombre completo
  nombre?: string; // Campo legacy
  apellido?: string; // Campo legacy
  email?: string; // Campo de contacto
  telefono?: string; // Campo de contacto
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
  edad?: string; // Campo de edad editable
  cargo: string;
  sexo: 'M' | 'F';
  licencia_conducir: string;
  estado_id: number; // Campo requerido por el backend
  email?: string; // Campo de contacto
  telefono?: string; // Campo de contacto
  talla_zapatos: string;
  talla_pantalones: string;
  talla_poleras: string;
  zona_geografica: string;
}

export interface UpdatePersonalData {
  nombres?: string; // Campo principal para nombre completo
  sexo?: 'M' | 'F';
  licencia_conducir?: string;
  cargo?: string;
  estado_id?: number;
  fecha_nacimiento?: string; // Campo requerido por el backend
  edad?: string; // Campo de edad editable
  talla_zapatos?: string;
  talla_pantalones?: string;
  talla_poleras?: string;
  zona_geografica?: string;
  comentario_estado?: string;
  // Campos legacy (mantener para compatibilidad)
  nombre?: string;
  apellido?: string;
  rut?: string;
  empresa_id?: string;
  servicio_id?: string;
  activo?: boolean;
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
  fecha_inicio?: string; // Fecha de inicio del curso
  fecha_fin?: string; // Fecha de finalización del curso
  fecha_vencimiento?: string; // Fecha de vencimiento del certificado
  estado?: string; // Estado del curso (default: 'completado')
  institucion?: string; // Institución que otorga el curso
  descripcion?: string; // Descripción del curso
  // Campos legacy (mantener para compatibilidad)
  fecha_obtencion?: string;
  horas_academicas?: number;
  tipo_curso?: string;
  certificado?: boolean;
  observaciones?: string;
  activo?: boolean;
  // Nuevos campos para soporte de archivos (POST /api/cursos ahora acepta multipart/form-data)
  archivo?: File; // Archivo adjunto del curso (se guarda en cursos_certificaciones/)
  fecha_emision?: string; // Fecha de emisión del documento
  dias_validez?: number; // Días de validez del documento
  institucion_emisora?: string; // Institución emisora del documento
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

// Interfaces para documentos
export interface CreateDocumentoData {
  personal_id: string;
  nombre_documento: string;
  tipo_documento?: string;
  archivo: File;
  descripcion?: string; // Campo opcional según documentación de la API
  fecha_emision?: string;
  fecha_vencimiento?: string;
  dias_validez?: number;
  estado_documento?: string;
  institucion_emisora?: string;
}

export interface UpdateDocumentoData {
  nombre_documento?: string;
  tipo_documento?: string;
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

// Funciones de validación
export interface ValidatePersonalDataResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// ==================== INTERFACES PARA SERVICIOS ====================

export interface Cartera {
  id: number;
  nombre: string;
  fecha_creacion: string;
  total_clientes: number;
  total_nodos: number;
  clientes?: Cliente[];
}

export interface Cliente {
  id: number;
  nombre: string;
  cartera_id: number;
  created_at: string;
  region_id?: number;
  cartera_nombre?: string;
  total_nodos: number;
  minimo_personal?: number;
  nodos?: Nodo[];
}

export interface Nodo {
  id: number;
  nombre: string;
  cliente_id: number;
  created_at: string;
  cliente_nombre?: string;
  cartera_id?: number;
  cartera_nombre?: string;
}

export interface EstructuraCompleta {
  id: number;
  nombre: string;
  created_at: string;
  clientes: Cliente[];
}

export interface EstadisticasServicios {
  totales: {
    carteras: number;
    clientes: number;
    nodos: number;
  };
  por_cartera: {
    id: number;
    cartera_nombre: string;
    total_clientes: number;
    total_nodos: number;
  }[];
}

export interface CreateCarteraData {
  name: string;
}

export interface CreateClienteData {
  nombre: string;
  cartera_id: number;
  region_id?: number;
}

export interface CreateNodoData {
  nombre: string;
  cliente_id: number;
}

export interface ServiciosParams {
  limit?: number;
  offset?: number;
  search?: string;
  cartera_id?: number;
  cliente_id?: number;
}

// ==================== INTERFACES PARA PROGRAMACIÓN SEMANAL ====================

export interface ProgramacionSemanal {
  id: number;
  rut: string;
  nombre_persona: string;
  cargo: string;
  cartera_id: number;
  nombre_cartera: string;
  cliente_id?: number;
  nombre_cliente?: string;
  nodo_id?: number;
  nombre_nodo?: string;
  semana_inicio: string;
  semana_fin: string;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
  horas_estimadas: number;
  observaciones?: string;
  estado: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProgramacionRequest {
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
}

export interface ProgramacionResponse {
  success: boolean;
  data: {
    cartera: {
      id: number;
      nombre: string;
    };
    semana: {
      inicio: string;
      fin: string;
    };
    programacion: ProgramacionSemanal[];
  };
  message?: string;
}

export interface ProgramacionPersonaResponse {
  success: boolean;
  data: {
    persona: {
      rut: string;
      nombre: string;
      cargo: string;
    };
    programacion: ProgramacionSemanal[];
  };
  message?: string;
}

export interface ProgramacionSemanaResponse {
  success: boolean;
  data: {
    semana: {
      inicio: string;
      fin: string;
    };
    programacion: {
      cartera: {
        id: number;
        nombre: string;
      };
      trabajadores: ProgramacionSemanal[];
    }[];
  };
  message?: string;
}

export interface CreateProgramacionData {
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
}

export interface UpdateProgramacionData {
  cliente_id?: number;
  nodo_id?: number;
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
}

export interface ProgramacionFilters {
  cartera_id?: number;
  semana?: string;
  fecha?: string;
  rut?: string;
  semanas?: number;
}

// ==================== INTERFACES PARA DOCUMENTOS VENCIDOS ====================

export interface DocumentoVencido {
  id: number;
  rut_persona: string;
  nombre_documento: string;
  tipo_documento: string;
  nombre_archivo: string;
  nombre_original: string;
  tipo_mime: string;
  tamaño_bytes: number;
  ruta_archivo: string;
  descripcion?: string;
  fecha_subida: string;
  subido_por: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  dias_validez?: number;
  estado_documento?: string;
  institucion_emisora?: string;
  dias_restantes?: number;
  personal?: {
    rut: string;
    nombres: string;
    cargo: string;
  };
}

export interface DocumentosVencidosResponse {
  success: boolean;
  data: DocumentoVencido[];
  message?: string;
}

export interface UpdateDocumentoData {
  fecha_emision?: string;
  fecha_vencimiento?: string;
  dias_validez?: number;
  estado_documento?: string;
  institucion_emisora?: string;
}

// ==================== INTERFACES PARA MÍNIMO PERSONAL ====================

export interface MinimoPersonal {
  id: number;
  servicio_id: number;
  cartera_id: number;
  cliente_id?: number;
  nodo_id?: number;
  minimo_personal: number;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  servicio?: {
    id: number;
    nombre: string;
  };
  cartera?: {
    id: number;
    nombre: string;
  };
  cliente?: {
    id: number;
    nombre: string;
  };
  nodo?: {
    id: number;
    nombre: string;
  };
}

export interface CreateMinimoPersonalData {
  servicio_id: number;
  cartera_id: number;
  cliente_id?: number;
  nodo_id?: number;
  minimo_personal: number;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateMinimoPersonalData {
  servicio_id?: number;
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
  minimo_personal?: number;
  descripcion?: string;
  activo?: boolean;
}

export interface MinimoPersonalCalculo {
  id: number;
  servicio_id: number;
  cartera_id: number;
  cliente_id?: number;
  nodo_id?: number;
  minimo_requerido: number;
  personal_asignado: number;
  personal_disponible: number;
  cumple_minimo: boolean;
  deficit?: number;
  exceso?: number;
  calculado_en: string;
  detalles?: {
    personal_por_cargo: { [cargo: string]: number };
    personal_por_zona: { [zona: string]: number };
  };
}

// ==================== INTERFACES PARA ACUERDOS ====================

export interface Acuerdo {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_acuerdo: 'servicio' | 'personal' | 'cliente' | 'general';
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
  condiciones?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  activado_por?: string;
  activado_en?: string;
  desactivado_por?: string;
  desactivado_en?: string;
}

export interface CreateAcuerdoData {
  nombre: string;
  descripcion?: string;
  tipo_acuerdo: 'servicio' | 'personal' | 'cliente' | 'general';
  fecha_inicio: string;
  fecha_fin: string;
  condiciones?: string;
  observaciones?: string;
  estado?: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
}

export interface UpdateAcuerdoData {
  nombre?: string;
  descripcion?: string;
  tipo_acuerdo?: 'servicio' | 'personal' | 'cliente' | 'general';
  fecha_inicio?: string;
  fecha_fin?: string;
  condiciones?: string;
  observaciones?: string;
  estado?: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
}

export interface AcuerdoVencer {
  id: number;
  nombre: string;
  fecha_fin: string;
  dias_restantes: number;
  estado: 'activo' | 'inactivo' | 'vencido' | 'pendiente';
  tipo_acuerdo: 'servicio' | 'personal' | 'cliente' | 'general';
  alerta: 'critica' | 'advertencia' | 'normal';
}

// Tipos para notificaciones
export interface NotificacionDocumento {
  id: string;
  tipo: 'documento_vencido' | 'documento_por_vencer' | 'documento_faltante' | 'documento_renovado' | 'personal_sin_asignacion' | 'servicios_sin_personal' | 'programacion_pendiente' | 'mantenimiento_proximo' | 'auditoria_critica' | 'auditoria_sistema' | 'auditoria_estadisticas';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  personal_id: string | null;
  personal_nombre: string | null;
  documento_id?: string | null;
  documento_nombre?: string | null;
  fecha_vencimiento?: string | null;
  dias_restantes?: number | null;
  leida: boolean;
  fecha_creacion: string;
  accion_requerida?: string;
}

export interface CreateNotificacionData {
  tipo: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  personal_id: string;
  documento_id?: string;
  fecha_vencimiento?: string;
  accion_requerida?: string;
}

export interface UpdateNotificacionData {
  leida?: boolean;
  accion_requerida?: string;
}