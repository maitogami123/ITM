const Staff = require("../models/staffModel");
const { calculateNextIncrementDate } = require("../utils/salaryIncrement");
const formatDate = require("../utils/formatDate");

// Create a new staff member
exports.createStaff = async (req, res) => {
  req.body.lastIncrementDate = req.body.startDate;
  const staff = new Staff(req.body);
  try {
    const newStaff = await staff.save();
    res
      .status(201)
      .json({ message: "Staff member created successfully", staff: newStaff });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all staff members
exports.getStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().populate(
      "positions unit rewards competitions"
    );
    res.json(staffList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate(
      "positions unit rewards competitions"
    );
    if (!staff)
      return res.status(404).json({ message: "Staff member not found" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a staff member by ID
exports.updateStaff = async (req, res) => {
  const {
    mscb,
    name,
    gender,
    dateOfBirth,
    phone,
    qualificationCode,
    isPermanent,
    startDate,
    notes,
    positions,
    mainSpecialization,
    unit,
    rewards,
    competitions,
  } = req.body;
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ message: "Staff member not found" });

    staff.mscb = mscb || staff.mscb;
    staff.name = name || staff.name;
    staff.gender = gender || staff.gender;
    staff.dateOfBirth = dateOfBirth || staff.dateOfBirth;
    staff.phone = phone || staff.phone;
    staff.qualificationCode = qualificationCode || staff.qualificationCode;
    staff.isPermanent = isPermanent || staff.isPermanent;
    staff.startDate = startDate || staff.startDate;
    staff.notes = notes || staff.notes;
    staff.positions = positions || staff.positions;
    staff.mainSpecialization = mainSpecialization || staff.mainSpecialization;
    staff.unit = unit || staff.unit;
    staff.rewards = rewards || staff.rewards;
    staff.competitions = competitions || staff.competitions;

    await staff.save();
    res.json({ message: "Staff member updated successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a staff member by ID
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff)
      return res.status(404).json({ message: "Staff member not found" });
    res.json({ message: "Staff member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List listSalaryIncrements
exports.listSalaryIncrements = async (req, res) => {
  try {
    const staffList = await Staff.find().populate("rewards");
    const salaryIncrements = staffList.map((staff) => {
      const nextIncrementDate = calculateNextIncrementDate(
        staff.qualificationCode,
        staff.lastIncrementDate,
        staff.rewards
      );
      return {
        mscb: staff.mscb,
        name: staff.name,
        qualificationCode: staff.qualificationCode,
        lastIncrementDate: formatDate(staff.lastIncrementDate),
        nextIncrementDate: formatDate(nextIncrementDate),
      };
    });
    res.json(salaryIncrements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
