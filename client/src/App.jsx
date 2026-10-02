import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import JobMatches from './pages/JobMatches';
import Tracker from './pages/Tracker';
import InterviewPrep from './pages/InterviewPrep';
import Settings from './pages/Settings';
import Rewrite from './pages/Rewrite';

import ProtectedRoute from './components/ProtectedRoute';

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/jobs" element={<JobMatches />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/prep" element={<InterviewPrep />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rewrite" element={<Rewrite />} />
          </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
