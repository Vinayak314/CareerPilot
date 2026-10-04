import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    links: [String],
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    heading: String,
    bullets: [String],
  },
  { _id: false }
);

/**
 * Parsed, structured view of the resume. Produced locally by services/resumeParser.js
 * so it is available without an AI key; the analyzer agent reads both this and rawText.
 */
const parsedSchema = new mongoose.Schema(
  {
    contact: contactSchema,
    summary: String,
    skills: [String],
    experience: [experienceSchema],
    education: [String],
    projects: [String],
    certifications: [String],
    bullets: [String],
    sectionsFound: [String],
    wordCount: Number,
    pageCount: Number,
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx', 'txt'], required: true },
    size: { type: Number, required: true, min: 0 },
    /** sha256 of the uploaded bytes, used to detect re-uploads of the same file. */
    fileHash: { type: String, required: true },
    /** sha256 of the normalised extracted text, used as the resume half of the analysis cache key. */
    textHash: { type: String, required: true },
    rawText: { type: String, required: true },
    parsed: parsedSchema,
    /** 1-based upload counter per user so resumes can be shown as versions. */
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, fileHash: 1 });
resumeSchema.index({ userId: 1, createdAt: -1 });

/** Public representation; raw text is omitted from list views to keep payloads small. */
resumeSchema.methods.toSummary = function toSummary(extra = {}) {
  return {
    _id: this._id,
    fileName: this.fileName,
    originalName: this.fileName,
    fileType: this.fileType,
    mimeType: this.mimeType,
    size: this.size,
    version: this.version,
    wordCount: this.parsed?.wordCount ?? null,
    pageCount: this.parsed?.pageCount ?? null,
    sectionsFound: this.parsed?.sectionsFound ?? [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ...extra,
  };
};

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
