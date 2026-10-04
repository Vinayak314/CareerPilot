import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { unprocessable, badRequest } from '../utils/httpError.js';

/**
 * Resume parsing: extract plain text from PDF/DOCX/TXT, then derive a structured
 * view (contact, sections, skills, experience bullets). This runs locally so
 * uploads work without an AI key; the analyzer agent consumes the result.
 */

const MIN_TEXT_CHARS = 80;
const MAX_TEXT_CHARS = 60_000; // ~ a very long CV; keeps prompts and documents bounded

export const detectFileType = (fileName) => {
  const ext = path.extname(fileName || '').toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (ext === '.txt') return 'txt';
  return null;
};

/** Check the file's magic bytes so a renamed binary can't masquerade as a resume. */
const assertSignature = (buffer, fileType) => {
  if (fileType === 'pdf' && buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw badRequest('This file does not look like a valid PDF.');
  }
  if (fileType === 'docx' && !(buffer[0] === 0x50 && buffer[1] === 0x4b)) {
    throw badRequest('This file does not look like a valid DOCX document.');
  }
  if (fileType === 'txt' && buffer.subarray(0, 4096).includes(0)) {
    throw badRequest('This text file contains binary data.');
  }
};

const extractPdf = async (buffer) => {
  // pdf.js may transfer/detach the buffer it is given, so pass a copy.
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: result.text || '', pageCount: result.total ?? null };
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw unprocessable('This PDF is password-protected. Please upload an unlocked copy.');
    }
    throw unprocessable('We could not read this PDF. Try re-exporting it or upload a DOCX/TXT version.');
  } finally {
    await parser.destroy().catch(() => {});
  }
};

const extractDocx = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value || '', pageCount: null };
  } catch {
    throw unprocessable('We could not read this DOCX file. Try re-saving it or upload a PDF version.');
  }
};

const extractTxt = (buffer) => ({
  text: buffer.toString('utf8').replace(/^\uFEFF/, ''),
  pageCount: null,
});

/** Normalise whitespace and the many bullet glyphs PDFs/Word emit into "• ". */
export const normalizeText = (text) =>
  text
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/^[ \t]*(?:[•●▪■◦○►▶➢➤✓✔⁃∙·]|[\uF0A7\uF0B7\uF076\uF0D8\uF0FC]|-(?=\s)|\*(?=\s)|o(?=\s{1,3}[A-Z]))[ \t]*/gm, '• ')
    .replace(/-- \d+ of \d+ --/g, '') // pdf-parse page separators
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Extract and normalise text from an uploaded resume buffer.
 * @returns {{ text: string, pageCount: number|null, fileType: string }}
 */
export const extractResumeText = async (buffer, fileName) => {
  const fileType = detectFileType(fileName);
  if (!fileType) throw badRequest('Please upload a PDF, DOCX or TXT file.');
  if (!buffer?.length) throw badRequest('The uploaded file is empty.');
  assertSignature(buffer, fileType);

  const raw =
    fileType === 'pdf' ? await extractPdf(buffer) : fileType === 'docx' ? await extractDocx(buffer) : extractTxt(buffer);

  const text = normalizeText(raw.text).slice(0, MAX_TEXT_CHARS);
  if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) {
    throw unprocessable(
      'We could not find enough text in this resume. If it is a scanned image, upload a text-based PDF or DOCX instead.'
    );
  }
  return { text, pageCount: raw.pageCount, fileType };
};

// ---------------------------------------------------------------------------
// Structuring
// ---------------------------------------------------------------------------

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'profile', 'professional profile', 'objective', 'career objective', 'about me', 'about'],
  experience: [
    'experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history',
    'internships', 'internship', 'internship experience', 'relevant experience', 'career history',
  ],
  education: ['education', 'academic background', 'academics', 'academic qualifications', 'qualifications', 'education and training'],
  skills: [
    'skills', 'technical skills', 'core skills', 'key skills', 'core competencies', 'competencies', 'technologies',
    'tools', 'tech stack', 'skills and tools', 'tools and technologies', 'technical proficiencies', 'skills & tools',
    'skills & interests',
  ],
  projects: ['projects', 'personal projects', 'academic projects', 'key projects', 'selected projects', 'side projects'],
  certifications: ['certifications', 'certificates', 'licenses', 'licenses and certifications', 'courses', 'certifications & courses'],
  awards: ['awards', 'achievements', 'honors', 'honours', 'awards and achievements', 'accomplishments'],
  publications: ['publications', 'research'],
  volunteer: ['volunteer', 'volunteering', 'volunteer experience', 'leadership', 'leadership experience', 'extracurricular activities', 'activities'],
  languages: ['languages'],
  interests: ['interests', 'hobbies'],
};

const HEADING_LOOKUP = new Map(
  Object.entries(SECTION_ALIASES).flatMap(([section, aliases]) => aliases.map((a) => [a, section]))
);

const headingFor = (line) => {
  const cleaned = line.replace(/[:|•\-–—_]+$/g, '').replace(/^[•\-–—_]+/, '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned || cleaned.length > 40) return null;
  return HEADING_LOOKUP.get(cleaned) || HEADING_LOOKUP.get(cleaned.replace(/&/g, 'and')) || null;
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;
const LINK_RE = /\b(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|[a-z0-9-]+\.(?:dev|io|me|com|in))\/?[^\s,|)]*/gi;

const looksLikeName = (line) =>
  /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3}$/.test(line) && line.length <= 40 && !headingFor(line);

