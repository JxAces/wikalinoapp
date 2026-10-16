export const CLASS_CODE_MAX_LENGTH = 64;

/** Preserve the teacher's spelling until the backend defines its code format. */
export function normalizeClassCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim();
  return code.length > 0 && code.length <= CLASS_CODE_MAX_LENGTH ? code : undefined;
}
