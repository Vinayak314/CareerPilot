import { Link } from 'react-router-dom';
import { Upload, PlayCircle, Sparkles, Cpu, Target } from 'lucide-react';

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

const Landing = () => {
  return (
    <div className="flex flex-col items-center pb-24">
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
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
                to="/signup"
                className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm"
              >
                Upload Your Resume
                <Upload className="w-4 h-4" />
              </Link>
              <button
                className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                Watch Interactive Demo
              </button>
            </div>
            
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
              </div>
              <p>Trusted by <strong>10,000+</strong> job seekers at Google, Meta, & Stripe.</p>
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
                    <path className="donut-ring" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="donut-segment-green" strokeWidth="4" strokeDasharray="84, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
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

      {/* Steps Section */}
      <div className="w-full bg-slate-50/50 border-t border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-teal-700 text-xs font-bold tracking-widest uppercase mb-3 block">STEP-BY-STEP SYSTEM</span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Get Hired in Three Clear Steps</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
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
    </div>
  );
};

export default Landing;
