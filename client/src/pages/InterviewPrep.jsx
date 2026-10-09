import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, ArrowLeft, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';
import useApi from '../hooks/useApi';
import { advisorApi, analysisApi } from '../api/endpoints';
import { normalizeInterviewPrep, analysisContextLabel } from '../lib/normalize';
import { Card, PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui/Layout';
import Button from '../components/ui/Button';
import { SeverityTag } from '../components/ui/Tags';
import { toast } from '../store/toastStore';
import { TextArea } from '../components/ui/FormField';

const InterviewPrep = () => {
  const { currentAnalysisId } = useAnalysisStore();
  
  const loader = async () => {
    if (!currentAnalysisId) return null;
    const analysis = await analysisApi.get(currentAnalysisId);
    return { questions: [], company: analysis.company, jobTitle: analysis.jobTitle };
  };

  const { data, loading, error, reload, setData } = useApi(loader, [currentAnalysisId]);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [evaluatingIndex, setEvaluatingIndex] = useState(null);

  const handleGenerate = async () => {
    if (!currentAnalysisId) return;
    setGenerating(true);
    try {
      const raw = await advisorApi.generateInterviewPrep(currentAnalysisId);
      setData(normalizeInterviewPrep(raw));
      setAnswers({});
      setFeedback({});
      toast.success('Interview questions generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate interview prep.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (index, answer) => {
    setAnswers((current) => ({ ...current, [index]: answer }));
    setFeedback((current) => ({ ...current, [index]: undefined }));
  };

  const handleEvaluateAnswer = async (index, question) => {
    const answer = answers[index]?.trim() || '';
    if (answer.length < 10) {
      toast.error('Write at least a sentence before requesting feedback.');
      return;
    }
    setEvaluatingIndex(index);
    try {
      const result = await advisorApi.evaluateInterviewAnswer(currentAnalysisId, {
        question: question.question,
        category: question.type,
        answer,
      });
      setFeedback((current) => ({ ...current, [index]: result }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to get answer feedback.');
    } finally {
      setEvaluatingIndex(null);
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
      <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_300ms_ease-out]">
        <PageHeader title="Loading prep materials..." description="Fetching your customized interview questions." />
        <LoadingState rows={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState title="Failed to load interview prep" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { questions = [], company, jobTitle } = data || {};
  const contextLabel = analysisContextLabel(company, jobTitle);

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <PageHeader 
        eyebrow={contextLabel || undefined}
        title="Interview Prep" 
        description="Tailored questions based on your resume and the target role."
        actions={
          <div className="flex gap-3">
            <Button as={Link} to="/dashboard" variant="secondary" icon={ArrowLeft}>
              Dashboard
            </Button>
            <Button onClick={handleGenerate} loading={generating} disabled={loading} icon={Sparkles}>
              {questions.length > 0 ? 'Regenerate' : 'Generate Questions'}
            </Button>
          </div>
        }
      />

      {generating && (
        <Card className="mb-8 flex flex-col items-center justify-center p-12 text-center border-teal-200 bg-teal-50/30">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Creating Mock Interview</h3>
          <p className="text-sm text-slate-500">Our AI is generating customized questions based on your gaps and strengths...</p>
        </Card>
      )}

      {!generating && questions.length === 0 && (
        <Card className="mb-8 text-center p-12 bg-slate-50">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm ring-1 ring-slate-200 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No questions yet</h3>
          <p className="text-sm text-slate-500 mb-4">Click "Generate Questions" to have our AI create a custom prep set.</p>
        </Card>
      )}

      <div className="space-y-6">
        {!generating && questions.map((q, i) => (
          <QuestionCard
            key={i}
            question={q}
            index={i}
            answer={answers[i] || ''}
            feedback={feedback[i]}
            evaluating={evaluatingIndex === i}
            onAnswerChange={handleAnswerChange}
            onEvaluate={handleEvaluateAnswer}
          />
        ))}
      </div>
    </div>
  );
};

const QuestionCard = ({ question, index, answer, feedback, evaluating, onAnswerChange, onEvaluate }) => {
  const [expanded, setExpanded] = useState(false);
  const { question: text, category, difficulty, talkingPoints = [], exampleResponse } = question;

  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'critical'
  };

  return (
    <Card padded={false} className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="p-5 sm:p-6 cursor-pointer flex gap-4 items-start select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded uppercase tracking-wide">
              {category || 'General'}
            </span>
            <SeverityTag severity={difficultyColors[difficulty?.toLowerCase()] || 'neutral'} size="sm">
              {difficulty || 'Medium'}
            </SeverityTag>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {text}
          </h3>
        </div>
        <div className="flex-shrink-0 mt-1">
           <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
             {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
           </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 animate-[fadeIn_200ms_ease-out]">
          {talkingPoints.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" /> Suggested Talking Points
              </h4>
              <ul className="space-y-2">
                {talkingPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="text-teal-500 mt-1 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {exampleResponse && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Example Framework Response</h4>
              <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600 leading-relaxed italic">
                "{exampleResponse}"
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6 border-t border-slate-100 space-y-4">
        <TextArea
          label="Your answer"
          hint="Type your response as you would say it in an interview. You can edit it and request feedback again."
          value={answer}
          onChange={(event) => onAnswerChange(index, event.target.value)}
          rows={5}
          maxLength={6000}
          placeholder="Write your answer here..."
        />
        <div className="flex justify-end">
          <Button onClick={() => onEvaluate(index, question)} loading={evaluating} disabled={answer.trim().length < 10} icon={Sparkles}>
            Get AI Feedback
          </Button>
        </div>

        {feedback && (
          <div className="rounded-xl border border-teal-200 bg-white p-4 sm:p-5 space-y-4" aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <h4 className="font-bold text-slate-900">AI feedback</h4>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">{feedback.score}/5</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{feedback.overall}</p>
            {feedback.strengths?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-emerald-800 mb-1">What worked</h5>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {feedback.strengths.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {feedback.improvements?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-amber-800 mb-1">How to improve</h5>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {feedback.improvements.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {feedback.exampleUpgrade && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h5 className="text-sm font-semibold text-slate-800 mb-1">Possible stronger version</h5>
                <p className="text-sm leading-relaxed text-slate-600">{feedback.exampleUpgrade}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default InterviewPrep;
