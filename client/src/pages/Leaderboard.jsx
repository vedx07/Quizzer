import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Trophy, Clock, Medal, ArrowLeft } from 'lucide-react';

const Leaderboard = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get(`/exams/${testId}/leaderboard`);
        setLeaderboard(data);
      } catch (error) {
        console.error(error);
        alert('Failed to load leaderboard');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [testId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRowStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-50 border border-yellow-200';
    if (rank === 2) return 'bg-gray-100 border border-gray-300';
    if (rank === 3) return 'bg-orange-50 border border-orange-200';
    return 'bg-white border border-gray-100';
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-transparent';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Go Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h1 className="text-3xl font-bold mb-2">Test Leaderboard</h1>
            <p className="text-blue-100">See how you rank among other students!</p>
          </div>

          <div className="p-6">
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No results published yet for this test.
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="space-y-3 min-w-[500px]">
                  <div className="flex items-center px-4 sm:px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-lg">
                    <div className="w-12 sm:w-16">Rank</div>
                    <div className="flex-1">Student</div>
                    <div className="w-20 sm:w-24 text-right">Score</div>
                    <div className="w-24 sm:w-32 text-right flex items-center justify-end gap-1"><Clock className="w-4 h-4"/> Time</div>
                  </div>

                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.rank} 
                      className={`flex items-center px-4 sm:px-6 py-4 rounded-xl shadow-sm ${getRowStyle(entry.rank)}`}
                    >
                      <div className="w-12 sm:w-16 font-bold text-gray-900 flex items-center gap-1 sm:gap-2">
                        {entry.rank <= 3 && <Medal className={`w-4 h-4 sm:w-5 sm:h-5 ${getMedalColor(entry.rank)}`} />}
                        {entry.rank > 3 && <span className="ml-5 sm:ml-7">{entry.rank}</span>}
                      </div>
                      <div className="flex-1 font-semibold text-gray-800 truncate pr-2">
                        {entry.studentName}
                      </div>
                      <div className="w-20 sm:w-24 text-right font-bold text-blue-600">
                        {entry.score}
                      </div>
                      <div className="w-24 sm:w-32 text-right text-sm text-gray-600 font-medium">
                        {formatTime(entry.timeTakenSecs)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
