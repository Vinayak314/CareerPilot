import { Link } from 'react-router-dom';
import { Navigation } from 'lucide-react';

const Logo = ({ to = '/', className = '', onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 ${className}`}
    aria-label="CareerPilot home"
  >
    <span className="bg-teal-700 p-1.5 rounded-lg flex items-center justify-center shadow-sm shadow-teal-900/20">
      <Navigation className="w-5 h-5 text-white fill-white rotate-45" aria-hidden="true" />
    </span>
    <span>CareerPilot</span>
  </Link>
);

export default Logo;
