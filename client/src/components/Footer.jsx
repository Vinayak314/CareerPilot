import { Link } from 'react-router-dom';
import Logo from './ui/Logo';
import { SECTION_LINKS } from './Navbar';

const productLinks = [
  { label: 'Resume Analysis', to: '/upload' },
  { label: 'Job Matches', to: '/jobs' },
  { label: 'Application Tracker', to: '/tracker' },
  { label: 'Interview Prep', to: '/prep' },
];

const Footer = () => (
  <footer className="bg-slate-50 border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2 max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-slate-500 leading-relaxed">
            The AI-powered resume and application copilot that helps you close skill gaps, track applications and
            prepare for interviews.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Product</h2>
          <ul className="space-y-3 text-sm">
            {productLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-slate-500 hover:text-teal-700 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Explore</h2>
          <ul className="space-y-3 text-sm">
            {SECTION_LINKS.map((link) => (
              <li key={link.hash}>
                <Link to={{ pathname: '/', hash: link.hash }} className="text-slate-500 hover:text-teal-700 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/signup" className="text-slate-500 hover:text-teal-700 transition-colors">
                Create an account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500">
        © {new Date().getFullYear()} CareerPilot. Built for modern job search.
      </p>
    </div>
  </footer>
);

export default Footer;
