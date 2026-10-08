import { useState, useMemo } from 'react';
import { ExternalLink, BookmarkPlus, Search, Briefcase } from 'lucide-react';
import useApi from '../hooks/useApi';
import { jobsApi, applicationsApi, resumeApi } from '../api/endpoints';
import { Card, PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui/Layout';
import ScoreRing from '../components/ui/ScoreRing';
import Button from '../components/ui/Button';
import { SeverityTag } from '../components/ui/Tags';
import { toast } from '../store/toastStore';
import { getErrorMessage } from '../lib/errors';

const JobMatches = () => {
  const loadMatches = async () => {
    const existing = await jobsApi.matches();
    if (existing.length) return existing;
    const resumes = await resumeApi.list();
    if (!resumes.length) return [];
    return jobsApi.find(resumes[0]._id);
  };
  const { data: jobData, loading, error, reload } = useApi(loadMatches, []);
  const jobs = Array.isArray(jobData) ? jobData.map((job) => ({
    ...job,
    id: job._id,
    score: job.fitScore,
    skills: job.matchedSkills || [],
    url: job.url,
  })) : [];
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');

  const handleSave = async (job) => {
    setSavingId(job.id);
    try {
      await applicationsApi.create({
        company: job.company,
        title: job.title,
        url: job.url,
        status: 'Saved',
        jobMatchId: job._id,
        fitScore: job.fitScore,
        notes: `Salary: ${job.salary || 'Unknown'}, Location: ${job.location || 'Unknown'}`
      });
      toast.success(`Saved ${job.title} at ${job.company}`);
    } catch (err) {
      toast.error('Failed to save job. You might have saved it already.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...jobs];
    
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter(j => 
        j.title?.toLowerCase().includes(q) || 
        j.company?.toLowerCase().includes(q) ||
        j.skills?.some(s => s.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'match') return (b.score || 0) - (a.score || 0);
      return (b.postedAt ? new Date(b.postedAt).getTime() : 0) - (a.postedAt ? new Date(a.postedAt).getTime() : 0);
    });

    return result;
  }, [jobs, filter, sortBy]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Finding matches..." description="Searching for jobs that align with your resume." />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState
          title="Failed to load job matches"
          message={error.response?.status === 404
            ? 'The jobs API endpoint is not available on the server yet.'
            : getErrorMessage(error)}
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <PageHeader 
        title="Job Matches" 
        description="Roles ranked by how well they align with your resume."
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter by title or skill..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-64"
              />
            </div>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="match">Sort by: Match Score</option>
              <option value="date">Sort by: Date Posted</option>
            </select>
          </div>
        }
      />

      {filteredAndSorted.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title={filter ? "No matches found" : "No jobs available"}
          description={filter ? "Try adjusting your search filters." : "We couldn't find any job matches for your profile yet."}
        />
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map((job) => (
            <Card key={job.id || job._id} className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 transition-shadow hover:shadow-md">
              <div className="flex justify-center sm:block flex-shrink-0">
                <ScoreRing score={job.score || 0} size={80} stroke={6} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={job.title}>
                      {job.title}
                    </h3>
                    <div className="text-slate-500 text-sm mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-700">{job.company}</span>
                      {job.location && <span className="flex items-center before:content-['•'] before:mr-3 before:text-slate-300">{job.location}</span>}
                      {job.salary && <span className="flex items-center before:content-['•'] before:mr-3 before:text-slate-300">{job.salary}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleSave(job)}
                      loading={savingId === (job.id || job._id)}
                      disabled={savingId !== null}
                      icon={BookmarkPlus}
                      className="flex-1 sm:flex-none"
                    >
                      Save
                    </Button>
                    <Button 
                      as="a"
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      iconRight={ExternalLink}
                      className="flex-1 sm:flex-none"
                      disabled={!job.url}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
                
                {job.skills?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Aligned Skills</h4>
                    <div className="flex gap-2 flex-wrap">
                      {job.skills.map((skill, i) => (
                        <SeverityTag key={i} severity="success" size="sm">{skill}</SeverityTag>
                      ))}
                    </div>
                  </div>
                )}
                {job.missingSkills?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Missing Skills</h4>
                    <div className="flex gap-2 flex-wrap">
                      {job.missingSkills.map((skill, i) => (
                        <SeverityTag key={i} severity="warning" size="sm">{skill}</SeverityTag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobMatches;
