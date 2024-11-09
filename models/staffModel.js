const mongoose = require("mongoose");
const QualificationCode = require("./enum/QualificationCode"); // Import the enum
const Gender = require("./enum/Gender");

const staffSchema = new mongoose.Schema({
  // mscb này có bị dư kh? staff_id = mscb kh?
  mscb: { type: String, unique: true, required: true },
  //
  name: { type: String, required: true },
  gender: {
    type: String,
    enum: Object.values(Gender),
    required: true,
  },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  qualificationCode: {
    type: String,
    enum: Object.values(QualificationCode), // Use values from QualificationCode enum
    required: true,
  },
  isPermanent: { type: Boolean, required: true },
  startDate: { type: Date, required: true },
  notes: { type: String },
  mainSpecialization: { type: String, required: true },
  positions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Position" }],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reward" }],
  competitions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Competition" }],
});

module.exports = mongoose.model("Staff", staffSchema);
