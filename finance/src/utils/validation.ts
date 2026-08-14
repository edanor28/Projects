// Utilities for validation and sanitization

export function sanitizeText(input: string): string {
  // Basic sanitization: remove script tags and control characters
  return input.replace(/<script.*?>.*?<\/script>/gi, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export function validateAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  throw new Error('Invalid amount');
}

export function validateEpochMs(value: unknown): number {
  const num = validateAmount(value);
  if (num <= 0) throw new Error('Invalid date');
  return Math.trunc(num);
}
