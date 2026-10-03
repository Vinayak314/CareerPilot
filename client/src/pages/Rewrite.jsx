import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, X, Edit2, Save, ArrowLeft, ArrowRight, Loader2, FileText } from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';
import useApi from '../hooks/useApi';
import { advisorApi } from '../api/endpoints';
import { normalizeRewrites } from '../lib/normalize';
import { Card, PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui/Layout';
import Button from '../components/ui/Button';
import { TextArea } from '../components/ui/FormField';
import { SeverityTag } from '../components/ui/Tags';
import { toast } from '../store/toastStore';

const Rewrite = () => {
  const { currentAnalysisId } = useAnalysisStore();
  
  const loader = async () => {
    if (!currentAnalysisId) return null;
    try {
      const raw = await advisorApi.getRewrites(currentAnalysisId);
      return normalizeRewrites(raw);
    } catch (err) {
      if (err?.response?.status === 404) return { bullets: [] };
      throw err;
    }
  };

  const { data, loading, error, reload, setData } = useApi(loader, [currentAnalysisId]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!currentAnalysisId) return;
    setGenerating(true);
    try {
      const raw = await advisorApi.generateRewrites(currentAnalysisId);
      setData(normalizeRewrites(raw));
      toast.success('Rewrite suggestions generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate rewrites.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async (bulletId, payload) => {
    try {
      await advisorApi.updateRewrite(bulletId, payload);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bullets: prev.bullets.map((b) => (b.id === bulletId ? { ...b, ...payload } : b)),
        };
      });
      if (payload.status === 'accepted') toast.success('Accepted rewrite saved.');
    } catch (err) {
      toast.error('Failed to update rewrite status.');
    }
  };

  if (!currentAnalysisId) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <EmptyState
          icon={FileText}
          title="No analysis selected"
          description="Please select an analysis from the dashboard or upload a new resume."
          action={<Button as={Link} to="/dashboard">Go to Dashboard</Button>}
        />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Loading rewrites..." description="Fetching AI suggestions for your resume." />
        <LoadingState rows={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <ErrorState title="Failed to load rewrites" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { bullets = [], company, jobTitle } = data || {};

  return (
    <div className="max-w-5xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <PageHeader 
        eyebrow={company && jobTitle ? `${company} • ${jobTitle}` : undefined}
        title="Rewrite Studio" 
        description="Review and refine AI-optimized bullet points for your resume."
        actions={
          <div className="flex gap-3">
            <Button as={Link} to="/dashboard" variant="secondary" icon={ArrowLeft}>
              Back to Dashboard
            </Button>
            <Button onClick={handleGenerate} loading={generating} disabled={loading} icon={Sparkles}>
              Generate Rewrites
            </Button>
          </div>
        }
      />

      {generating && (
        <Card className="mb-8 flex flex-col items-center justify-center p-12 text-center border-teal-200 bg-teal-50/30">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Analyzing and Optimizing</h3>
          <p className="text-sm text-slate-500">Our AI is generating tailored resume bullets to match the job description...</p>
        </Card>
      )}

      {!generating && bullets.length === 0 && (
        <Card className="mb-8 text-center p-12 bg-slate-50">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm ring-1 ring-slate-200 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No suggestions yet</h3>
          <p className="text-sm text-slate-500 mb-4">Click "Generate Rewrites" to have our AI analyze your resume bullets.</p>
        </Card>
      )}

      <div className="space-y-8">
        {!generating && bullets.map((bullet) => (
          <BulletGroup key={bullet.id} bullet={bullet} onUpdate={(payload) => handleUpdate(bullet.id, payload)} />
        ))}
      </div>
    </div>
  );
};

const BulletGroup = ({ bullet, onUpdate }) => {
  const { original, issue, suggestions, acceptedVersion, status } = bullet;
  const activeSuggestion = suggestions[0] || null;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(acceptedVersion || activeSuggestion?.text || '');

  const handleAccept = () => onUpdate({ status: 'accepted', acceptedVersion: activeSuggestion?.text });
  const handleReject = () => onUpdate({ status: 'rejected' });
  const handleSaveEdit = () => {
    onUpdate({ status: 'accepted', acceptedVersion: editText });
    setEditing(false);
  };

  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';

  return (
    <Card padded={false} className={`overflow-hidden transition-opacity ${isRejected ? 'opacity-60' : ''}`}>
      <div className="p-5 sm:p-6 bg-white border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Original Bullet</span>
            <p className="text-slate-700 leading-relaxed">{original}</p>
          </div>
          {issue && (
            <div className="flex-shrink-0">
               <SeverityTag severity="warning" size="sm">{issue}</SeverityTag>
            </div>
          )}
        </div>
      </div>

      {!isRejected && activeSuggestion && (
        <div className={`p-5 sm:p-6 transition-colors ${isAccepted ? 'bg-emerald-50/30' : 'bg-teal-50/30'}`}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-4 h-4 ${isAccepted ? 'text-emerald-600' : 'text-teal-600'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isAccepted ? 'text-emerald-700' : 'text-teal-700'}`}>
                  {isAccepted ? 'Accepted Version' : 'Suggested Rewrite'}
                </span>
              </div>
              
              {editing ? (
                <div className="space-y-3">
                  <TextArea 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)} 
                    className="w-full text-base bg-white"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} icon={Save}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(acceptedVersion || activeSuggestion.text); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-900 font-medium text-base sm:text-lg mb-4 leading-relaxed">
                    {acceptedVersion || activeSuggestion.text}
                  </p>
                  {activeSuggestion.addedKeywords?.length > 0 && !isAccepted && (
                    <div className="flex flex-wrap gap-2">
                      {activeSuggestion.addedKeywords.map((kw, idx) => (
                        <SeverityTag key={idx} severity="added" size="sm">{kw}</SeverityTag>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {!editing && (
              <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                {!isAccepted && (
                  <button onClick={handleAccept} className="flex-1 sm:flex-none p-2 sm:px-4 sm:py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 flex items-center justify-center gap-2 transition-colors font-semibold text-sm" title="Accept">
                    <Check className="w-4 h-4" /> <span className="sm:hidden">Accept</span>
                  </button>
                )}
                <button onClick={() => setEditing(true)} className="flex-1 sm:flex-none p-2 sm:px-4 sm:py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors font-semibold text-sm" title="Edit">
                  <Edit2 className="w-4 h-4" /> <span className="sm:hidden">Edit</span>
                </button>
                {!isAccepted && (
                  <button onClick={handleReject} className="flex-1 sm:flex-none p-2 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center justify-center gap-2 transition-colors font-semibold text-sm" title="Reject">
                    <X className="w-4 h-4" /> <span className="sm:hidden">Reject</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {isRejected && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-5 sm:px-6">
           <span className="text-sm font-medium text-slate-500">Suggestion rejected</span>
           <button onClick={() => onUpdate({ status: 'pending' })} className="text-sm font-medium text-teal-700 hover:text-teal-800">
             Restore
           </button>
        </div>
      )}
    </Card>
  );
};

export default Rewrite;
