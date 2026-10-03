import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { TextField } from '../components/ui/FormField';
import Button from '../components/ui/Button';
import { Alert, Card } from '../components/ui/Layout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, errorCode } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
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
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue to CareerPilot</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert tone={errorCode === 'invalid' ? 'warning' : 'error'} title="Sign in failed">
                {error}
                {errorCode === 'invalid' && (
                  <div className="mt-2 text-xs">
                    Please check your email and password, or{' '}
                    <Link to="/signup" className="underline font-semibold hover:text-amber-800">
                      create an account
                    </Link>{' '}
                    if you don't have one.
                  </div>
                )}
              </Alert>
            )}

            <TextField
              id="login-email"
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
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-700 focus:ring-teal-700 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-teal-700 hover:text-teal-800">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              iconRight={ArrowRight}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
