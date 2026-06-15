import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    serverEndTime: {
      type: Date,
      required: true, // Calculated when attempt starts based on Test duration
    },
    status: {
      type: String,
      enum: ['ONGOING', 'COMPLETED', 'AUTO_SUBMITTED'],
      default: 'ONGOING',
    },
    warningCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// A student can have multiple attempts, so just index it for performance without unique constraint
attemptSchema.index({ testId: 1, studentId: 1 });

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;
