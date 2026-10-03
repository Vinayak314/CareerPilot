import { create } from 'zustand';

const KEY = 'careerpilot_current_analysis';

/**
 * Remembers which saved analysis the user is working with so Dashboard,
 * Rewrite Studio and Interview Prep share the same context.
 */
const useAnalysisStore = create((set) => ({
  currentAnalysisId: localStorage.getItem(KEY) || null,
  setCurrentAnalysisId: (id) => {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    set({ currentAnalysisId: id || null });
  },
}));

export default useAnalysisStore;
