const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  staffs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
});

module.exports = mongoose.model("Unit", unitSchema);
