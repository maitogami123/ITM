const Unit = require("../models/unitModel");

// Create a new unit member
exports.createUnit = async (req, res) => {
  const unit = new Unit(req.body);
  try {
    const newUnit = await unit.save();
    res
      .status(201)
      .json({ message: "Unit member created successfully", unit: newUnit });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all unit members
exports.getUnit = async (req, res) => {
  try {
    const unitList = await Unit.find().populate(
      "positions unit rewards annualCompetitions"
    );
    res.json(unitList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single unit member by ID
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate(
      "positions unit rewards annualCompetitions"
    );
    if (!unit)
      return res.status(404).json({ message: "Unit member not found" });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a unit member by ID
exports.updateUnit = async (req, res) => {
  const { name, staff } = req.body;
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit)
      return res.status(404).json({ message: "Unit member not found" });
    unit.name = name || unit.name;
    unit.staff = staff || unit.staff;
    await unit.save();
    res.json({ message: "Unit member updated successfully", unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a unit member by ID
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit)
      return res.status(404).json({ message: "Unit member not found" });
    res.json({ message: "Unit member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
