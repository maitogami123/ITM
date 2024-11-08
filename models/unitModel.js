const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
});

module.exports = mongoose.model('Unit', unitSchema);
