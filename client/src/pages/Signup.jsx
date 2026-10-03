import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { TextField } from '../components/ui/FormField';
import Button from '../components/ui/Button';
import { Alert, Card } from '../components/ui/Layout';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isLoading, error, errorCode } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await signup(name, email, password);
    if (success) {
      const from = location.state?.from;
      const target = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/dashboard';
      navigate(target, { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-[fadeIn_300ms_ease-out]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-slate-600">Join CareerPilot to supercharge your job search</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert tone={errorCode === 'duplicate' ? 'warning' : 'error'} title="Sign up failed">
                {error}
                {errorCode === 'duplicate' && (
                  <div className="mt-2 text-xs">
                    <Link to="/login" className="underline font-semibold hover:text-amber-800">
                      Sign in instead
                    </Link>{' '}
                    or try resetting your password.
                  </div>
                )}
              </Alert>
            )}

            <TextField
              id="signup-name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              icon={User}
              required
              autoComplete="name"
            />

            <TextField
              id="signup-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              required
              autoComplete="email"
            />

            <TextField
              id="signup-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              hint="Must be at least 8 characters."
              icon={Lock}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              loading={isLoading}
              iconRight={ArrowRight}
            >
              Sign up
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
