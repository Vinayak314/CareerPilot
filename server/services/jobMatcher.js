import { extractSkills } from './keywords.js';

/**
 * Fast local job-fit scoring using keyword matching.
 * This avoids expensive LLM calls for bulk job searches.
 */
export const scoreJobFit = (resumeText, jobDescriptionText) => {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescriptionText);
  
  const matched = [];
  const missing = [];

  for (const [skill, count] of jdSkills.entries()) {
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
    matchedSkills: matched.slice(0, 15), // Cap to prevent huge documents
    missingSkills: missing.slice(0, 15),
  };
};
