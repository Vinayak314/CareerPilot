import { extractSkills, isCertification, isGenericSkill, isSoftSkill, relatedSkills, STOPWORDS } from './keywords.js';
import { MATCH_WEIGHTS, MATCHING } from '../config/matching.js';
import { DEGREE_RANK, detectDegreeLevel, DOMAINS } from './careerProfile.js';

/**
 * Hybrid Job Matching Service
 *
 * Evaluates candidate-job compatibility across 5 weighted factors:
 *   1. Role Relevance (30%)
 *   2. Technical Skills (30%)
 *   3. Experience Compatibility (20%)
 *   4. Location (10%)
 *   5. Qualifications (10%)
 *
 * Also performs:
 *   - Security clearance & seniority filtering
 *   - Duplicate & near-duplicate removal
 *   - Structured skill gap analysis (required vs preferred, related skills)
 *   - Evidence-based, explainable match summaries
 */

// ---------------------------------------------------------------------------
// 1. Job Description Requirement & Metadata Parsing
// ---------------------------------------------------------------------------

const CLEARANCE_PATTERNS = [
  /\b(?:security\s+clearance(?:\s+(?:required|needed|must\s+have|active))?)\b/i,
  /\b(?:active\s+(?:secret|top\s+secret|ts\/sci|polygraph)\s+clearance)\b/i,
  /\b(?:ts[\s/]sci|top\s+secret\s+clearance)\b/i,
  /\b(?:must\s+(?:hold|have|be\s+eligible\s+for)\s+(?:an?\s+)?active\s+clearance)\b/i,
  /\b(?:dod\s+(?:secret|top\s+secret))\b/i,
  /\b(?:u\.?s\.?\s+citizenship\s+(?:is\s+)?required\s+due\s+to\s+(?:government|clearance))\b/i,
];

const SENIOR_TITLE_RE = /\b(senior|sr\.?|lead|principal|staff|architect|director|vp|vice\s+president|head\s+of|chief|manager|mgr)\b/i;
const INTERN_TITLE_RE = /\b(intern|internship|co-?op|trainee|apprentice)\b/i;
const ENTRY_TITLE_RE = /\b(junior|jr\.?|entry[\s-]level|fresher|associate|graduate)\b/i;

const REMOTE_RE = /\b(remote|work\s+from\s+home|wfh|telecommute|anywhere)\b/i;

const EXP_YEARS_RE = /(?:(\d{1,2})(?:\s*-\s*(\d{1,2})|\+)?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp|hands[\s-]on|relevant\s+experience))/gi;
const EXP_YEARS_PREFIX_RE = /(?:experience|exp)\s*(?:of|:)?\s*(\d{1,2})(?:\s*-\s*(\d{1,2})|\+)?\s*(?:years?|yrs?)/gi;

/**
 * Extract structured constraints and requirements from job title + description.
 */
export const parseJobRequirements = (job) => {
  const title = job.title || '';
  const text = `${title}\n${job.descriptionText || ''}`;

  // Clearance check
  const requiresClearance = CLEARANCE_PATTERNS.some((pattern) => pattern.test(text));

  // Seniority detection from title
  const isSeniorTitle = SENIOR_TITLE_RE.test(title);
  const isInternTitle = INTERN_TITLE_RE.test(title);
  const isEntryTitle = ENTRY_TITLE_RE.test(title);

  // Experience requirement in years
  let minYears = null;
  let maxYears = null;

  const matches = [...text.matchAll(EXP_YEARS_RE), ...text.matchAll(EXP_YEARS_PREFIX_RE)];
  for (const match of matches) {
    const val1 = parseInt(match[1], 10);
    const val2 = match[2] ? parseInt(match[2], 10) : null;
    if (!isNaN(val1) && val1 >= 0 && val1 <= 25) {
      if (minYears === null || val1 < minYears) minYears = val1;
      if (val2 !== null && !isNaN(val2) && val2 <= 30) {
        if (maxYears === null || val2 > maxYears) maxYears = val2;
      }
    }
  }

  // Derive target experience level
  let derivedLevel = 'mid';
  if (isInternTitle || (minYears !== null && minYears === 0 && (text.includes('intern') || text.includes('trainee')))) {
    derivedLevel = 'intern';
  } else if (isEntryTitle || (minYears !== null && minYears <= 1 && !isSeniorTitle)) {
    derivedLevel = 'entry';
  } else if (isSeniorTitle || (minYears !== null && minYears >= 5)) {
    derivedLevel = 'senior';
  } else if (minYears !== null && minYears >= 2) {
    derivedLevel = 'mid';
  }

  // Degree requirements
  const requiredDegree = detectDegreeLevel(text);

  // Remote check
  const isRemote = REMOTE_RE.test(title) || REMOTE_RE.test(job.location || '') || REMOTE_RE.test(text.slice(0, 500));

  // Split skills into mandatory vs preferred based on section markers
  const { requiredSkills, preferredSkills } = splitMandatoryAndPreferredSkills(text);

  return {
    requiresClearance,
    isSeniorTitle,
    isInternTitle,
    isEntryTitle,
    derivedLevel,
    minYearsRequired: minYears,
    maxYearsRequired: maxYears,
    requiredDegree,
    isRemote,
    requiredSkills,
    preferredSkills,
  };
};

