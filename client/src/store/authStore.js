import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('careerpilot_user')) || null,
  token: localStorage.getItem('careerpilot_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('careerpilot_token', token);
      localStorage.setItem('careerpilot_user', JSON.stringify(userData));
      
      set({ user: userData, token, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      return false;
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { token, ...userData } = response.data;
      
      localStorage.setItem('careerpilot_token', token);
      localStorage.setItem('careerpilot_user', JSON.stringify(userData));
      
      set({ user: userData, token, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Signup failed', 
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('careerpilot_token');
    localStorage.removeItem('careerpilot_user');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
