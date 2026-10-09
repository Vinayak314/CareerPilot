
/**
 * Job Provider Service using Adzuna API
 * Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in environment variables.
 */

const ADZUNA_API_URL = 'https://api.adzuna.com/v1/api/jobs';

export const fetchJobs = async ({ query, location = 'us', page = 1, resultsPerPage = 20 }) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('[JobProvider] Adzuna API keys not configured. No live jobs can be returned.');
    return [];
  }

  try {
    const url = new URL(`${ADZUNA_API_URL}/${location}/search/${page}`);
    url.searchParams.append('app_id', appId);
    url.searchParams.append('app_key', appKey);
    url.searchParams.append('results_per_page', resultsPerPage);
    if (query) url.searchParams.append('what', query);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Adzuna API returned ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map(job => ({
      jobId: String(job.id),
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || 'Remote',
      url: job.redirect_url,
      descriptionText: job.description,
    }));
  } catch (error) {
    console.error('[JobProvider] Error fetching jobs:', error.message);
    return [];
  }
};
