import { extractSkills, isCertification, isGenericSkill } from './keywords.js';

/**
 * Candidate profiling for job matching. Turns a stored resume (rawText + the
 * locally parsed structure) into an evidence-based profile: canonical skills
 * (and where they are demonstrated), career domains, suitable role titles,
 * experience level, education and certifications.
 *
 * Nothing here guesses at things the resume doesn't say: location and
 * employment type come only from explicit user preferences; the only inference
 * is the country (needed to choose an Adzuna endpoint) and it is returned with
 * the evidence used so the UI can show it and let the user override it.
 */

// ---------------------------------------------------------------------------
// Domain catalogue
// ---------------------------------------------------------------------------

/**
 * Each domain lists the skills that signal it, title words that identify its
 * roles, role titles per seniority level, and Adzuna `title_only` queries per level.
 */
export const DOMAINS = {
  cybersecurity: {
    label: 'Cybersecurity',
    skills: [
      'SOC Operations', 'SIEM', 'Splunk', 'IBM QRadar', 'Microsoft Sentinel', 'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite',
      'Kali Linux', 'Penetration Testing', 'Vulnerability Assessment', 'Web Application Security', 'Incident Response',
      'Threat Intelligence', 'Threat Hunting', 'Log Analysis', 'Network Security', 'Networking', 'Malware Analysis',
      'Digital Forensics', 'EDR', 'MITRE ATT&CK', 'ISO 27001', 'NIST', 'Security Compliance', 'IAM', 'Cloud Security',
      'Cryptography', 'CTF', 'CompTIA Security+', 'CompTIA Network+', 'CEH', 'eJPT', 'OSCP', 'CISSP', 'CISM', 'Active Directory',
    ],
    terms: /cyber\s?security|information security|infosec|ethical hack|blue team|red team|security analyst|soc analyst|threat|vulnerabilit|malware|phishing|intrusion/gi,
    titleTerms: ['security', 'soc', 'cyber', 'penetration', 'pentest', 'vapt', 'infosec', 'threat', 'incident', 'forensic', 'grc', 'iam', 'siem'],
    roles: {
      intern: ['SOC Analyst Intern', 'Cyber Security Intern', 'Security Analyst Intern'],
      entry: ['SOC Analyst', 'Junior Security Analyst', 'Cyber Security Analyst', 'Information Security Analyst'],
      mid: ['Security Analyst', 'Security Engineer', 'SOC Analyst L2'],
      senior: ['Senior Security Engineer', 'Security Architect'],
    },
    queries: {
      intern: ['security intern', 'soc intern'],
      entry: ['soc analyst', 'security analyst'],
      mid: ['security analyst', 'security engineer'],
      senior: ['security engineer', 'security architect'],
    },
  },
  fullstack: {
    label: 'Full Stack Development',
    skills: ['MERN Stack'],
    terms: /full[\s-]?stack|mern|mean stack|end[\s-]to[\s-]end web/gi,
    titleTerms: ['full stack', 'fullstack', 'mern', 'web developer', 'software', 'developer', 'sde'],
    roles: {
      intern: ['Full Stack Developer Intern', 'Software Developer Intern', 'Web Developer Intern'],
      entry: ['Full Stack Developer', 'Junior Software Developer', 'Junior Web Developer'],
      mid: ['Full Stack Developer', 'Software Engineer', 'Full Stack Engineer'],
      senior: ['Senior Full Stack Developer', 'Senior Software Engineer'],
    },
    queries: {
      intern: ['full stack intern', 'software developer intern'],
      entry: ['full stack developer', 'junior software developer'],
      mid: ['full stack developer', 'software engineer'],
      senior: ['senior full stack', 'senior software engineer'],
    },
  },
  frontend: {
    label: 'Frontend Development',
    skills: ['React', 'Next.js', 'Angular', 'Vue.js', 'Svelte', 'Redux', 'Zustand', 'Tailwind CSS', 'Sass', 'HTML', 'CSS', 'Vite', 'Webpack', 'Responsive Design', 'Accessibility', 'UI/UX', 'TypeScript'],
    terms: /front[\s-]?end|user interface|single[\s-]page app|responsive/gi,
    titleTerms: ['frontend', 'front end', 'front-end', 'react', 'angular', 'vue', 'ui developer', 'web developer'],
    roles: {
      intern: ['Frontend Developer Intern', 'React Developer Intern'],
      entry: ['Frontend Developer', 'React Developer', 'Junior Frontend Developer'],
      mid: ['Frontend Developer', 'Frontend Engineer', 'React Developer'],
      senior: ['Senior Frontend Engineer'],
    },
    queries: {
      intern: ['react intern', 'frontend intern'],
      entry: ['react developer', 'frontend developer'],
      mid: ['frontend developer', 'react developer'],
      senior: ['senior frontend'],
    },
  },
  backend: {
    label: 'Backend Development',
    skills: [
      'Node.js', 'Express', 'NestJS', 'Django', 'Django REST Framework', 'Flask', 'FastAPI', 'Spring Boot', '.NET', 'Ruby on Rails',
      'GraphQL', 'REST APIs', 'gRPC', 'Microservices', 'WebSockets', 'Celery', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
      'Kafka', 'RabbitMQ', 'API Design', 'System Design', 'Postman',
    ],
    terms: /back[\s-]?end|server[\s-]side|api development|rest(ful)? api/gi,
    titleTerms: ['backend', 'back end', 'back-end', 'django', 'python', 'node', 'java', 'api', 'software', 'developer', 'sde'],
    roles: {
      intern: ['Backend Developer Intern', 'Software Developer Intern'],
      entry: ['Backend Developer', 'Junior Backend Developer', 'Junior Software Developer'],
      mid: ['Backend Developer', 'Backend Engineer', 'Software Engineer'],
      senior: ['Senior Backend Engineer'],
    },
    queries: {
      intern: ['backend intern', 'software developer intern'],
      entry: ['backend developer', 'junior software developer'],
      mid: ['backend developer', 'backend engineer'],
      senior: ['senior backend'],
    },
  },
  data: {
    label: 'Data Science & ML',
    skills: ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision', 'LLMs', 'LangChain', 'Pandas', 'NumPy', 'Spark', 'Hadoop', 'Airflow'],
    terms: /machine learning|data scien|deep learning|neural network|model training|predictive model/gi,
    titleTerms: ['data scien', 'machine learning', 'ml ', 'ai ', 'deep learning', 'nlp', 'computer vision'],
    roles: {
      intern: ['Data Science Intern', 'Machine Learning Intern'],
      entry: ['Junior Data Scientist', 'Machine Learning Engineer', 'AI/ML Engineer'],
      mid: ['Data Scientist', 'Machine Learning Engineer'],
      senior: ['Senior Data Scientist'],
    },
    queries: {
      intern: ['data science intern', 'machine learning intern'],
      entry: ['machine learning engineer', 'data scientist'],
      mid: ['data scientist', 'machine learning engineer'],
      senior: ['senior data scientist'],
    },
  },
  analytics: {
    label: 'Data Analytics',
    skills: ['SQL', 'Excel', 'Tableau', 'Power BI', 'Data Analysis', 'Statistics', 'Pandas', 'ETL', 'Snowflake'],
    terms: /data analy|dashboard|business intelligence|reporting/gi,
    titleTerms: ['data analyst', 'business analyst', 'bi ', 'analytics'],
    roles: {
      intern: ['Data Analyst Intern'],
      entry: ['Data Analyst', 'Junior Data Analyst'],
      mid: ['Data Analyst', 'BI Analyst'],
      senior: ['Senior Data Analyst'],
    },
    queries: { intern: ['data analyst intern'], entry: ['data analyst'], mid: ['data analyst'], senior: ['senior data analyst'] },
  },
  devops: {
    label: 'DevOps & Cloud',
    skills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Nginx', 'Serverless', 'Observability', 'AWS Certification', 'Azure Certification'],
    terms: /devops|site reliability|infrastructure as code|cloud infrastructure|deployment pipeline/gi,
    titleTerms: ['devops', 'cloud', 'sre', 'site reliability', 'platform engineer', 'infrastructure'],
    roles: {
      intern: ['DevOps Intern', 'Cloud Intern'],
      entry: ['Junior DevOps Engineer', 'Cloud Engineer'],
      mid: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer'],
      senior: ['Senior DevOps Engineer'],
    },
    queries: { intern: ['devops intern', 'cloud intern'], entry: ['devops engineer', 'cloud engineer'], mid: ['devops engineer', 'cloud engineer'], senior: ['senior devops'] },
  },
  mobile: {
    label: 'Mobile Development',
    skills: ['React Native', 'Flutter', 'Kotlin', 'Swift', 'Dart'],
    terms: /android|ios app|mobile app/gi,
    titleTerms: ['android', 'ios', 'mobile', 'flutter', 'react native'],
    roles: {
      intern: ['Android Developer Intern', 'Flutter Developer Intern'],
      entry: ['Android Developer', 'Flutter Developer', 'Mobile App Developer'],
      mid: ['Mobile App Developer', 'Android Developer'],
      senior: ['Senior Mobile Engineer'],
    },
    queries: { intern: ['android intern', 'flutter intern'], entry: ['android developer', 'flutter developer'], mid: ['mobile developer', 'android developer'], senior: ['senior android'] },
  },
  qa: {
    label: 'QA & Test Automation',
    skills: ['Selenium', 'Cypress', 'Playwright', 'Unit Testing', 'PyTest', 'Jest', 'Mocha'],
    terms: /test automation|quality assurance|test cases|manual testing/gi,
    titleTerms: ['qa', 'test', 'quality', 'sdet'],
    roles: {
      intern: ['QA Intern'],
      entry: ['QA Engineer', 'Test Automation Engineer'],
      mid: ['QA Automation Engineer', 'SDET'],
      senior: ['Senior QA Engineer'],
    },
    queries: { intern: ['qa intern'], entry: ['qa engineer', 'automation tester'], mid: ['qa automation engineer', 'sdet'], senior: ['senior qa'] },
  },
};

