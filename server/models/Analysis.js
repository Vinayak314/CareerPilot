import mongoose from 'mongoose';

const categoryScoreSchema = new mongoose.Schema(
  {
    key: String,
    label: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false }
);

const weakBulletSchema = new mongoose.Schema(
  {
    bullet: { type: String, required: true },
    issue: String,
    suggestion: String,
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },

    // Job description input
    jobDescriptionText: { type: String, required: true },
    jobDescriptionUrl: String,
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },

    // Analyzer agent output
    atsScore: { type: Number, min: 0, max: 100, required: true },
    summary: String,
    categoryScores: [categoryScoreSchema],
    missingKeywords: [String],
    partialKeywords: [String],
    matchedKeywords: [String],
    weakBullets: [weakBulletSchema],
    formattingIssues: [String],
    recommendations: [recommendationSchema],

    // Provenance / observability
    source: { type: String, enum: ['gemini', 'heuristic'], required: true },
    model: String,
    fallbackReason: String,
    latencyMs: Number,
    tokenUsage: {
      input: Number,
      output: Number,
      total: Number,
    },
    /** sha256(resume text hash + normalised JD) — cache key for re-analysis of the same pair. */
    inputHash: { type: String, required: true },
  },
  { timestamps: true }
);

analysisSchema.index({ userId: 1, inputHash: 1 });
analysisSchema.index({ userId: 1, createdAt: -1 });

const Analysis = mongoose.model('Analysis', analysisSchema);
export default Analysis;
