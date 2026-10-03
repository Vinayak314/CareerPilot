import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Logo from './ui/Logo';

/** Authenticated app shell: sidebar + main content, with a mobile top bar. */
const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-teal-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <Sidebar mobileOpen={mobileOpen} onClose={close} />

      <header className="lg:hidden sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4">
        <Logo to="/dashboard" />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </header>

      <main id="main-content" tabIndex={-1} className="lg:ml-64 px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12 focus:outline-none">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
