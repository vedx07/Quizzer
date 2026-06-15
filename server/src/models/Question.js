import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    type: {
      type: String,
      enum: ['MCQ', 'MSQ', 'NUMERICAL'],
      required: true,
    },
    content: {
      type: String,
      required: true, // Rich text or markdown
    },
    options: [
      {
        id: String,
        text: String,
      },
    ],
    // Correct answers stored as strings to handle multiple types
    // For MCQ/MSQ: Array of option IDs
    // For Numerical: Array containing exact value or min/max range
    correctAnswers: [
      {
        type: String,
        required: true,
      },
    ],
    numericalTolerance: {
      type: Number,
      default: 0, // e.g. answer is 4.5 +/- 0.1
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ sectionId: 1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;
