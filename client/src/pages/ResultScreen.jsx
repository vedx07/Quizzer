import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Trophy, CheckCircle, XCircle, MinusCircle, Clock, ArrowLeft } from 'lucide-react';

const ResultScreen = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/exams/results/${resultId}`);
        setResult(data);
      } catch (error) {
        console.error(error);
        alert('Failed to load results');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId, navigate]);

  if (loading || !result) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          
          <button 
            onClick={() => navigate(`/results/${resultId}/review`)}
            className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-bold transition-colors shadow-sm"
          >
            View Detailed Analysis
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-blue-600 p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h1 className="text-3xl font-bold mb-2">Exam Completed!</h1>
            <p className="text-blue-100">{result.testId?.title}</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Score</p>
                <p className="text-5xl font-bold text-gray-900">{result.totalScore}</p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Time Taken</p>
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
                  <Clock className="w-8 h-8 text-blue-600" />
                  {formatTime(result.timeTakenSecs)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Sectional Analysis</h2>
        <div className="grid grid-cols-1 gap-6">
          {result.sectionScores.map(section => (
            <div key={section._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800">{section.sectionId?.name || 'Unknown Section'}</h3>
                <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full font-bold">
                  Score: {section.score}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">Correct</p>
                    <p className="text-xl font-bold text-green-700">{section.correctCount}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-xs text-red-600 uppercase font-bold">Incorrect</p>
                    <p className="text-xl font-bold text-red-700">{section.incorrectCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <MinusCircle className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Unanswered</p>
                    <p className="text-xl font-bold text-gray-600">{section.unansweredCount}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ResultScreen;
