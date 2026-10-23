const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d[\d\s\-()]{7,}$/;

export function validateAlias(alias: string): string | null {
  const trimmed = alias.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return "Use 2–20 characters";
  }
  if (EMAIL_PATTERN.test(trimmed)) {
    return "Must not look like an email";
  }
  if (PHONE_PATTERN.test(trimmed.replace(/\s/g, ""))) {
    return "Must not look like a phone number";
  }
  return null;
}
