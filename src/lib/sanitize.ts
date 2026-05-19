/**
 * Sanitizes a text string by removing HTML tags, script injection patterns,
 * and enforcing a maximum length.
 */
export function sanitizeText(input: string | null | undefined): string | null {
  if (!input) return null
  return input
    .replace(/<[^>]*>/g, '')                   // remove HTML tags
    .replace(/javascript:/gi, '')              // remove javascript: URIs
    .replace(/on\w+=/gi, '')                   // remove event handler attributes
    .trim()
    .slice(0, 300)                             // enforce max length
}

/**
 * Normalizes a Brazilian phone number by stripping all non-digit characters.
 * Returns null if the result is not 10 or 11 digits.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 11) return null
  return digits
}

/**
 * Normalizes a Brazilian CEP by stripping all non-digit characters.
 * Returns null if the result is not exactly 8 digits.
 */
export function normalizeCep(cep: string | null | undefined): string | null {
  if (!cep) return null
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  return digits
}