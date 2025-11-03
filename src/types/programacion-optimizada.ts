// Interfaces para Programación Optimizada

export interface ProgramacionOptimizada {
  id: number;
  personal_id: string;
  nombre_persona: string;
  cartera_id: number;
  cartera_nombre: string;
  cliente_id: number;
  cliente_nombre: string;
  nodo_id?: number;
  nodo_nombre?: string;
  fecha: string;
  turno: 'mañana' | 'tarde' | 'noche';
  estado: 'programado' | 'ejecutado' | 'cancelado';
  horas_asignadas: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramacionOptimizadaData {
  personal_id: string;
  cartera_id: number;
  cliente_id: number;
  nodo_id?: number;
  fecha: string;
  turno: 'mañana' | 'tarde' | 'noche';
  horas_asignadas: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones?: string;
}

export interface UpdateProgramacionOptimizadaData {
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
  fecha?: string;
  turno?: 'mañana' | 'tarde' | 'noche';
  estado?: 'programado' | 'ejecutado' | 'cancelado';
  horas_asignadas?: number;
  hora_inicio?: string;
  hora_fin?: string;
  observaciones?: string;
}

export interface ProgramacionOptimizadaResponse {
  success: boolean;
  data: {
    programacion: ProgramacionOptimizada[];
  };
  message?: string;
}

export interface ProgramacionOptimizadaFilters {
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
  personal_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  turno?: 'mañana' | 'tarde' | 'noche';
  estado?: 'programado' | 'ejecutado' | 'cancelado';
}

export interface ResumenProgramacionOptimizada {
  total_asignaciones: number;
  horas_totales: number;
  por_turno: {
    mañana: number;
    tarde: number;
    noche: number;
  };
  por_estado: {
    programado: number;
    ejecutado: number;
    cancelado: number;
  };
  personal_asignado: number;
}

export interface AsignacionOptimizadaForm {
  personal_id: string;
  cartera_id: number;
  cliente_id: number;
  nodo_id?: number;
  fecha: string;
  turno: 'mañana' | 'tarde' | 'noche';
  horas_asignadas: number;
  hora_inicio: string;
  hora_fin: string;
  observaciones?: string;
}

// Tipos para el calendario optimizado
export interface CalendarioEvento {
  id: number;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    personal_id: string;
    nombre_persona: string;
    cartera_id: number;
    cartera_nombre: string;
    cliente_id: number;
    cliente_nombre: string;
    nodo_id?: number;
    nodo_nombre?: string;
    turno: 'mañana' | 'tarde' | 'noche';
    estado: 'programado' | 'ejecutado' | 'cancelado';
    horas_asignadas: number;
    observaciones?: string;
  };
}