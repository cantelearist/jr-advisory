/* ── Input Sanitization Utilities ──
 *
 * Shared functions for escaping user data before interpolation into HTML,
 * headers, or other contexts where injection is possible.
 * P4: Input Validation & XSS hardening.
 */

/**
 * Escape HTML special characters to prevent XSS.
 * Use when interpolating user data into HTML templates (emails, exports, etc.).
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a string for use in Content-Disposition filename header.
 * Removes characters that could break or inject HTTP headers.
 */
export function sanitizeFilename(name: unknown): string {
  if (!name) return 'download';
  return String(name)
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')  // only safe chars
    .replace(/\s+/g, '_')                   // spaces to underscores
    .replace(/_+/g, '_')                     // collapse multiple underscores
    .replace(/^_|_$/g, '')                   // trim underscores
    .slice(0, 200)                           // max length
    || 'download';
}

/**
 * Allowed file extensions for document upload.
 * Blocks dangerous types that could execute code (html, svg, js, php, etc.).
 */
export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'rtf', 'odt', 'ods',
  // Images
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'heic',
  // Presentations
  'ppt', 'pptx',
  // Archives (safe for storage)
  'zip',
]);

/**
 * Blocked MIME types that should never be accepted.
 */
export const BLOCKED_MIME_PREFIXES = [
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'image/svg+xml',     // SVG can contain script
  'application/xhtml',
  'text/xml',          // can contain script
  'application/xml',
];

/**
 * Validate a file upload. Returns null if valid, error message if invalid.
 */
export function validateUploadFile(
  filename: string,
  mimeType: string,
  size: number,
  maxSizeMb = 50,
): string | null {
  // Check extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return `File type ".${ext}" is not allowed. Accepted: PDF, Word, Excel, images.`;
  }

  // Check MIME type
  for (const blocked of BLOCKED_MIME_PREFIXES) {
    if (mimeType.toLowerCase().startsWith(blocked)) {
      return `File type "${mimeType}" is not allowed for security reasons.`;
    }
  }

  // Check size
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (size > maxBytes) {
    return `File exceeds ${maxSizeMb} MB limit.`;
  }

  // Check for double extensions (e.g., file.pdf.html)
  const parts = filename.split('.');
  if (parts.length > 2) {
    // Check if any non-last part is a dangerous extension
    const dangerousExts = ['html', 'htm', 'svg', 'js', 'php', 'asp', 'jsp', 'exe', 'bat', 'cmd', 'sh'];
    for (let i = 1; i < parts.length - 1; i++) {
      if (dangerousExts.includes(parts[i].toLowerCase())) {
        return `File has a suspicious double extension. Rename and try again.`;
      }
    }
  }

  return null; // valid
}

/**
 * Validate signature data — must be a data:image URL.
 */
export function validateSignatureData(data: string): boolean {
  // Accept data:image/* URLs (from canvas.toDataURL())
  // Also accept "DECLINED" or "DECLINED: reason" strings
  if (data.startsWith('DECLINED')) return true;
  if (!data.startsWith('data:image/')) return false;
  // Must have base64 content
  if (!data.includes(';base64,')) return false;
  // Reasonable size limit (2MB base64 for a signature is very generous)
  if (data.length > 2 * 1024 * 1024) return false;
  return true;
}
