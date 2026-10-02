import React from 'react';

const JobMatches = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Matches</h1>
          <p className="text-slate-500 mt-2">Roles ranked by your resume match score</p>
        </div>
        <div className="flex gap-4">
          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium">
            <option>Sort by: Match Score</option>
            <option>Sort by: Date Added</option>
          </select>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Filters</button>
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 flex gap-6">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path className="donut-ring" strokeWidth="4" fill="none" stroke="#f1f5f9" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="donut-segment-green" strokeWidth="4" strokeDasharray="85, 100" fill="none" stroke="#10b981" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900">85%</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Senior Full Stack Engineer</h3>
                  <div className="text-slate-500 text-sm mt-1 flex gap-3">
                    <span className="font-medium text-slate-700">Acme Corp</span>
                    <span>San Francisco, CA (Hybrid)</span>
                    <span>$140k - $180k</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 text-sm">Save</button>
                  <button className="px-4 py-2 bg-teal-700 text-white font-medium rounded hover:bg-teal-800 text-sm">Quick Apply</button>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Aligned Skills</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">React</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">Node.js</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">TypeScript</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobMatches;
