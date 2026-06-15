import Test from '../models/Test.js';
import Section from '../models/Section.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Answer from '../models/Answer.js';
import Result from '../models/Result.js';

// @desc    Get all published tests
// @route   GET /api/v1/exams/available
// @access  Private (Student)
export const getAvailableTests = async (req, res) => {
  try {
    const tests = await Test.find({ isPublished: true }).select('-createdBy -createdAt -updatedAt');
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start a test attempt
// @route   POST /api/v1/exams/attempts/start
// @access  Private (Student)
export const startAttempt = async (req, res) => {
  try {
    const { testId } = req.body;
    const studentId = req.user._id;

    // Verify test exists and is published
    const test = await Test.findOne({ _id: testId, isPublished: true });
    if (!test) {
      return res.status(404).json({ message: 'Test not found or not published' });
    }

    // Check if there is an ONGOING attempt
    let attempt = await Attempt.findOne({ testId, studentId }).sort({ createdAt: -1 });

    if (attempt && (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED')) {
      return res.status(403).json({ message: 'You have already completed this exam.' });
    }

    if (!attempt || attempt.status !== 'ONGOING') {
      // Calculate server end time
      const serverEndTime = new Date(Date.now() + test.durationMinutes * 60000);
      attempt = await Attempt.create({
        testId,
        studentId,
        serverEndTime,
        status: 'ONGOING',
      });
    }

    // Fetch Sections and Questions (without correctAnswers)
    const sections = await Section.find({ testId }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((s) => s._id);
    const questions = await Question.find({ sectionId: { $in: sectionIds } })
      .select('-correctAnswers') // VERY IMPORTANT: Do not send answers to client
      .lean();

    // Organize questions by section
    const testPayload = sections.map((section) => ({
      ...section,
      questions: questions.filter((q) => q.sectionId.toString() === section._id.toString()),
    }));

    // Fetch existing answers if resuming
    const existingAnswers = await Answer.find({ attemptId: attempt._id }).lean();

    res.status(200).json({
      attemptId: attempt._id,
      serverEndTime: attempt.serverEndTime,
      warningCount: attempt.warningCount || 0,
      test: testPayload,
      savedAnswers: existingAnswers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync answers periodically
// @route   POST /api/v1/exams/attempts/:attemptId/sync
// @access  Private (Student)
export const syncAnswers = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // Array of { questionId, studentAnswers, status, timeSpentSecs }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized attempt' });
    }

    if (attempt.status !== 'ONGOING') {
      return res.status(400).json({ message: 'Attempt is already completed' });
    }

    // Bulk upsert answers
    const bulkOps = answers.map((ans) => ({
      updateOne: {
        filter: { attemptId, questionId: ans.questionId },
        update: { $set: { studentAnswers: ans.studentAnswers, status: ans.status, timeSpentSecs: ans.timeSpentSecs } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Answer.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: 'Synced successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record anti-cheat warning
// @route   POST /api/v1/exams/attempts/:attemptId/warning
// @access  Private (Student)
export const recordWarning = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized attempt' });
    }

    if (attempt.status !== 'ONGOING') {
      return res.status(400).json({ message: 'Attempt is already completed' });
    }

    attempt.warningCount = (attempt.warningCount || 0) + 1;
    await attempt.save();

    res.status(200).json({ warningCount: attempt.warningCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit test and evaluate
// @route   POST /api/v1/exams/attempts/:attemptId/submit
// @access  Private (Student)
export const submitAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized attempt' });
    }

    if (attempt.status !== 'ONGOING') {
      return res.status(400).json({ message: 'Attempt is already completed' });
    }

    // 1. Mark as completed
    attempt.status = 'COMPLETED';
    await attempt.save();

    // 2. Fetch all required data for evaluation
    const studentAnswers = await Answer.find({ attemptId });
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
    const timeTakenSecs = Math.floor((Date.now() - attempt.createdAt.getTime()) / 1000);
    // Check if it's the first attempt
    const previousResult = await Result.findOne({ testId: attempt.testId, studentId: attempt.studentId });
    const isFirstAttempt = !previousResult;
    
    const result = await Result.create({
      attemptId,
      studentId: attempt.studentId,
      testId: attempt.testId,
      totalScore,
      sectionScores,
      timeTakenSecs,
      isFirstAttempt
    });

    res.status(200).json({ message: 'Test submitted successfully', resultId: result._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get result by ID
// @route   GET /api/v1/exams/results/:resultId
// @access  Private (Student)
export const getResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId)
      .populate('testId', 'title description durationMinutes')
      .populate('sectionScores.sectionId', 'name');

    if (!result || result.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Result not found or unauthorized' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard for a specific test
// @route   GET /api/v1/exams/:testId/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test || !test.isPublished) {
      return res.status(403).json({ message: 'Leaderboard is not available until the test is published' });
    }

    // Find all FIRST ATTEMPT results for this test, sort by highest score, then lowest time
    const results = await Result.find({ testId, isFirstAttempt: true })
      .sort({ totalScore: -1, timeTakenSecs: 1 })
      .populate('studentId', 'name')
      .limit(100); // Limit to top 100 for performance

    if (!results) {
      return res.status(404).json({ message: 'No results found for this test' });
    }

    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      studentName: result.studentId?.name || 'Unknown Student',
      score: result.totalScore,
      timeTakenSecs: result.timeTakenSecs,
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's exam statistics
// @route   GET /api/v1/exams/stats
// @access  Private (Student)
export const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    const allResults = await Result.find({ studentId }).populate('testId', '_id');
    
    // Filter out any orphaned results where the test was deleted
    const results = allResults.filter(r => r.testId != null);

    const completedTests = results.map(r => ({
      testId: r.testId._id.toString(),
      resultId: r._id.toString(),
    }));

    // Deduplicate in case of multiple attempts (though we removed that)
    const uniqueCompletedTests = [];
    const seenTestIds = new Set();
    for (const ct of completedTests) {
      if (!seenTestIds.has(ct.testId)) {
        uniqueCompletedTests.push(ct);
        seenTestIds.add(ct.testId);
      }
    }

    res.status(200).json({
      completedTests: uniqueCompletedTests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed review of a result (questions, answers, correctness)
// @route   GET /api/v1/exams/results/:resultId/review
// @access  Private (Student)
export const getResultReview = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await Result.findById(resultId).populate('testId');
    if (!result || result.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Result not found or unauthorized' });
    }

    const attempt = await Attempt.findById(result.attemptId);
    const answers = await Answer.find({ attemptId: attempt._id }).lean();
    const sections = await Section.find({ testId: result.testId._id }).lean();
    const questions = await Question.find({ sectionId: { $in: sections.map(s => s._id) } }).lean();

    const answerMap = new Map();
    answers.forEach(a => answerMap.set(a.questionId.toString(), a));

    const reviewData = questions.map(q => {
      const studentAns = answerMap.get(q._id.toString());
      const sectionMaster = sections.find(s => s._id.toString() === q.sectionId.toString());

      let isCorrect = false;
      let status = studentAns ? studentAns.status : 'UNVISITED';
      let marksAwarded = 0;

      if (studentAns && (status === 'ANSWERED' || status === 'ANSWERED_MARKED_FOR_REVIEW')) {
        if (q.type === 'MCQ' || q.type === 'MSQ') {
          const correctSet = new Set(q.correctAnswers);
          const studentSet = new Set(studentAns.studentAnswers);
          if (correctSet.size === studentSet.size && [...correctSet].every(x => studentSet.has(x))) {
            isCorrect = true;
          }
        } else if (q.type === 'NUMERICAL') {
          const correctVal = parseFloat(q.correctAnswers[0]);
          const studentVal = parseFloat(studentAns.studentAnswers[0]);
          const tol = q.numericalTolerance || 0;
          if (Math.abs(correctVal - studentVal) <= tol) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          marksAwarded = sectionMaster.marksPerQuestion;
        } else {
          marksAwarded = -sectionMaster.negativeMarks;
        }
      }

      return {
        questionId: q._id,
        content: q.content,
        type: q.type,
        options: q.options,
        correctAnswers: q.correctAnswers,
        numericalTolerance: q.numericalTolerance,
        studentAnswers: studentAns ? studentAns.studentAnswers : [],
        status,
        isCorrect,
        marksAwarded,
        sectionName: sectionMaster.name
      };
    });

    res.status(200).json(reviewData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
