import { useExam } from '../../context/ExamContext';

const QuestionContent = () => {
  const { state, dispatch } = useExam();

  if (!state.test) return null;

  const currentSection = state.test[state.currentSectionIndex];
  const question = currentSection.questions[state.currentQuestionIndex];
  const currentAnswer = state.answers[question._id]?.studentAnswers || [];

  const handleOptionChange = (optionId) => {
    let newAnswers = [...currentAnswer];

    if (question.type === 'MCQ') {
      newAnswers = [optionId];
    } else if (question.type === 'MSQ') {
      if (newAnswers.includes(optionId)) {
        newAnswers = newAnswers.filter(id => id !== optionId);
      } else {
        newAnswers.push(optionId);
      }
    }

    dispatch({
      type: 'UPDATE_ANSWER',
      payload: { questionId: question._id, studentAnswers: newAnswers }
    });
  };

  const handleNumericalChange = (e) => {
    dispatch({
      type: 'UPDATE_ANSWER',
      payload: { questionId: question._id, studentAnswers: [e.target.value] }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          Question {state.currentQuestionIndex + 1}
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
          {question.type}
        </span>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="text-lg text-gray-800 mb-8 leading-relaxed">
          {question.content}
        </div>

        <div className="space-y-4">
          {(question.type === 'MCQ' || question.type === 'MSQ') && question.options.map(opt => {
            const isSelected = currentAnswer.includes(opt.id);
            return (
              <label 
                key={opt.id} 
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type={question.type === 'MCQ' ? 'radio' : 'checkbox'}
                  className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={isSelected}
                  onChange={() => handleOptionChange(opt.id)}
                />
                <span className="ml-4 text-gray-700">{opt.text}</span>
              </label>
            );
          })}

          {question.type === 'NUMERICAL' && (
            <div>
              <input
                type="number"
                step="any"
                value={currentAnswer[0] || ''}
                onChange={handleNumericalChange}
                placeholder="Enter your answer"
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionContent;
