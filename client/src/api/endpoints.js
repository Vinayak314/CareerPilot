import api from './axios';

/**
 * Endpoint wrappers for the CareerPilot REST API.
 * Paths follow CareerPilot_Technical_Overview.md §7; see client/API_CONTRACT.md
 * for the request/response shapes the pages expect.
 */

const data = (promise) => promise.then((res) => res.data);

export const authApi = {
  login: (email, password) => data(api.post('/auth/login', { email, password })),
  signup: (name, email, password) => data(api.post('/auth/signup', { name, email, password })),
};

export const userApi = {
  getProfile: () => data(api.get('/users/profile')),
  updateProfile: (payload) => data(api.patch('/users/profile', payload)),
  deleteAccount: () => data(api.delete('/users')),
};

export const resumeApi = {
  list: () => data(api.get('/resumes')),
  upload: (file, { onProgress, signal } = {}) => {
    const form = new FormData();
    form.append('resume', file);
    return data(
      api.post('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      })
    );
  },
  remove: (id) => data(api.delete(`/resumes/${id}`)),
};

export const analysisApi = {
  create: ({ resumeId, jobDescriptionText, jobDescriptionUrl }, { signal } = {}) =>
    data(api.post('/analyze', { resumeId, jobDescriptionText, jobDescriptionUrl }, { signal })),
  list: () => data(api.get('/analyses')),
  get: (id) => data(api.get(`/analyses/${id}`)),
  latest: () => data(api.get('/analyses/latest')),
};

export const advisorApi = {
  generateRewrites: async (analysisId) => {
    const { data: analysis } = await api.get(`/analyses/${analysisId}`);
    return data(api.post('/advisor/rewrite', { analysisId, resumeId: analysis.resumeId?._id || analysis.resumeId }));
  },
  generateInterviewPrep: async (analysisId) => {
    const { data: analysis } = await api.get(`/analyses/${analysisId}`);
    return data(api.post('/advisor/interview', { analysisId, resumeId: analysis.resumeId?._id || analysis.resumeId }));
  },
  evaluateInterviewAnswer: async (analysisId, { question, category, answer }) => {
    const { data: analysis } = await api.get(`/analyses/${analysisId}`);
    return data(api.post('/advisor/interview/feedback', {
      analysisId,
      resumeId: analysis.resumeId?._id || analysis.resumeId,
      question,
      category,
      answer,
    }));
  },
};

export const jobsApi = {
  matches: (params) => data(api.get('/jobs', { params })),
  find: (resumeId, options = {}) => {
    const payload = typeof options === 'string' ? { resumeId, location: options } : { resumeId, ...options };
    return data(api.post('/jobs/find', payload));
  },
  updateStatus: (id, status) => data(api.patch(`/jobs/${id}/status`, { status })),
};

export const applicationsApi = {
  list: () => data(api.get('/applications')),
  create: (payload) => data(api.post('/applications', payload)),
  get: (id) => data(api.get(`/applications/${id}`)),
  get: (id) => data(api.get(`/applications/${id}`)),
  update: (id, payload) => data(api.patch(`/applications/${id}`, payload)),
  remove: (id) => data(api.delete(`/applications/${id}`)),
};
