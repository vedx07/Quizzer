import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
    },
    order: {
      type: Number,
      required: true,
    },
    marksPerQuestion: {
      type: Number,
      required: true,
      default: 4,
    },
    negativeMarks: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

sectionSchema.index({ testId: 1, order: 1 });

const Section = mongoose.model('Section', sectionSchema);

export default Section;
