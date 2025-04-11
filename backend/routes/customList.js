const express = require('express');
const router = express.Router();
const CustomList = require('../models/CustomList');
const authenticate = require('../middleware/authenticate');

// POST /api/custom-lists
router.post('/', authenticate, async (req, res) => {
  const { name, visibility } = req.body;
  const userId = req.user._id;

  try {
    const existing = await CustomList.findOne({ userId, name });
    if (existing) return res.status(400).json({ error: 'List already exists' });

    const newList = new CustomList({ userId, name, visibility });
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/custom-lists/:id
router.put('/:id', authenticate, async (req, res) => {
  const { mangaIds } = req.body;
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const list = await CustomList.findOne({ _id: id, userId });
    if (!list) return res.status(404).json({ error: 'List not found' });

    list.mangaIds = mangaIds;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/custom-lists
router.get('/', authenticate, async (req, res) => {
  try {
    const lists = await CustomList.find({ userId: req.user._id });
    res.json(lists);
  } catch (err) {
    console.error('Error fetching custom lists:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;