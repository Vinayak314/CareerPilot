import { z } from 'zod';

/**
 * Zod schemas for agent output.
 *
 * Each agent has two schemas:
 *  - a *model* schema bound to Gemini via withStructuredOutput. It is deliberately
 *    permissive (plain strings/numbers/arrays with descriptions) because Gemini's
 *    function-calling schema subset rejects many JSON-Schema constraints;
 *  - a *result* schema that every output (AI or heuristic) must pass before it is
 *    persisted. It trims, clamps, dedupes and caps lists so stored data is always clean.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const clampScore = (n) => Math.round(Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)));

export const scoreField = z.coerce.number().transform(clampScore);

const dedupe = (items, max) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
};

export const stringList = (max, itemMax = 120) =>
  z
    .array(z.string())
    .default([])
    .transform((items) => dedupe(items.map((s) => s.trim().slice(0, itemMax)).filter(Boolean), max));

const text = (max) => z.string().default('').transform((s) => s.trim().slice(0, max));

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export const AnalyzerModelSchema = z.object({
  jobTitle: z.string().describe('Job title from the job description, or an empty string if not stated'),
  company: z.string().describe('Hiring company name from the job description, or an empty string if not stated'),
  atsScore: z.number().describe('Overall ATS match score from 0 to 100 (integer)'),
  summary: z.string().describe('Two or three sentence plain-English verdict on how well the resume fits this job'),
  categoryScores: z
    .array(
      z.object({
        label: z.string().describe('One of: Keyword Match, Skills Coverage, Experience Impact, Formatting'),
        score: z.number().describe('Score from 0 to 100 (integer)'),
      })
    )
    .describe('Exactly four category scores: Keyword Match, Skills Coverage, Experience Impact, Formatting'),
  matchedKeywords: z.array(z.string()).describe('Important job keywords/skills clearly evidenced in the resume'),
  missingKeywords: z.array(z.string()).describe('Critical required keywords/skills absent from the resume'),
  partialKeywords: z
    .array(z.string())
    .describe('Preferred skills that are missing, or required skills only weakly evidenced (e.g. listed but never demonstrated)'),
  weakBullets: z
    .array(
      z.object({
        bullet: z.string().describe('The resume bullet copied verbatim'),
        issue: z.string().describe('Why it is weak (vague, no metric, passive, missing keyword, etc.)'),
        suggestion: z.string().describe('Short concrete guidance for improving it (do not invent facts)'),
      })
    )
    .describe('Up to 8 of the weakest resume bullets relative to this job'),
  formattingIssues: z.array(z.string()).describe('ATS-relevant formatting/structure problems found in the resume'),
  recommendations: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .describe('3 to 5 prioritised, actionable recommendations'),
});

export const CATEGORY_KEYS = {
  'keyword match': 'keywordMatch',
  'skills coverage': 'skillsCoverage',
  'experience impact': 'experienceImpact',
  formatting: 'formatting',
};

export const AnalysisResultSchema = z.object({
  jobTitle: text(120),
  company: text(120),
  atsScore: scoreField,
  summary: text(1200),
  categoryScores: z
    .array(z.object({ label: z.string().trim().min(1).max(60), score: scoreField }))
    .default([])
    .transform((items) =>
      items.slice(0, 6).map((c) => ({ key: CATEGORY_KEYS[c.label.toLowerCase()] || undefined, ...c }))
    ),
  matchedKeywords: stringList(40, 60),
  missingKeywords: stringList(25, 60),
  partialKeywords: stringList(25, 60),
  weakBullets: z
    .array(z.object({ bullet: text(600), issue: text(300), suggestion: text(400) }))
    .default([])
    .transform((items) => items.filter((b) => b.bullet).slice(0, 10)),
  formattingIssues: stringList(12, 240),
  recommendations: z
    .array(z.object({ title: text(120), description: text(500) }))
    .default([])
    .transform((items) => items.filter((r) => r.title || r.description).slice(0, 6)),
});

// ---------------------------------------------------------------------------
// Advisor - Rewrites
// ---------------------------------------------------------------------------

export const RewriteModelSchema = z.object({
  rewrites: z
    .array(
      z.object({
        bullet: z.string().describe('The original resume bullet copied verbatim'),
        options: z
          .array(z.string())
          .describe('2-3 different high-impact rewrite options for the bullet'),
      })
    )
    .describe('List of rewrites for the weak bullets provided'),
});

export const RewriteResultSchema = z.object({
  rewrites: z
    .array(
      z.object({
        bullet: text(600),
        options: z
          .array(text(600))
          .default([])
          .transform((items) => items.filter(Boolean).slice(0, 4)),
      })
    )
    .default([])
    .transform((items) => items.filter((r) => r.bullet && r.options.length > 0).slice(0, 10)),
});

// ---------------------------------------------------------------------------
// Advisor - Interview Prep
// ---------------------------------------------------------------------------

export const InterviewModelSchema = z.object({
  questions: z
    .array(
      z.object({
        type: z.string().describe('Type of question (e.g., Technical, Behavioral, Experience)'),
        question: z.string().describe('The interview question'),
        rationale: z.string().describe('Why the interviewer is asking this based on the JD or resume gap'),
        tips: z.string().describe('Tips for answering effectively'),
      })
    )
    .describe('List of 5 to 7 tailored interview questions'),
});

export const InterviewResultSchema = z.object({
  questions: z
    .array(
      z.object({
        type: text(60),
        question: text(400),
        rationale: text(600),
        tips: text(600),
      })
    )
    .default([])
    .transform((items) => items.filter((q) => q.question).slice(0, 10)),
});