/**
 * Separate skills found in mandatory requirements vs preferred sections.
 */
const splitMandatoryAndPreferredSkills = (text) => {
  const lower = text.toLowerCase();
  const allExtracted = extractSkills(text, { strict: true });

  const preferredSkills = new Set();
  const requiredSkills = new Set();

  // Find preferred clauses: "nice to have", "plus", "preferred", "bonus", "good to have"
  const preferredIndices = [];
  const prefRegex = /\b(nice\s+to\s+have|preferred|preferred\s+qualifications|good\s+to\s+have|plus|bonus|optional)\b/gi;
  let match;
  while ((match = prefRegex.exec(lower)) !== null) {
    preferredIndices.push(match.index);
  }

  for (const [skill] of allExtracted) {
    if (isGenericSkill(skill)) continue;

    // Check if skill occurs primarily near preferred markers
    let isPreferred = false;
    const skillRegex = new RegExp(`\\b${skill.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const skillMatch = skillRegex.exec(text);

    if (skillMatch) {
      const idx = skillMatch.index;
      for (const pIdx of preferredIndices) {
        if (idx > pIdx && idx - pIdx < 300) {
          isPreferred = true;
          break;
        }
      }
    }

    if (isPreferred) {
      preferredSkills.add(skill);
    } else {
      requiredSkills.add(skill);
    }
  }

  return { requiredSkills, preferredSkills };
};

// ---------------------------------------------------------------------------
// 2. Contextual / Semantic Relevance (Local TF-IDF Tokenizer)
// ---------------------------------------------------------------------------

const tokenize = (str) => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[-./]+|[-./]+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
};

export const computeTfIdfCosineSimilarity = (textA, textB) => {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;

  const freqA = new Map();
  for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1);

  const freqB = new Map();
  for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, countA] of freqA.entries()) {
    magA += countA * countA;
    const countB = freqB.get(term) || 0;
    dotProduct += countA * countB;
  }

  for (const countB of freqB.values()) {
    magB += countB * countB;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (!denominator) return 0;

  return Math.min(1, Math.max(0, dotProduct / denominator));
};

// ---------------------------------------------------------------------------
// 3. Scoring Factors
// ---------------------------------------------------------------------------

const GENERIC_ROLE_WORDS = new Set([
  'analyst', 'developer', 'engineer', 'specialist', 'associate', 'intern', 'internship',
  'consultant', 'trainee', 'lead', 'officer', 'coordinator', 'programmer', 'architect', 'manager',
]);

/**
 * 1. Role Relevance (Weight: 30%)
 * Combines title target alignment with contextual text similarity.
 */
export const scoreRoleRelevance = (profile, job) => {
  const title = (job.title || '').toLowerCase();
  const suitable = (profile.suitableRoles || []).map((r) => r.toLowerCase());

  // Check if any domain title terms match
  let matchesAnyDomainTerm = false;
  let domainScore = 0;
  for (const dom of profile.domains || []) {
    const domainDef = DOMAINS[dom.id];
    if (!domainDef) continue;
    const matchesDomain = domainDef.titleTerms.some((term) => title.includes(term));
    if (matchesDomain) {
      matchesAnyDomainTerm = true;
      domainScore = Math.max(domainScore, dom.strength || 0.8);
    }
  }

  // Direct title match
  let titleScore = 0;
  for (const role of suitable) {
    if (title.includes(role) || role.includes(title)) {
      titleScore = 1.0;
      break;
    }
    // Token overlap: only award score if non-generic role words match
    const roleWords = role.split(/\s+/).filter((w) => w.length > 2);
    const nonGenericRoleWords = roleWords.filter((w) => !GENERIC_ROLE_WORDS.has(w));
    const matchedNonGeneric = nonGenericRoleWords.filter((w) => title.includes(w));

    if (nonGenericRoleWords.length > 0 && matchedNonGeneric.length > 0) {
      const ratio = matchedNonGeneric.length / nonGenericRoleWords.length;
      if (ratio > titleScore) titleScore = ratio;
    }
  }

  // If title has ZERO non-generic overlap and ZERO domain title matches,
  // role relevance is 0 (prevents off-domain keyword matches like 'Tax Analyst')
  if (!matchesAnyDomainTerm && titleScore === 0) {
    return {
      score: 0.0,
      titleScore: 0.0,
      semanticSimilarity: 0.0,
    };
  }

  const combinedTitleScore = Math.max(titleScore, domainScore * 0.9);

  // Contextual semantic similarity between candidate profile and JD
  const semanticSim = computeTfIdfCosineSimilarity(profile.contextText || '', job.descriptionText || '');

  // Role score is 70% title/domain alignment + 30% contextual similarity
  const finalRoleScore = Math.min(1, 0.7 * combinedTitleScore + 0.3 * (semanticSim * 2.5));

  return {
    score: Math.round(finalRoleScore * 100) / 100,
    titleScore: Math.round(combinedTitleScore * 100) / 100,
    semanticSimilarity: Math.round(semanticSim * 100) / 100,
  };
};

/**
 * 2. Technical Skills (Weight: 30%)
 * Evaluates matched, missing, and related technical skills.
 */
export const scoreTechnicalSkills = (profile, requirements) => {
  const candidateSkills = new Set(profile.skills || []);
  const skillEvidence = profile.skillEvidence || {};

  const required = [...requirements.requiredSkills];
  const preferred = [...requirements.preferredSkills];
  const allJobSkills = [...required, ...preferred];

  if (!allJobSkills.length) {
    // Missing skill data in job description: return neutral score without awarding full credit
    return {
      score: MATCHING.unknownFactorScore,
      matched: [],
      missing: [],
      missingRequired: [],
      missingPreferred: [],
      related: [],
      certificationsMissing: [],
    };
  }

  const matched = [];
  const missingRequired = [];
  const missingPreferred = [];
  const related = [];
  const certificationsMissing = [];

  let earnedPoints = 0;
  let totalPoints = 0;

  // Process required skills (weight = 2)
  for (const skill of required) {
    totalPoints += 2;
    if (candidateSkills.has(skill)) {
      matched.push(skill);
      const ev = skillEvidence[skill];
      earnedPoints += ev === 'demonstrated' ? 2 : 1.7; // demonstrated vs listed
    } else {
      const rel = relatedSkills(skill, candidateSkills);
      if (rel.length > 0) {
        related.push({ skill, possessedRelated: rel });
        earnedPoints += 1.0; // Partial credit for transferable skill
      } else {
        missingRequired.push(skill);
        if (isCertification(skill)) certificationsMissing.push(skill);
      }
    }
  }

  // Process preferred skills (weight = 1)
  for (const skill of preferred) {
    totalPoints += 1;
    if (candidateSkills.has(skill)) {
      matched.push(skill);
      earnedPoints += 1;
    } else {
      missingPreferred.push(skill);
      if (isCertification(skill)) certificationsMissing.push(skill);
    }
  }

  const rawScore = totalPoints > 0 ? earnedPoints / totalPoints : 0;
  const score = Math.min(1, Math.max(0, Math.round(rawScore * 100) / 100));

  return {
    score,
    matched: [...new Set(matched)],
    missing: [...new Set([...missingRequired, ...missingPreferred])],
    missingRequired,
    missingPreferred,
    related,
    certificationsMissing,
  };
};

/**
 * 3. Experience Compatibility (Weight: 20%)
 * Evaluates years of experience and seniority level.
 */
export const scoreExperience = (profile, requirements) => {
  const candidateYears = profile.experience?.years || 0;
  const candidateLevel = profile.level; // 'student' | 'fresher' | 'junior' | 'mid' | 'senior'
  const jobLevel = requirements.derivedLevel;
  const minYears = requirements.minYearsRequired;

  // Unknown experience requirements
  if (minYears === null && !requirements.isSeniorTitle && !requirements.isInternTitle && !requirements.isEntryTitle) {
    return {
      score: MATCHING.unknownFactorScore,
      incompatible: false,
      reason: 'Experience requirements not specified',
    };
  }

  // Seniority mismatch checks
  const isFresherOrStudent = candidateLevel === 'student' || candidateLevel === 'fresher';

  if (isFresherOrStudent) {
    // Fresher applying to Senior or Lead
    if (requirements.isSeniorTitle || (minYears !== null && minYears >= 4)) {
      return {
        score: 0.05,
        incompatible: true,
        reason: `Role requires ${minYears ? minYears + '+ years' : 'senior'} experience, but candidate is an entry-level fresher.`,
      };
    }
    // Fresher applying to Intern or Entry
    if (jobLevel === 'intern' || jobLevel === 'entry' || (minYears !== null && minYears <= 1)) {
      return { score: 1.0, incompatible: false, reason: 'Matches fresher/entry-level experience' };
    }
    // Mid role with 2-3 years: partial compatibility
    if (minYears !== null && minYears <= 2) {
      return { score: 0.6, incompatible: false, reason: 'Requires 1-2 years experience (stretch role)' };
    }
    return { score: 0.3, incompatible: false, reason: 'Experience exceeds candidate entry level' };
  }

  // Experienced candidate
  if (minYears !== null) {
    if (candidateYears >= minYears) {
      // Overqualified for an internship?
      if (requirements.isInternTitle && candidateYears >= 3) {
        return { score: 0.3, incompatible: false, reason: 'Internship role for experienced candidate' };
      }
      return { score: 1.0, incompatible: false, reason: 'Meets required years of experience' };
    } else {
      // Below required years
      const gap = minYears - candidateYears;
      if (gap <= 1) return { score: 0.75, incompatible: false, reason: 'Close to required experience' };
      if (gap <= 2) return { score: 0.5, incompatible: false, reason: '1-2 years below preferred experience' };
      return { score: 0.2, incompatible: gap >= 4, reason: `Requires ${minYears}+ years (gap of ${gap} years)` };
    }
  }

  // Fallback level-based matching
  if (candidateLevel === jobLevel) return { score: 1.0, incompatible: false };
  if ((candidateLevel === 'mid' && jobLevel === 'entry') || (candidateLevel === 'junior' && jobLevel === 'mid')) {
    return { score: 0.8, incompatible: false };
  }
  return { score: 0.5, incompatible: false };
};

/**
 * 4. Location (Weight: 10%)
 * Evaluates candidate location preference vs job location.
 */
export const scoreLocation = (job, userPreferences, countryHint) => {
  const targetCountry = (userPreferences?.country || countryHint?.code || 'in').toLowerCase();
  const targetLocation = (userPreferences?.location || '').trim().toLowerCase();
  const jobLoc = (job.location || '').toLowerCase();
  const jobCountry = (job.country || '').toLowerCase();

  // If remote
  if (userPreferences?.remoteOnly || targetLocation === 'remote') {
    if (job.isRemote || jobLoc.includes('remote')) return { score: 1.0, remote: true, reason: 'Remote match' };
    return { score: 0.2, remote: false, reason: 'Candidate prefers remote only' };
  }

  // Remote friendly job
  if (job.isRemote || jobLoc.includes('remote')) {
    return { score: 1.0, remote: true, reason: 'Remote eligible' };
  }

  // Cross-country mismatch
  if (jobCountry && targetCountry && jobCountry !== targetCountry) {
    return { score: 0.0, incompatible: true, reason: `Located in ${jobCountry.toUpperCase()}, preference is ${targetCountry.toUpperCase()}` };
  }

  // City match if user specified explicit city
  if (targetLocation && targetLocation !== 'all' && targetLocation !== targetCountry) {
    if (jobLoc.includes(targetLocation)) {
      return { score: 1.0, remote: false, reason: 'Matches target city' };
    }
    // Same country but different city
    return { score: 0.6, remote: false, reason: `Located in ${job.location || 'different city'} (${jobCountry.toUpperCase()})` };
  }

  // Country match without specific city preference
  return { score: 0.9, remote: false, reason: 'Matches target country' };
};

/**
 * 5. Qualifications (Weight: 10%)
 * Degree requirements and mandatory certifications.
 */
export const scoreQualifications = (profile, requirements) => {
  const candidateDegree = profile.education?.level || 'none';
  const candRank = DEGREE_RANK[candidateDegree] || 0;
  const reqDegree = requirements.requiredDegree;

  let degreeScore = MATCHING.unknownFactorScore;
  if (reqDegree) {
    const reqRank = DEGREE_RANK[reqDegree] || 0;
    if (candRank >= reqRank) {
      degreeScore = 1.0;
    } else if (candRank === reqRank - 1) {
      degreeScore = 0.6; // e.g. has bachelor, asks for master
    } else {
      degreeScore = 0.3;
    }
  }

  // Certifications
  let certScore = 1.0;
  const missingCerts = requirements.requiredSkills
    ? [...requirements.requiredSkills].filter(
        (s) => isCertification(s) && !profile.certifications?.includes(s)
      )
    : [];

  if (missingCerts.length > 0) {
    certScore = 0.5;
  }

  const finalScore = Math.min(1, 0.7 * degreeScore + 0.3 * certScore);
  return {
    score: Math.round(finalScore * 100) / 100,
    degreeMatched: !reqDegree || candRank >= (DEGREE_RANK[reqDegree] || 0),
    missingCertifications: missingCerts,
  };
};

// ---------------------------------------------------------------------------
// 4. Master Match Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single job against candidate profile & user preferences.
 */
export const evaluateJobMatch = (job, profile, userPreferences = {}) => {
  const requirements = parseJobRequirements(job);

  // --- HARD FILTER 1: Security clearance restriction ---
  if (requirements.requiresClearance) {
    return {
      eligible: false,
      filterReason: 'Security clearance required (incompatible for general applicants)',
      fitScore: 0,
    };
  }

  // --- HARD FILTER 2: Incompatible seniority for freshers/students ---
  const isFresher = profile.level === 'student' || profile.level === 'fresher';
  if (isFresher) {
    if (requirements.isSeniorTitle) {
      return {
        eligible: false,
        filterReason: 'Senior/lead title incompatible with fresher/student profile',
        fitScore: 0,
      };
    }
    if (requirements.minYearsRequired !== null && requirements.minYearsRequired >= 4) {
      return {
        eligible: false,
        filterReason: `Requires ${requirements.minYearsRequired}+ years experience (incompatible with fresher)`,
        fitScore: 0,
      };
    }
  }

  // --- HARD FILTER 3: Employment type preference ---
  const prefType = userPreferences.employmentType; // 'all' | 'internship' | 'full_time'
  if (prefType === 'internship' && !requirements.isInternTitle) {
    return {
      eligible: false,
      filterReason: 'Candidate requested internship roles only',
      fitScore: 0,
    };
  }
  if (prefType === 'full_time' && requirements.isInternTitle) {
    return {
      eligible: false,
      filterReason: 'Candidate requested full-time roles only (excluding internships)',
      fitScore: 0,
    };
  }

  // --- Score Factors ---
  const role = scoreRoleRelevance(profile, job);
  const skills = scoreTechnicalSkills(profile, requirements);
  const experience = scoreExperience(profile, requirements);
  const location = scoreLocation(job, userPreferences, profile.countryHint);
  const qualifications = scoreQualifications(profile, requirements);

  // Hard filter on location mismatch if explicit cross-country
  if (location.incompatible) {
    return {
      eligible: false,
      filterReason: location.reason,
      fitScore: 0,
    };
  }

  // --- HARD FILTER 4: Role relevance threshold ---
  // If role has near zero relevance, it's an unrelated keyword hit
  if (role.score < MATCHING.minRoleRelevance && role.titleScore < 0.2) {
    return {
      eligible: false,
      filterReason: 'Role is outside candidate career domains (unrelated keyword hit)',
      fitScore: 0,
    };
  }

  // Compute weighted hybrid score
  let weightedScore =
    MATCH_WEIGHTS.role * role.score +
    MATCH_WEIGHTS.skills * skills.score +
    MATCH_WEIGHTS.experience * experience.score +
    MATCH_WEIGHTS.location * location.score +
    MATCH_WEIGHTS.qualifications * qualifications.score;

  // Penalize keyword-only matches:
  // If skills match purely on coincidence but role relevance is weak
  if (role.score < 0.35 && weightedScore > MATCHING.keywordOnlyCap / 100) {
    weightedScore = MATCHING.keywordOnlyCap / 100;
  }

  const fitScore = Math.min(100, Math.max(0, Math.round(weightedScore * 100)));

  // If fit score is below minimum display threshold
  if (fitScore < MATCHING.minFitScore) {
    return {
      eligible: false,
      filterReason: `Fit score (${fitScore}%) below minimum relevance threshold`,
      fitScore,
    };
  }

  // Warnings for uncertain eligibility
  const eligibilityWarnings = [];
  if (experience.reason && experience.score < 0.7 && !experience.incompatible) {
    eligibilityWarnings.push(experience.reason);
  }
  if (requirements.minYearsRequired && profile.experience?.years < requirements.minYearsRequired) {
    eligibilityWarnings.push(`Requires ${requirements.minYearsRequired}+ years experience (resume indicates ${profile.experience.years} yrs)`);
  }
  if (skills.certificationsMissing.length > 0) {
    eligibilityWarnings.push(`Certification mentioned: ${skills.certificationsMissing.join(', ')}`);
  }
  if (!qualifications.degreeMatched && requirements.requiredDegree) {
    eligibilityWarnings.push(`Requires ${requirements.requiredDegree} degree`);
  }

  // Generate concise explanation
  const explanation = generateMatchExplanation({
    fitScore,
    role,
    skills,
    experience,
    profile,
    job,
    requirements,
  });

  // Format salary display string
  const salary = formatSalary(job);

  // Format employment type
  const employmentType = requirements.isInternTitle
    ? 'Internship'
    : job.contractTime === 'part_time'
    ? 'Part-time'
    : job.contractType === 'contract'
    ? 'Contract'
    : 'Full-time';

  return {
    eligible: true,
    fitScore,
    explanation,
    matchedSkills: skills.matched.slice(0, 15),
    missingSkills: skills.missing.slice(0, 15),
    missingRequired: skills.missingRequired,
    missingPreferred: skills.missingPreferred,
    relatedSkills: skills.related,
    eligibilityWarnings,
    employmentType,
    salary,
    scoreBreakdown: {
      role: Math.round(role.score * 100),
      skills: Math.round(skills.score * 100),
      experience: Math.round(experience.score * 100),
      location: Math.round(location.score * 100),
      qualifications: Math.round(qualifications.score * 100),
    },
    experienceLevel: requirements.derivedLevel === 'intern' ? 'Internship' : requirements.derivedLevel === 'entry' ? 'Entry Level' : requirements.derivedLevel === 'mid' ? 'Mid Level' : 'Senior',
  };
};

// ---------------------------------------------------------------------------
// 5. Explanations & Formatting
// ---------------------------------------------------------------------------

const generateMatchExplanation = ({ fitScore, role, skills, experience, profile, job, requirements }) => {
  const parts = [];

  // Role fit
  if (role.titleScore >= 0.8) {
    parts.push(`Strong role match for your target career in ${profile.domains?.[0]?.label || 'tech'}.`);
  } else if (role.score >= 0.5) {
    parts.push(`Aligns with your technical background.`);
  }

  // Skill alignment
  if (skills.matched.length > 0) {
    const topSkills = skills.matched.slice(0, 3).join(', ');
    parts.push(`Matches key skills (${topSkills}).`);
  }

  // Experience
  if (requirements.isInternTitle && (profile.level === 'student' || profile.level === 'fresher')) {
    parts.push('Great fit for students and freshers.');
  } else if (experience.score >= 0.9) {
    parts.push('Experience level is well-matched.');
  } else if (experience.reason) {
    parts.push(experience.reason + '.');
  }

  // Gaps
  if (skills.missingRequired.length > 0) {
    const topMissing = skills.missingRequired.slice(0, 2).join(', ');
    parts.push(`Skill gap: ${topMissing}.`);
  }

  return parts.join(' ');
};

const formatSalary = (job) => {
  if (!job.salaryMin && !job.salaryMax) return null;
  const curr = job.salaryCurrency === 'INR' ? '₹' : job.salaryCurrency === 'USD' ? '$' : job.salaryCurrency === 'GBP' ? '£' : '';
  const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString());

  if (job.salaryMin && job.salaryMax) {
    if (job.salaryMin === job.salaryMax) return `${curr}${fmt(job.salaryMin)}`;
    return `${curr}${fmt(job.salaryMin)} - ${curr}${fmt(job.salaryMax)}`;
  }
  if (job.salaryMin) return `From ${curr}${fmt(job.salaryMin)}`;
  return `Up to ${curr}${fmt(job.salaryMax)}`;
};

// ---------------------------------------------------------------------------
// 6. Deduplication & Near-Duplicate Removal
// ---------------------------------------------------------------------------

const normalizeTitle = (t) =>
  (t || '')
    .toLowerCase()
    .replace(/\b(hiring|urgent|immediate|immediate\s+joiner|joiner|joiners|remote|wfh|job|jobs|opening|openings|fresher|internship|intern)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCompany = (c) =>
  (c || '')
    .toLowerCase()
    .replace(/\b(pvt|ltd|inc|llc|technologies|solutions|services|corp|corporation|private\s+limited|limited)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

export const deduplicateJobs = (jobs) => {
  const seenIds = new Set();
  const seenClusters = new Map(); // key -> job
  const result = [];

  for (const job of jobs) {
    if (!job.jobId || seenIds.has(job.jobId)) continue;
    seenIds.add(job.jobId);

    const normComp = normalizeCompany(job.company);
    const normTit = normalizeTitle(job.title);

    // If company is known, cluster on company + normalized title
    if (normComp && normComp.length > 2) {
      const clusterKey = `${normComp}:${normTit}`;
      if (seenClusters.has(clusterKey)) {
        const existing = seenClusters.get(clusterKey);
        // If this one has higher fitScore or is newer, replace it
        if ((job.fitScore || 0) > (existing.fitScore || 0)) {
          const idx = result.indexOf(existing);
          if (idx !== -1) result[idx] = job;
          seenClusters.set(clusterKey, job);
        }
        continue;
      }
      seenClusters.set(clusterKey, job);
    }

    result.push(job);
  }

  return result;
};

// ---------------------------------------------------------------------------
// 7. Legacy Export for backward compatibility
// ---------------------------------------------------------------------------

export const scoreJobFit = (resumeText, jobDescriptionText) => {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescriptionText, { strict: true });

  const matched = [];
  const missing = [];

  for (const [skill] of jdSkills.entries()) {
    if (resumeSkills.has(skill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = jdSkills.size ? Math.round((matched.length / jdSkills.size) * 100) : 0;

  return {
    fitScore: score,
    scorable: jdSkills.size > 0,
    matchedSkills: matched.slice(0, 15),
    missingSkills: missing.slice(0, 15),
  };
};
