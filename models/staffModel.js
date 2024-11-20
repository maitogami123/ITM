const mongoose = require('mongoose');
const QualificationCode = require('./enum/QualificationCode'); // Import the enum
const Gender = require('./enum/Gender');

const staffSchema = new mongoose.Schema({
  mscb: { type: String, unique: true, required: true },
  name: { type: String },
  gender: {
    type: String,
    enum: Object.values(Gender),
    default: Gender.NOT_DECLARE,
  },
  dateOfBirth: { type: String },
  phone: { type: String },
  qualificationCode: {
    type: String,
    enum: Object.values(QualificationCode),
    default: QualificationCode.UNKNOWN, // Use values from QualificationCode enum
  },
  isPermanent: { type: Boolean },
  startDate: {
    type: String,
    default: () => {
      const date = new Date(Date.now());
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    },
  },
  lastIncrementDate: { type: String },
  notes: { type: String },
  mainSpecialization: { type: String },
  positions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
  competitions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competition' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tham chiếu tới User
});

module.exports = mongoose.model('Staff', staffSchema);
