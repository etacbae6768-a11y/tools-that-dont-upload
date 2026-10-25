// W-HUBFIX 2026-10-14: PDF file endpoints input guard for the gateway (tools-hub-ratelimit).
// Turns client input faults that the origin (Pages project tools-no-upload, Functions) answers with
// HTTP 500 into clear 4xx problem responses. Reads the upload only in memory, never stores or logs it.
// Basis: ISO 32000-1:2008 7.5.2 (file header "%PDF-"), 7.5.5 / 7.6.1 (trailer /Encrypt entry).
export const PDF_MAX_BYTES = 15 * 1024 * 1024;
const PDF_FILE_FIELD = { '/api/pdf-merge': 'files' };
const PDF_SCAN = 65536;

function pdfProblem(status, title, code, detail) {
  return { type: 'about:blank', title, status, code, detail };
}
function pdfHasHeader(u) {
  const n = Math.min(u.length, 1024);
  for (let i = 0; i + 4 < n; i++) {
    if (u[i] === 0x25 && u[i + 1] === 0x50 && u[i + 2] === 0x44 && u[i + 3] === 0x46 && u[i + 4] === 0x2d) return true;
  }
  return false;
}
function pdfLatin1(u) {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return s;
}
function pdfLooksEncrypted(u) {
  const re = /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/;
  if (re.test(pdfLatin1(u.subarray(0, Math.min(u.length, PDF_SCAN))))) return true;
  return u.length > PDF_SCAN && re.test(pdfLatin1(u.subarray(u.length - PDF_SCAN)));
}

// Returns null when the request may be forwarded, otherwise a problem object (status inside).
export async function checkPdfUpload(path, req) {
  if (req.method !== 'POST') return pdfProblem(405, 'Method Not Allowed', 'method', 'Send the PDF in a POST multipart/form-data body.');
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > PDF_MAX_BYTES + 1048576) return pdfProblem(413, 'Payload Too Large', 'too_large', 'PDF uploads are limited to 15 MB per request.');
  let fd;
  try { fd = await req.formData(); } catch (e) { return pdfProblem(400, 'Bad Request', 'invalid_multipart', 'The multipart/form-data body could not be read.'); }
  if (path === '/api/pdf-rotate') {
    const a = fd.get('angle');
    if (a !== null && !(typeof a === 'string' && /^-?\d+$/.test(a.trim()) && Number(a) % 90 === 0)) return pdfProblem(400, 'Bad Request', 'angle', 'angle must be a multiple of 90 (90, 180 or 270).');
  }
  const field = PDF_FILE_FIELD[path] || 'file';
  const parts = fd.getAll(field);
  if (parts.length === 0) return null; // the origin answers 400 with its own message
  let total = 0;
  for (const f of parts) {
    if (typeof f === 'string') return pdfProblem(400, 'Bad Request', 'file_not_binary', 'Field "' + field + '" must be a file part (binary upload with a filename), not a text value. Base64 text is not accepted on this endpoint.');
    total += f.size;
    if (total > PDF_MAX_BYTES) return pdfProblem(413, 'Payload Too Large', 'too_large', 'PDF uploads are limited to 15 MB per request.');
  }
  for (let i = 0; i < parts.length; i++) {
    const u = new Uint8Array(await parts[i].arrayBuffer());
    const which = parts.length > 1 ? ' (file ' + (i + 1) + ')' : '';
    if (!pdfHasHeader(u)) return pdfProblem(422, 'Unprocessable Entity', 'not_pdf', 'The uploaded file' + which + ' is not a PDF (no %PDF- header).');
    if (pdfLooksEncrypted(u)) return pdfProblem(422, 'Unprocessable Entity', 'encrypted', 'The uploaded PDF' + which + ' is encrypted (password or permission protection). Encrypted PDFs are not supported; remove the protection and try again.');
  }
  return null;
}

// Maps known input-caused origin failures (HTTP 5xx with JSON {error}) to 4xx. Unknown errors -> null.
export async function mapOriginPdfError(resp) {
  let msg = '';
  try { const j = await resp.clone().json(); msg = String((j && j.error) || ''); } catch (e) { return null; }
  if (/is encrypted/i.test(msg)) return pdfProblem(422, 'Unprocessable Entity', 'encrypted', 'The uploaded PDF is encrypted (password or permission protection). Encrypted PDFs are not supported; remove the protection and try again.');
  if (/Failed to parse|No PDF header|Invalid object ref|Expected instance of|MissingPDFHeader|Unexpected end of/i.test(msg)) return pdfProblem(422, 'Unprocessable Entity', 'invalid_pdf', 'The PDF could not be read. It may be damaged or incomplete.');
  if (/FormData|Content-Type header/i.test(msg)) return pdfProblem(400, 'Bad Request', 'invalid_multipart', 'This endpoint requires a multipart/form-data file upload.');
  if (/must be a multiple of 90/i.test(msg)) return pdfProblem(400, 'Bad Request', 'angle', 'angle must be a multiple of 90 (90, 180 or 270).');
  if (/arrayBuffer is not a function/i.test(msg)) return pdfProblem(400, 'Bad Request', 'file_not_binary', 'The file field must be a file part (binary upload with a filename), not a text value.');
  return null;
}
