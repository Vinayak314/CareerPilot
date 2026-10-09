import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, PenTool, FileText, ArrowRight } from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';
import useApi from '../hooks/useApi';
import { analysisApi } from '../api/endpoints';
import { normalizeAnalysis, analysisContextLabel } from '../lib/normalize';
import { scoreLabel } from '../lib/format';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui/Layout';
import ScoreRing from '../components/ui/ScoreRing';
import { SeverityTag } from '../components/ui/Tags';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const { currentAnalysisId, setCurrentAnalysisId } = useAnalysisStore();

  // If we have an ID, load it. Otherwise load latest.
  const loader = async () => {
    try {
      const raw = currentAnalysisId ? await analysisApi.get(currentAnalysisId) : await analysisApi.latest();
      const norm = normalizeAnalysis(raw);
      if (norm && norm.id !== currentAnalysisId) {
        setCurrentAnalysisId(norm.id);
      }
      return norm;
    } catch (err) {
      if (err?.response?.status === 404 && !currentAnalysisId) {
        return null; // Empty state
      }
      throw err;
    }
  };

  const { data: analysis, loading, error, reload, setData } = useApi(loader, [currentAnalysisId]);
  const [generatingAiAnalysis, setGeneratingAiAnalysis] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');

  const handleGenerateAiAnalysis = async () => {
    if (!analysis?.resumeId || !analysis?.jobDescriptionText) {
      setAiAnalysisError('This report is missing its resume or job description. Upload them again to create an AI report.');
      return;
    }
    setGeneratingAiAnalysis(true);
    setAiAnalysisError('');
    try {
      const response = await analysisApi.create({
        resumeId: analysis.resumeId,
        jobDescriptionText: analysis.jobDescriptionText,
      });
      const nextAnalysis = normalizeAnalysis(response?.analysis || response);
      setData(nextAnalysis);
      if (nextAnalysis?.id) setCurrentAnalysisId(nextAnalysis.id);
    } catch (err) {
      setAiAnalysisError(err.response?.data?.message || err.message || 'AI analysis failed. Check your Gemini configuration and try again.');
    } finally {
      setGeneratingAiAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Loading report..." description="Fetching your latest optimization data." />
        <LoadingState rows={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState title="Failed to load analysis" message={error.message || 'Something went wrong.'} onRetry={reload} />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <EmptyState
          icon={FileText}
          title="No analyses yet"
          description="Upload your resume and a target job description to get your first ATS alignment report."
          action={
            <Button as={Link} to="/upload" size="lg" iconRight={ArrowRight}>
              Scan a Resume
            </Button>
          }
        />
      </div>
    );
  }

  const {
    company,
    jobTitle,
    atsScore,
    summary,
    categories = [],
    gaps = { critical: [], moderate: [], aligned: [] },
    recommendations = [],
  } = analysis;

  const contextLabel = analysisContextLabel(company, jobTitle);
  const hasAiAnalysis = analysis.source === 'gemini';

  return (
    <div className="max-w-6xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          {contextLabel && (
            <div className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-2 flex items-center gap-2">
              {contextLabel}
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight break-words">ATS Real-time Optimization Report</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <Button as={Link} to="/prep" variant="secondary" icon={Sparkles}>
            Prep for Interview
          </Button>
          <Button as={Link} to="/rewrite" icon={PenTool}>
            Rewrite Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-8 items-stretch">
        {hasAiAnalysis ? (
          <>
            <Card className="xl:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-5">
              <ScoreRing score={atsScore} size={112} stroke={8} label="Overall Match" />
              <div className="text-center sm:text-left min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">Overall resume match</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{atsScore}% Match — {scoreLabel(atsScore)}</h3>
              </div>
            </Card>
            <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat, i) => (
                <Card key={i} className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-snug">{cat.label}</div>
                  <ScoreRing score={cat.score} size={64} label={cat.label} />
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="xl:col-span-12 flex flex-col sm:flex-row sm:items-center gap-5 border-teal-100 bg-gradient-to-r from-teal-50/80 to-white">
            <div className="w-12 h-12 rounded-xl bg-white border border-teal-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-teal-700" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-1">AI feedback isn’t available for this report yet</h2>
              <p className="text-sm text-slate-600">Generate an AI assessment to see a resume match score, skill gaps, and recommendations tailored to this role.</p>
              {aiAnalysisError && <p role="alert" className="text-sm text-red-700 mt-2">{aiAnalysisError}</p>}
            </div>
            <Button onClick={handleGenerateAiAnalysis} loading={generatingAiAnalysis} icon={Sparkles} className="flex-shrink-0">Generate AI feedback</Button>
          </Card>
        )}
      </div>

      {hasAiAnalysis && summary && (
        <Card className="mb-8 border-slate-200 bg-slate-50/60">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">AI assessment</h2>
          <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{summary}</p>
        </Card>
      )}

      {hasAiAnalysis && <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Semantic Gap Analysis</h3>
            <span className="text-sm text-slate-400 font-medium">
              {(gaps.critical?.length || 0) + (gaps.moderate?.length || 0)} Gaps Identified
            </span>
          </div>

          <div className="space-y-6">
            {gaps.critical?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-700 mb-3">CRITICAL MISSING SKILLS (RED)</h4>
                <div className="flex flex-wrap gap-2">
                  {gaps.critical.map((gap, i) => (
                    <SeverityTag key={i} severity="critical">{gap}</SeverityTag>
                  ))}
                </div>
              </div>
            )}
            
            {gaps.moderate?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-600 mb-3">MODERATE WARNINGS (AMBER)</h4>
                <div className="flex flex-wrap gap-2">
                  {gaps.moderate.map((gap, i) => (
                    <SeverityTag key={i} severity="warning">{gap}</SeverityTag>
                  ))}
                </div>
              </div>
            )}
            
            {gaps.aligned?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-emerald-700 mb-3">SUCCESSFULLY ALIGNED (GREEN)</h4>
                <div className="flex flex-wrap gap-2">
                  {gaps.aligned.map((gap, i) => (
                    <SeverityTag key={i} severity="success">{gap}</SeverityTag>
                  ))}
                </div>
              </div>
            )}

            {!gaps.critical?.length && !gaps.moderate?.length && !gaps.aligned?.length && (
              <p className="text-sm text-slate-500">No gap analysis available for this report.</p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <h3 className="text-lg font-bold text-slate-900 mb-6">AI Coach Recommendations</h3>
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                <div>
                  {rec.title && <h4 className="font-semibold text-slate-900 text-sm mb-1">{rec.title}</h4>}
                  {rec.description && <p className="text-slate-500 text-sm leading-relaxed">{rec.description}</p>}
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No role-specific recommendations were returned for this report.</p>
            )}
          </div>
        </Card>
      </div>}
    </div>
  );
};

export default Dashboard;
