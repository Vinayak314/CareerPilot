import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, PenTool, FileText, ArrowRight } from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';
import useApi from '../hooks/useApi';
import { analysisApi } from '../api/endpoints';
import { normalizeAnalysis, analysisTitle } from '../lib/normalize';
import { scoreLabel, toScore } from '../lib/format';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui/Layout';
import ScoreRing from '../components/ui/ScoreRing';
import { SeverityTag } from '../components/ui/Tags';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const { currentAnalysisId, setCurrentAnalysisId } = useAnalysisStore();
  const navigate = useNavigate();

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

  const { data: analysis, loading, error, reload } = useApi(loader, [currentAnalysisId]);

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
    id,
    company,
    jobTitle,
    atsScore,
    summary,
    categories = [],
    gaps = { critical: [], moderate: [], aligned: [] },
    recommendations = [],
  } = analysis;

  const titleText = analysisTitle(analysis);

  return (
    <div className="max-w-6xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          {company && jobTitle && (
            <div className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-2 flex items-center gap-2">
              {company} <span className="text-slate-300">•</span> <span className="text-slate-500 normal-case tracking-normal font-medium">{jobTitle}</span>
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

      <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
        <Card className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <ScoreRing score={atsScore} size={130} stroke={8} label="Overall Match" />
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{atsScore}% Match — {scoreLabel(atsScore)}</h3>
            <p className="text-slate-500 leading-relaxed text-sm max-w-md">
              {summary || 'Your credentials align well, but some missing requirements trigger warning tags. Action recommendations below.'}
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap lg:flex-nowrap gap-4 flex-shrink-0">
          {categories.map((cat, i) => (
            <Card key={i} padded={false} className="p-4 flex flex-col items-center justify-between min-w-[120px] flex-1 lg:flex-none">
              <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider mb-3">
                {cat.label}
              </div>
              <ScoreRing score={cat.score} size={64} label={cat.label} />
            </Card>
          ))}
          {categories.length === 0 && (
             <div className="text-sm text-slate-400 p-8 flex items-center justify-center border border-slate-200 border-dashed rounded-xl w-full">
               No category data available.
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
              <p className="text-sm text-slate-500">No recommendations available.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
