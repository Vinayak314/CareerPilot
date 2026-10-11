import { ADZUNA } from '../config/matching.js';

/**
 * Job Provider Service using the Adzuna API (the only external job source).
 * Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in environment variables; they are
 * only ever used server-side and are stripped from cache keys and logs.
 *
 * Features: country endpoint selection, targeted `title_only` role queries,
 * `where`/`distance` location filtering, recency (`max_days_old`), contract
 * filters, pagination, an in-memory TTL cache with in-flight de-duplication,
 * a client-side rate limiter, timeouts and one retry for transient failures.
 * It never invents jobs: on failure it returns an empty list plus an error.
 */

const ADZUNA_API_URL = 'https://api.adzuna.com/v1/api/jobs';

/** Country endpoints Adzuna supports, with the currency salaries are reported in. */
export const ADZUNA_COUNTRIES = {
  in: { name: 'India', currency: 'INR' },
  us: { name: 'United States', currency: 'USD' },
  gb: { name: 'United Kingdom', currency: 'GBP' },
  ca: { name: 'Canada', currency: 'CAD' },
  au: { name: 'Australia', currency: 'AUD' },
  sg: { name: 'Singapore', currency: 'SGD' },
  nz: { name: 'New Zealand', currency: 'NZD' },
  za: { name: 'South Africa', currency: 'ZAR' },
  de: { name: 'Germany', currency: 'EUR' },
  fr: { name: 'France', currency: 'EUR' },
  nl: { name: 'Netherlands', currency: 'EUR' },
  at: { name: 'Austria', currency: 'EUR' },
  be: { name: 'Belgium', currency: 'EUR' },
  it: { name: 'Italy', currency: 'EUR' },
  es: { name: 'Spain', currency: 'EUR' },
  pl: { name: 'Poland', currency: 'PLN' },
  ch: { name: 'Switzerland', currency: 'CHF' },
  br: { name: 'Brazil', currency: 'BRL' },
  mx: { name: 'Mexico', currency: 'MXN' },
};

export const isSupportedCountry = (code) => Boolean(code && ADZUNA_COUNTRIES[String(code).toLowerCase()]);

// ---------------------------------------------------------------------------
// Cache + rate limiting
// ---------------------------------------------------------------------------

const cache = new Map(); // key -> { expires, value }
const inFlight = new Map(); // key -> Promise
const MAX_CACHE_ENTRIES = 300;
const callTimes = [];

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const cacheSet = (key, value) => {
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { expires: Date.now() + ADZUNA.cacheTtlMs, value });
};

/** Sliding one-minute window; returns false when the budget is exhausted. */
const takeRateToken = () => {
  const now = Date.now();
  while (callTimes.length && now - callTimes[0] > 60_000) callTimes.shift();
  if (callTimes.length >= ADZUNA.maxCallsPerMinute) return false;
  callTimes.push(now);
  return true;
};

