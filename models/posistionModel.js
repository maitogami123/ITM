const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
});

module.exports = mongoose.model('Position', positionSchema);
