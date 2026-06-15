import cron from 'node-cron';
import Attempt from '../models/Attempt.js';
import Answer from '../models/Answer.js';
import Section from '../models/Section.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';

export const startCronJobs = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Find attempts that are ONGOING and their serverEndTime has passed
      // Add a 1-minute grace period
      const gracePeriod = new Date(Date.now() - 60 * 1000); 
      
      const expiredAttempts = await Attempt.find({
        status: 'ONGOING',
        serverEndTime: { $lt: gracePeriod }
      });

      if (expiredAttempts.length === 0) return;

      console.log(`[Cron] Found ${expiredAttempts.length} expired exam attempts. Auto-submitting...`);

      for (const attempt of expiredAttempts) {
        try {
          // 1. Mark as Auto-Submitted
          attempt.status = 'AUTO_SUBMITTED';
          await attempt.save();

          // 2. Fetch all required data for evaluation
          const studentAnswers = await Answer.find({ attemptId: attempt._id });
          const sections = await Section.find({ testId: attempt.testId }).lean();
          const questions = await Question.find({ sectionId: { $in: sections.map(s => s._id) } }).lean();

          // 3. Evaluation Logic
          let totalScore = 0;
          const sectionScores = sections.map((section) => ({
            sectionId: section._id,
            score: 0,
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0,
          }));

          const answerMap = new Map();
          studentAnswers.forEach(ans => answerMap.set(ans.questionId.toString(), ans));

          questions.forEach((question) => {
            const sectionScoreObj = sectionScores.find(s => s.sectionId.toString() === question.sectionId.toString());
            const sectionMaster = sections.find(s => s._id.toString() === question.sectionId.toString());
            
            const studentAns = answerMap.get(question._id.toString());

            if (!studentAns || studentAns.status === 'UNVISITED' || studentAns.status === 'VISITED_NOT_ANSWERED') {
              sectionScoreObj.unansweredCount += 1;
              return;
            }

            // Check correctness
            let isCorrect = false;
            if (question.type === 'MCQ' || question.type === 'MSQ') {
              const correctSet = new Set(question.correctAnswers);
              const studentSet = new Set(studentAns.studentAnswers);
              
              // Exact match
              if (correctSet.size === studentSet.size && [...correctSet].every(x => studentSet.has(x))) {
                isCorrect = true;
              }
            } else if (question.type === 'NUMERICAL') {
              const correctVal = parseFloat(question.correctAnswers[0]);
              const studentVal = parseFloat(studentAns.studentAnswers[0]);
              const tol = question.numericalTolerance || 0;
              
              if (Math.abs(correctVal - studentVal) <= tol) {
                isCorrect = true;
              }
            }

            if (isCorrect) {
              sectionScoreObj.correctCount += 1;
              sectionScoreObj.score += sectionMaster.marksPerQuestion;
              totalScore += sectionMaster.marksPerQuestion;
            } else {
              sectionScoreObj.incorrectCount += 1;
              sectionScoreObj.score -= sectionMaster.negativeMarks;
              totalScore -= sectionMaster.negativeMarks;
            }
          });

          // 4. Save Result
          const timeTakenSecs = Math.floor((new Date(attempt.serverEndTime).getTime() - attempt.createdAt.getTime()) / 1000);
          
          // Check if it's the first attempt
          const previousResult = await Result.findOne({ testId: attempt.testId, studentId: attempt.studentId });
          const isFirstAttempt = !previousResult;
          
          await Result.create({
            attemptId: attempt._id,
            studentId: attempt.studentId,
            testId: attempt.testId,
            totalScore,
            sectionScores,
            timeTakenSecs,
            isFirstAttempt
          });

          console.log(`[Cron] Successfully auto-submitted attempt ${attempt._id}`);
        } catch (innerError) {
          console.error(`[Cron] Failed to process attempt ${attempt._id}:`, innerError);
        }
      }
    } catch (error) {
      console.error('[Cron] Error running auto-submit job:', error);
    }
  });
};
