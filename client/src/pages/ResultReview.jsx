import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

const ResultReview = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await api.get(`/exams/results/${resultId}/review`);
        setReviewData(data);
      } catch (error) {
        console.error(error);
        alert('Failed to load detailed review');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [resultId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status, isCorrect) => {
    if (status === 'UNVISITED' || status === 'VISITED_NOT_ANSWERED') {
      return <HelpCircle className="w-6 h-6 text-gray-400" />;
    }
    if (isCorrect) {
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    }
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  const getStatusBadge = (status, isCorrect) => {
    if (status === 'UNVISITED' || status === 'VISITED_NOT_ANSWERED') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">UNANSWERED</span>;
    }
    if (isCorrect) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">CORRECT</span>;
    }
    return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">INCORRECT</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Results
          </button>
        </div>
        <h1 className="font-bold text-xl text-gray-900">Detailed Question Review</h1>
        <div className="w-24"></div> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        {reviewData.map((q, idx) => (
          <div key={q.questionId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-gray-900">Q{idx + 1}</span>
                <span className="text-sm font-semibold text-gray-500 uppercase px-2 py-1 bg-gray-100 rounded">{q.sectionName}</span>
                {getStatusBadge(q.status, q.isCorrect)}
              </div>
              <div className="text-right flex items-center gap-2">
                {getStatusIcon(q.status, q.isCorrect)}
                <span className={`font-bold ${q.marksAwarded > 0 ? 'text-green-600' : q.marksAwarded < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {q.marksAwarded > 0 ? '+' : ''}{q.marksAwarded} Marks
                </span>
              </div>
            </div>

            <p className="text-gray-800 font-medium mb-6 whitespace-pre-wrap">{q.content}</p>

            {q.type === 'MCQ' || q.type === 'MSQ' ? (
              <div className="space-y-3">
                {q.options.map(opt => {
                  const isStudentChoice = q.studentAnswers.includes(opt.id);
                  const isActuallyCorrect = q.correctAnswers.includes(opt.id);

                  let borderClass = "border-gray-200";
                  let bgClass = "bg-white";
                  let textClass = "text-gray-700";
                  let icon = null;

                  if (isActuallyCorrect) {
                    borderClass = "border-green-500";
                    bgClass = isStudentChoice ? "bg-green-50" : "bg-green-50";
                    textClass = "text-green-800 font-medium";
                    icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                  } else if (isStudentChoice && !isActuallyCorrect) {
                    borderClass = "border-red-500";
                    bgClass = "bg-red-50";
                    textClass = "text-red-800 font-medium";
                    icon = <XCircle className="w-5 h-5 text-red-500" />;
                  }

                  return (
                    <div key={opt.id} className={`p-4 rounded-lg border-2 flex gap-4 items-center ${borderClass} ${bgClass}`}>
                      <span className={`font-bold ${textClass}`}>{opt.id}.</span>
                      <span className={`flex-1 ${textClass}`}>{opt.text}</span>
                      {icon}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <span className="block text-sm font-semibold text-blue-800 mb-1">Your Answer:</span>
                  <span className="font-bold text-gray-900">{q.studentAnswers[0] || '—'}</span>
                </div>
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <span className="block text-sm font-semibold text-green-800 mb-1">Correct Answer:</span>
                  <span className="font-bold text-gray-900">{q.correctAnswers[0]} (± {q.numericalTolerance})</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default ResultReview;
