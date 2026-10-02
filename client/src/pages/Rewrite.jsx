import React from 'react';
import { Sparkles, Check, X, Edit2 } from 'lucide-react';

const Rewrite = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rewrite Studio</h1>
          <p className="text-slate-500 mt-2">Review AI-optimized bullet points for your resume</p>
        </div>
        <button className="px-6 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800">
          Save All Accepted
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
            <div className="flex-1 pr-8">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Original Bullet</span>
              <p className="text-slate-700">Managed team to build new API system for clients, which improved things.</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded">Weak Impact</span>
            </div>
          </div>
          
          <div className="bg-teal-50/30 rounded-lg p-5 border border-teal-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Suggested Rewrite</span>
                </div>
                <p className="text-slate-900 font-medium text-lg mb-3">
                  Spearheaded a cross-functional team of 5 to architect a scalable REST API, reducing client onboarding time by 40% and processing 1M+ daily requests.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-white border border-teal-200 text-teal-700 rounded text-xs font-medium">REST API</span>
                  <span className="px-2 py-1 bg-white border border-teal-200 text-teal-700 rounded text-xs font-medium">Scalable Architecture</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center justify-center" title="Accept">
                  <Check className="w-5 h-5" />
                </button>
                <button className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center justify-center" title="Edit">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center" title="Reject">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewrite;
