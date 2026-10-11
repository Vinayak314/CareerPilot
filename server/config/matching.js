/**
 * Job-matching configuration. Weights are percentages and are normalised at load
 * time, so they can be tuned via MATCH_WEIGHTS without code changes, e.g.
 *   MATCH_WEIGHTS={"role":35,"skills":30,"experience":15,"location":10,"qualifications":10}
 */
import 'dotenv/config'; // imports evaluate before server.js calls dotenv.config(); this is idempotent

const DEFAULT_WEIGHTS = {
  role: 30,
  skills: 30,
  experience: 20,
  location: 10,
  qualifications: 10,
};

const parseWeights = () => {
  if (!process.env.MATCH_WEIGHTS) return DEFAULT_WEIGHTS;
  try {
    const custom = JSON.parse(process.env.MATCH_WEIGHTS);
    const merged = { ...DEFAULT_WEIGHTS };
    for (const key of Object.keys(DEFAULT_WEIGHTS)) {
      if (Number.isFinite(custom[key]) && custom[key] >= 0) merged[key] = custom[key];
    }
    return merged;
  } catch {
    console.warn('[matching] MATCH_WEIGHTS is not valid JSON; using defaults.');
    return DEFAULT_WEIGHTS;
  }
};

const normalise = (weights) => {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
};

export const MATCH_WEIGHTS = normalise(parseWeights());

export const MATCHING = {
  /** Score (0..1) used for a factor the listing gives no evidence about — neutral, never full credit. */
  unknownFactorScore: 0.5,
  /** Jobs whose role relevance falls below this are treated as off-domain keyword hits. */
  minRoleRelevance: 0.25,
  /** Matches below this final score are not shown. */
  minFitScore: 30,
  /** Cap on the final score when the job is only a keyword overlap (wrong role/domain). */
  keywordOnlyCap: 45,
  /** Bump when scoring logic changes so stale stored matches can be recognised. */
  version: 2,
};

export const ADZUNA = {
  defaultCountry: (process.env.ADZUNA_DEFAULT_COUNTRY || 'in').toLowerCase(),
  maxDaysOld: Number(process.env.ADZUNA_MAX_DAYS_OLD) || 60,
  resultsPerPage: 50,
  /** Max distinct role queries per search request (each is one Adzuna call, plus optional page 2). */
  maxQueries: 6,
  maxPagesPerQuery: 2,
  cacheTtlMs: (Number(process.env.ADZUNA_CACHE_MINUTES) || 60) * 60 * 1000,
  /** Adzuna's free tier allows ~25 calls/minute; stay safely under it. */
  maxCallsPerMinute: Number(process.env.ADZUNA_MAX_CALLS_PER_MINUTE) || 20,
  timeoutMs: 10_000,
};
