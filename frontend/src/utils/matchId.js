// Shared id comparison — JWT/JSON may store numbers as strings.
export function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}
