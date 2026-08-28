export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const DOC_MAX_BYTES = 25 * 1024 * 1024; // 25MB

export function validateFile(
  file: { type: string; size: number },
  opts: { allowed: string[]; maxBytes: number }
): { ok: true } | { ok: false; error: "type" | "size" } {
  if (!opts.allowed.includes(file.type)) return { ok: false, error: "type" };
  if (file.size > opts.maxBytes) return { ok: false, error: "size" };
  return { ok: true };
}
