import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <div className="border-b border-slate-200 px-6 py-4 flex gap-6 bg-slate-50">
          <button className="font-bold text-teal-700 border-b-2 border-teal-700 pb-1">User Account</button>
          <button className="font-medium text-slate-500 hover:text-slate-700 pb-1">Security</button>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h3>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input type="text" className="w-full bg-white border border-slate-200 rounded px-4 py-2" defaultValue="David Miller" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input type="email" className="w-full bg-white border border-slate-200 rounded px-4 py-2" defaultValue="david.m@example.com" />
            </div>
            
            <button className="px-4 py-2 bg-teal-700 text-white font-medium rounded hover:bg-teal-800">
              Save Changes
            </button>
          </div>
          
          <hr className="my-8 border-slate-200" />
          
          <h3 className="text-lg font-bold text-slate-900 mb-4">Uploaded Resumes</h3>
          
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
            <div className="p-4 flex justify-between items-center bg-white hover:bg-slate-50">
              <div>
                <div className="font-medium text-slate-900">David_Miller_Resume_2026.pdf</div>
                <div className="text-sm text-slate-500">Uploaded Oct 1, 2026</div>
              </div>
              <button className="text-red-600 text-sm font-medium hover:underline">Delete</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;
