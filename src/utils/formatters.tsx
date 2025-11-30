// Utility functions for formatting strings and other data

import React from 'react';
import { FileText, Shield, Award, Book, Paperclip, HelpCircle } from 'lucide-react';

/**
 * Standardizes a name by capitalizing the first letter of each word
 * and converting the rest to lowercase.
 *
 * @param name - The name to standardize.
 * @returns The standardized name.
 */
export function standardizeName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a RUT (Chilean ID) to the format xxxxxxxx-x.
 *
 * @param rut - The RUT to format.
 * @returns The formatted RUT.
 */
export function formatRUT(rut: string): string {
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  const body = cleanRut.slice(0, -1);
  const verifier = cleanRut.slice(-1).toUpperCase();
  return `${body}-${verifier}`;
}


export function getAge(fechaNacimiento: string | Date): number {
  if (!fechaNacimiento) return 0;
  try {
    const birthDate = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error parsing date for getAge:", fechaNacimiento);
    return 0;
  }
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return 'N/A';
  try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      // Use Intl.DateTimeFormat for localized formatting (es-CL)
      try {
        return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date as Date);
      } catch (e) {
        // Fallback to toLocaleDateString
        return (date as Date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
      }
  } catch (error) {
      return 'Fecha inválida';
  }
}

export function truncateFilename(filename: string | undefined, maxLength = 50): string {
  if (!filename) return '';
  if (filename.length <= maxLength) {
    return filename;
  }
  return `${filename.substring(0, maxLength - 3)}...`;
}

export function daysUntilNumber(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  try {
      const targetDate = typeof date === 'string' ? new Date(date) : (date as Date);
      const msPerDay = 1000 * 60 * 60 * 24;
      // Calculate full days difference (target - now)
      const diff = Math.ceil(((targetDate as Date).getTime() - new Date().getTime()) / msPerDay);
      return diff;
  } catch (e) {
      return null;
  }
}

export function daysUntilText(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : (date as Date);
    const days = daysUntilNumber(targetDate);
    if (days === null) return null;
    if (days < 0) {
      const ago = Math.abs(days);
      return `Vencido hace ${ago} día${ago !== 1 ? 's' : ''}`;
    }
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} día${days !== 1 ? 's' : ''}`;
  } catch (e) {
      return "Fecha inválida";
  }
}

export function getDocumentIcon(tipoDocumento: string | undefined): React.ReactNode {
    const tipo = tipoDocumento?.toLowerCase() || '';
    if (tipo.includes('licencia')) return <Shield />;
    if (tipo.includes('certific')) return <Award />;
    if (tipo.includes('curso')) return <Book />;
    if (tipo.includes('contrato')) return <FileText />;
    if (tipo.includes('examen')) return <Paperclip />;
    return <HelpCircle />;
}

export function getDocumentColor(tipoDocumento: string | undefined): string {
    const tipo = tipoDocumento?.toLowerCase() || '';
    if (tipo.includes('licencia')) return 'border-blue-500 text-blue-700 bg-blue-100';
    if (tipo.includes('certific')) return 'border-green-500 text-green-700 bg-green-100';
    if (tipo.includes('curso')) return 'border-purple-500 text-purple-700 bg-purple-100';
    if (tipo.includes('contrato')) return 'border-gray-500 text-gray-700 bg-gray-100';
    if (tipo.includes('examen')) return 'border-yellow-500 text-yellow-700 bg-yellow-100';
    return 'border-gray-400 text-gray-600 bg-gray-50';
}