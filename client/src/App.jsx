import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamScreen from './pages/ExamScreen';
import ResultScreen from './pages/ResultScreen';
import ResultReview from './pages/ResultReview';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import TestBuilder from './pages/TestBuilder';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exam/:testId" element={<ExamScreen />} />
            <Route path="/results/:resultId" element={<ResultScreen />} />
            <Route path="/results/:resultId/review" element={<ResultReview />} />
            <Route path="/leaderboard/:testId" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/test-builder" element={<TestBuilder />} />
            <Route path="/admin/test-builder/:editTestId" element={<TestBuilder />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
