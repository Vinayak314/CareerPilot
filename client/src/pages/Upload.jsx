import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, Trash2, ArrowRight } from 'lucide-react';
import useApi from '../hooks/useApi';
import useUploadStore from '../store/uploadStore';
import useAnalysisStore from '../store/analysisStore';
import { resumeApi, analysisApi } from '../api/endpoints';
import { getErrorMessage } from '../lib/errors';
import { formatDate, formatFileSize, isHttpUrl } from '../lib/format';
import { Card, PageHeader, Alert } from '../components/ui/Layout';
import { TextField, TextArea } from '../components/ui/FormField';
import Button from '../components/ui/Button';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const Upload = () => {
  const { file, jobUrl, jobText, uploadedResumeId, setFile, setJobUrl, setJobText, setUploadedResumeId, clearAll } = useUploadStore();
  const { setCurrentAnalysisId } = useAnalysisStore();
  const navigate = useNavigate();
  const { data: savedResumes, loading: loadingResumes, error: resumeError, reload: reloadResumes } = useApi(resumeApi.list, []);
  const resumes = Array.isArray(savedResumes) ? savedResumes : [];
  const selectedResume = !file && resumes.find((resume) => resume._id === uploadedResumeId);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [jobTextError, setJobTextError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const jobTextRef = useRef(null);

  const validateFile = (f) => {
    if (!f) return 'Please select a file.';
    if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|docx|txt)$/i)) {
      return 'Please upload a PDF, DOCX or TXT file.';
    }
    if (f.size > MAX_SIZE) {
      return `File is too large. Maximum size is ${formatFileSize(MAX_SIZE)}.`;
    }
    return null;
  };

  const handleFileChange = (f) => {
    if (submitting) return;
    setError(null);
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    clearAll();
    setError(null);
    setJobTextError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setError(null);
    setJobTextError(null);
    
    if (!file && !uploadedResumeId) {
      setError('Please upload a resume or choose an existing resume first.');
      return;
    }
    
    if (!jobUrl.trim() && !jobText.trim()) {
      setError('Please provide either a job URL or paste the job description.');
      return;
    }

    if (jobUrl.trim() && !isHttpUrl(jobUrl.trim())) {
      setError('Please provide a valid HTTP/HTTPS URL for the job posting.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    try {
      let resId = uploadedResumeId;
      
      // Phase 1: Upload resume if we haven't already
      if (!resId) {
        const uploadRes = await resumeApi.upload(file, { 
          signal,
          onProgress: (pct) => setUploadProgress(pct)
        });
        resId = uploadRes.resume?._id || uploadRes.resume?.id || uploadRes._id || uploadRes.id;
        setUploadedResumeId(resId);
      }

      // Phase 2: Start analysis
      setUploadProgress(100); // Upload done, now analyzing
      
      const analysisRes = await analysisApi.create({
        resumeId: resId,
        jobDescriptionText: jobText.trim() || undefined,
        jobDescriptionUrl: jobUrl.trim() || undefined,
      }, { signal });

      const analysisId = analysisRes.analysis?._id || analysisRes.analysis?.id || analysisRes._id || analysisRes.id;
      
      if (analysisId) {
        setCurrentAnalysisId(analysisId);
        clearAll();
        navigate('/dashboard');
      } else {
        throw new Error('No analysis ID returned from server.');
      }
      
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(getErrorMessage(err, 'Analysis failed. Please try again.'));
        if (err.response?.status === 422 && jobUrl.trim() && !jobText.trim()) {
          setJobTextError(err.response?.data?.details?.jobDescriptionText || 'The job page could not be read. Paste its responsibilities and requirements here.');
          requestAnimationFrame(() => jobTextRef.current?.focus());
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = (file || uploadedResumeId) && (jobUrl.trim() || jobText.trim());

  return (
    <div className="max-w-3xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <PageHeader 
        eyebrow="New Scan"
        title="Upload Resume"
        description="Compare your resume against a target role to discover keyword gaps and optimize your ATS score."
      />

      <div className="space-y-6">
        {error && <Alert title="Analysis could not be completed">{error}</Alert>}

        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">1. Your Resume</h2>
            <span className="text-sm font-medium text-slate-500">PDF, DOCX or TXT</span>
          </div>

          <div className="mb-5">
            {loadingResumes ? (
              <p className="text-sm text-slate-500 py-4">Loading saved resumes...</p>
            ) : resumeError ? (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900" role="alert">
                <p>Could not load your saved resumes.</p>
                <Button variant="ghost" size="sm" onClick={reloadResumes} disabled={submitting} className="mt-2">Retry</Button>
              </div>
            ) : resumes.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Your uploaded resumes</h3>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {resumes.map((resume) => {
                    const selected = !file && uploadedResumeId === resume._id;
                    return (
                      <div key={resume._id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${selected ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'}`}>
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                            <File className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{resume.fileName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Uploaded {formatDate(resume.createdAt) || 'previously'}{resume.version ? ` ? Version ${resume.version}` : ''}</p>
                          </div>
                        </div>
                        <Button
                          variant={selected ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={submitting}
                          aria-pressed={selected}
                          onClick={() => {
                            setFile(null);
                            setUploadedResumeId(resume._id);
                            setError(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="w-full sm:w-auto shrink-0"
                        >
                          {selected ? 'Selected' : 'Use this resume'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No saved resumes yet. Upload your first resume below.</p>
            )}
          </div>

          {selectedResume && (
            <p className="mb-3 text-sm text-teal-700" role="status">Saved resume selected. You can also upload a new file below.</p>
          )}
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-teal-500 bg-teal-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                disabled={submitting}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload resume file"
              />
              <div className="w-14 h-14 bg-white rounded-full shadow-sm ring-1 ring-slate-200 flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-6 h-6 text-teal-700" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Drag and drop your resume</h3>
              <p className="text-sm text-slate-500 mb-4">or click to browse from your computer</p>
              <Button variant="secondary" size="sm" className="pointer-events-none">Browse Files</Button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-teal-700" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              {!submitting && (
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">2. Target Role</h2>
            <span className="text-sm font-medium text-slate-500">Provide one</span>
          </div>

          <div className="space-y-5">
            <TextField
              id="jobUrl"
              label="Job URL"
              hint="Paste a link to a specific job. If the site requires sign-in or blocks access, paste the job description below."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              disabled={submitting}
            />

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">or paste text</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <TextArea
              id="jobText"
              ref={jobTextRef}
              label="Job Description"
              hint="Pasted text takes priority over the URL. Include the role's responsibilities and requirements."
              error={jobTextError}
              value={jobText}
              onChange={(e) => { setJobText(e.target.value); setJobTextError(null); }}
              placeholder="Paste the full job description here..."
              disabled={submitting}
              className="h-40"
            />
          </div>
        </Card>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={handleClear} disabled={submitting}>
            Clear All
          </Button>
          
          <div className="flex items-center gap-4">
            {submitting && uploadProgress > 0 && uploadProgress < 100 && (
              <span className="text-sm font-medium text-teal-700">Uploading: {uploadProgress}%</span>
            )}
            {submitting && uploadProgress === 100 && (
              <span className="text-sm font-medium text-teal-700 animate-pulse">Analyzing...</span>
            )}
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              loading={submitting}
              iconRight={ArrowRight}
              size="lg"
            >
              Analyze Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
