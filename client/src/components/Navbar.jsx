import { Link, useLocation } from 'react-router-dom';
import { Navigation } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  if (isDashboard) return null; // Don't show top navbar on dashboard (it uses sidebar)

  return (
    <nav className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <div className="bg-teal-700 p-1.5 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white fill-white transform rotate-45" />
            </div>
            <span>CareerPilot</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Testimonials</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded text-center transition-colors">
              Get Started Free
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
