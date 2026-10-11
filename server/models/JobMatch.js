import mongoose from 'mongoose';

const JobMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobId: {
      type: String, // ID from external provider (Adzuna)
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
    descriptionText: String, // Extracted or full description

    // Scoring & Explanations
    fitScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    explanation: String,
    scoreBreakdown: {
      role: Number,
      skills: Number,
      experience: Number,
      location: Number,
      qualifications: Number,
    },

    // Skills & Gap Analysis
    matchedSkills: [String],
    missingSkills: [String],
    missingRequired: [String],
    missingPreferred: [String],
    relatedSkills: [
      {
        skill: String,
        possessedRelated: [String],
      },
    ],

    // Job Meta & Warnings
    salary: String,
    employmentType: String,
    experienceLevel: String,
    eligibilityWarnings: [String],
    postedAt: Date,
    country: String,

    // Status in the Kanban tracker
    status: {
      type: String,
      enum: ['Matched', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
      default: 'Matched',
    },
  },
  { timestamps: true }
);

JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
JobMatchSchema.index({ userId: 1, status: 1 });
JobMatchSchema.index({ userId: 1, fitScore: -1 });

const JobMatch = mongoose.model('JobMatch', JobMatchSchema);
export default JobMatch;
