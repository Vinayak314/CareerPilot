import 'dotenv/config';
import { buildCandidateProfile } from '../services/careerProfile.js';
import { evaluateJobMatch, deduplicateJobs, parseJobRequirements } from '../services/jobMatcher.js';
import { searchAdzuna } from '../services/jobProvider.js';

console.log('====================================================');
console.log('🧪 CareerPilot Job Matching Test Suite');
console.log('====================================================\n');

let failedTests = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// 1. Profile 1: Cybersecurity Fresher
// ---------------------------------------------------------------------------
console.log('----------------------------------------------------');
console.log('Test Profile 1: Cybersecurity Fresher');
console.log('----------------------------------------------------');

const cyberFresherResume = {
  rawText: `
John Doe
Email: john.cyber@example.com | Phone: +91 9876543210 | Location: Bangalore, India
LinkedIn: linkedin.com/in/johncyber | GitHub: github.com/johncyber

PROFESSIONAL SUMMARY
Aspiring Cybersecurity Analyst and SOC enthusiast with hands-on experience in threat detection, network security, and vulnerability assessment. Built home labs simulating SOC monitoring with SIEM and IDS tools.

TECHNICAL SKILLS
Security & Tools: SIEM, Wireshark, Nmap, Metasploit, Burp Suite, Kali Linux, Vulnerability Assessment, Web Application Security
Networking & Systems: Linux, Bash, TCP/IP, Network Security
Certifications: CompTIA Security+, CEH

PROJECTS
• SOC Monitoring Lab: Configured Wazuh and Splunk SIEM on Ubuntu VMs to ingest and analyze network telemetry. Detected brute-force and port scan attacks in real-time.
• Web Application Penetration Testing: Identified OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF) on Juice Shop and DVWA using Burp Suite and Nmap. Documented remediation steps.

EDUCATION
B.Tech in Computer Science and Engineering | 2022 - 2026 (Expected)
Vellore Institute of Technology
`,
  parsed: {
    skills: ['SIEM', 'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'Kali Linux', 'Vulnerability Assessment', 'Web Application Security', 'Linux', 'CompTIA Security+', 'CEH'],
    certifications: ['CompTIA Security+', 'CEH'],
    education: ['B.Tech in Computer Science and Engineering | 2022 - 2026'],
    experience: [],
    projects: [
      'SOC Monitoring Lab: Configured Wazuh and Splunk SIEM on Ubuntu VMs',
      'Web Application Penetration Testing: Identified OWASP Top 10 vulnerabilities',
    ],
  },
};

const cyberProfile = buildCandidateProfile(cyberFresherResume);
assert(cyberProfile.domains.some((d) => d.id === 'cybersecurity'), 'Identified Cybersecurity as primary career domain');
assert(cyberProfile.level === 'student' || cyberProfile.level === 'fresher', `Identified experience level as student/fresher (got: ${cyberProfile.level})`);
assert(cyberProfile.countryHint?.code === 'in', `Identified country hint as India (IN) from +91 phone (got: ${cyberProfile.countryHint?.code})`);
assert(cyberProfile.suitableRoles.some((r) => /soc analyst|security/i.test(r)), `Generated suitable roles including SOC Analyst / Security: ${cyberProfile.suitableRoles.join(', ')}`);
assert(cyberProfile.searchQueries.some((q) => /security|soc/i.test(q)), `Generated targeted queries: ${cyberProfile.searchQueries.join(', ')}`);

// Test Job Matches for Cyber Fresher
const goodCyberJob = {
  jobId: 'cyber-1',
  title: 'SOC Analyst Intern',
  company: 'CyberDefense Global',
  location: 'Bangalore, India',
  country: 'in',
  descriptionText: 'We are looking for an energetic SOC Analyst Intern to join our Security Operations Center. Requirements: Basic knowledge of SIEM tools, Wireshark, network protocols (TCP/IP), and Linux. CompTIA Security+ is a plus. Fresher candidates welcome.',
};

const evalCyberGood = evaluateJobMatch(goodCyberJob, cyberProfile, { country: 'in' });
assert(evalCyberGood.eligible === true, 'Eligible for SOC Analyst Intern role');
assert(evalCyberGood.fitScore >= 70, `High fit score for SOC Analyst Intern (got: ${evalCyberGood.fitScore}%)`);
assert(evalCyberGood.matchedSkills.includes('SIEM') && evalCyberGood.matchedSkills.includes('Wireshark'), 'Matched key skills SIEM and Wireshark');
assert(evalCyberGood.employmentType === 'Internship', `Detected employment type as Internship (got: ${evalCyberGood.employmentType})`);

// Senior clearance job (should be filtered out)
const clearanceCyberJob = {
  jobId: 'cyber-senior-clearance',
  title: 'Senior Cybersecurity Architect',
  company: 'Defense Systems Inc',
  location: 'Virginia, USA',
  country: 'us',
  descriptionText: 'Must possess an Active Top Secret / SCI Security Clearance. 8+ years of experience in enterprise security architecture. Salary: $220,000.',
};

const evalCyberClearance = evaluateJobMatch(clearanceCyberJob, cyberProfile, { country: 'in' });
assert(evalCyberClearance.eligible === false, `Incompatible Senior/Clearance job was correctly excluded: ${evalCyberClearance.filterReason}`);

// Unrelated keyword job (e.g. Tax Analyst mentioning basic security compliance)
const unrelatedTaxJob = {
  jobId: 'unrelated-1',
  title: 'Financial Tax Analyst',
  company: 'Finance Corp',
  location: 'Bangalore, India',
  country: 'in',
  descriptionText: 'Perform tax audit and accounting reviews. Responsible for maintaining security of financial records.',
};

const evalCyberUnrelated = evaluateJobMatch(unrelatedTaxJob, cyberProfile, { country: 'in' });
assert(evalCyberUnrelated.eligible === false, `Unrelated role filtered out despite isolated keyword: ${evalCyberUnrelated.filterReason}`);

// ---------------------------------------------------------------------------
// 2. Profile 2: Full Stack Fresher
// ---------------------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('Test Profile 2: Full Stack Fresher');
console.log('----------------------------------------------------');

const fullstackResume = {
  rawText: `
Jane Smith
Email: jane.dev@example.com | Phone: +91 9123456789 | Location: Mumbai, India
GitHub: github.com/janesmith | Portfolio: janesmith.dev

SUMMARY
Enthusiastic Full Stack Developer (MERN Stack) with strong foundation in JavaScript, React, Node.js, Express, and MongoDB. Passionate about building responsive web applications with clean RESTful APIs.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, HTML, CSS, SQL
Frontend: React, Redux, Tailwind CSS, Vite
Backend: Node.js, Express, MongoDB, REST APIs, WebSockets
Tools: Git, GitHub, Postman, Docker

PROJECTS
• DevConnect - Full Stack Developer Network (MERN): Built responsive social platform for developers using React, Node.js, Express, and MongoDB. Implemented JWT authentication and real-time messaging via WebSockets.
• TaskMaster Pro: Kanban task manager built with React, Tailwind CSS, and REST API backend. Implemented drag-and-drop task sorting.

EDUCATION
B.Tech in Information Technology | 2022 - 2026
University of Mumbai
`,
  parsed: {
    skills: ['JavaScript', 'TypeScript', 'React', 'Redux', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'WebSockets', 'Git'],
    education: ['B.Tech in Information Technology | 2022 - 2026'],
    experience: [],
    projects: [
      'DevConnect - Full Stack Developer Network (MERN): Built using React, Node.js, Express, and MongoDB',
      'TaskMaster Pro: Kanban task manager built with React, Tailwind CSS',
    ],
  },
};

const fsProfile = buildCandidateProfile(fullstackResume);
assert(fsProfile.domains.some((d) => d.id === 'fullstack' || d.id === 'frontend'), 'Identified Full Stack / Frontend domain');
assert(fsProfile.level === 'student' || fsProfile.level === 'fresher', `Identified level as student/fresher (got: ${fsProfile.level})`);
assert(fsProfile.suitableRoles.some((r) => /full stack|react|software developer/i.test(r)), `Generated suitable roles: ${fsProfile.suitableRoles.join(', ')}`);

const goodFsJob = {
  jobId: 'fs-1',
  title: 'Full Stack Developer Intern',
  company: 'WebSolutions Tech',
  location: 'Mumbai, India',
  country: 'in',
  descriptionText: 'Looking for a Full Stack Developer Intern. Hands-on experience with React, Node.js, and MongoDB required. Familiarity with TypeScript and Tailwind CSS is a bonus. Candidates should have built personal projects.',
};

const evalFsGood = evaluateJobMatch(goodFsJob, fsProfile, { country: 'in' });
assert(evalFsGood.eligible === true, 'Eligible for Full Stack Developer Intern role');
assert(evalFsGood.fitScore >= 75, `High fit score for Full Stack Intern (got: ${evalFsGood.fitScore}%)`);
assert(evalFsGood.matchedSkills.includes('React') && evalFsGood.matchedSkills.includes('Node.js'), 'Matched React and Node.js');
assert(evalFsGood.scoreBreakdown?.role >= 80, `Strong role breakdown score: ${evalFsGood.scoreBreakdown?.role}%`);

// Senior $200k job for Fresher
const seniorDevJob = {
  jobId: 'fs-senior',
  title: 'Lead Full Stack Architect',
  company: 'Enterprise Cloud Inc',
  location: 'New York, USA',
  country: 'us',
  descriptionText: 'Looking for a Lead Architect with 7+ years of experience leading engineering teams. Must have scaled distributed systems.',
};

const evalFsSenior = evaluateJobMatch(seniorDevJob, fsProfile, { country: 'in' });
assert(evalFsSenior.eligible === false, `Lead Architect job was correctly filtered out for fresher: ${evalFsSenior.filterReason}`);

// ---------------------------------------------------------------------------
// 3. Profile 3: Experienced Django Developer
// ---------------------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('Test Profile 3: Experienced Django Developer');
console.log('----------------------------------------------------');

const djangoDevResume = {
  rawText: `
Robert Brown
Email: robert.django@example.com | Phone: +91 9988776655 | Pune, India
LinkedIn: linkedin.com/in/robertdjango | GitHub: github.com/robertdjango

SUMMARY
Experienced Backend Software Engineer with 3+ years of professional industry experience specializing in Python, Django, and Django REST Framework. Proven track record designing scalable microservices, Celery task queues, PostgreSQL database optimizations, and Redis caching.

WORK EXPERIENCE
Backend Software Engineer | CloudScale Systems | Pune, India
July 2023 - Present
• Designed and maintained high-throughput REST APIs using Django and Django REST Framework serving 5M+ daily requests.
• Implemented asynchronous background processing using Celery and Redis, reducing API response times by 40%.
• Optimized complex PostgreSQL queries and database indexing, cutting slow query frequency by 60%.
• Integrated Docker containers into automated GitHub Actions CI/CD deployment pipelines on AWS EC2.

Junior Python Developer | Apex Software | Pune, India
June 2022 - June 2023
• Developed backend modules in Python and Flask for internal enterprise reporting tools.
• Wrote comprehensive unit tests using PyTest achieving 85% code coverage.

TECHNICAL SKILLS
Languages & Frameworks: Python, Django, Django REST Framework, Flask, SQL
Databases & Caching: PostgreSQL, Redis, MySQL
DevOps & Tools: Docker, Git, CI/CD, Celery, AWS, Linux, PyTest, Postman

EDUCATION
B.Tech in Computer Science | 2018 - 2022
Pune University
`,
  parsed: {
    skills: ['Python', 'Django', 'Django REST Framework', 'Flask', 'PostgreSQL', 'Redis', 'Docker', 'Celery', 'AWS', 'Linux', 'PyTest', 'Git', 'CI/CD'],
    education: ['B.Tech in Computer Science | 2018 - 2022'],
    experience: [
      { heading: 'Backend Software Engineer | CloudScale Systems | Pune, India | July 2023 - Present', bullets: ['Designed and maintained high-throughput REST APIs using Django'] },
      { heading: 'Junior Python Developer | Apex Software | Pune, India | June 2022 - June 2023', bullets: ['Developed backend modules in Python and Flask'] },
    ],
    projects: [],
  },
};

const djangoProfile = buildCandidateProfile(djangoDevResume);
assert(djangoProfile.domains.some((d) => d.id === 'backend'), 'Identified Backend Development domain');
assert(djangoProfile.level === 'mid', `Identified experience level as mid (got: ${djangoProfile.level}, years: ${djangoProfile.experience?.years})`);
assert(djangoProfile.experience?.years >= 2.5, `Computed experience >= 2.5 years (got: ${djangoProfile.experience?.years})`);
assert(djangoProfile.suitableRoles.some((r) => /django|backend|python/i.test(r)), `Generated suitable roles: ${djangoProfile.suitableRoles.join(', ')}`);

const goodDjangoJob = {
  jobId: 'django-mid',
  title: 'Django Developer',
  company: 'Fintech Solutions',
  location: 'Pune, Maharashtra',
  country: 'in',
  descriptionText: 'We are hiring a Django Developer with 2-4 years experience. Requirements: Strong proficiency in Python, Django, Django REST Framework, and PostgreSQL. Experience with Redis and Celery for async tasks is required. Experience with Docker is a plus.',
};

const evalDjangoGood = evaluateJobMatch(goodDjangoJob, djangoProfile, { country: 'in' });
assert(evalDjangoGood.eligible === true, 'Eligible for mid-level Django Developer role');
assert(evalDjangoGood.fitScore >= 80, `High fit score for experienced Django role (got: ${evalDjangoGood.fitScore}%)`);
assert(evalDjangoGood.scoreBreakdown?.experience >= 90, `High experience compatibility score: ${evalDjangoGood.scoreBreakdown?.experience}%`);
assert(evalDjangoGood.matchedSkills.includes('Django') && evalDjangoGood.matchedSkills.includes('PostgreSQL'), 'Matched Django & PostgreSQL');

// Transferable / Related skill test: Job asks for MySQL and FastAPI (candidate has PostgreSQL and Django)
const adjacentDjangoJob = {
  jobId: 'django-adjacent',
  title: 'Python Backend Engineer',
  company: 'SaaS Platform',
  location: 'Pune, Maharashtra',
  country: 'in',
  descriptionText: 'Looking for a Python Backend Engineer with 2-3 years experience. Must have Python, MySQL, and FastAPI. Redis knowledge preferred.',
};

const evalDjangoAdjacent = evaluateJobMatch(adjacentDjangoJob, djangoProfile, { country: 'in' });
assert(evalDjangoAdjacent.eligible === true, 'Eligible for Python Backend Engineer role');
assert(evalDjangoAdjacent.relatedSkills.length > 0, `Identified transferable skills: ${JSON.stringify(evalDjangoAdjacent.relatedSkills)}`);

// ---------------------------------------------------------------------------
// 4. Deduplication & Near-Duplicate Clustering Test
// ---------------------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('Test 4: Deduplication and Clustering');
console.log('----------------------------------------------------');

const duplicateJobList = [
  { jobId: '101', title: 'SOC Analyst', company: 'Infosys Limited', fitScore: 85, location: 'Bangalore' },
  { jobId: '102', title: 'Urgent Hiring: SOC Analyst', company: 'Infosys Ltd', fitScore: 82, location: 'Bangalore' },
  { jobId: '103', title: 'SOC Analyst - Immediate Joiner', company: 'Infosys', fitScore: 88, location: 'Bangalore' },
  { jobId: '104', title: 'Security Analyst', company: 'Wipro Technologies', fitScore: 78, location: 'Pune' },
  { jobId: '101', title: 'SOC Analyst', company: 'Infosys Limited', fitScore: 85, location: 'Bangalore' }, // Exact ID dup
];

const deduplicated = deduplicateJobs(duplicateJobList);
assert(deduplicated.length === 2, `Deduplicated 5 listings (including 3 near-duplicates of Infosys SOC Analyst) into 2 distinct listings (got: ${deduplicated.length})`);
assert(deduplicated.find((j) => j.company.includes('Infosys'))?.fitScore === 88, 'Kept the highest scoring variant of near-duplicates');

// ---------------------------------------------------------------------------
// 5. Live Adzuna Query Test (India endpoint, rate limit & caching check)
// ---------------------------------------------------------------------------
console.log('\n----------------------------------------------------');
console.log('Test 5: Live Adzuna Integration & Caching');
console.log('----------------------------------------------------');

try {
  const liveResult = await searchAdzuna({
    country: 'in',
    params: { title_only: 'soc analyst' },
    page: 1,
  });
  assert(Array.isArray(liveResult.jobs) && liveResult.jobs.length > 0, `Live Adzuna returned ${liveResult.jobs?.length} live jobs for 'soc analyst' in India`);
  
  // Test cache hit on identical query
  const cachedResult = await searchAdzuna({
    country: 'in',
    params: { title_only: 'soc analyst' },
    page: 1,
  });
  assert(cachedResult.cached === true, 'Cache successfully hit for repeated query (preserves rate limit budget)');
} catch (err) {
  console.warn(`Live Adzuna test note: ${err.message}`);
}

console.log('\n====================================================');
if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
} else {
  console.log(`❌ ${failedTests} TESTS FAILED.`);
  process.exit(1);
}
console.log('====================================================\n');
