import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import { searchAdzuna } from '../services/jobProvider.js';
import { buildCandidateProfile } from '../services/careerProfile.js';
import { evaluateJobMatch, deduplicateJobs } from '../services/jobMatcher.js';
import { notFound, badRequest } from '../utils/httpError.js';
import { ADZUNA } from '../config/matching.js';
import { z } from 'zod';

export const findMatchesSchema = z.object({
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID'),
  location: z.string().optional(),
  country: z.string().optional(),
  employmentType: z.enum(['all', 'full_time', 'internship', 'contract', 'part_time']).optional(),
  page: z.number().int().min(1).max(10).optional(),
});

export const findMatches = async (req, res, next) => {
  try {
    const { resumeId, location: reqLocation, country: reqCountry, employmentType: reqEmploymentType, page = 1 } = req.body;
    const userId = req.user._id;

    const [resume, user] = await Promise.all([
      Resume.findOne({ _id: resumeId, userId }),
      User.findById(userId).select('preferences'),
    ]);

    if (!resume) throw notFound('Resume not found.');

    // 1. Build rich, structured candidate profile
    const profile = buildCandidateProfile(resume);

    // 2. Resolve country & preferences (Explicit > User Prefs > Resume Hint > Default)
    const country = (
      reqCountry ||
      user?.preferences?.country ||
      profile.countryHint?.code ||
      ADZUNA.defaultCountry ||
      'in'
    ).toLowerCase();

    const location = (
      reqLocation !== undefined
        ? reqLocation
        : user?.preferences?.location || ''
    ).trim();

    const employmentType =
      reqEmploymentType ||
      user?.preferences?.employmentType ||
      'all';

    const userPreferences = {
      country,
      location,
      employmentType,
      remoteOnly: user?.preferences?.remoteOnly || location.toLowerCase() === 'remote',
    };

    // 3. Select search queries based on candidate profile and employment type
    let queries = [...profile.searchQueries];
    if (employmentType === 'internship') {
      queries = queries.filter((q) => q.includes('intern')).concat(
        queries.map((q) => (q.includes('intern') ? q : `${q} intern`))
      );
    } else if (employmentType === 'full_time') {
      queries = queries.filter((q) => !q.includes('intern'));
    }

    // Take top distinct queries, bounded by rate and performance constraints
    const uniqueQueries = [...new Set(queries)].slice(0, ADZUNA.maxQueries);
    if (!uniqueQueries.length) {
      uniqueQueries.push(profile.domains?.[0]?.label?.toLowerCase() || 'developer');
    }

    // 4. Concurrently query Adzuna for targeted role titles
    const searchPromises = uniqueQueries.map(async (query) => {
      try {
        const params = {
          title_only: query,
        };
        if (location && location.toLowerCase() !== 'remote' && location.toLowerCase() !== 'all') {
          params.where = location;
        }

        const res = await searchAdzuna({
          country,
          params,
          page,
        });
        return res.jobs || [];
      } catch (err) {
        // Log individual query error without aborting entire batch
        console.warn(`[JobMatch] Adzuna search failed for query "${query}":`, err.message);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    const rawJobs = results.flat();

    // 5. If title_only returned few or zero results, fall back to a broader 'what' search
    if (rawJobs.length < 5 && uniqueQueries[0]) {
      try {
        const fallbackRes = await searchAdzuna({
          country,
          params: {
            what: uniqueQueries[0],
            where: location && location.toLowerCase() !== 'remote' ? location : undefined,
          },
          page,
        });
        if (fallbackRes.jobs?.length) {
          rawJobs.push(...fallbackRes.jobs);
        }
      } catch (err) {
        console.warn('[JobMatch] Fallback search failed:', err.message);
      }
    }

    // 6. Deduplicate raw fetched listings by jobId
    const uniqueRawJobs = [];
    const seenJobIds = new Set();
    for (const j of rawJobs) {
      if (j.jobId && !seenJobIds.has(j.jobId)) {
        seenJobIds.add(j.jobId);
        uniqueRawJobs.push(j);
      }
    }

    // 7. Evaluate each job through Hybrid Matcher
    const evaluatedMatches = [];
    for (const job of uniqueRawJobs) {
      const evaluation = evaluateJobMatch(job, profile, userPreferences);
      if (!evaluation.eligible) continue;

      evaluatedMatches.push({
        userId,
        resumeId,
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        descriptionText: job.descriptionText,
        fitScore: evaluation.fitScore,
        explanation: evaluation.explanation,
        scoreBreakdown: evaluation.scoreBreakdown,
        matchedSkills: evaluation.matchedSkills,
        missingSkills: evaluation.missingSkills,
        missingRequired: evaluation.missingRequired,
        missingPreferred: evaluation.missingPreferred,
        relatedSkills: evaluation.relatedSkills,
        salary: evaluation.salary,
        employmentType: evaluation.employmentType,
        experienceLevel: evaluation.experienceLevel,
        eligibilityWarnings: evaluation.eligibilityWarnings,
        postedAt: job.postedAt || new Date(),
        country,
        status: 'Matched',
      });
    }

    // 8. Deduplicate clustered/near-duplicate listings (by company + title)
    const deduplicated = deduplicateJobs(evaluatedMatches);

    // 9. Persist/upsert into database
    const savedMatches = await Promise.all(
      deduplicated.map(async (match) => {
        return JobMatch.findOneAndUpdate(
          { userId, jobId: match.jobId },
          match,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      })
    );

    // 10. Sort by fitScore descending
    const sortedMatches = savedMatches.sort((a, b) => b.fitScore - a.fitScore);

    res.status(200).json(sortedMatches);
  } catch (error) {
    next(error);
  }
};

export const getMatches = async (req, res, next) => {
  try {
    const { status, sortBy = 'match', roleType = 'all' } = req.query;
    const filter = {
      userId: req.user._id,
      jobId: { $not: /^mock-/ },
    };

    if (status) {
      filter.status = status;
    }

    if (roleType === 'internships') {
      filter.employmentType = 'Internship';
    } else if (roleType === 'jobs') {
      filter.employmentType = { $ne: 'Internship' };
    }

    const sortOption = sortBy === 'date' ? { postedAt: -1 } : { fitScore: -1 };

    const matches = await JobMatch.find(filter).sort(sortOption);
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
