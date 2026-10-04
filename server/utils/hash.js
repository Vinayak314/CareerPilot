import crypto from 'node:crypto';

export const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');

/** Normalise text before hashing so whitespace/case-only edits hit the same cache entry. */
export const normalizeForHash = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

export const textHash = (text) => sha256(normalizeForHash(text));
