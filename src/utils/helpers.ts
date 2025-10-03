import { Personal, Empresa, Servicio } from '../types';

// Formateo de fechas
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formateo de moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

// Formateo de RUT chileno
export const formatRut = (rut: string): string => {
  // Eliminar puntos y guión
  const value = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Obtener dígito verificador
  const dv = value.slice(-1);
  const rutNumber = value.slice(0, -1);
  
  // Agregar puntos
  let formattedRut = '';
  for (let i = rutNumber.length - 1, j = 0; i >= 0; i--, j++) {
    if (j % 3 === 0 && j !== 0) {
      formattedRut = '.' + formattedRut;
    }
    formattedRut = rutNumber[i] + formattedRut;
  }
  
  return `${formattedRut}-${dv}`;
};

// Validación de RUT chileno
export const validateRut = (rut: string): boolean => {
  // Eliminar puntos y guión
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (cleanRut.length < 2) return false;
  
  const rutNumber = parseInt(cleanRut.slice(0, -1));
  const dv = cleanRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = String(rutNumber).split('').reverse().join(''); i; i = i.slice(1)) {
    sum += parseInt(i) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : String(expectedDv);
  
  return dv === calculatedDv;
};

// Generación de iniciales
export const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};

// Generación de nombre completo
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// Capitalización de texto
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Truncamiento de texto
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Generación de ID único
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Filtrado de arrays
export const filterBySearch = <T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(term);
    })
  );
};

// Ordenamiento de arrays
export const sortByField = <T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Paginación
export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number; totalItems: number } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    totalPages: Math.ceil(items.length / pageSize),
    totalItems: items.length,
  };
};

// Validación de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de teléfono chileno
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+56|56)?[2-9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Formateo de teléfono
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('56')) {
    return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
  }
  
  if (cleanPhone.startsWith('9')) {
    return `+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
  }
  
  return cleanPhone;
};

// Cálculo de edad
export const calculateAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Verificación de estado activo
export const isActive = (item: Personal | Empresa | Servicio): boolean => {
  return item.activo === true;
};

// Obtención de estado como texto
export const getStatusText = (active: boolean): string => {
  return active ? 'Activo' : 'Inactivo';
};

// Obtención de clase CSS para estado
export const getStatusClass = (active: boolean): string => {
  return active 
    ? 'bg-success/10 text-success border-success/20' 
    : 'bg-gray-100 text-gray-600 border-gray-200';
};

// Conversión de bytes a formato legible
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Generación de color aleatorio
export const getRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Validación de archivos
export const validateFileSize = (file: File, maxSizeMB: number = 100): { isValid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo permitido: ${maxSizeMB}MB. Tamaño actual: ${formatBytes(file.size)}`
    };
  }
  
  return { isValid: true };
};

export const validateFileType = (file: File, allowedTypes: string[]): { isValid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes.map(type => {
      const extension = type.split('/')[1];
      return extension ? `.${extension}` : type;
    }).join(', ');
    
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedExtensions}`
    };
  }
  
  return { isValid: true };
};

export const validateFile = (file: File, maxSizeMB: number = 100, allowedTypes: string[]): { isValid: boolean; error?: string } => {
  // Validar tamaño
  const sizeValidation = validateFileSize(file, maxSizeMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // Validar tipo
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  return { isValid: true };
};

// Función para mostrar progreso de upload
export const createUploadProgressHandler = (onProgress: (progress: number) => void) => {
  return (progressEvent: any) => {
    if (progressEvent.lengthComputable) {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(progress);
    }
  };
};