import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, FileText, Trash2, Shield, LogOut, Bell } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useApi from '../hooks/useApi';
import { userApi, resumeApi } from '../api/endpoints';
import { Card, PageHeader } from '../components/ui/Layout';
import { TextField, Toggle } from '../components/ui/FormField';
import Button from '../components/ui/Button';
import { toast } from '../store/toastStore';

const Settings = () => {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  // Account form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    applicationUpdates: true,
    interviewReminders: true,
    jobMatchAlerts: false,
    analysisUpdates: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Resumes
  const {
    data: resumeData,
    error: resumesError,
    loading: resumesLoading,
    reload: reloadResumes,
    setData: setResumes,
  } = useApi(resumeApi.list, []);
  // A failed API request leaves useApi.data as null. Keep the view safe while
  // showing the failure separately from a genuinely empty resume list.
  const resumes = Array.isArray(resumeData) ? resumeData : [];

  const handleAccountSave = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const updatedUser = await userApi.updateProfile({ name, email });
      setUser(updatedUser.user || updatedUser);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    setSavingSecurity(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSavingNotifs(true);
    try {
      if (userApi.updatePreferences) {
        await userApi.updatePreferences({ notifications });
      }
      toast.success('Notification preferences saved.');
    } catch (err) {
      toast.error('Failed to save preferences.');
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.remove(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted.');
    } catch (err) {
      toast.error('Failed to delete resume.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_300ms_ease-out]">
      <PageHeader title="Settings" description="Manage your account preferences and data." />
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-sm">
        <div className="border-b border-slate-200 flex bg-slate-50/50 overflow-x-auto">
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'account' ? 'border-teal-700 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('account')}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" /> User Account
            </div>
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'border-teal-700 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </div>
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-teal-700 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('security')}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security
            </div>
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
          {activeTab === 'account' && (
            <div className="space-y-10 animate-[fadeIn_200ms_ease-out]">
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h3>
                <form onSubmit={handleAccountSave} className="space-y-5 max-w-md">
                  <TextField 
                    id="name" 
                    label="Full Name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    icon={User} 
                  />
                  <TextField 
                    id="email" 
                    type="email" 
                    label="Email Address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    icon={Mail} 
                  />
                  <Button type="submit" loading={savingAccount} className="mt-2">
                    Save Changes
                  </Button>
                </form>
              </section>
              
              <hr className="border-slate-100" />
              
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Uploaded Resumes</h3>
                </div>
                
                {resumesLoading ? (
                  <div className="text-sm text-slate-500 py-4">Loading resumes...</div>
                ) : resumesError ? (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900">
                    <p>Could not load your resumes. Please try again.</p>
                    <Button variant="ghost" size="sm" onClick={reloadResumes} className="mt-2 text-amber-900">
                      Retry
                    </Button>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="border border-slate-200 border-dashed rounded-lg p-8 text-center text-slate-500 text-sm">
                    No resumes uploaded yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {resumes.map(r => (
                      <div key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm truncate">{r.fileName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteResume(r._id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto flex-shrink-0">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10 animate-[fadeIn_200ms_ease-out]">
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6 max-w-lg mb-8">
                  <Toggle 
                    id="notif-apps"
                    label="Application Updates"
                    description="Get notified when a tracked application status changes or needs follow-up."
                    checked={notifications.applicationUpdates}
                    onChange={(val) => setNotifications(prev => ({ ...prev, applicationUpdates: val }))}
                  />
                  <Toggle 
                    id="notif-interviews"
                    label="Interview Reminders"
                    description="Receive preparation reminders 24 hours before a scheduled interview."
                    checked={notifications.interviewReminders}
                    onChange={(val) => setNotifications(prev => ({ ...prev, interviewReminders: val }))}
                  />
                  <Toggle 
                    id="notif-matches"
                    label="Job Match Alerts"
                    description="Get weekly alerts for new job postings that strongly match your saved resumes."
                    checked={notifications.jobMatchAlerts}
                    onChange={(val) => setNotifications(prev => ({ ...prev, jobMatchAlerts: val }))}
                  />
                  <Toggle 
                    id="notif-analysis"
                    label="Resume Analysis Updates"
                    description="Get notified when AI processing completes for newly uploaded resumes."
                    checked={notifications.analysisUpdates}
                    onChange={(val) => setNotifications(prev => ({ ...prev, analysisUpdates: val }))}
                  />
                </div>
                <Button onClick={handleNotificationsSave} loading={savingNotifs}>
                  Save Preferences
                </Button>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 animate-[fadeIn_200ms_ease-out]">
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Change Password</h3>
                <form onSubmit={handleSecuritySave} className="space-y-5 max-w-md">
                  <TextField 
                    id="currentPassword" 
                    type="password" 
                    label="Current Password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    icon={Lock} 
                    required 
                  />
                  <TextField 
                    id="newPassword" 
                    type="password" 
                    label="New Password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    icon={Lock} 
                    required 
                    minLength={8}
                  />
                  <Button type="submit" loading={savingSecurity} className="mt-2">
                    Update Password
                  </Button>
                </form>
              </section>

              <hr className="border-slate-100" />

              <section>
                <h3 className="text-lg font-bold text-red-600 mb-2">Sign Out</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-md">
                  Signing out will clear your current session. You will need to sign in again to access your account.
                </p>
                <Button variant="secondary" onClick={handleLogout} className="text-slate-700 hover:bg-slate-100">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
