const Position = require('../models/posistionModel');

// Create a new position
exports.createPosition = async (req, res) => {
  const position = new Position(req.body);
  try {
    const newPosition = await position.save();
    res.status(201).json({ message: 'Position created successfully', position: newPosition });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all positions
exports.getPositions = async (req, res) => {
  try {
    const positions = await Position.find().populate('staff');
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single position by ID
exports.getPositionById = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id).populate('staff');
    if (!position) return res.status(404).json({ message: 'Position not found' });
    res.json(position);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a position by ID
exports.updatePosition = async (req, res) => {
  const { title, staff } = req.body;
  try {
    const position = await Position.findById(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found' });

    position.title = title || position.title;
    position.staff = staff || position.staff;

    await position.save();
    res.json({ message: 'Position updated successfully', position });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a position by ID
exports.deletePosition = async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found' });
    res.json({ message: 'Position deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
