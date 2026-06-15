import express from 'express';
import {
  getAvailableTests,
  startAttempt,
  syncAnswers,
  submitAttempt,
  getResult,
  getLeaderboard,
  getStudentStats,
  getResultReview,
  recordWarning,
} from '../controllers/examController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // All exam routes require authentication

router.get('/available', getAvailableTests);
router.get('/stats', getStudentStats);
router.post('/attempts/start', startAttempt);
router.post('/attempts/:attemptId/sync', syncAnswers);
router.post('/attempts/:attemptId/warning', recordWarning);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.get('/results/:resultId', getResult);
router.get('/results/:resultId/review', getResultReview);
router.get('/:testId/leaderboard', getLeaderboard);

export default router;
