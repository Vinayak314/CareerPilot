import React from 'react';

const Tracker = () => {
  const columns = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
        </div>
        <button className="px-4 py-2 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800">
          + Add Job manually
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
        {columns.map(col => (
          <div key={col} className="w-80 flex-shrink-0 bg-slate-50 rounded-xl p-4 flex flex-col">
            <h3 className="font-bold text-slate-900 mb-4">{col}</h3>
            
            {/* Dummy Card */}
            {col === 'Saved' && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">Frontend Engineer</h4>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">85% Fit</span>
                </div>
                <div className="text-sm text-slate-500 mb-3">Stripe</div>
                <div className="text-xs text-slate-400">Saved 2 days ago</div>
              </div>
            )}
            
            {col === 'Applied' && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">Software Engineer</h4>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">70% Fit</span>
                </div>
                <div className="text-sm text-slate-500 mb-3">Google</div>
                <div className="text-xs text-slate-400">Applied Oct 1, 2026</div>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tracker;
