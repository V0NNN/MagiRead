const mongoose = require('mongoose');

const ReadingStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mangaId: { type: String, required: true },
  status: {
    type: String,
    enum: ['reading', 'on_hold', 'dropped', 'plan_to_read', 'completed', 're_reading'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ReadingStatus', ReadingStatusSchema);