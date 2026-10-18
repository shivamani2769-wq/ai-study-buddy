const express = require('express');
const Attempt = require('../models/Attempt');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/stats -> weakest topics across all my quiz attempts
router.get('/', auth, async (req, res) => {
  const attempts = await Attempt.find({ user: req.userId });

  const totals = {};
  let scoreSum = 0;
  let totalSum = 0;

  attempts.forEach((a) => {
    scoreSum += a.score;
    totalSum += a.total;
    a.topics.forEach((t) => {
      if (!totals[t.topic]) totals[t.topic] = { topic: t.topic, correct: 0, total: 0 };
      totals[t.topic].correct += t.correct;
      totals[t.topic].total += t.total;
    });
  });

  const topics = Object.values(totals)
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first

  res.json({
    attempts: attempts.length,
    averageScore: totalSum ? Math.round((scoreSum / totalSum) * 100) : 0,
    topics,
  });
});

module.exports = router;