/** Stack-specific titles/queries added when the candidate demonstrably uses that stack. */
const STACK_ROLES = [
  { skill: 'Django', domain: 'backend', roles: ['Django Developer', 'Python Developer'], queries: { intern: 'python intern', other: 'django developer' } },
  { skill: 'FastAPI', domain: 'backend', roles: ['Python Developer'], queries: { intern: 'python intern', other: 'python developer' } },
  { skill: 'Flask', domain: 'backend', roles: ['Python Developer'], queries: { intern: 'python intern', other: 'python developer' } },
  { skill: 'Node.js', domain: 'backend', roles: ['Node.js Developer'], queries: { intern: 'node intern', other: 'node developer' } },
  { skill: 'Spring Boot', domain: 'backend', roles: ['Java Developer'], queries: { intern: 'java intern', other: 'java developer' } },
  { skill: 'MERN Stack', domain: 'fullstack', roles: ['MERN Stack Developer'], queries: { intern: 'mern intern', other: 'mern developer' } },
  { skill: 'React', domain: 'frontend', roles: ['React Developer'], queries: { intern: 'react intern', other: 'react developer' } },
  { skill: 'Angular', domain: 'frontend', roles: ['Angular Developer'], queries: { intern: 'angular intern', other: 'angular developer' } },
  { skill: 'Flutter', domain: 'mobile', roles: ['Flutter Developer'], queries: { intern: 'flutter intern', other: 'flutter developer' } },
  { skill: 'Penetration Testing', domain: 'cybersecurity', roles: ['Penetration Tester', 'VAPT Analyst'], queries: { intern: 'vapt intern', other: 'penetration tester' } },
];

