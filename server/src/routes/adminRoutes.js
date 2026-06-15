import express from 'express';
import {
  createTest,
  createSection,
  createQuestion,
  publishTest,
  getAllTests,
  deleteTest,
  getFullTest,
  updateTest,
  updateSection,
  deleteSection,
  updateQuestion,
  deleteQuestion,
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes here are protected and require admin role
router.use(protect, admin);

router.route('/tests').post(createTest).get(getAllTests);
router.route('/tests/:testId')
  .delete(deleteTest)
  .put(updateTest);
router.get('/tests/:testId/full', getFullTest);

router.post('/tests/:testId/sections', createSection);
router.route('/sections/:sectionId')
  .put(updateSection)
  .delete(deleteSection);

router.post('/sections/:sectionId/questions', createQuestion);
router.route('/questions/:questionId')
  .put(updateQuestion)
  .delete(deleteQuestion);

router.patch('/tests/:testId/publish', publishTest);

export default router;
