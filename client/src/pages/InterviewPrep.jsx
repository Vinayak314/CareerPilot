import React from 'react';

const InterviewPrep = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interview Prep</h1>
          <p className="text-slate-500 mt-2">Tailored questions for Senior Systems Engineer at Stripe</p>
        </div>
        <button className="px-6 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800">
          Start AI Mock Practice
        </button>
      </div>

      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded uppercase">Technical Depth</span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded">Hard</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              "Can you explain a time you had to design a distributed system that could handle high throughput while maintaining consistency?"
            </h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-bold text-slate-700 mb-2">Suggested Talking Points:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li>Reference your work with Kubernetes and Docker orchestration.</li>
                <li>Discuss the trade-offs between eventual consistency and strong consistency you made.</li>
                <li>Mention specific metrics (e.g. latency, requests per second) you optimized for.</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 text-sm">Add Notes</button>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 text-sm">Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewPrep;