// ---------------------------------------------------------------------------
// Experience / seniority
// ---------------------------------------------------------------------------

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const DATE_TOKEN = String.raw`(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*'?,?\s*(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}|(?:19|20)\d{2})`;
const RANGE_RE = new RegExp(
  String.raw`(${DATE_TOKEN})\s*(?:-|–|—|to|until)\s*(${DATE_TOKEN}|present|current|now|till date|to date|ongoing)`,
  'gi'
);

const parseDateToken = (token, now) => {
  const t = token.toLowerCase().trim();
  if (/present|current|now|till date|to date|ongoing/.test(t)) return now;
  const monthName = t.match(/^([a-z]+)/)?.[1];
  const year = Number(t.match(/(19|20)\d{2}/)?.[0]);
  if (!year) return null;
  if (monthName && MONTHS[monthName.slice(0, 4)] !== undefined) return new Date(year, MONTHS[monthName.slice(0, 4)]);
  if (monthName && MONTHS[monthName.slice(0, 3)] !== undefined) return new Date(year, MONTHS[monthName.slice(0, 3)]);
  const numericMonth = t.match(/^(\d{1,2})[/.-]/)?.[1];
  if (numericMonth) return new Date(year, Number(numericMonth) - 1);
  return new Date(year, 0);
};

