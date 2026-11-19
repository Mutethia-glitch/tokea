/** Kenyan mobile-number normalization. Never log or persist the supplied input. */
export function normalizeKenyanPhone(value: string): string | null {
  const input = value.trim().replace(/[\s()-]/g, "");
  if (/^0[17]\d{8}$/.test(input)) return "+254" + input.slice(1);
  if (/^254[17]\d{8}$/.test(input)) return "+" + input;
  if (/^\+254[17]\d{8}$/.test(input)) return input;
  return null;
}

export function maskedKenyanPhone(phone: string): string {
  return phone.slice(0, 7) + "•••" + phone.slice(-3);
}
