import { create } from 'zustand';

let nextId = 1;

const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    const entry = { id, type: 'success', duration: 4000, ...toast };
    set({ toasts: [...get().toasts, entry] });
    if (entry.duration > 0) {
      setTimeout(() => get().dismiss(id), entry.duration);
    }
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message, opts) => useToastStore.getState().push({ type: 'success', message, ...opts }),
  error: (message, opts) => useToastStore.getState().push({ type: 'error', message, duration: 6000, ...opts }),
  info: (message, opts) => useToastStore.getState().push({ type: 'info', message, ...opts }),
};

export default useToastStore;
