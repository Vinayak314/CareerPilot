import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, X, Trash2, ArrowRight } from 'lucide-react';
import useUploadStore from '../store/uploadStore';
import useAnalysisStore from '../store/analysisStore';
import { resumeApi, analysisApi } from '../api/endpoints';
import { getErrorMessage } from '../lib/errors';
import { formatFileSize, isHttpUrl } from '../lib/format';
import { Card, PageHeader, Alert } from '../components/ui/Layout';
import { TextField, TextArea } from '../components/ui/FormField';
import Button from '../components/ui/Button';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const Upload = () => {
  const { file, jobUrl, jobText, uploadedResumeId, setFile, setJobUrl, setJobText, setUploadedResumeId, clearAll } = useUploadStore();
  const { setCurrentAnalysisId } = useAnalysisStore();
  const navigate = useNavigate();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleClear = () => {
    abortRef.current?.abort();
    clearAll();
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!file && !uploadedResumeId) {
      setError('Please upload your resume first.');
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
        {error && <Alert title="Upload error">{error}</Alert>}

        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">1. Your Resume</h2>
            <span className="text-sm font-medium text-slate-500">PDF, DOCX or TXT</span>
          </div>

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
              hint="Paste a link to the job posting (e.g. LinkedIn, Indeed, company site)."
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
              label="Job Description"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
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
