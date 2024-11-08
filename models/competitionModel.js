const mongoose = require("mongoose");

const researchProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const competitionSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  projects: [researchProjectSchema],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reward" }],
});

module.exports = mongoose.model("Competition", competitionSchema);
