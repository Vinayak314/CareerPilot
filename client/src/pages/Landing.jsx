import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles, Cpu, Target, ChevronDown, CheckCircle2, Zap, FileText } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Upload & Input',
    desc: 'Drag and drop your resume in PDF/DOCX format, then paste your target job description or paste its URL directly.',
    icon: <Upload className="w-5 h-5 text-teal-700" />
  },
  {
    num: '02',
    title: 'Instant Analysis',
    desc: 'Our Notion-grade AI processes your content and scores against actual Applicant Tracking System algorithm paradigms.',
    icon: <Cpu className="w-5 h-5 text-teal-700" />
  },
  {
    num: '03',
    title: 'Close the Gaps',
    desc: 'Action dynamic custom suggestions to optimize missing keywords, alignment formatting, and targeted career objectives.',
    icon: <Sparkles className="w-5 h-5 text-teal-700" />
  }
];

const features = [
  {
    title: 'ATS Scoring Engine',
    desc: 'See exactly how your resume is parsed by automated tracking systems and get a realistic match score.',
    icon: <Target className="w-6 h-6 text-teal-600" />
  },
  {
    title: 'Smart Keyword Gap Analysis',
    desc: 'Instantly identify missing hard skills and competencies required by the job description.',
    icon: <Zap className="w-6 h-6 text-amber-500" />
  },
  {
    title: 'AI Resume Rewriter',
    desc: 'Automatically generate high-impact, results-driven bullet points tailored to your specific experience.',
    icon: <FileText className="w-6 h-6 text-emerald-500" />
  },
  {
    title: 'Interactive Mock Interviews',
    desc: 'Practice with AI-generated technical and behavioral questions specific to the role and company.',
    icon: <Cpu className="w-6 h-6 text-teal-600" />
  }
];

const faqs = [
  {
    question: 'How accurate is the ATS scoring?',
    answer: 'Our scoring model is built on the same parsing technologies and keyword weighting algorithms used by major ATS platforms like Workday, Greenhouse, and Lever, giving you a highly accurate representation of how employers see your resume.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We do not sell your personal information or use your resumes to train public AI models. Your data is encrypted in transit and at rest, and you can delete your account and all associated files at any time.'
  },
  {
    question: 'Can I use CareerPilot for different types of roles?',
    answer: 'Yes! CareerPilot analyzes your resume dynamically against any job description you provide, whether you are applying for a software engineering role, a marketing position, or a product management gig.'
  }
];

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <button 
        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-bold text-slate-900 text-left">{faq.question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 pt-2 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
          {faq.answer}
        </div>
      )}
    </div>
  );
};

const Landing = () => {
  return (
    <div className="flex flex-col items-center pb-24">
      {/* Hero Section */}
      <div id="hero" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold tracking-wide uppercase mb-6 md:mb-8">
              Introducing CareerPilot AI 2.0 <Sparkles className="w-3.5 h-3.5" />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6 text-balance">
              Stop guessing.<br />Close the resume gap.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 mb-8 md:mb-10 leading-relaxed max-w-lg text-pretty">
              Power your job search with AI analysis. Compare your resume against target job descriptions, discover critical keyword gaps, and instantly align your profile for maximum ATS visibility.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/upload"
                className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700"
              >
                Upload Your Resume
                <Upload className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hero Image / Graphic (simplified representation) */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative max-w-[400px] w-full mx-auto lg:mx-0 lg:ml-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-900 text-sm md:text-base">ATS Alignment Score</h3>
               <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md">94% MATCH</span>
             </div>
             
             <div className="flex items-center gap-6 md:gap-8">
                {/* Donut */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path className="donut-ring" strokeWidth="4" fill="none" stroke="#f1f5f9" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="donut-segment-green" strokeWidth="4" strokeDasharray="84, 100" fill="none" stroke="#10b981" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-900">84%</span>
                  </div>
                </div>
                
                {/* Bars */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Technical Skills</span>
                      <span className="font-medium text-slate-900">92%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Soft Competencies</span>
                      <span className="font-medium text-slate-900">78%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Experience Alignment</span>
                      <span className="font-medium text-slate-900">85%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="w-full bg-slate-50 border-t border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-700 text-xs font-bold tracking-widest uppercase mb-3 block">POWERFUL FEATURES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to land the interview</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Our tools give you the exact insights required to bypass automated filters and impress hiring managers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div id="how-it-works" className="w-full py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-teal-700 text-xs font-bold tracking-widest uppercase mb-3 block">STEP-BY-STEP SYSTEM</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Get Hired in Three Clear Steps</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              CareerPilot operates directly in your browser. Seamless, secure, and incredibly precise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-700">
                    {step.icon}
                  </div>
                  <span className="text-4xl font-bold text-slate-100 group-hover:text-slate-200 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
      
      {/* FAQ Section */}
      <div id="faq" className="w-full bg-slate-50 border-t border-slate-100 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-lg">Got questions? We've got answers.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} faq={faq} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Landing;
