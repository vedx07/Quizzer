import { useExam } from '../../context/ExamContext';

const QuestionPalette = () => {
  const { state, dispatch } = useExam();

  if (!state.test) return null;

  const currentSection = state.test[state.currentSectionIndex];

  const getStatusColor = (status, isCurrent) => {
    if (isCurrent) return 'border-2 border-blue-600 bg-blue-50 text-blue-700';
    switch (status) {
      case 'ANSWERED': return 'bg-green-500 text-white border-green-600';
      case 'MARKED': return 'bg-orange-500 text-white border-orange-600';
      case 'VISITED_NOT_ANSWERED': return 'bg-red-500 text-white border-red-600';
      case 'UNVISITED': 
      default: return 'bg-gray-200 text-gray-700 border-gray-300';
    }
  };

  const handleQuestionClick = (index) => {
    dispatch({ 
      type: 'SET_QUESTION', 
      payload: { sectionIndex: state.currentSectionIndex, questionIndex: index } 
    });
  };

  // Stats calculation
  let answered = 0;
  let marked = 0;
  let notAnswered = 0;
  let unvisited = 0;

  currentSection.questions.forEach(q => {
    const status = state.answers[q._id]?.status || 'UNVISITED';
    if (status === 'ANSWERED') answered++;
    else if (status === 'MARKED') marked++;
    else if (status === 'VISITED_NOT_ANSWERED') notAnswered++;
    else unvisited++;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Question Palette</h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 border-b border-gray-100">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Answered: {answered}</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Not Answered: {notAnswered}</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded-sm border border-gray-300"></div> Unvisited: {unvisited}</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded-sm"></div> Marked: {marked}</div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="grid grid-cols-5 gap-2">
          {currentSection.questions.map((q, idx) => {
            const isCurrent = state.currentQuestionIndex === idx;
            const status = state.answers[q._id]?.status || 'UNVISITED';
            const colorClass = getStatusColor(status, isCurrent);

            return (
              <button
                key={q._id}
                onClick={() => handleQuestionClick(idx)}
                className={`w-10 h-10 flex items-center justify-center rounded-md font-medium text-sm transition-all shadow-sm ${colorClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
