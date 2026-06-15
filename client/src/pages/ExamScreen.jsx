import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ExamProvider, useExam } from '../context/ExamContext';
import ExamTimer from '../components/exam/ExamTimer';
import QuestionPalette from '../components/exam/QuestionPalette';
import QuestionContent from '../components/exam/QuestionContent';
import { BookOpen, ChevronLeft, ChevronRight, Flag, XCircle, Menu, X } from 'lucide-react';

const ExamLayout = () => {
  const { state, dispatch } = useExam();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const startTest = async () => {
      try {
        if (!testId) {
          toast.error('No test selected');
          navigate('/dashboard');
          return;
        }

        const { data } = await api.post('/exams/attempts/start', { testId });
        dispatch({ type: 'START_EXAM', payload: data });
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to start test');
        navigate('/dashboard');
      }
    };
    startTest();
  }, [dispatch, navigate, testId]);

  // Anti-Cheat / Proctoring
  const [warningCount, setWarningCount] = useState(state.warningCount || 0);

  useEffect(() => {
    // If state loads late, initialize it
    if (state.warningCount !== undefined && warningCount === 0) {
      setWarningCount(state.warningCount);
    }
  }, [state.warningCount]);

  useEffect(() => {
    // Prevent right-click
    const handleContextMenu = (e) => e.preventDefault();
    
    // Prevent copy/paste
    const handleCopyPaste = (e) => e.preventDefault();

    // Tab visibility change
    const handleVisibilityChange = async () => {
      if (document.hidden && state.attemptId) {
        try {
          const { data } = await api.post(`/exams/attempts/${state.attemptId}/warning`);
          const newCount = data.warningCount;
          setWarningCount(newCount);
          
          toast.error(`WARNING: Tab switching is strictly prohibited! (Warning ${newCount}/3)`, { duration: 5000 });
          if (newCount >= 3) {
            toast.error('Maximum warnings reached. Your exam is being auto-submitted.', { duration: 5000 });
            handleFinalSubmit();
          }
        } catch (error) {
          console.error('Failed to record warning', error);
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.attemptId]);

  const requestSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowSubmitModal(false);
    dispatch({ type: 'SUBMIT_EXAM_START' });
    try {
      const answersPayload = Object.entries(state.answers).map(([questionId, data]) => ({
        questionId,
        ...data,
      }));
      await api.post(`/exams/attempts/${state.attemptId}/sync`, { answers: answersPayload });
      
      const { data } = await api.post(`/exams/attempts/${state.attemptId}/submit`);
      toast.success('Test submitted successfully!');
      navigate(`/results/${data.resultId}`);
    } catch (error) {
      toast.error('Failed to submit exam');
    }
  };

  const getStats = () => {
    let attempted = 0;
    let marked = 0;
    let notAttempted = 0;

    state.test.forEach(sec => {
      sec.questions.forEach(q => {
        const status = state.answers[q._id]?.status || 'UNVISITED';
        if (status === 'ANSWERED') attempted++;
        else if (status === 'ANSWERED_MARKED_FOR_REVIEW' || status === 'VISITED_MARKED_FOR_REVIEW') marked++;
        else notAttempted++;
      });
    });

    return { attempted, marked, notAttempted };
  };

  if (loading || !state.test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentSection = state.test[state.currentSectionIndex];
  const question = currentSection.questions[state.currentQuestionIndex];
  
  const handleSaveAndNext = () => {
    // If not last question in section, go to next
    if (state.currentQuestionIndex < currentSection.questions.length - 1) {
      dispatch({ type: 'SET_QUESTION', payload: { sectionIndex: state.currentSectionIndex, questionIndex: state.currentQuestionIndex + 1 }});
    } else if (state.currentSectionIndex < state.test.length - 1) {
      // Go to next section
      dispatch({ type: 'SET_QUESTION', payload: { sectionIndex: state.currentSectionIndex + 1, questionIndex: 0 }});
    } else {
      // Last question of the last section -> Request Submit
      requestSubmit();
    }
  };

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: 'SET_QUESTION', payload: { sectionIndex: state.currentSectionIndex, questionIndex: state.currentQuestionIndex - 1 }});
    } else if (state.currentSectionIndex > 0) {
      const prevSection = state.test[state.currentSectionIndex - 1];
      dispatch({ type: 'SET_QUESTION', payload: { sectionIndex: state.currentSectionIndex - 1, questionIndex: prevSection.questions.length - 1 }});
    }
  };

  const toggleReview = () => dispatch({ type: 'TOGGLE_REVIEW', payload: { questionId: question._id } });
  const clearResponse = () => dispatch({ type: 'CLEAR_RESPONSE', payload: { questionId: question._id } });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header - Sticky */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row justify-between items-center shrink-0 sticky top-0 z-30 gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg shadow-sm">
              <BookOpen className="text-white h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h1 className="font-bold text-lg sm:text-xl text-gray-900 tracking-tight">Quizzer</h1>
          </div>
          <button 
            className="sm:hidden p-2 text-gray-600 bg-gray-100 rounded-lg"
            onClick={() => setIsPaletteOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {state.test.map((sec, idx) => (
            <button
              key={sec._id}
              onClick={() => dispatch({ type: 'SET_QUESTION', payload: { sectionIndex: idx, questionIndex: 0 }})}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                state.currentSectionIndex === idx 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <ExamTimer onTimeUp={handleFinalSubmit} />
          <button 
            onClick={requestSubmit}
            disabled={state.isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {state.isSubmitting ? 'Submitting...' : 'SUBMIT'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 sm:p-4 md:p-6 gap-6 max-w-[1600px] mx-auto w-full relative">
        {/* Left Column - Question */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0 pb-20 md:pb-0">
          <QuestionContent />
          
          {/* Action Bar - Sticky Bottom on Mobile */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-md md:shadow-sm border border-gray-200 flex flex-wrap md:flex-nowrap justify-between items-center shrink-0 fixed md:static bottom-0 left-0 right-0 z-20 m-2 md:m-0 gap-2">
            <div className="flex gap-2 order-2 md:order-1 flex-1 md:flex-none">
              <button 
                onClick={handlePrevious}
                className="flex flex-1 md:flex-none justify-center items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm md:text-base font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Previous</span>
              </button>
              <button 
                onClick={clearResponse}
                className="flex flex-1 md:flex-none justify-center items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm md:text-base font-medium transition-colors"
              >
                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
            <div className="flex gap-2 order-1 md:order-2 w-full md:w-auto">
              <button 
                onClick={toggleReview}
                className="flex-1 md:flex-none flex justify-center items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm md:text-base font-medium transition-colors"
              >
                <Flag className="w-4 h-4 md:w-5 md:h-5" /> <span className="sm:hidden">Review</span><span className="hidden sm:inline">Mark for Review</span>
              </button>
              <button 
                onClick={handleSaveAndNext}
                className={`flex-1 md:flex-none flex justify-center items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 text-white rounded-lg text-sm md:text-base font-semibold shadow-sm transition-colors ${
                  state.currentSectionIndex === state.test.length - 1 && state.currentQuestionIndex === currentSection.questions.length - 1
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {state.currentSectionIndex === state.test.length - 1 && state.currentQuestionIndex === currentSection.questions.length - 1 ? 'Submit' : 'Save & Next'} <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Palette (Drawer on Mobile, Sidebar on Desktop) */}
        {isPaletteOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsPaletteOpen(false)}></div>
        )}
        <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:static md:w-80 md:shadow-none md:bg-transparent md:transform-none flex flex-col gap-6 shrink-0 ${
          isPaletteOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
            <h3 className="font-bold text-lg">Question Palette</h3>
            <button onClick={() => setIsPaletteOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4 md:p-0">
            <QuestionPalette />
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-6 text-white text-center">
              <h2 className="text-2xl font-bold mb-1">Submit Test?</h2>
              <p className="text-red-100 text-sm">Are you sure you want to finish your exam?</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Attempted</p>
                  <p className="text-xl font-bold text-green-600">{getStats().attempted}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Review</p>
                  <p className="text-xl font-bold text-orange-500">{getStats().marked}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Unanswered</p>
                  <p className="text-xl font-bold text-gray-400">{getStats().notAttempted}</p>
                </div>
              </div>
              
              {getStats().notAttempted > 0 && (
                <p className="text-center text-red-600 font-medium mb-6 text-sm">
                  You still have {getStats().notAttempted} unanswered questions!
                </p>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamScreen = () => {
  return (
    <ExamProvider>
      <ExamLayout />
    </ExamProvider>
  );
};

export default ExamScreen;
