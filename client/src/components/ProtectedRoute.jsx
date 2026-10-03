import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/** Requires a session; remembers where the user was going so login can return them there. */
const ProtectedRoute = () => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

/** Keeps signed-in users away from /login and /signup. */
export const GuestRoute = () => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (user && token) {
    const from = location.state?.from;
    const target = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
