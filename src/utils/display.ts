export function displayValue(value: any, rut?: string, defaultText = 'No asignada') {
  // Lista de RUTs para los cuales no queremos mostrar el texto por defecto
  const suppressRuts = ['10978973-9', '12036820-6'];
  if (rut && suppressRuts.includes(rut)) {
    return value || '';
  }
  if (value === undefined || value === null || value === '') return defaultText;
  return value;
}
