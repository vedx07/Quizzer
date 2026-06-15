import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    totalScore: {
      type: Number,
      required: true,
    },
    sectionScores: [
      {
        sectionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Section',
        },
        score: Number,
        correctCount: Number,
        incorrectCount: Number,
        unansweredCount: Number,
      },
    ],
    timeTakenSecs: {
      type: Number,
      required: true,
    },
    isFirstAttempt: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ testId: 1, totalScore: -1, timeTakenSecs: 1 }); // Leaderboard query

const Result = mongoose.model('Result', resultSchema);

export default Result;
