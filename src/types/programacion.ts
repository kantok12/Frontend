// Tipos compartidos para el sistema de programación semanal

export interface AsignacionSemanal {
  id: string;
  personalId: string;
  personalNombre: string;
  personalRut: string;
  carteraId: number;
  carteraNombre: string;
  clienteId?: number;
  clienteNombre?: string;
  nodoId?: number;
  nodoNombre?: string;
  dia: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
  estado: 'confirmada' | 'pendiente' | 'completada';
}

export interface AsignacionFormData {
  personalId: string;
  carteraId: number;
  clienteId: string | number;
  nodoId: string | number;
  horaInicio: string;
  horaFin: string;
  observaciones: string;
  estado: 'confirmada' | 'pendiente' | 'completada';
}

export interface EstadisticasSemana {
  totalAsignaciones: number;
  personalUnico: number;
  carterasActivas: number;
  asignacionesConfirmadas: number;
  asignacionesPendientes: number;
  asignacionesCompletadas: number;
}

export interface EstadisticasDia {
  totalAsignaciones: number;
  personalUnico: number;
  carterasUnicas: number;
}
