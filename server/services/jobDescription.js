import dns from 'node:dns/promises';
import net from 'node:net';
import { badRequest, unprocessable } from '../utils/httpError.js';

/**
 * Job description input handling: fetch a posting URL (with SSRF guards), prefer
 * schema.org JobPosting JSON-LD when the page provides it, otherwise strip the
 * HTML down to readable text. Also extracts a best-effort title/company.
 */

export const MAX_JD_CHARS = 20_000;
const MIN_JD_CHARS = 80;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024;

const isLinkedIn = (url) => url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com');

/** Search-result links identify the selected posting in currentJobId. */
export const normalizeJobUrl = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest('Please provide a valid job posting URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw badRequest('Please provide an HTTP/HTTPS job URL without credentials.');
  }
  if (!isLinkedIn(url)) return url;
  const jobId = url.searchParams.get('currentJobId') || url.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/)?.[1];
  if (!jobId || !/^\d+$/.test(jobId)) {
    throw badRequest('Choose a specific LinkedIn job and copy its link, or paste the job description text.');
  }
  return new URL(`https://www.linkedin.com/jobs/view/${jobId}/`);
};

const linkedInUnavailable = () => unprocessable(
  'We could not read the LinkedIn job description. Open the job on LinkedIn, copy its responsibilities and requirements, and paste them into Job Description below.',
  { jobDescriptionText: 'Paste the full job description here to continue.' }
);

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
};

/** Reject URLs that resolve to loopback/private networks so the server can't be used to probe internal hosts. */
const assertPublicUrl = async (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest('Please provide a valid job posting URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw badRequest('Job URLs must start with http:// or https://');
  if (url.username || url.password) throw badRequest('Job URLs must not contain credentials.');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw badRequest('That job URL is not publicly reachable.');
  }
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw unprocessable('We could not reach that job URL. Paste the job description text instead.');
  if (addresses.some(({ address }) => isPrivateIp(address))) {
    throw badRequest('That job URL is not publicly reachable.');
  }
  return url;
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', bull: '•', hellip: '…' };
const decodeEntities = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

/** Convert an HTML fragment to readable plain text, keeping list items and paragraphs on their own lines. */
export const htmlToText = (html) =>
  decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/(p|div|section|article|h[1-6]|li|ul|ol|tr|table)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t\u00A0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const findJobPosting = (node) => {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  const type = node['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return node;
  return findJobPosting(node['@graph']);
};

const extractJsonLdJob = (html) => {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const json = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const posting = findJobPosting(JSON.parse(json));
      if (posting?.description) {
        const org = posting.hiringOrganization;
        return {
          text: htmlToText(decodeEntities(String(posting.description))),
          jobTitle: String(posting.title || '').trim(),
          company: String((typeof org === 'string' ? org : org?.name) || '').trim(),
        };
      }
    } catch {
      // Ignore malformed JSON-LD and keep looking.
    }
  }
  return null;
};

