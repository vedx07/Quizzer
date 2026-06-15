import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    studentAnswers: [
      {
        type: String, // Can store option IDs or numerical value
      },
    ],
    status: {
      type: String,
      enum: ['UNVISITED', 'ANSWERED', 'MARKED', 'VISITED_NOT_ANSWERED'],
      default: 'UNVISITED',
    },
    timeSpentSecs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Rapid upsert per question per attempt
answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

const Answer = mongoose.model('Answer', answerSchema);

export default Answer;
