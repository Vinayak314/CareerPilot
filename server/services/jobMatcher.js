import { extractSkills } from './keywords.js';

/**
 * Fast local job-fit scoring using keyword matching.
 * This avoids expensive LLM calls for bulk job searches.
 */
export const scoreJobFit = (resumeText, jobDescriptionText) => {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescriptionText);
  
  if (jdSkills.size === 0) {
    return {
      fitScore: 50, // Neutral score if no skills found
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matched = [];
  const missing = [];

  for (const [skill, count] of jdSkills.entries()) {
    if (resumeSkills.has(skill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = Math.round((matched.length / (matched.length + missing.length)) * 100);

  return {
    fitScore: score,
    matchedSkills: matched.slice(0, 15), // Cap to prevent huge documents
    missingSkills: missing.slice(0, 15),
  };
};
