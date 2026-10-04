import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../utils/httpError.js';

export const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB, matches the client limit

export const RESUME_TYPES = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.txt': ['text/plain'],
};

/**
 * Browsers sometimes send a generic MIME type (e.g. application/octet-stream for
 * .docx on Windows), so the extension is the primary check and the MIME type
 * only needs to be plausible. The parser verifies the real content afterwards.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedMimes = RESUME_TYPES[ext];
  const genericMimes = ['application/octet-stream', 'application/zip', ''];
  if (!allowedMimes || !(allowedMimes.includes(file.mimetype) || genericMimes.includes(file.mimetype || ''))) {
    return cb(badRequest('Please upload a PDF, DOCX or TXT file.'));
  }
  cb(null, true);
};

/** Single `resume` file, kept in memory (we only persist the parsed text + metadata). */
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 10 },
  fileFilter,
}).single('resume');
