import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import { fetchJobs } from '../services/jobProvider.js';
import { scoreJobFit } from '../services/jobMatcher.js';
import { extractSkills } from '../services/keywords.js';
import { notFound, badRequest } from '../utils/httpError.js';
import { z } from 'zod';

export const findMatchesSchema = z.object({
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID'),
  location: z.string().optional(),
});

export const findMatches = async (req, res, next) => {
  try {
    const { resumeId, location } = req.body;
    const userId = req.user._id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw notFound('Resume not found.');

    // Build search terms only from the selected resume, then include an
    // internship-specific search so internship results are available to filter.
    const resumeSkills = resume.parsed?.skills?.length
      ? resume.parsed.skills
      : [...extractSkills(resume.rawText).keys()];
    const searchQuery = resumeSkills.slice(0, 6).join(' ') || resume.parsed?.summary?.split(/\s+/).slice(0, 6).join(' ') || 'entry level';
    const [jobs, internships] = await Promise.all([
      fetchJobs({ query: searchQuery, location }),
      fetchJobs({ query: `internship ${searchQuery}`, location }),
    ]);
    const resultsById = new Map();
    for (const job of jobs) resultsById.set(job.jobId, job);
    for (const internship of internships) resultsById.set(internship.jobId, internship);
    const availableJobs = [...resultsById.values()];

    const matchesToSave = [];
    for (const job of availableJobs) {
      const scoring = scoreJobFit(resume.rawText, job.descriptionText);
      if (!scoring.scorable) continue;
      
      matchesToSave.push({
        userId,
        resumeId,
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        descriptionText: job.descriptionText,
        fitScore: scoring.fitScore,
        matchedSkills: scoring.matchedSkills,
        missingSkills: scoring.missingSkills,
        status: 'Matched',
      });
    }

    // Upsert matches (if they already exist for this user/job, don't duplicate, just update score)
    const savedMatches = await Promise.all(
      matchesToSave.map(async (match) => {
        return JobMatch.findOneAndUpdate(
          { userId, jobId: match.jobId },
          match,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      })
    );

    // Return top matches sorted by score
    const topMatches = savedMatches.sort((a, b) => b.fitScore - a.fitScore);
    res.status(200).json(topMatches);
  } catch (error) {
    next(error);
  }
};

export const getMatches = async (req, res, next) => {
  try {
    const matches = await JobMatch.find({ userId: req.user._id, jobId: { $not: /^mock-/ } })
      .sort({ fitScore: -1 });
    res.json(matches);
  } catch (error) {
    next(error);
  }
};

export const updateMatchStatusSchema = z.object({
  status: z.enum(['Matched', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected']),
});

export const updateMatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const match = await JobMatch.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { returnDocument: 'after' }
    );
    if (!match) throw notFound('Match not found.');
    res.json(match);
  } catch (error) {
    next(error);
  }
};
