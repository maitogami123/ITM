const mongoose = require('mongoose');

const researchProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const competitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, required: true },
  description: { type: String, required: true },
  // projects: [researchProjectSchema],
  staffs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
});

competitionSchema.methods.registerStaff = function (staffId) {
  if (!this.staffs.includes(staffId)) {
    this.staffs.push(staffId);
  }
};

module.exports = mongoose.model('Competition', competitionSchema);
