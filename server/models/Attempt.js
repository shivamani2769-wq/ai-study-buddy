const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    score: Number,
    total: Number,
    topics: [{ topic: String, correct: Number, total: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attempt', attemptSchema);