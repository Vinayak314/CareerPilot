import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Briefcase, KanbanSquare, Sparkles, Settings, LogOut, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Logo from './ui/Logo';
import { initials } from '../lib/format';

/** `match` lists every route pattern that should highlight the item (including nested routes). */
const navItems = [
  { name: 'Dashboard', Icon: LayoutDashboard, path: '/dashboard', match: ['/dashboard/*', '/rewrite/*'] },
  { name: 'Resume Upload', Icon: UploadCloud, path: '/upload', match: ['/upload/*'] },
  { name: 'Job Matches', Icon: Briefcase, path: '/jobs', match: ['/jobs/*'] },
  { name: 'Application Tracker', Icon: KanbanSquare, path: '/tracker', match: ['/tracker/*'] },
  { name: 'Interview Prep', Icon: Sparkles, path: '/prep', match: ['/prep/*'] },
  { name: 'Settings', Icon: Settings, path: '/settings', match: ['/settings/*'] },
];

const isItemActive = (item, pathname) => item.match.some((pattern) => matchPath({ path: pattern }, pathname));

const SidebarContent = ({ onNavigate, showClose }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 border-r border-slate-200">
      <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
        <Logo to="/dashboard" onClick={onNavigate} />
        {showClose && (
          <button
            type="button"
            onClick={onNavigate}
            className="p-2 -mr-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isItemActive(item, pathname);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Signed in'}</div>
              {user?.email && <div className="text-xs text-slate-500 truncate">{user.email}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Fixed sidebar on large screens; slide-in drawer on smaller screens
 * (opened from the AppLayout top bar).
 */
const Sidebar = ({ mobileOpen, onClose }) => {
  const { pathname } = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          id="mobile-navigation"
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          inert={!mobileOpen ? true : undefined}
        >
          <SidebarContent onNavigate={onClose} showClose />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
