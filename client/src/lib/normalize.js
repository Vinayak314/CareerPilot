import { toScore } from './format';

/**
 * Normalisers convert API payloads into the shape the UI renders. They accept both
 * camelCase and the snake_case keys produced by the analyzer agent, and never throw
 * on missing/empty values.
 */

const arr = (value) => (Array.isArray(value) ? value : []);
const str = (value) => (typeof value === 'string' ? value.trim() : '');
const pick = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return undefined;
};

const humanize = (key) =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toLabelList = (value) =>
  arr(value)
    .map((item) => (typeof item === 'string' ? item : str(item?.keyword || item?.skill || item?.name || item?.label)))
    .map((s) => s.trim())
    .filter(Boolean);

export const unwrapList = (payload, ...keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

export const normalizeAnalysis = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw.analysis && typeof raw.analysis === 'object' ? raw.analysis : raw;

  const rawCategories = pick(a, 'categoryScores', 'category_scores');
  let categories = [];
  if (Array.isArray(rawCategories)) {
    categories = rawCategories
      .map((c) => ({ label: str(c?.label || c?.name || c?.category), score: toScore(c?.score ?? c?.value) }))
      .filter((c) => c.label);
  } else if (rawCategories && typeof rawCategories === 'object') {
    categories = Object.entries(rawCategories).map(([key, value]) => ({
      label: humanize(key),
      score: toScore(typeof value === 'object' ? value?.score : value),
    }));
  }

  const gaps = a.gaps && typeof a.gaps === 'object' ? a.gaps : {};
  const critical = toLabelList(gaps.critical ?? pick(a, 'missingKeywords', 'missing_keywords', 'criticalGaps'));
  const moderate = toLabelList(gaps.moderate ?? gaps.warnings ?? pick(a, 'weakKeywords', 'partialKeywords', 'warnings'));
  const aligned = toLabelList(gaps.aligned ?? gaps.matched ?? pick(a, 'matchedKeywords', 'matched_keywords', 'alignedKeywords'));

  const recommendations = arr(pick(a, 'recommendations', 'suggestions'))
    .map((r) =>
      typeof r === 'string'
        ? { title: r, description: '' }
        : { title: str(r?.title || r?.heading), description: str(r?.description || r?.detail || r?.body) }
    )
    .filter((r) => r.title || r.description);

  const formattingIssues = arr(pick(a, 'formattingIssues', 'formatting_issues'))
    .map((f) => (typeof f === 'string' ? f : str(f?.issue || f?.description || f?.message)))
    .filter(Boolean);

  return {
    id: a._id || a.id || null,
    source: str(a.source),
    resumeId: a.resumeId?._id || a.resumeId || null,
    jobDescriptionText: str(a.jobDescriptionText || a.job_description_text),
    company: str(pick(a, 'company', 'companyName', 'company_name')),
    jobTitle: str(pick(a, 'jobTitle', 'job_title', 'role', 'title')),
    atsScore: toScore(pick(a, 'atsScore', 'ats_score', 'score')),
    summary: str(pick(a, 'summary', 'overview')),
    categories,
    gaps: { critical, moderate, aligned },
    recommendations,
    formattingIssues,
    resumeName: str(pick(a, 'resumeName', 'resumeFileName') || a.resume?.originalName || a.resume?.fileName),
    createdAt: pick(a, 'createdAt', 'created_at') || null,
  };
};

export const analysisTitle = (analysis) => {
  if (!analysis) return '';
  const parts = [analysis.company, analysis.jobTitle].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Untitled analysis';
};

export const analysisContextLabel = (company, jobTitle) => {
  const normalizedCompany = str(company);
  const normalizedJobTitle = str(jobTitle);
  if (!normalizedCompany || !normalizedJobTitle) return '';
  if (normalizedCompany.toLowerCase() === 'unknown company') return '';
  if (/^0\s+jobs?\s+jobs?\s+in\s+united states$/i.test(normalizedJobTitle)) return '';
  return `${normalizedCompany} • ${normalizedJobTitle}`;
};

export const normalizeRewrites = (payload) => {
  const list = unwrapList(payload, 'rewrites', 'items', 'bullets');
  const bullets = list
    .map((r, index) => {
      const suggestions = arr(r?.suggestions || r?.options)
        .map((s, i) =>
          typeof s === 'string'
            ? { id: `${index}-${i}`, text: s, addedKeywords: [] }
            : {
                id: s?._id || s?.id || `${index}-${i}`,
                text: str(s?.text || s?.rewrite || s?.content),
                addedKeywords: toLabelList(s?.addedKeywords || s?.added_keywords || s?.keywords),
                tone: str(s?.tone),
              }
        )
        .filter((s) => s.text);
      const accepted = str(r?.acceptedVersion || r?.accepted_version);
      const status = ['accepted', 'rejected', 'pending'].includes(r?.status)
        ? r.status
        : accepted
          ? 'accepted'
          : 'pending';
      return {
        id: r?._id || r?.id || `rewrite-${index}`,
        original: str(r?.originalBullet || r?.original_bullet || r?.original || r?.bullet),
        issue: str(r?.issue || r?.reason || r?.weakness),
        suggestions,
        acceptedVersion: accepted,
        status,
      };
    })
    .filter((b) => b.id && (b.original || b.suggestions.length));

  const meta = Array.isArray(payload) ? {} : payload || {};
  return {
    bullets,
    company: str(meta.company),
    jobTitle: str(meta.jobTitle),
    scoreForecast: meta.scoreForecast ?? meta.score_forecast ?? null,
    keywordsAdded: meta.keywordsAdded ?? meta.keywords_added ?? null,
  };
};

