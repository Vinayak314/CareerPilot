import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from './ui/Logo';
import Button from './ui/Button';
import useAuthStore from '../store/authStore';

export const SECTION_LINKS = [
  { label: 'Features', hash: '#features' },
  { label: 'How It Works', hash: '#how-it-works' },
  { label: 'FAQ', hash: '#faq' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, token } = useAuthStore();
  const signedIn = Boolean(user && token);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-teal-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <nav aria-label="Primary" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {SECTION_LINKS.map((link) => (
              <a 
                key={link.hash} 
                href={pathname === '/' ? link.hash : `/${link.hash}`}
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    const el = document.querySelector(link.hash);
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 80; // 80px for header
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }
                }}
                className="hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {signedIn ? (
              <Button as={Link} to="/dashboard" iconRight={ArrowRight}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 py-2">
                  Sign In
                </Link>
                <Button as={Link} to="/signup">
                  Get Started Free
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 -mr-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="public-mobile-menu" className="md:hidden border-t border-slate-100 bg-white px-4 pb-6 pt-2 shadow-lg">
          <div className="flex flex-col">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.hash}
                href={pathname === '/' ? link.hash : `/${link.hash}`}
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    setOpen(false);
                    const el = document.querySelector(link.hash);
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  } else {
                    setOpen(false);
                  }
                }}
                className="py-3 text-base font-medium text-slate-700 border-b border-slate-100 block"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {signedIn ? (
              <Button as={Link} to="/dashboard" size="lg" iconRight={ArrowRight}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/signup" size="lg">
                  Get Started Free
                </Button>
                <Button as={Link} to="/login" size="lg" variant="secondary">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
