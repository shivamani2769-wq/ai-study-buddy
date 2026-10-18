const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { askGemini } = require('../services/gemini');

const router = express.Router();

// keep the uploaded file in memory (no saving to disk), max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/documents/upload   (form-data: file, optional title)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a file' });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const isTxt = req.file.mimetype === 'text/plain';
    if (!isPdf && !isTxt) {
      return res.status(400).json({ message: 'Only PDF or TXT files are allowed' });
    }

    let text = '';
    if (isPdf) {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    text = text.replace(/\s+/g, ' ').trim();

    if (text.length < 50) {
      return res.status(400).json({
        message: 'Could not read text from this file. Scanned/image PDFs are not supported.',
      });
    }

    // keep it a sensible size for the AI later
    text = text.slice(0, 30000);

    const title = req.body.title || req.file.originalname.replace(/\.[^.]+$/, '');

    const doc = await Document.create({ user: req.userId, title, text });

    res.status(201).json({
      id: doc._id,
      title: doc.title,
      characters: text.length,
      preview: text.slice(0, 300),
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// GET /api/documents   (list my documents, without the big text)
router.get('/', auth, async (req, res) => {
  const docs = await Document.find({ user: req.userId })
    .select('title createdAt summary')
    .sort({ createdAt: -1 });
  res.json(docs);
});

// GET /api/documents/:id   (one full document)
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: 'Invalid document id' });
  }
});
// POST /api/documents/:id/generate  -> summary + flashcards + quiz
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const prompt = `You are a helpful study assistant for engineering students.
Read the study notes below and return ONLY valid JSON in exactly this shape:
{
  "summary": "A clear summary in 6-8 sentences",
  "flashcards": [ { "question": "...", "answer": "..." } ],
  "quiz": [
    { "question": "...", "options": ["A text", "B text", "C text", "D text"], "answer": "must be exactly one of the options", "topic": "short topic name" }
  ]
}
Rules: give exactly 8 flashcards and exactly 6 quiz questions. Each quiz question has 4 options. Base everything only on the notes.

NOTES:
${doc.text}`;

    const result = await askGemini(prompt);

    // basic safety checks on what the AI returned
    const flashcards = (result.flashcards || []).filter((f) => f.question && f.answer);
    const quiz = (result.quiz || []).filter(
      (q) => q.question && Array.isArray(q.options) && q.options.includes(q.answer)
    );

    doc.summary = result.summary || '';
    doc.flashcards = flashcards;
    doc.quiz = quiz;
    await doc.save();

    res.json({ summary: doc.summary, flashcards: doc.flashcards, quiz: doc.quiz });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: 'AI limit reached, please wait a minute and try again' });
    }
    res.status(500).json({ message: 'AI generation failed', error: err.message });
  }
});

module.exports = router;