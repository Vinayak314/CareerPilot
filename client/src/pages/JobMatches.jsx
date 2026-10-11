import { useState, useMemo } from 'react';
import { ExternalLink, BookmarkPlus, Search, Briefcase, AlertTriangle, Globe, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import useApi from '../hooks/useApi';
import { jobsApi, applicationsApi, resumeApi } from '../api/endpoints';
import { Card, PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui/Layout';
import ScoreRing from '../components/ui/ScoreRing';
import Button from '../components/ui/Button';
import { SeverityTag } from '../components/ui/Tags';
import { toast } from '../store/toastStore';
import { getErrorMessage } from '../lib/errors';
import { normalizeJobMatch } from '../lib/normalize';

const COUNTRIES = [
  { code: 'in', label: 'India (IN)' },
  { code: 'us', label: 'United States (US)' },
  { code: 'gb', label: 'United Kingdom (UK)' },
  { code: 'ca', label: 'Canada (CA)' },
  { code: 'au', label: 'Australia (AU)' },
  { code: 'sg', label: 'Singapore (SG)' },
  { code: 'de', label: 'Germany (DE)' },
];

const JobMatches = () => {
  const [selectedCountry, setSelectedCountry] = useState('in');
  const [selectedCity, setSelectedCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState(null);

  const loadMatches = async () => {
    const existing = (await jobsApi.matches()).filter((job) => !String(job.jobId || '').startsWith('mock-'));
    const resumes = await resumeApi.list();
    if (!resumes.length) return existing;
    setCurrentResumeId(resumes[0]._id);

    // If no existing matches, trigger search automatically
    if (!existing.length) {
      const refreshed = await jobsApi.find(resumes[0]._id, { country: selectedCountry });
      return refreshed.length ? refreshed : existing;
    }
    return existing;
  };

  const { data: jobData, loading, error, reload, setData } = useApi(loadMatches, []);

  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [roleType, setRoleType] = useState('all');
  const [expLevel, setExpLevel] = useState('all');
  const [sortBy, setSortBy] = useState('match');

  const jobs = useMemo(() => {
    if (!Array.isArray(jobData)) return [];
    return jobData.map((job, idx) => {
      const norm = normalizeJobMatch(job, idx);
      const isIntern = norm.employmentType === 'Internship' || /\b(intern(ship)?|co[- ]?op)\b/i.test(`${norm.title} ${job.descriptionText || ''}`);
      return {
        ...job,
        ...norm,
        id: job._id || norm.id,
        score: norm.fitScore,
        skills: norm.matchedSkills,
        url: norm.applyUrl || job.url,
        isInternship: isIntern,
        explanation: norm.explanation || job.explanation,
        eligibilityWarnings: norm.eligibilityWarnings || job.eligibilityWarnings || [],
        missingRequired: norm.missingRequired || job.missingRequired || [],
        missingPreferred: norm.missingPreferred || job.missingPreferred || [],
        relatedSkills: norm.relatedSkills || job.relatedSkills || [],
        scoreBreakdown: norm.scoreBreakdown || job.scoreBreakdown || null,
        experienceLevel: norm.experienceLevel || job.experienceLevel || (isIntern ? 'Internship' : 'Mid Level'),
      };
    });
  }, [jobData]);

  const handleRefresh = async () => {
    if (!currentResumeId) {
      toast.error('Please upload a resume first to find matching jobs.');
      return;
    }
    setRefreshing(true);
    try {
      const refreshed = await jobsApi.find(currentResumeId, {
        country: selectedCountry,
        location: selectedCity,
        employmentType: roleType === 'internships' ? 'internship' : roleType === 'jobs' ? 'full_time' : 'all',
      });
      setData(refreshed);
      toast.success(`Found ${refreshed.length} matching jobs!`);
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to refresh job matches.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async (job) => {
    setSavingId(job.id);
    try {
      await applicationsApi.create({
        company: job.company,
        title: job.title,
        url: job.url,
        status: 'Saved',
        jobMatchId: job._id,
        fitScore: job.fitScore || job.score,
        notes: `Salary: ${job.salary || 'Not specified'}, Location: ${job.location || 'Unknown'}`
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

    // Employment / Role filter
    if (roleType === 'jobs') result = result.filter((job) => !job.isInternship);
    if (roleType === 'internships') result = result.filter((job) => job.isInternship);
    if (roleType === 'contract') result = result.filter((job) => job.employmentType === 'Contract');

    // Experience Level filter
    if (expLevel !== 'all') {
      result = result.filter((job) => (job.experienceLevel || '').toLowerCase().includes(expLevel.toLowerCase()));
    }

    // Keyword & text search filter
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((j) =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.skills?.some((s) => s.toLowerCase().includes(q)) ||
        j.missingSkills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'match') return (b.score || 0) - (a.score || 0);
      return (b.postedAt ? new Date(b.postedAt).getTime() : 0) - (a.postedAt ? new Date(a.postedAt).getTime() : 0);
    });

    return result;
  }, [jobs, filter, roleType, expLevel, sortBy]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Finding matches..." description="Searching Adzuna for targeted roles aligned with your resume." />
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
    <div className="max-w-6xl mx-auto animate-[fadeIn_300ms_ease-out] pb-12">
      <PageHeader 
        title="Job Matches" 
        description="Personalized, evidence-based recommendations matched against your profile."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <Globe className="w-4 h-4 text-slate-500 ml-1.5" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none"
                aria-label="Target country"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <div className="h-4 w-px bg-slate-200" />
              <MapPin className="w-4 h-4 text-slate-500 ml-1" />
              <input
                type="text"
                placeholder="City/Remote (opt)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-slate-700 text-xs w-28 focus:outline-none placeholder:text-slate-400"
              />
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                loading={refreshing}
                onClick={handleRefresh}
                className="text-xs py-1 px-2.5 h-7"
              >
                Search
              </Button>
            </div>
          </div>
        }
      />

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by title, company, location, or skill..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full bg-white shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            aria-label="Filter by role type"
            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          >
            <option value="all">All Roles</option>
            <option value="jobs">Full-time Jobs</option>
            <option value="internships">Internships</option>
            <option value="contract">Contract</option>
          </select>

          <select
            value={expLevel}
            onChange={(e) => setExpLevel(e.target.value)}
            aria-label="Filter by experience level"
            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          >
            <option value="all">All Levels</option>
            <option value="internship">Internship</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort listings"
            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          >
            <option value="match">Sort: Match Score</option>
            <option value="date">Sort: Date Posted</option>
          </select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title={filter ? "No matching jobs found" : "No live listings found"}
          description={filter 
            ? "Try adjusting your keywords or clearing the active filters." 
            : "No active Adzuna jobs were returned for this query. Try choosing another country or searching for a different role."
          }
          action={
            <Button variant="secondary" onClick={() => { setFilter(''); setRoleType('all'); setExpLevel('all'); handleRefresh(); }}>
              Reset Filters & Refresh
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map((job) => (
            <Card key={job.id || job._id} className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6 transition-all hover:shadow-md border border-slate-200">
              {/* Score Ring */}
              <div className="flex flex-col items-center justify-start flex-shrink-0 pt-1">
                <ScoreRing score={job.score || 0} size={76} stroke={6} />
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  {job.score >= 80 ? 'High Fit' : job.score >= 60 ? 'Good Fit' : 'Moderate'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Header: Title, Company, Meta, Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={job.title}>
                        {job.title}
                      </h3>
                      {job.employmentType && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          job.employmentType === 'Internship' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {job.employmentType}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {job.experienceLevel}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-slate-500 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-800">{job.company}</span>
                      {job.location && (
                        <span className="flex items-center before:content-['•'] before:mr-3 before:text-slate-300">
                          {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="flex items-center before:content-['•'] before:mr-3 before:text-slate-300 font-medium text-emerald-700">
                          {job.salary}
                        </span>
                      )}
                      {job.postedAt && (
                        <span className="flex items-center before:content-['•'] before:mr-3 before:text-slate-300 text-xs text-slate-400">
                          {new Date(job.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-1 sm:mt-0">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleSave(job)}
                      loading={savingId === (job.id || job._id)}
                      disabled={savingId !== null}
                      icon={BookmarkPlus}
                      className="flex-1 sm:flex-none text-xs sm:text-sm py-2 px-3"
                    >
                      Save
                    </Button>
                    <Button 
                      as="a"
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      iconRight={ExternalLink}
                      className="flex-1 sm:flex-none text-xs sm:text-sm py-2 px-3.5"
                      disabled={!job.url}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Match Explanation & Score Breakdown */}
                {job.explanation && (
                  <div className="mt-2.5 p-3 rounded-lg bg-teal-50/70 border border-teal-100/80 text-xs text-teal-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-teal-950">Why this matches: </span>
                      <span>{job.explanation}</span>
                      {job.scoreBreakdown && (
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-teal-800 font-medium">
                          <span>Role: <strong>{job.scoreBreakdown.role}%</strong></span>
                          <span>•</span>
                          <span>Skills: <strong>{job.scoreBreakdown.skills}%</strong></span>
                          <span>•</span>
                          <span>Experience: <strong>{job.scoreBreakdown.experience}%</strong></span>
                          <span>•</span>
                          <span>Location: <strong>{job.scoreBreakdown.location}%</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Eligibility Warnings */}
                {job.eligibilityWarnings?.length > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-950">Eligibility Notice: </span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {job.eligibilityWarnings.map((w, idx) => (
                          <li key={idx} className="inline mr-3">{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Skills Grid */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                  {/* Aligned Skills */}
                  {job.skills?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Aligned Skills ({job.skills.length})
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {job.skills.map((skill, i) => (
                          <SeverityTag key={i} severity="success" size="sm">{skill}</SeverityTag>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills Gap Breakdown */}
                  {((job.missingRequired?.length > 0) || (job.missingPreferred?.length > 0) || (job.missingSkills?.length > 0)) && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Skill Gaps
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Mandatory / Required Skills Missing */}
                        {job.missingRequired?.map((skill, i) => (
                          <SeverityTag key={`req-${i}`} severity="critical" size="sm">
                            Required: {skill}
                          </SeverityTag>
                        ))}

                        {/* Preferred / Nice-to-have Skills Missing */}
                        {job.missingPreferred?.map((skill, i) => (
                          <SeverityTag key={`pref-${i}`} severity="warning" size="sm">
                            Preferred: {skill}
                          </SeverityTag>
                        ))}

                        {/* Fallback if not partitioned */}
                        {!job.missingRequired?.length && !job.missingPreferred?.length && job.missingSkills?.map((skill, i) => (
                          <SeverityTag key={`gen-${i}`} severity="warning" size="sm">{skill}</SeverityTag>
                        ))}

                        {/* Related / Transferable Skills */}
                        {job.relatedSkills?.map((rel, i) => (
                          <SeverityTag key={`rel-${i}`} severity="brand" size="sm">
                            Transferable: {rel.skill} (you know {rel.possessedRelated?.slice(0, 2).join(', ')})
                          </SeverityTag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobMatches;
