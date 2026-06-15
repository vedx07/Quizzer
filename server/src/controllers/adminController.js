import Test from '../models/Test.js';
import Section from '../models/Section.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Answer from '../models/Answer.js';
import Result from '../models/Result.js';

// @desc    Create a new test
// @route   POST /api/v1/admin/tests
// @access  Private/Admin
export const createTest = async (req, res) => {
  try {
    const { title, description, durationMinutes, scheduledStartTime, scheduledEndTime } = req.body;

    const test = await Test.create({
      title,
      description,
      durationMinutes,
      scheduledStartTime,
      scheduledEndTime,
      createdBy: req.user._id,
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a section for a test
// @route   POST /api/v1/admin/tests/:testId/sections
// @access  Private/Admin
export const createSection = async (req, res) => {
  try {
    const { testId } = req.params;
    const { name, instructions, order, marksPerQuestion, negativeMarks } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const section = await Section.create({
      testId,
      name,
      instructions,
      order,
      marksPerQuestion,
      negativeMarks,
    });

    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a question to a section
// @route   POST /api/v1/admin/sections/:sectionId/questions
// @access  Private/Admin
export const createQuestion = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { type, content, options, correctAnswers, numericalTolerance } = req.body;

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const question = await Question.create({
      sectionId,
      type,
      content,
      options,
      correctAnswers,
      numericalTolerance,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publish a test
// @route   PATCH /api/v1/admin/tests/:testId/publish
// @access  Private/Admin
export const publishTest = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    if (!test.title || !test.durationMinutes) {
      return res.status(400).json({ message: 'Test title and duration are required' });
    }

    const sections = await Section.find({ testId });
    if (sections.length === 0) {
      return res.status(400).json({ message: 'At least one section is required to publish' });
    }

    let hasQuestions = false;
    for (const section of sections) {
      if (!section.marksPerQuestion) {
        return res.status(400).json({ message: `Section '${section.name}' must have marks assigned` });
      }

      const questions = await Question.find({ sectionId: section._id });
      if (questions.length > 0) hasQuestions = true;

      for (const q of questions) {
        if (!q.content || !q.correctAnswers || q.correctAnswers.length === 0) {
          return res.status(400).json({ message: `A question in section '${section.name}' is missing content or correct answer` });
        }
        if (q.type !== 'NUMERICAL' && (!q.options || q.options.length < 2)) {
          return res.status(400).json({ message: `A question in section '${section.name}' is missing options` });
        }
      }
    }

    if (!hasQuestions) {
      return res.status(400).json({ message: 'At least one question is required to publish' });
    }

    test.isPublished = true;
    await test.save();

    res.status(200).json({ message: 'Test published successfully', test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tests for admin
// @route   GET /api/v1/admin/tests
// @access  Private/Admin
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a test and its contents
// @route   DELETE /api/v1/admin/tests/:testId
// @access  Private (Admin)
export const deleteTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Delete related sections and questions
    const sections = await Section.find({ testId });
    const sectionIds = sections.map(s => s._id);
    await Question.deleteMany({ sectionId: { $in: sectionIds } });
    await Section.deleteMany({ testId });
    
    // Optional: Delete Attempts, Answers, Results? Yes to keep DB clean
    const attempts = await Attempt.find({ testId });
    const attemptIds = attempts.map(a => a._id);
    await Answer.deleteMany({ attemptId: { $in: attemptIds } });
    await Result.deleteMany({ testId });
    await Attempt.deleteMany({ testId });

    await Test.findByIdAndDelete(testId);

    res.status(200).json({ message: 'Test and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full test data (test, sections, questions) for editing
// @route   GET /api/v1/admin/tests/:testId/full
// @access  Private (Admin)
export const getFullTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).lean();
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const sections = await Section.find({ testId }).sort({ order: 1 }).lean();
    const sectionIds = sections.map(s => s._id);
    const questions = await Question.find({ sectionId: { $in: sectionIds } }).lean();

    const fullSections = sections.map(sec => ({
      ...sec,
      questions: questions.filter(q => q.sectionId.toString() === sec._id.toString())
    }));

    res.status(200).json({ ...test, sections: fullSections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update test basic details
// @route   PUT /api/v1/admin/tests/:testId
// @access  Private (Admin)
export const updateTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    if (test.isPublished) return res.status(400).json({ message: 'Cannot edit published test directly' });

    const updatedTest = await Test.findByIdAndUpdate(testId, req.body, { new: true });
    res.status(200).json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update section
// @route   PUT /api/v1/admin/sections/:sectionId
// @access  Private (Admin)
export const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const updated = await Section.findByIdAndUpdate(sectionId, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete section
// @route   DELETE /api/v1/admin/sections/:sectionId
// @access  Private (Admin)
export const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    await Question.deleteMany({ sectionId });
    await Section.findByIdAndDelete(sectionId);
    res.status(200).json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update question
// @route   PUT /api/v1/admin/questions/:questionId
// @access  Private (Admin)
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updated = await Question.findByIdAndUpdate(questionId, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete question
// @route   DELETE /api/v1/admin/questions/:questionId
// @access  Private (Admin)
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    await Question.findByIdAndDelete(questionId);
    res.status(200).json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
