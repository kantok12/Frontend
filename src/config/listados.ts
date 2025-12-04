// Catálogos maestros para filtros de la aplicación.
// Rellena estas listas con los valores completos que quieras exponer
// en los filtros, incluso si no hay personal usando esas opciones actualmente.

export const CARGOS: string[] = [
  // Ej: 'Chofer', 'Operario', 'Supervisor', 'Administrativo'
];

export const ZONAS: string[] = [
  // Ej: 'Norte', 'Sur', 'Centro', 'Metropolitana'
];

export const EMPRESAS: { id?: string | number; nombre: string }[] = [
  // Ej: { id: 1, nombre: 'Empresa A' }, { id: 2, nombre: 'Empresa B' }
];

export const PROFESIONES: string[] = [
  // Ej: 'Ingeniero', 'Técnico', 'Enfermero', 'Contador'
];

export const LICENCIAS: string[] = [
  // Ej: 'Clase B', 'Clase A', 'Clase C'
];

// Estados posibles del personal — añade o modifica según tu catálogo maestro
export const ESTADOS_PERSONAL: string[] = [
  'Activo',
  'Inactivo',
  'Asignado',
  'Vacaciones',
  'Capacitación',
  'Exámenes',
  'Desvinculado',
  'Licencia médica',
  'Sin estado'
];