const isBulletLine = (line) => line.startsWith('• ');
const stripBullet = (line) => line.replace(/^•\s*/, '').trim();

/** Merge wrapped lines back into whole bullets (PDF extraction breaks long bullets across lines). */
const collectBullets = (lines) => {
  const bullets = [];
  for (const line of lines) {
    if (isBulletLine(line)) {
      bullets.push(stripBullet(line));
    } else if (bullets.length && /^[a-z(&,]/.test(line)) {
      bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${line}`;
    }
  }
  return bullets.filter((b) => b.split(/\s+/).length >= 3);
};

const splitList = (lines) =>
  lines
    .flatMap((line) => stripBullet(line).replace(/^[A-Za-z /&]{2,30}:\s*/, '').split(/\s*(?:,|\||;|•|·|\t)\s*/))
    .map((s) => s.replace(/[.]+$/, '').trim())
    .filter((s) => s.length >= 1 && s.length <= 40);

const DATE_HINT_RE = /\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{2,4}/i;

/**
 * DOCX text from mammoth (and some PDFs) loses bullet glyphs. A line that reads like
 * a sentence — several words, no date range, not a short title — is treated as a bullet.
 */
const isSentenceLike = (line) =>
  line.split(/\s+/).length >= 6 && !DATE_HINT_RE.test(line) && /^[A-Z0-9]/.test(line) && !line.includes(' | ');

/** Group an experience/projects section into entries: heading lines followed by their bullets. */
const groupEntries = (lines) => {
  const entries = [];
  let current = null;
  const flush = () => {
    if (current && (current.heading || current.lines.length)) {
      entries.push({ heading: current.heading.trim().slice(0, 300), bullets: collectBullets(current.lines) });
    }
  };

  for (const rawLine of lines) {
    const hasHeading = Boolean(current?.heading);
    const line = !isBulletLine(rawLine) && hasHeading && isSentenceLike(rawLine) ? `• ${rawLine}` : rawLine;
    const continuation = current?.lines.length && /^[a-z(&,]/.test(line);

    if (isBulletLine(line) || continuation) {
      if (!current) current = { heading: '', lines: [] };
      current.lines.push(line);
    } else if (current && !current.lines.length) {
      // Consecutive heading lines (company, title, dates) form a single heading.
      current.heading = current.heading ? `${current.heading} | ${line}` : line;
    } else {
      flush();
      current = { heading: line, lines: [] };
    }
  }
  flush();
  return entries;
};

/**
 * Derive a structured representation from normalised resume text.
 * Heuristic by design: good enough for keyword evidence and bullet rewriting,
 * and it never throws on unusual layouts (unknown content stays in rawText).
 */
export const structureResume = (text, { pageCount = null } = {}) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = { header: [] };
  let currentSection = 'header';
  const sectionsFound = [];

  for (const line of lines) {
    const heading = headingFor(line);
    if (heading) {
      currentSection = heading;
      if (!sectionsFound.includes(heading)) sectionsFound.push(heading);
      sections[heading] = sections[heading] || [];
      continue;
    }
    sections[currentSection].push(line);
  }

  const headerText = sections.header.slice(0, 8).join(' \n ');
  const email = text.match(EMAIL_RE)?.[0] || '';
  const phoneCandidate = headerText.match(PHONE_RE)?.[0] || text.slice(0, 600).match(PHONE_RE)?.[0] || '';
  const phone = phoneCandidate.replace(/\D/g, '').length >= 10 ? phoneCandidate.trim() : '';
  const links = [...new Set((text.slice(0, 1500).match(LINK_RE) || []).filter((l) => !EMAIL_RE.test(l) && !l.includes('@')))].slice(0, 6);
  const name = sections.header.find(looksLikeName) || '';

  const experience = groupEntries(sections.experience || []);
  const projectEntries = groupEntries(sections.projects || []);
  const allBullets = [
    ...experience.flatMap((e) => e.bullets),
    ...projectEntries.flatMap((p) => p.bullets),
    ...collectBullets(sections.volunteer || []),
  ];
  // Resumes without explicit bullet glyphs: fall back to any bullet-like line anywhere.
  const bullets = allBullets.length ? allBullets : collectBullets(lines);

  return {
    contact: { name, email, phone, links },
    summary: (sections.summary || []).join(' ').slice(0, 2000),
    skills: [...new Set(splitList(sections.skills || []))].slice(0, 80),
    experience,
    education: (sections.education || []).slice(0, 20),
    projects: projectEntries.map((p) => [p.heading, ...p.bullets].filter(Boolean).join(' — ')).slice(0, 20),
    certifications: (sections.certifications || []).map(stripBullet).slice(0, 20),
    bullets: [...new Set(bullets)].slice(0, 80),
    sectionsFound,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    pageCount,
  };
};

/** Full pipeline used by the upload controller. */
export const parseResume = async (buffer, fileName) => {
  const { text, pageCount, fileType } = await extractResumeText(buffer, fileName);
  return { text, fileType, parsed: structureResume(text, { pageCount }) };
};
