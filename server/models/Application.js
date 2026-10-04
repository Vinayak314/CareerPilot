import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  location: String,
  url: String,
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
    default: 'Saved',
  },
  appliedDate: Date,
  notes: String,
  jobMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobMatch',
  }, // If created from a job match
}, { timestamps: true });

ApplicationSchema.index({ userId: 1, status: 1 });

const Application = mongoose.model('Application', ApplicationSchema);
export default Application;
