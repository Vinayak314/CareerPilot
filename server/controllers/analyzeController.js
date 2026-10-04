import { z } from 'zod';
import { resolveJobDescription } from '../services/jobDescription.js';
import { runAnalyzer } from '../agents/analyzerAgent.js';
import { textHash } from '../utils/hash.js';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import { notFound, badRequest } from '../utils/httpError.js';

export const analyzeRequestSchema = z.object({
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID'),
  jobDescriptionText: z.string().optional(),
  jobDescriptionUrl: z.string().url('Invalid job URL').optional().or(z.literal('')),
}).refine(data => data.jobDescriptionText || data.jobDescriptionUrl, {
  message: "Either jobDescriptionText or jobDescriptionUrl must be provided",
  path: ["jobDescriptionText"],
});

export const createAnalysis = async (req, res, next) => {
  try {
    const { resumeId, jobDescriptionText, jobDescriptionUrl } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    const jobDesc = await resolveJobDescription({ jobDescriptionText, jobDescriptionUrl });
    const jdHash = textHash(jobDesc.text);
    const inputHash = textHash(resume.textHash + jdHash);

    // Cache hit: If this user has analyzed this exact resume text against this exact JD text before
    const existing = await Analysis.findOne({ userId, inputHash }).sort({ createdAt: -1 });
    if (existing) {
      return res.status(200).json({ analysis: existing });
    }

    // Cache miss: Run the analyzer
    const result = await runAnalyzer({ resume, jobDescription: jobDesc });

    const analysis = await Analysis.create({
      userId,
      resumeId,
      jobDescriptionText: jobDesc.text,
      jobDescriptionUrl: jobDescriptionUrl || undefined,
      inputHash,
      ...result,
    });

    res.status(201).json({ analysis });
  } catch (error) {
    next(error);
  }
};

export const listAnalyses = async (req, res, next) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-weakBullets -formattingIssues -recommendations -missingKeywords -partialKeywords -matchedKeywords -categoryScores')
      .populate('resumeId', 'fileName fileType');
    res.json(analyses);
  } catch (error) {
    next(error);
  }
};

export const getLatestAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('resumeId', 'fileName fileType');
    
    if (!analysis) throw notFound('No analyses found.');
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

export const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('resumeId', 'fileName fileType');
      
    if (!analysis) throw notFound('Analysis not found.');
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};
