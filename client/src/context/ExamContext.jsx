import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';

const ExamContext = createContext();

const initialState = {
  attemptId: null,
  test: null, // Array of sections with questions
  answers: {}, // Key: questionId, Value: { studentAnswers: [], status: 'UNVISITED', timeSpentSecs: 0 }
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  serverEndTime: null,
  timeRemaining: 0,
  isSubmitting: false,
  lastSavedAt: null,
};

function examReducer(state, action) {
  switch (action.type) {
    case 'START_EXAM': {
      const { attemptId, test, serverEndTime, savedAnswers } = action.payload;
      
      // Initialize answer map
      const initialAnswers = {};
      test.forEach(section => {
        section.questions.forEach(q => {
          initialAnswers[q._id] = {
            studentAnswers: [],
            status: 'UNVISITED',
            timeSpentSecs: 0,
          };
        });
      });

      // Override with saved answers if resuming
      if (savedAnswers) {
        savedAnswers.forEach(ans => {
          initialAnswers[ans.questionId] = {
            studentAnswers: ans.studentAnswers,
            status: ans.status,
            timeSpentSecs: ans.timeSpentSecs || 0,
          };
        });
      }

      // Mark first question as visited if unvisited
      const firstSection = test[0];
      if (firstSection && firstSection.questions.length > 0) {
        const firstQId = firstSection.questions[0]._id;
        if (initialAnswers[firstQId].status === 'UNVISITED') {
          initialAnswers[firstQId].status = 'VISITED_NOT_ANSWERED';
        }
      }

      return {
        ...state,
        attemptId,
        test,
        serverEndTime: new Date(serverEndTime),
        answers: initialAnswers,
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
      };
    }

    case 'SET_QUESTION': {
      const { sectionIndex, questionIndex } = action.payload;
      
      const newAnswers = { ...state.answers };
      
      // Mark new question as visited if it was unvisited
      const newQuestionId = state.test[sectionIndex].questions[questionIndex]._id;
      if (newAnswers[newQuestionId].status === 'UNVISITED') {
        newAnswers[newQuestionId].status = 'VISITED_NOT_ANSWERED';
      }

      return {
        ...state,
        currentSectionIndex: sectionIndex,
        currentQuestionIndex: questionIndex,
        answers: newAnswers,
      };
    }

    case 'UPDATE_ANSWER': {
      const { questionId, studentAnswers } = action.payload;
      const isAnswered = studentAnswers.length > 0 || (studentAnswers[0] && studentAnswers[0].trim() !== '');
      
      return {
        ...state,
        answers: {
          ...state.answers,
          [questionId]: {
            ...state.answers[questionId],
            studentAnswers,
            status: isAnswered ? 'ANSWERED' : 'VISITED_NOT_ANSWERED',
          },
        },
      };
    }

    case 'TOGGLE_REVIEW': {
      const { questionId } = action.payload;
      const currentStatus = state.answers[questionId].status;
      let newStatus = currentStatus === 'MARKED' ? 'VISITED_NOT_ANSWERED' : 'MARKED';
      
      // If it has answers and is marked, it should still be submitted
      if (state.answers[questionId].studentAnswers.length > 0 && currentStatus !== 'MARKED') {
        newStatus = 'MARKED'; // Often exams differentiate "Answered & Marked for Review", but we'll stick to simple MARKED overriding visual for now
      }

      return {
        ...state,
        answers: {
          ...state.answers,
          [questionId]: {
            ...state.answers[questionId],
            status: newStatus,
          },
        },
      };
    }

    case 'CLEAR_RESPONSE': {
      const { questionId } = action.payload;
      return {
        ...state,
        answers: {
          ...state.answers,
          [questionId]: {
            ...state.answers[questionId],
            studentAnswers: [],
            status: 'VISITED_NOT_ANSWERED',
          },
        },
      };
    }

    case 'UPDATE_TIMER': {
      return { ...state, timeRemaining: action.payload };
    }

    case 'SYNC_SUCCESS': {
      return { ...state, lastSavedAt: new Date() };
    }

    case 'SUBMIT_EXAM_START': {
      return { ...state, isSubmitting: true };
    }

    default:
      return state;
  }
}

export const ExamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(examReducer, initialState);

  // Background Auto-Sync every 15 seconds
  useEffect(() => {
    if (!state.attemptId) return;

    const syncInterval = setInterval(async () => {
      try {
        const answersPayload = Object.entries(state.answers).map(([questionId, data]) => ({
          questionId,
          ...data,
        }));
        await api.post(`/exams/attempts/${state.attemptId}/sync`, { answers: answersPayload });
        dispatch({ type: 'SYNC_SUCCESS' });
      } catch (error) {
        console.error('Auto-sync failed', error);
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [state.attemptId, state.answers]);

  return (
    <ExamContext.Provider value={{ state, dispatch }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
