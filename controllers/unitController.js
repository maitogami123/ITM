const Unit = require('../models/unitModel');
const Staff = require('../models/staffModel');
const mongoose = require('mongoose');
const {
  findCustomWithPopulate,
  populateOptions,
} = require('../custom/CustomFinding');

// Create a new unit member
exports.createUnit = async (req, res) => {
  const unit = new Unit(req.body);
  try {
    const existingUnit = await Unit.findOne({ name });
    if (existingUnit) {
      return res
        .status(400)
        .json({ message: 'Unit with this name already exists' });
    }
    const newUnit = await unit.save();
    res
      .status(201)
      .json({ message: 'Unit member created successfully', unit: newUnit });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all unit members
exports.getUnit = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for name
        ],
      };
    }

    // Pagination and sorting options
    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === 'asc' ? 1 : -1 },
    };

    const units = await findCustomWithPopulate({
      model: Unit.find(filter, null, options),
      // populateOptions: populateOption,
    });
    const total = await Unit.countDocuments(filter);
    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: units,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single unit member by ID
exports.getUnitById = async (req, res) => {
  try {
    let option = populateOptions('staffs', 'positions', 'Position');
    const unit = await findCustomWithPopulate({
      model: Unit,
      id: req.params.id,
      populateOptions: option,
    });
    if (!unit)
      return res.status(404).json({ message: 'Unit member not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a unit member by ID
exports.updateUnit = async (req, res) => {
  const { name } = req.body;
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit)
      return res.status(404).json({ message: 'Unit member not found' });
    unit.name = name || unit.name;
    await unit.save();
    res.json({ message: 'Unit member updated successfully', unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a unit member by ID
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit)
      return res.status(404).json({ message: 'Unit member not found' });
    res.json({ message: 'Unit member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeStaffFromUnit = async (req, res) => {
  try {
    const { unitId, staffId } = req.params;
    const unit = await Unit.findByIdAndUpdate(
      unitId,
      { $pull: { staffs: new mongoose.Types.ObjectId(staffId) } },
      { new: true } // Return the updated document
    );

    if (!unit) {
      throw new Error('Unit not found');
    }

    const staff = await Staff.findById(staffId);
    staff.unit = null;
    await staff.save();

    return res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('Error removing staff from unit:', error);
    res.status(500).json({ message: error.message });
  }
};
