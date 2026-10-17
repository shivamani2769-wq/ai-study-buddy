const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    text: { type: String, default: '' },
    summary: { type: String, default: '' },
    flashcards: [{ question: String, answer: String }],
    quiz: [
      {
        question: String,
        options: [String],
        answer: String,
        topic: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);