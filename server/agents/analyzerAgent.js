import { isAiEnabled, invokeStructured } from '../services/gemini.js';
import { extractSkills, extractKeyTerms, mentionsSkill, SKILL_LABELS } from '../services/keywords.js';
import { AnalyzerModelSchema, AnalysisResultSchema } from './schemas.js';

/**
 * AI implementation of the analyzer agent. Uses Gemini to grade the resume against
 * the job description, extract gaps, and identify weak bullets.
 */
const runAiAnalyzer = async ({ resume, jobDescription }) => {
  const jdText = jobDescription.text;
  const resumeText = resume.rawText;
  
  const systemMessage = `You are an expert ATS (Applicant Tracking System) simulator and technical recruiter.
Your job is to rigorously evaluate a resume against a job description. Be objective and strict—do not inflate scores.

Follow these rules:
1. Keyword Match: Check if the exact or synonymous hard skills required in the job description appear in the resume.
2. Skills Coverage: Evaluate if the resume demonstrates the breadth of required skills, not just listing them but using them in context.
3. Experience Impact: Assess if the experience bullets are action-oriented, include metrics, and prove the candidate's capabilities.
4. Formatting: Look for ATS-friendly formatting (plain text extraction shouldn't have weird artifacts).
5. Only suggest missing skills that are actually required or strongly preferred by the job description.
6. For weak bullets, pick ones that lack metrics, use passive voice, or miss an opportunity to highlight a required skill.`;

  const userMessage = `--- JOB DESCRIPTION ---
${jdText}

--- RESUME TEXT ---
${resumeText}

Analyze the resume against the job description and provide the structured evaluation.`;

  const result = await invokeStructured({
    schema: AnalyzerModelSchema,
    name: 'Analyzer',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2, // Low temperature for consistent scoring
    runName: 'analyze-resume',
  });

  return {
    ...result.parsed,
    source: 'gemini',
    model: result.model,
    latencyMs: result.latencyMs,
    tokenUsage: result.usage,
  };
};

/**
 * Heuristic fallback for the analyzer agent. Used when AI is disabled or fails.
 * Uses local keyword extraction to provide a basic gap analysis.
 */
const runHeuristicAnalyzer = ({ resume, jobDescription }) => {
  const jdText = jobDescription.text;
  const resumeText = resume.rawText;
  const parsed = resume.parsed || {};

  const jdSkills = extractSkills(jdText);
  const resumeSkills = extractSkills(resumeText);
  
  const matched = [];
  const missing = [];
  
  for (const [skill, count] of jdSkills.entries()) {
    if (resumeSkills.has(skill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  // Extract other key terms from JD as partial matches
  const jdTerms = extractKeyTerms(jdText, { exclude: new Set([...matched, ...missing]) });
  const partial = [];
  for (const term of jdTerms) {
    if (!resumeText.toLowerCase().includes(term.toLowerCase())) {
      partial.push(term);
    }
  }

  const score = Math.round((matched.length / (matched.length + missing.length || 1)) * 100);
  
  let summary = `Your resume matches ${score}% of the core skills found in the job description. `;
  if (missing.length > 0) {
    summary += `Consider adding evidence of ${missing.slice(0, 3).join(', ')} if you have those skills.`;
  } else {
    summary += "You have great keyword alignment!";
  }

  return {
    jobTitle: jobDescription.jobTitle || 'Unknown Role',
    company: jobDescription.company || 'Unknown Company',
    atsScore: score,
    summary,
    categoryScores: [
      { label: 'Keyword Match', score: score },
      { label: 'Skills Coverage', score: Math.max(0, score - 10) },
      { label: 'Experience Impact', score: 70 }, // Heuristic can't really judge this
      { label: 'Formatting', score: 85 } // Assume OK if we parsed it
    ],
    matchedKeywords: matched,
    missingKeywords: missing,
    partialKeywords: partial.slice(0, 5),
    weakBullets: [], // Heuristic doesn't do bullet rewrites
    formattingIssues: [],
    recommendations: [
      {
        title: "Add missing keywords",
        description: "Incorporate missing skills organically into your experience bullets."
      }
    ],
    source: 'heuristic',
    fallbackReason: isAiEnabled() ? 'AI call failed' : 'AI not configured',
  };
};

/**
 * Main entry point for the Analyzer agent.
 * Tries the AI model first, falls back to heuristics if needed, and always validates
 * the final output against the strict result schema.
 */
export const runAnalyzer = async ({ resume, jobDescription }) => {
  let rawResult;
  
  if (isAiEnabled()) {
    try {
      rawResult = await runAiAnalyzer({ resume, jobDescription });
    } catch (error) {
      console.warn('[Analyzer] AI failed, falling back to heuristic:', error.message);
      rawResult = runHeuristicAnalyzer({ resume, jobDescription });
      rawResult.fallbackReason = error.message;
    }
  } else {
    rawResult = runHeuristicAnalyzer({ resume, jobDescription });
  }

  // Validate and clamp through the strict schema
  const validated = AnalysisResultSchema.parse(rawResult);
  
  // Re-attach the provenance data that the schema strips
  return {
    ...validated,
    source: rawResult.source,
    model: rawResult.model,
    fallbackReason: rawResult.fallbackReason,
    latencyMs: rawResult.latencyMs,
    tokenUsage: rawResult.tokenUsage,
  };
};
