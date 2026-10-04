import fetch from 'node-fetch';

/**
 * Job Provider Service using Adzuna API
 * Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in environment variables.
 */

const ADZUNA_API_URL = 'https://api.adzuna.com/v1/api/jobs';

export const fetchJobs = async ({ query, location = 'us', page = 1, resultsPerPage = 20 }) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('[JobProvider] Adzuna API keys not configured. Returning mock data.');
    return getMockJobs();
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
    return getMockJobs();
  }
};

const getMockJobs = () => {
  return [
    {
      jobId: 'mock-1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      url: 'https://example.com/job/mock-1',
      descriptionText: 'Looking for a Senior Frontend Developer with expertise in React, Redux, and modern CSS. Must have 5+ years of experience.',
    },
    {
      jobId: 'mock-2',
      title: 'Full Stack Engineer',
      company: 'StartupInc',
      location: 'Remote',
      url: 'https://example.com/job/mock-2',
      descriptionText: 'Join our fast-paced startup. We need a Full Stack Engineer who knows Node.js, Express, React, and MongoDB. Experience with AWS is a plus.',
    },
    {
      jobId: 'mock-3',
      title: 'Backend Developer',
      company: 'Enterprise Solutions',
      location: 'New York, NY',
      url: 'https://example.com/job/mock-3',
      descriptionText: 'Backend developer needed to maintain and scale our distributed systems. Requires strong knowledge of Java, Spring Boot, and PostgreSQL.',
    }
  ];
};
