import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Copy, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await login(email, password);
      toast.success('Welcome back, ' + (res?.name?.split(' ')[0] || 'User') + '!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const autofillAdmin = () => {
    setEmail('admin@quizzer.com');
    setPassword('Admin@123');
    toast.success('Credentials autofilled successfully');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <BookOpen className="text-white h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back to Quizzer</h2>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account to continue</p>
        </div>

        {/* SaaS-Style Demo Credentials Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="p-4 pl-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm uppercase">Demo Account</span>
              <span className="text-xs font-semibold text-gray-500">Admin Access</span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-100 group">
                <a href="mailto:admin@quizzer.com" className="text-sm font-mono text-gray-700 hover:text-blue-600 transition-colors">admin@quizzer.com</a>
                <button 
                  type="button" 
                  onClick={() => { navigator.clipboard.writeText('admin@quizzer.com'); toast.success('Email copied!'); }}
                  className="text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Copy Email"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-100 group">
                <span className="text-sm font-mono text-gray-500 tracking-widest mt-1">••••••••</span>
                <button 
                  type="button" 
                  onClick={() => { navigator.clipboard.writeText('Admin@123'); toast.success('Password copied!'); }}
                  className="text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Copy Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button 
              type="button" 
              onClick={autofillAdmin}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-md transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Autofill Credentials
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
