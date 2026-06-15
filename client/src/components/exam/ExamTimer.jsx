import { useEffect, useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { Clock } from 'lucide-react';

const ExamTimer = ({ onTimeUp }) => {
  const { state, dispatch } = useExam();
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    if (!state.serverEndTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = state.serverEndTime.getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeftStr('00:00:00');
        onTimeUp();
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formatted = 
          `${hours.toString().padStart(2, '0')}:` +
          `${minutes.toString().padStart(2, '0')}:` +
          `${seconds.toString().padStart(2, '0')}`;
        
        setTimeLeftStr(formatted);
        dispatch({ type: 'UPDATE_TIMER', payload: Math.floor(diff / 1000) });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.serverEndTime, onTimeUp, dispatch]);

  return (
    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
      <Clock className="w-5 h-5 text-blue-600" />
      <span className="font-mono font-bold text-lg text-blue-800 tracking-wider">
        {timeLeftStr || '--:--:--'}
      </span>
    </div>
  );
};

export default ExamTimer;