/** Total months covered by intervals, merging overlaps (concurrent jobs don't double count). */
const mergedMonths = (intervals) => {
  const sorted = intervals.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur = null;
  for (const [s, e] of sorted) {
    if (!cur || s > cur[1]) {
      if (cur) total += cur[1] - cur[0];
      cur = [s, e];
    } else if (e > cur[1]) cur[1] = e;
  }
  if (cur) total += cur[1] - cur[0];
  return total / (1000 * 60 * 60 * 24 * 30.44);
};

const INTERN_HEADING_RE = /\b(intern|internship|trainee|apprentice|virtual experience|job simulation|summer analyst)\b/i;

const estimateExperience = (parsed, rawText, now) => {
  const fullTime = [];
  const internships = [];
  const roles = [];
  for (const entry of parsed?.experience || []) {
    const heading = entry.heading || '';
    const isIntern = INTERN_HEADING_RE.test(heading);
    RANGE_RE.lastIndex = 0;
    const m = RANGE_RE.exec(heading);
    roles.push({ heading: heading.slice(0, 120), isIntern });
    if (!m) continue;
    const start = parseDateToken(m[1], now);
    const end = parseDateToken(m[2], now);
    if (!start || !end || start > now) continue;
    (isIntern ? internships : fullTime).push([start, end > now ? now : end]);
  }

  const computedYears = mergedMonths(fullTime) / 12;
  const internshipMonths = Math.round(mergedMonths(internships));
  const intro = `${parsed?.summary || ''}\n${rawText.slice(0, 1500)}`;
  const stated = intro.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|industry\s+|hands[\s-]on\s+|work\s+)?experience/i);
  const statedYears = stated ? Number(stated[1]) : 0;
  const years = Math.round(Math.max(computedYears, statedYears <= 40 ? statedYears : 0) * 10) / 10;

  return {
    years,
    internshipMonths,
    hasInternships: internships.length > 0 || roles.some((r) => r.isIntern),
    datedRoles: fullTime.length + internships.length,
    evidence: statedYears > computedYears ? `Resume states ${statedYears}+ years of experience` : null,
  };
};

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export const DEGREE_RANK = { none: 0, diploma: 1, bachelor: 2, master: 3, phd: 4 };