export const normalizeInterviewPrep = (payload) => {
  const list = unwrapList(payload, 'questions', 'items');
  const questions = list
    .map((q, index) => ({
      id: q?._id || q?.id || `q-${index}`,
      persisted: Boolean(q?._id || q?.id),
      category: str(q?.category || q?.type),
      difficulty: str(q?.difficulty),
      question: str(q?.question || q?.prompt || q?.text),
      talkingPoints: toLabelList(q?.talkingPoints || q?.talking_points || [q?.tips, q?.rationale].filter(Boolean)),
      exampleResponse: str(q?.exampleResponse || q?.example_response || q?.sampleAnswer),
      criticalPhrases: toLabelList(q?.criticalPhrases || q?.critical_phrases || q?.keywords),
      notes: str(q?.notes),
    }))
    .filter((q) => q.question);

  const meta = Array.isArray(payload) ? {} : payload || {};
  const insights = meta.insights && typeof meta.insights === 'object' ? meta.insights : null;
  return {
    questions,
    company: str(meta.company),
    jobTitle: str(meta.jobTitle),
    insights: insights
      ? {
          title: str(insights.title),
          summary: str(insights.summary || insights.text),
          metrics: arr(insights.metrics)
            .map((m) => ({ label: str(m?.label || m?.name), value: m?.value }))
            .filter((m) => m.label && m.value !== undefined && m.value !== null && m.value !== ''),
        }
      : null,
  };
};

const WORK_MODES = ['remote', 'hybrid', 'on-site'];
const normalizeWorkMode = (value, location) => {
  const v = str(value).toLowerCase().replace(/\s+/g, '-');
  if (v === 'onsite' || v === 'in-office' || v === 'office') return 'on-site';
  if (WORK_MODES.includes(v)) return v;
  const loc = str(location).toLowerCase();
  if (loc.includes('remote')) return 'remote';
  if (loc.includes('hybrid')) return 'hybrid';
  return '';
};

export const normalizeJobMatch = (j, index = 0) => ({
  id: j?._id || j?.id || j?.jobPostingId || `job-${index}`,
  jobPostingId: j?.jobPostingId || j?._id || j?.id || null,
  title: str(j?.title || j?.jobTitle) || 'Untitled role',
  company: str(j?.company || j?.companyName),
  location: str(j?.location),
  workMode: normalizeWorkMode(j?.workMode || j?.work_mode, j?.location),
  salary: j?.salary,
  salaryMin: j?.salaryMin ?? j?.salary_min,
  salaryMax: j?.salaryMax ?? j?.salary_max,
  salaryCurrency: j?.salaryCurrency || j?.salary_currency,
  fitScore: toScore(j?.fitScore ?? j?.fit_score),
  matchedSkills: toLabelList(j?.matchedSkills || j?.matched_skills),
  warnings: toLabelList(j?.warnings || j?.partialSkills || j?.partial_skills),
  missingSkills: toLabelList(j?.missingSkills || j?.missing_skills),
  applyUrl: str(j?.applyUrl || j?.apply_url || j?.url || j?.redirectUrl),
  postedAt: j?.postedAt || j?.created || j?.createdAt || null,
});

export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

export const normalizeApplication = (a) => ({
  id: a?._id || a?.id,
  company: str(a?.company) || str(a?.jobMatch?.company),
  title: str(a?.title || a?.role) || str(a?.jobMatch?.title),
  status: APPLICATION_STATUSES.includes(a?.status) ? a.status : 'Saved',
  fitScore: toScore(a?.fitScore ?? a?.jobMatch?.fitScore),
  notes: str(a?.notes),
  reminder: str(a?.reminder || a?.nextStep),
  jobUrl: str(a?.jobUrl || a?.applyUrl || a?.jobMatch?.applyUrl),
  jobMatchId: a?.jobMatchId?._id || a?.jobMatchId || a?.jobMatch?._id || null,
  dateApplied: a?.dateApplied || null,
  createdAt: a?.createdAt || null,
  updatedAt: a?.updatedAt || null,
});

export const normalizeResume = (r) => ({
  id: r?._id || r?.id,
  name: str(r?.originalName || r?.fileName || r?.name) || 'Untitled resume',
  size: r?.size ?? r?.fileSize ?? null,
  createdAt: r?.createdAt || r?.uploadedAt || null,
  fitScore: toScore(r?.fitScore ?? r?.latestScore ?? r?.atsScore),
});
