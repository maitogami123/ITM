const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  mscb: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  gender: { type: Boolean, required: true },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  qualificationCode: { type: String, enum: ['BSc', 'MSc', 'PhD'], required: true },
  isPermanent: { type: Boolean, required: true },
  startDate: { type: Date, required: true },
  notes: { type: String },
  positions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }],
  mainSpecialization: { type: String, required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
  annualCompetitions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competition' }],
});

module.exports = mongoose.model('Staff', staffSchema);
