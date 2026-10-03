import { create } from 'zustand';

const DRAFT_KEY = 'careerpilot_upload_draft';

const readDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
  } catch {
    return {};
  }
};

const saveDraft = (state) => {
  sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ jobUrl: state.jobUrl, jobText: state.jobText })
  );
};

const draft = readDraft();

/**
 * Upload form state lives outside the page so it survives navigation until the
 * user clears or submits it. Text fields are also kept for the browser session;
 * the File object can only live in memory.
 */
const useUploadStore = create((set, get) => ({
  file: null,
  jobUrl: draft.jobUrl || '',
  jobText: draft.jobText || '',
  /** Resume already uploaded for the current file, so a failed analysis can retry without re-uploading. */
  uploadedResumeId: null,

  setFile: (file) => set({ file, uploadedResumeId: null }),
  setJobUrl: (jobUrl) => {
    set({ jobUrl });
    saveDraft(get());
  },
  setJobText: (jobText) => {
    set({ jobText });
    saveDraft(get());
  },
  setUploadedResumeId: (uploadedResumeId) => set({ uploadedResumeId }),
  clearAll: () => {
    sessionStorage.removeItem(DRAFT_KEY);
    set({ file: null, jobUrl: '', jobText: '', uploadedResumeId: null });
  },
}));

export default useUploadStore;
