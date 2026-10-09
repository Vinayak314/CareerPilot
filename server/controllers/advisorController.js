import { resolveJobDescription } from '../services/jobDescription.js';
import { runRewrites, runInterviewPrep, runInterviewFeedback } from '../agents/advisorAgent.js';
import { runFullOrchestration } from '../agents/orchestrator.js';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import { notFound, badRequest } from '../utils/httpError.js';
import { z } from 'zod';

export const advisorRequestSchema = z.object({
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID'),
  analysisId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid analysis ID').optional(),
  jobDescriptionText: z.string().optional(),
  jobDescriptionUrl: z.string().optional(),
});

export const interviewFeedbackRequestSchema = z.object({
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID'),
  analysisId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid analysis ID'),
  question: z.string().trim().min(1).max(1000),
  category: z.string().trim().max(100).optional(),
  answer: z.string().trim().min(10, 'Write at least a sentence before requesting feedback.').max(6000),
});

export const getRewrites = async (req, res, next) => {
  try {
    const { resumeId, analysisId } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    const analysis = await Analysis.findOne({ _id: analysisId, userId });
    if (!analysis) throw notFound('Analysis not found.');

    const jobDesc = await resolveJobDescription({ jobDescriptionText: analysis.jobDescriptionText });
    
    const result = await runRewrites({ 
      resume, 
      jobDescription: jobDesc, 
      weakBullets: analysis.weakBullets 
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInterviewPrep = async (req, res, next) => {
  try {
    const { resumeId, analysisId } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    const analysis = await Analysis.findOne({ _id: analysisId, userId });
    if (!analysis) throw notFound('Analysis not found.');

    const jobDesc = await resolveJobDescription({ jobDescriptionText: analysis.jobDescriptionText });
    
    const result = await runInterviewPrep({ 
      resume, 
      jobDescription: jobDesc, 
      analysis 
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInterviewAnswerFeedback = async (req, res, next) => {
  try {
    const { resumeId, analysisId, question, category, answer } = req.body;
    const userId = req.user._id;
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    const analysis = await Analysis.findOne({ _id: analysisId, resumeId, userId });
    if (!analysis) throw notFound('Analysis not found for this resume.');
    if (!process.env.GEMINI_API_KEY || process.env.AI_DISABLED === 'true') {
      throw badRequest('AI feedback is unavailable. Configure Gemini to review answers.');
    }

    const jobDescription = await resolveJobDescription({ jobDescriptionText: analysis.jobDescriptionText });
    const feedback = await runInterviewFeedback({ resume, jobDescription, question, category, answer });
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const runFullWorkflow = async (req, res, next) => {
  try {
    const { resumeId, jobDescriptionText, jobDescriptionUrl } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    const jobDesc = await resolveJobDescription({ jobDescriptionText, jobDescriptionUrl });
    
    // Orchestrator handles analysis + parallel advisor tasks
    const result = await runFullOrchestration(resume, jobDesc);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