export const detectDegreeLevel = (text) => {
  if (!text) return null;
  if (/\bph\.?\s?d\b|\bdoctorate\b/i.test(text)) return 'phd';
  if (/\bm\.?\s?tech\b|\bm\.?e\.(?=\s)|\bmaster'?s?\b|\bm\.?\s?sc\b|\bmca\b|\bmba\b|\bm\.s\.|\bms in\b/i.test(text)) return 'master';
  if (/\bb\.?\s?tech\b|\bb\.?\s?e\b\.?(?=\s|,|$)|\bbachelor'?s?\b|\bb\.?\s?sc\b|\bbca\b|\bb\.s\.|\bbs in\b|\bundergraduate\b|\bgraduat(e|ion) degree\b/i.test(text)) return 'bachelor';
  if (/\bdiploma\b/i.test(text)) return 'diploma';
  return null;
};

const FIELD_RE = /computer science|computer engineering|information technology|\bcse\b|\bit\b(?= |,)|software engineering|cyber\s?security|information security|electronics|data science|artificial intelligence|computer applications/i;

const extractEducation = (parsed, rawText, now) => {
  const lines = parsed?.education?.length ? parsed.education : [];
  const text = lines.join(' \n ') || rawText.match(/education[\s\S]{0,600}/i)?.[0] || '';
  const level = detectDegreeLevel(text);
  const field = text.match(FIELD_RE)?.[0] || null;
  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const gradYear = years.length ? Math.max(...years) : null;
  const currentYear = now.getFullYear();
  const isStudent =
    (gradYear !== null && gradYear >= currentYear && gradYear <= currentYear + 5) ||
    /\b(pursuing|expected|currently enrolled|ongoing|(?:1st|2nd|3rd|4th|first|second|third|final)[\s-]year|semester)\b/i.test(text);
  return { level, field, graduationYear: gradYear, isStudent, lines: lines.slice(0, 6) };
};

// ---------------------------------------------------------------------------
// Country evidence (for choosing the Adzuna endpoint only)
// ---------------------------------------------------------------------------

const COUNTRY_HINTS = [
  { code: 'in', re: /\+91[\s-]?\d|\bindia\b/i, label: '+91 phone number / India mentioned' },
  { code: 'gb', re: /\+44[\s-]?\d|\bunited kingdom\b|\blondon\b/i, label: '+44 phone number / UK mentioned' },
  { code: 'au', re: /\+61[\s-]?\d|\baustralia\b/i, label: '+61 phone number / Australia mentioned' },
  { code: 'sg', re: /\+65[\s-]?\d|\bsingapore\b/i, label: '+65 phone number / Singapore mentioned' },
  { code: 'ca', re: /\bcanada\b|\btoronto\b|\bvancouver\b/i, label: 'Canada mentioned' },
  { code: 'us', re: /\+1[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\bunited states\b|\busa\b/i, label: '+1 phone number / USA mentioned' },
];

const inferCountry = (parsed, rawText) => {
  const header = `${parsed?.contact?.phone || ''} ${rawText.slice(0, 800)}`;
  for (const hint of COUNTRY_HINTS) {
    if (hint.re.test(header)) return { code: hint.code, evidence: hint.label };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const countMatches = (text, re) => {
  re.lastIndex = 0;
  return (text.match(re) || []).length;
};

/** Level bucket used for role titles and query selection. */
const levelFor = ({ years, isStudent }) => {
  if (years < 1) return isStudent ? 'student' : 'fresher';
  if (years < 2.5) return 'junior';
  if (years < 6) return 'mid';
  return 'senior';
};

const LEVEL_ROLE_KEYS = {
  student: ['intern', 'entry'],
  fresher: ['entry', 'intern'],
  junior: ['entry', 'mid'],
  mid: ['mid'],
  senior: ['mid', 'senior'],
};

/**
 * Build the candidate profile from a Resume document (or {rawText, parsed}).
 * Deterministic: the same resume always yields the same profile.
 */
export const buildCandidateProfile = (resume, { now = new Date() } = {}) => {
  const rawText = resume.rawText || '';
  const parsed = resume.parsed || {};

  // --- Skills with evidence -------------------------------------------------
  const allSkills = extractSkills(rawText);
  const listedSkills = extractSkills((parsed.skills || []).join(', '));
  const demonstratedText = [
    ...(parsed.experience || []).flatMap((e) => [e.heading, ...(e.bullets || [])]),
    ...(parsed.projects || []),
  ].join('\n');
  const demonstrated = extractSkills(demonstratedText);
  const certText = (parsed.certifications || []).join('\n');
  const listedCerts = extractSkills(certText);

  const skills = new Set([...allSkills.keys()].filter((s) => !isGenericSkill(s)));
  const certifications = [...skills].filter(isCertification);
  const skillEvidence = {};
  for (const s of skills) {
    skillEvidence[s] = demonstrated.has(s) ? 'demonstrated' : listedSkills.has(s) || listedCerts.has(s) ? 'listed' : 'mentioned';
  }

  // --- Domains --------------------------------------------------------------
  const contextText = `${parsed.summary || ''}\n${demonstratedText}\n${rawText.slice(0, 600)}`;
  const domainScores = {};
  for (const [id, domain] of Object.entries(DOMAINS)) {
    let score = 0;
    for (const s of domain.skills) {
      if (!skills.has(s)) continue;
      score += skillEvidence[s] === 'demonstrated' ? 1.5 : 1;
    }
    score += Math.min(3, countMatches(contextText, domain.terms) * 0.75);
    domainScores[id] = score;
  }
  // Full stack = real evidence on both sides of the stack (or an explicit claim).
  const fe = domainScores.frontend;
  const be = domainScores.backend;
  if (fe >= 2 && be >= 2) domainScores.fullstack += (fe + be) * 0.6;

  const top = Math.max(...Object.values(domainScores), 0);
  const domains = Object.entries(domainScores)
    .filter(([, s]) => s >= 2.5 && s >= top * 0.4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, s]) => ({ id, label: DOMAINS[id].label, strength: Math.round((s / top) * 100) / 100, score: Math.round(s * 10) / 10 }));

  // --- Experience & education ----------------------------------------------
  const experience = estimateExperience(parsed, rawText, now);
  const education = extractEducation(parsed, rawText, now);
  const level = levelFor({ years: experience.years, isStudent: education.isStudent });
  const careerStage = experience.years < 1 ? 'fresher' : 'experienced';

  // --- Suitable roles & search queries -------------------------------------
  const roleKeys = LEVEL_ROLE_KEYS[level];
  const suitableRoles = [];
  const queries = [];
  const pushUnique = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };

  for (const d of domains) {
    const def = DOMAINS[d.id];
    for (const key of roleKeys) {
      def.roles[key].forEach((r) => pushUnique(suitableRoles, r));
    }
    for (const stack of STACK_ROLES) {
      if (stack.domain !== d.id && !(d.id === 'fullstack' && ['frontend', 'backend'].includes(stack.domain))) continue;
      if (skillEvidence[stack.skill] !== 'demonstrated' && skillEvidence[stack.skill] !== 'listed') continue;
      stack.roles.forEach((r) => pushUnique(suitableRoles, roleKeys.includes('intern') ? `${r} Intern` : r));
    }
  }

  // Interleave queries across domains so the strongest domain leads but others are represented.
  const perDomain = domains.map((d) => {
    const def = DOMAINS[d.id];
    const list = [];
    const [primary, secondary] = roleKeys;
    // Students/freshers: one internship + one entry query per domain first.
    if (primary && secondary) {
      list.push(def.queries[primary][0], def.queries[secondary]?.[0], def.queries[primary][1], def.queries[secondary]?.[1]);
    } else {
      list.push(...def.queries[primary]);
    }
    for (const stack of STACK_ROLES) {
      const relevantDomain = stack.domain === d.id || (d.id === 'fullstack' && ['frontend', 'backend'].includes(stack.domain));
      if (!relevantDomain || skillEvidence[stack.skill] !== 'demonstrated') continue;
      list.splice(1, 0, roleKeys.includes('intern') && roleKeys[0] === 'intern' ? stack.queries.intern : stack.queries.other);
    }
    return list.filter(Boolean);
  });
  for (let i = 0; perDomain.some((l) => l.length > i); i += 1) {
    for (const list of perDomain) pushUnique(queries, list[i]);
  }

  return {
    skills: [...skills].sort(),
    skillEvidence,
    certifications,
    domains,
    level,
    careerStage,
    experience,
    education,
    suitableRoles: suitableRoles.slice(0, 10),
    searchQueries: queries,
    projectsCount: (parsed.projects || []).length,
    countryHint: inferCountry(parsed, rawText),
    /** Text used for contextual (TF-IDF) similarity against job descriptions. */
    contextText: [
      [...skills].join(' '),
      suitableRoles.join(' '),
      domains.map((d) => d.label).join(' '),
      parsed.summary || '',
      demonstratedText,
    ].join('\n'),
  };
};
