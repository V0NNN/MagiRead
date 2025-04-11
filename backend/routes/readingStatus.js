const express = require('express');
const router = express.Router();
const ReadingStatus = require('../models/ReadingStatus');
const authenticate = require('../middleware/authenticate');

// POST /api/reading-status/:mangaId
router.post('/:mangaId', authenticate, async (req, res) => {
  const { status } = req.body;
  const { mangaId } = req.params;
  const userId = req.user._id;

  try {
    const existing = await ReadingStatus.findOne({ userId, mangaId });
    if (existing) {
      existing.status = status;
      await existing.save();
      return res.json(existing);
    }

    const newStatus = new ReadingStatus({ userId, mangaId, status });
    await newStatus.save();
    res.status(201).json(newStatus);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reading-status
router.get('/', authenticate, async (req, res) => {
    try {
        const statuses = await ReadingStatus.find({ userId: req.user._id });
        res.json(statuses);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/reading-status/:mangaId
router.delete('/:mangaId', authenticate, async (req, res) => {
    const { mangaId } = req.params;
    const userId = req.user._id;
  
    try {
      const result = await ReadingStatus.findOneAndDelete({ userId, mangaId });
      if (!result) return res.status(404).json({ error: 'Entry not found' });
  
      res.json({ message: 'Removed from reading list' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;