/** Only accept a posting description on LinkedIn, never the surrounding search/sign-in page. */
export const extractLinkedInJob = (html) => {
  const structured = extractJsonLdJob(html);
  if (structured?.text.length >= MIN_JD_CHARS) return structured;
  const description = html.match(/<div\b[^>]*class\s*=\s*["'][^"']*\bshow-more-less-html__markup\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  const text = description ? htmlToText(description) : '';
  if (text.length < MIN_JD_CHARS) throw linkedInUnavailable();
  const title = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const company = html.match(/<a\b[^>]*class\s*=\s*["'][^"']*\btopcard__org-name-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] || '';
  return { text, jobTitle: htmlToText(title), company: htmlToText(company) };
};

/** Fetch a job posting page and return its description text plus title/company if found. */
export const fetchJobDescription = async (rawUrl) => {
  const url = await assertPublicUrl(normalizeJobUrl(rawUrl).href);
  let response;
  try {
    response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CareerPilotBot/1.0; +https://github.com/Vinayak314/CareerPilot)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    });
  } catch {
    if (isLinkedIn(url)) throw linkedInUnavailable();
    throw unprocessable('We could not load that job URL. Paste the job description text instead.');
  }
  // Re-check the final host after redirects.
  if (response.url && response.url !== url.href) await assertPublicUrl(response.url);
  if (!response.ok) {
    if (isLinkedIn(url)) throw linkedInUnavailable();
    throw unprocessable(`The job site responded with ${response.status}. Paste the job description text instead.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!/text\/html|application\/xhtml|text\/plain/.test(contentType)) {
    throw unprocessable('That URL does not point to a web page. Paste the job description text instead.');
  }
  const body = (await response.text()).slice(0, MAX_HTML_BYTES);

  if (isLinkedIn(url)) return extractLinkedInJob(body);

  if (contentType.includes('text/plain')) return { text: body.trim(), jobTitle: '', company: '' };

  const fromJsonLd = extractJsonLdJob(body);
  if (fromJsonLd && fromJsonLd.text.length >= MIN_JD_CHARS) return fromJsonLd;

  const main = body.match(/<main[\s\S]*?<\/main>/i)?.[0] || body.match(/<body[\s\S]*<\/body>/i)?.[0] || body;
  const text = htmlToText(main);
  const pageTitle = decodeEntities(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
  if (text.length < MIN_JD_CHARS) {
    throw unprocessable(
      'That page did not contain a readable job description (it may require sign-in or JavaScript). Paste the text instead.'
    );
  }
  return { text, jobTitle: pageTitle.split(/\s[|\-–—]\s/)[0]?.trim() || '', company: '' };
};

const TITLE_LABEL_RE = /^(?:job\s*title|title|position|role|designation)\s*[:\-–]\s*(.{3,80})$/im;
const COMPANY_LABEL_RE = /^(?:company|organization|organisation|employer|company name)\s*[:\-–]\s*(.{2,60})$/im;
const ABOUT_RE = /^about\s+(?!the role|the job|the team|you|us|this role|the position)([A-Z][\w&.,' -]{1,50})\s*$/m;
const AT_RE = /\b(?:join|at)\s+([A-Z][\w&.'-]+(?:\s+[A-Z][\w&.'-]+){0,3})(?=[,.!\s])/;
const ROLE_WORDS = /(engineer|developer|scientist|analyst|designer|manager|intern|architect|consultant|specialist|lead|administrator|associate|programmer|researcher|technician|officer|coordinator)/i;

/** Best-effort job title and company from free-text JDs (the AI analyzer refines these when available). */
export const guessJobMeta = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 25);
  let jobTitle = text.match(TITLE_LABEL_RE)?.[1]?.trim() || '';
  if (!jobTitle) {
    jobTitle = lines.find((l) => l.length <= 70 && ROLE_WORDS.test(l) && l.split(/\s+/).length <= 9 && !/[.!?]$/.test(l)) || '';
  }
  let company = text.match(COMPANY_LABEL_RE)?.[1]?.trim() || text.match(ABOUT_RE)?.[1]?.trim() || '';
  if (!company) company = text.slice(0, 1500).match(AT_RE)?.[1]?.trim() || '';
  const clean = (s) => s.replace(/^[•\-\s]+|[\s|,.:;-]+$/g, '').slice(0, 80);
  return { jobTitle: clean(jobTitle), company: clean(company) };
};

/**
 * Resolve the job description from pasted text and/or a URL. Pasted text wins when
 * both are given (it is what the user actually reviewed); the URL is still stored.
 */
export const resolveJobDescription = async ({ jobDescriptionText, jobDescriptionUrl }) => {
  let text = (jobDescriptionText || '').trim();
  let meta = { jobTitle: '', company: '' };

  if (!text && jobDescriptionUrl) {
    const fetched = await fetchJobDescription(jobDescriptionUrl);
    text = fetched.text;
    meta = { jobTitle: fetched.jobTitle, company: fetched.company };
  }
  text = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < MIN_JD_CHARS) {
    throw badRequest('The job description is too short to analyze. Paste the full posting (responsibilities and requirements).');
  }
  text = text.slice(0, MAX_JD_CHARS);

  const guessed = guessJobMeta(text);
  return {
    text,
    jobTitle: meta.jobTitle || guessed.jobTitle,
    company: meta.company || guessed.company,
  };
};
