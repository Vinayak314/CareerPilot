import { Sparkles, PenTool } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      
      <main className="ml-64 p-8">
        
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                STRIPE <span className="text-slate-300">•</span> <span className="text-slate-500 normal-case tracking-normal font-medium">Senior Systems Engineer</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">ATS Real-time Optimization Report</h1>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 flex items-center gap-2 transition-colors">
                <Sparkles className="w-4 h-4" />
                Prep for Interview
              </button>
              <button className="px-4 py-2 bg-teal-700 text-white font-medium rounded hover:bg-teal-800 flex items-center gap-2 transition-colors">
                <PenTool className="w-4 h-4" />
                Rewrite Resume
              </button>
            </div>
          </div>
          
          {/* Main Top Cards */}
          <div className="flex gap-6 mb-8">
            {/* Overall Score */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex-1 flex items-center gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path className="donut-ring" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="donut-segment-amber" strokeWidth="3" strokeDasharray="72, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">72%</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">72% Match — Good Progress</h3>
                <p className="text-slate-500 leading-relaxed max-w-md text-sm">
                  Your credentials align well, but missing key technical requirements is currently triggering warning tags. Action recommendations below.
                </p>
              </div>
            </div>
            
            {/* Metric Cards Grid */}
            <div className="flex gap-4">
              <MetricCard title="TECHNICAL SKILLS" score={88} color="green" />
              <MetricCard title="CORE KEYWORDS" score={45} color="red" />
              <MetricCard title="FORMAT & SYNTAX" score={95} color="green" />
              <MetricCard title="EDUCATION GAP" score={100} color="green" />
            </div>
          </div>
          
          {/* Bottom Split Section */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Semantic Gap Analysis</h3>
                <span className="text-sm text-slate-400 font-medium">12 Gaps Identified</span>
              </div>
              
              <div className="space-y-6">
                <GapCategory 
                  title="CRITICAL MISSING SKILLS (RED)" 
                  color="red"
                  tags={['Kubernetes Deployments', 'Golang Architecture', 'Microservices Routing']} 
                />
                <GapCategory 
                  title="MODERATE WARNINGS (AMBER)" 
                  color="amber"
                  tags={['gRPC Protocols', 'Redis Caching']} 
                />
                <GapCategory 
                  title="SUCCESSFULLY ALIGNED (GREEN)" 
                  color="green"
                  tags={['Cloud Engineering', 'Docker Orchestration', 'CI/CD Pipelines']} 
                />
              </div>
            </div>
            
            <div className="col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">AI Coach Recommendations</h3>
              
              <div className="space-y-4">
                <RecommendationCard 
                  title="Improve experience metrics"
                  desc="Embed your 'Docker' experience directly alongside quantitative stats in your Stripe section."
                />
                <RecommendationCard 
                  title="Optimize header keywords"
                  desc="Your resume header currently misses 'Systems Architect' context tags."
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ title, score, color }) => {
  const strokeClass = color === 'green' ? 'donut-segment-green' : color === 'red' ? 'donut-segment-red' : 'donut-segment-amber';
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-between min-w-[120px]">
      <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider mb-3">
        {title}
      </div>
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path className="donut-ring" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path className={strokeClass} strokeWidth="4" strokeDasharray={`${score}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900">{score}%</span>
        </div>
      </div>
    </div>
  );
};

const GapCategory = ({ title, color, tags }) => {
  const titleColor = color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-600' : 'text-emerald-700';
  const bgClass = color === 'red' ? 'bg-red-50 text-red-700' : color === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
  const icon = color === 'red' ? '✕' : color === 'amber' ? '!' : '✓';
  
  return (
    <div>
      <h4 className={`text-xs font-bold ${titleColor} mb-3`}>{title}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${bgClass}`}>
             <span className="font-bold">{icon}</span> {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const RecommendationCard = ({ title, desc }) => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex gap-3">
      <Sparkles className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

export default Dashboard;
