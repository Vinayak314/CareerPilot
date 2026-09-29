import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust in production
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careerpilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
