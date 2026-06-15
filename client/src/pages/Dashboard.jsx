import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, BookOpen, Clock, Trophy, PlayCircle, Calendar, CheckCircle2, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [availableTests, setAvailableTests] = useState([]);
  const [stats, setStats] = useState({ completedExams: 0, avgScore: 0, completedTests: [] });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, statsRes] = await Promise.all([
          api.get('/exams/available'),
          api.get('/exams/stats')
        ]);
        setAvailableTests(testsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <BookOpen className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-gray-900">Quizzer</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="text-sm px-4 py-1.5 font-bold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-gray-500 mt-1">Here is an overview of your examination portal.</p>
          </div>
          
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              Admin Panel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Available Tests</h3>
                <p className="text-2xl font-bold text-blue-600">{availableTests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pending Tests</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.max(0, availableTests.length - (stats.completedTests?.length || 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Completed Tests</h3>
                <p className="text-2xl font-bold text-green-600">{stats.completedTests?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live & Upcoming Exams</h2>
          
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>
          ) : availableTests.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              No exams are currently available. Check back later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTests.map(test => {
                const now = new Date();
                const isScheduled = !!test.scheduledStartTime;
                const startTime = isScheduled ? new Date(test.scheduledStartTime) : null;
                
                const isUpcoming = isScheduled && now < startTime;
                const isLive = !isUpcoming;
                const completedTestRecord = stats.completedTests?.find(ct => ct.testId === test._id);
                const isCompleted = !!completedTestRecord;

                return (
                  <div key={test._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">{test.title}</h3>
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" fill="currentColor" stroke="white" title="Completed" />
                          )}
                        </div>
                        {isLive && <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">LIVE</span>}
                        {isUpcoming && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">UPCOMING</span>}
                      </div>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{test.description}</p>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{test.durationMinutes} mins</span>
                          </div>
                        </div>
                        {isUpcoming && (
                          <div className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold bg-blue-50 w-fit px-2.5 py-1 rounded-md">
                            <Calendar className="w-4 h-4" />
                            <span>Goes live: {startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                      {isCompleted ? (
                        <button 
                          onClick={() => navigate(`/results/${completedTestRecord.resultId}`)}
                          className="flex-1 text-blue-700 bg-blue-100 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 hover:bg-blue-200"
                        >
                          <FileText className="w-5 h-5" /> View Result
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/exam/${test._id}`)}
                          disabled={isUpcoming}
                          className={`flex-1 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isUpcoming ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <PlayCircle className="w-5 h-5" /> Start Exam
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/leaderboard/${test._id}`)}
                        className="px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
                        title="View Leaderboard"
                      >
                        <Trophy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-5 text-white flex items-center gap-3">
              <LogOut className="w-6 h-6" />
              <h2 className="text-xl font-bold">Logout?</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6 font-medium">Are you sure you want to sign out of your account?</p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition-colors"
                >
                  Stay Logged In
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
