export function normalizeRut(rut: string | null | undefined): string {
  if (!rut) return '';
  return String(rut).replace(/\./g, '').trim();
}

export function generateRutVariants(rut: string | null | undefined): string[] {
  const cleaned = normalizeRut(rut);
  if (!cleaned) return [];
  // Return both the original-cleaned and a dotted variant (best-effort)
  // We avoid strict formatting (DV placement) and simply provide the two common forms
  const withoutDots = cleaned;
  const withDots = (() => {
    // Insert dots thousands-separator from right (e.g. 20011078 -> 20.011.078)
    const body = withoutDots.replace(/-/g, '');
    if (body.length <= 2) return withoutDots;
    const dv = withoutDots.split('-')[1] || '';
    const num = withoutDots.split('-')[0] || withoutDots;
    const reversed = num.split('').reverse().join('');
    const grouped = reversed.match(/.{1,3}/g)?.join('.') || reversed;
    const restored = grouped.split('').reverse().join('');
    return dv ? `${restored}-${dv}` : restored;
  })();

  return Array.from(new Set([withoutDots, withDots]));
}
