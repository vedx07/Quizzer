import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    scheduledStartTime: {
      type: Date,
    },
    scheduledEndTime: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

testSchema.index({ isPublished: 1, scheduledStartTime: 1 });

const Test = mongoose.model('Test', testSchema);

export default Test;
