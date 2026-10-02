import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Briefcase, FileText, Settings, Target } from 'lucide-react';
import { Navigation } from 'lucide-react';
import useAuthStore from '../store/authStore';

const navItems = [
  { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
  { name: 'Resume Upload', icon: <UploadCloud className="w-5 h-5" />, path: '/upload' },
  { name: 'Job Matches', icon: <Briefcase className="w-5 h-5" />, path: '/jobs' },
  { name: 'Application Tracker', icon: <FileText className="w-5 h-5" />, path: '/tracker' },
  { name: 'Interview Prep', icon: <Target className="w-5 h-5" />, path: '/prep' },
  { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 min-h-screen bg-slate-50 border-r border-slate-200 flex flex-col fixed left-0 top-0">
      
      <div className="h-20 flex items-center px-6 mb-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <div className="bg-teal-700 p-1.5 rounded-lg flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white fill-white transform rotate-45" />
          </div>
          <span>CareerPilot</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className={isActive ? 'text-teal-700' : 'text-slate-400'}>
                {item.icon}
              </div>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`} alt="User" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default Sidebar;
