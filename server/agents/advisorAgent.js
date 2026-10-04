import { isAiEnabled, invokeStructured } from '../services/gemini.js';
import { RewriteModelSchema, RewriteResultSchema, InterviewModelSchema, InterviewResultSchema } from './schemas.js';

export const runRewrites = async ({ resume, jobDescription, weakBullets }) => {
  if (!isAiEnabled() || !weakBullets || weakBullets.length === 0) {
    return { rewrites: [] };
  }

  const jdText = jobDescription.text;
  const systemMessage = `You are an expert technical recruiter and resume writer. 
Rewrite the provided weak resume bullets to make them high-impact, ATS-friendly, and targeted to the job description.
Use action verbs, metrics (if implied or plausible to ask for), and required keywords.
Do NOT lie or invent completely fake experiences, but you can phrase things in a highly professional way.`;

  const userMessage = `--- JOB DESCRIPTION ---
${jdText}

--- WEAK BULLETS ---
${JSON.stringify(weakBullets, null, 2)}

Provide 2-3 rewrite options for each weak bullet.`;

  try {
    const result = await invokeStructured({
      schema: RewriteModelSchema,
      name: 'Advisor-Rewriter',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      runName: 'rewrite-bullets',
    });

    return RewriteResultSchema.parse(result.parsed);
  } catch (error) {
    console.warn('[Advisor] Rewriter failed:', error.message);
    return { rewrites: [] };
  }
};

export const runInterviewPrep = async ({ resume, jobDescription, analysis }) => {
  if (!isAiEnabled()) {
    return { questions: [] };
  }

  const jdText = jobDescription.text;
  const resumeText = resume.rawText;
  
  const systemMessage = `You are a technical hiring manager conducting an interview.
Based on the candidate's resume and the job description, generate tailored interview questions.
Focus on:
1. Gaps or missing skills identified in the analysis.
2. Deep dives into their listed experience to verify claims.
3. Behavioral questions relevant to the role's requirements.`;

  const userMessage = `--- JOB DESCRIPTION ---
${jdText}

--- RESUME TEXT ---
${resumeText}

--- PREVIOUS ANALYSIS (Gaps, Missing Skills) ---
Missing Skills: ${analysis.missingKeywords?.join(', ') || 'None'}
Partial Skills: ${analysis.partialKeywords?.join(', ') || 'None'}

Provide 5-7 tailored interview questions.`;

  try {
    const result = await invokeStructured({
      schema: InterviewModelSchema,
      name: 'Advisor-Interviewer',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.6,
      runName: 'interview-prep',
    });

    return InterviewResultSchema.parse(result.parsed);
  } catch (error) {
    console.warn('[Advisor] Interviewer failed:', error.message);
    return { questions: [] };
  }
};