export class AdzunaError extends Error {
  constructor(message, { code = 'adzuna_error', status } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const normaliseJob = (job, country) => ({
  jobId: String(job.id),
  title: stripTags(job.title),
  company: stripTags(job.company?.display_name) || 'Unknown',
  location: stripTags(job.location?.display_name) || ADZUNA_COUNTRIES[country]?.name || '',
  locationArea: Array.isArray(job.location?.area) ? job.location.area : [],
  url: job.redirect_url,
  descriptionText: stripTags(job.description),
  salaryMin: Number.isFinite(job.salary_min) && job.salary_min > 0 ? job.salary_min : null,
  salaryMax: Number.isFinite(job.salary_max) && job.salary_max > 0 ? job.salary_max : null,
  salaryIsPredicted: String(job.salary_is_predicted) === '1',
  salaryCurrency: ADZUNA_COUNTRIES[country]?.currency || null,
  contractType: job.contract_type || null, // 'permanent' | 'contract'
  contractTime: job.contract_time || null, // 'full_time' | 'part_time'
  category: job.category?.label || null,
  postedAt: job.created ? new Date(job.created) : null,
  country,
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const buildUrl = ({ country, page, params }) => {
  const url = new URL(`${ADZUNA_API_URL}/${country}/search/${page}`);
  url.searchParams.set('results_per_page', String(ADZUNA.resultsPerPage));
  url.searchParams.set('max_days_old', String(ADZUNA.maxDaysOld));
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  // Credentials are appended last so the cache key (built before this) never contains them.
  const cacheKey = url.toString();
  url.searchParams.set('app_id', process.env.ADZUNA_APP_ID);
  url.searchParams.set('app_key', process.env.ADZUNA_APP_KEY);
  return { url, cacheKey };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const requestAdzuna = async (url, attempt = 0) => {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(ADZUNA.timeoutMs), headers: { Accept: 'application/json' } });
  } catch (error) {
    if (attempt === 0) {
      await sleep(600);
      return requestAdzuna(url, 1);
    }
    throw new AdzunaError(error.name === 'TimeoutError' ? 'Adzuna did not respond in time.' : 'Could not reach Adzuna.', { code: 'network' });
  }
  if (response.status === 429) throw new AdzunaError('Adzuna rate limit reached.', { code: 'rate_limited', status: 429 });
  if (response.status === 401 || response.status === 403) {
    throw new AdzunaError('Adzuna rejected the API credentials.', { code: 'auth', status: response.status });
  }
  if (response.status >= 500 && attempt === 0) {
    await sleep(800);
    return requestAdzuna(url, 1);
  }
  if (!response.ok) throw new AdzunaError(`Adzuna returned ${response.status}.`, { code: 'http', status: response.status });
  const data = await response.json().catch(() => null);
  if (!data || !Array.isArray(data.results)) throw new AdzunaError('Adzuna returned an unexpected response.', { code: 'bad_response' });
  return data;
};

/**
 * Run one Adzuna search page.
 * @param {object} opts
 * @param {string} opts.country  Adzuna country code (e.g. 'in')
 * @param {object} opts.params   Adzuna query params: title_only, what, what_or, where, distance, full_time, contract, ...
 * @param {number} [opts.page]
 * @returns {Promise<{ jobs: object[], count: number, cached: boolean }>}
 */
export const searchAdzuna = async ({ country, params = {}, page = 1 }) => {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    throw new AdzunaError('Adzuna API keys are not configured on the server.', { code: 'not_configured' });
  }
  const code = String(country || ADZUNA.defaultCountry).toLowerCase();
  if (!isSupportedCountry(code)) throw new AdzunaError(`Adzuna does not support country "${country}".`, { code: 'bad_country' });

  const { url, cacheKey } = buildUrl({ country: code, page, params });
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  if (!takeRateToken()) throw new AdzunaError('Local Adzuna rate budget exhausted for this minute.', { code: 'rate_limited' });

  const promise = requestAdzuna(url)
    .then((data) => {
      const value = { jobs: data.results.map((j) => normaliseJob(j, code)), count: Number(data.count) || 0 };
      cacheSet(cacheKey, value);
      return { ...value, cached: false };
    })
    .finally(() => inFlight.delete(cacheKey));
  inFlight.set(cacheKey, promise);
  return promise;
};

/**
 * Backwards-compatible helper: returns an array of jobs and never throws.
 * `location` was previously (incorrectly) used as the country path segment; it is now
 * treated as a city/region (`where`) and `country` selects the endpoint.
 */
export const fetchJobs = async ({ query, country = ADZUNA.defaultCountry, location, page = 1 } = {}) => {
  try {
    const { jobs } = await searchAdzuna({ country, page, params: { what: query, where: location } });
    return jobs;
  } catch (error) {
    console.error('[JobProvider] Error fetching jobs:', error.message);
    return [];
  }
};

/** Test helper. */
export const _resetAdzunaCache = () => {
  cache.clear();
  inFlight.clear();
  callTimes.length = 0;
};
