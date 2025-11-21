import { normalizeRut, generateRutVariants } from '../utils/rut';

describe('normalizeRut', () => {
  test('removes dots and trims', () => {
    expect(normalizeRut(' 20.011.078-1 ')).toBe('20011078-1');
    expect(normalizeRut('20011078-1')).toBe('20011078-1');
    expect(normalizeRut(null as any)).toBe('');
  });
});

describe('generateRutVariants', () => {
  test('returns both variants (with and without dots)', () => {
    const variants = generateRutVariants('20011078-1');
    expect(variants).toContain('20011078-1');
    expect(variants.some(v => v.includes('.'))).toBe(true);
  });
});
