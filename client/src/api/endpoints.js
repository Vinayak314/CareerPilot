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
  getProfile: () => data(api.get('/users/me')),
  updateProfile: (payload) => data(api.patch('/users/me', payload)),
  changePassword: (currentPassword, newPassword) =>
    data(api.patch('/users/me/password', { currentPassword, newPassword })),
  updatePreferences: (preferences) => data(api.patch('/users/me/preferences', preferences)),
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
  getRewrites: (analysisId) => data(api.get(`/analyses/${analysisId}/rewrites`)),
  generateRewrites: (analysisId) => data(api.post('/advisor/rewrite', { analysisId })),
  updateRewrite: (rewriteId, payload) => data(api.patch(`/rewrites/${rewriteId}`, payload)),

  getInterviewPrep: (analysisId) => data(api.get(`/analyses/${analysisId}/interview-prep`)),
  generateInterviewPrep: (analysisId) => data(api.post('/advisor/interview-prep', { analysisId })),
  updateQuestionNotes: (questionId, notes) =>
    data(api.patch(`/interview-questions/${questionId}`, { notes })),
};

export const jobsApi = {
  matches: () => data(api.get('/jobs/matches')),
};

export const applicationsApi = {
  list: () => data(api.get('/applications')),
  create: (payload) => data(api.post('/applications', payload)),
  update: (id, payload) => data(api.patch(`/applications/${id}`, payload)),
  remove: (id) => data(api.delete(`/applications/${id}`)),
};
