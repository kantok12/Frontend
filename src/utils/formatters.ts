// Utility functions for formatting strings and other data

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