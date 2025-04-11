const mongoose = require('mongoose');

const CustomListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  mangaIds: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('CustomList', CustomListSchema);