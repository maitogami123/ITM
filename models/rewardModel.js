const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  competition: { type: mongoose.Schema.Types.ObjectId, ref: "Competition" },
});

module.exports = mongoose.model("Reward", rewardSchema);
