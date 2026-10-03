import { create } from 'zustand';
import { setUnauthorizedHandler } from '../api/axios';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../lib/errors';

const USER_KEY = 'careerpilot_user';
const TOKEN_KEY = 'careerpilot_token';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
};

const persistSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Classify auth failures so the forms can show targeted guidance
 * (e.g. offer "Sign in instead" for a duplicate email).
 */
const classifyAuthError = (error, mode) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message || '';
  if (!error?.response) {
    return { code: 'network', message: getErrorMessage(error) };
  }
  if (mode === 'login' && (status === 401 || status === 400)) {
    return { code: 'invalid', message: 'Incorrect email or password. Please try again.' };
  }
  if (mode === 'signup' && (status === 409 || /exist/i.test(serverMessage))) {
    return { code: 'duplicate', message: 'An account with this email already exists.' };
  }
  return { code: 'server', message: getErrorMessage(error, mode === 'login' ? 'Sign in failed.' : 'Sign up failed.') };
};

const useAuthStore = create((set, get) => ({
  user: readUser(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  isLoading: false,
  error: null,
  errorCode: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const { token, ...userData } = await authApi.login(email.trim(), password);
      persistSession(token, userData);
      set({ user: userData, token, isLoading: false });
      return true;
    } catch (error) {
      const { code, message } = classifyAuthError(error, 'login');
      set({ error: message, errorCode: code, isLoading: false });
      return false;
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const { token, ...userData } = await authApi.signup(name.trim(), email.trim(), password);
      persistSession(token, userData);
      set({ user: userData, token, isLoading: false });
      return true;
    } catch (error) {
      const { code, message } = classifyAuthError(error, 'signup');
      set({ error: message, errorCode: code, isLoading: false });
      return false;
    }
  },

  /** Merge profile changes (e.g. from Settings) into the signed-in user. */
  updateUser: (partial) => {
    const user = { ...get().user, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  clearError: () => set({ error: null, errorCode: null }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, error: null, errorCode: null });
  },
}));

// Any 401 from a protected endpoint ends the session; ProtectedRoute then redirects to /login.
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().token) {
    useAuthStore.getState().logout();
  }
});

export default useAuthStore;
