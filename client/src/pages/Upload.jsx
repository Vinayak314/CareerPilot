import React from 'react';

const Upload = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Upload Resume</h1>
      {/* Upload UI based on figma/upload-desktop.png */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center mb-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Drag and drop your resume</h3>
        <p className="text-slate-500 mb-4">or click to browse from your computer</p>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Browse Files</button>
        <p className="text-xs text-slate-400 mt-4">Supported formats: PDF, DOCX (Max 10MB)</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-900 mb-2">Target Job Description</label>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-4 h-48 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Paste the job description here..."
        ></textarea>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-sm font-medium text-slate-400">OR</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>
        <input 
          type="text" 
          className="w-full bg-white border border-slate-200 rounded-xl p-4 mt-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Paste Job URL (e.g. LinkedIn, Indeed)..."
        />
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Clear All</button>
        <button className="px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800">Analyze Resume</button>
      </div>
    </div>
  );
};

export default Upload;
