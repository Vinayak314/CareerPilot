import { invokeStructured } from '../services/gemini.js';
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

/** Run the AI analyzer and reject failures instead of substituting a synthetic score. */
export const runAnalyzer = async ({ resume, jobDescription }) => {
  const rawResult = await runAiAnalyzer({ resume, jobDescription });
  const validated = AnalysisResultSchema.parse(rawResult);
  return {
    ...validated,
    source: 'gemini',
    model: rawResult.model,
    latencyMs: rawResult.latencyMs,
    tokenUsage: rawResult.tokenUsage,
  };
};
