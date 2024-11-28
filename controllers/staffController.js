const Staff = require("../models/staffModel");
const Unit = require("../models/unitModel");
const User = require("../models/userModel");
const { calculateNextIncrementDate } = require("../utils/salaryIncrement");
const formatDate = require("../utils/formatDate");
const mongoose = require("mongoose");
const { findCustomWithPopulate, populateOptions } = require("../custom/CustomFinding");

// Create a new staff member
exports.createStaff = async (req, res) => {
  req.body.lastIncrementDate = req.body.startDate;
  const staff = new Staff(req.body);
  try {
    const newStaff = await staff.save();

    const unit = await Unit.findById(req.body.unit);
    unit.staffs.push(newStaff);
    await unit.save();

    res.status(201).json({ message: "Staff member created successfully", staff: newStaff });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAvailableStaff = async (req, res) => {
  try {
    // Find all staff members
    const allStaff = await Staff.find().select("mscb name");

    // Find staff members already linked to users
    const linkedStaff = await User.find().select("staff");
    const linkedStaffIds = linkedStaff.map((user) => {
      if (user.staff) return user.staff.toString();
      return;
    });
    // Filter out linked staff members
    const availableStaff = allStaff.filter((staff) => !linkedStaffIds.includes(staff._id.toString()));

    res.json(availableStaff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .select("-password")
      .populate("positions unit rewards competitions user");
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
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
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

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
    if (unit && staff.unit !== unit) {
      await Unit.findByIdAndUpdate(
        staff.unit,
        { $pull: { staffs: new mongoose.Types.ObjectId(req.params.id) } },
        { new: true } // Return the updated document
      );
      const foundUnit = await Unit.findById(req.params.unitId || unit);
      foundUnit.staffs.push(staff);
      await foundUnit.save();
    }
    staff.unit = unit || staff.unit;
    staff.rewards = rewards || staff.rewards;
    staff.competitions = competitions || staff.competitions;

    await staff.save();
    res.json({ message: "Staff member updated successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStaffUnit = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    staff.unit = req.params.unitId || staff.unit;
    await staff.save();

    const unit = await Unit.findById(req.params.unitId);
    unit.staffs.push(staff);
    await unit.save();

    res.json({ message: "Staff member updated successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a staff member by ID
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    const unit = await Unit.findById(staff.unit);
    unit.staffs = unit.staffs.filter((staff) => staff._id !== staff._id);
    await unit.save();
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json({ message: "Staff member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List listSalaryIncrements
exports.listSalaryIncrements = async (req, res) => {
  try {
    const staffList = await Staff.find().populate("rewards");
    const salaryIncrements = await Promise.all(
      staffList.map(async (staff) => {
        const nextIncrementDate = calculateNextIncrementDate(
          staff.qualificationCode,
          staff.lastIncrementDate,
          staff.rewards
        );
        if (!staff.lastIncrementDate) {
          staff.lastIncrementDate = new Date().toLocaleDateString().split("T")[0];
          await staff.save();
        }

        return {
          mscb: staff.mscb,
          name: staff.name,
          qualificationCode: staff.qualificationCode,
          lastIncrementDate: new Date(staff.lastIncrementDate).toLocaleDateString().split("T")[0],
          nextIncrementDate: new Date(nextIncrementDate).toLocaleDateString().split("T")[0],
        };
      })
    );

    res.json(salaryIncrements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStaffSalaryIncrementStatus = async (req, res) => {
  try {
    const staffId = req.params.id; // Assuming the ID is passed as a URL parameter
    const staff = await Staff.findById(staffId).populate("rewards");

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const nextIncrementDate = calculateNextIncrementDate(staff.qualificationCode, staff.lastIncrementDate, staff.rewards);

    if (!staff.lastIncrementDate) {
      staff.lastIncrementDate = new Date().toLocaleDateString().split("T")[0];
      await staff.save();
    }

    const salaryIncrementStatus = {
      mscb: staff.mscb,
      name: staff.name,
      qualificationCode: staff.qualificationCode,
      lastIncrementDate: new Date(staff.lastIncrementDate).toLocaleDateString().split("T")[0],
      nextIncrementDate: new Date(nextIncrementDate).toLocaleDateString().split("T")[0],
    };

    res.json(salaryIncrementStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all staff members with search, pagination, and population
exports.getStaff = async (req, res) => {
  try {
    // Extract query parameters
    const { search, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for name
          { email: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for email
        ],
      };
    }

    // Pagination and sorting options
    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === "asc" ? 1 : -1 },
    };

    // Populate options for related fields
    const populateOption = populateOptions("positions unit rewards competitions");

    // Get the staff list with search, pagination, and population using findCustomWithPopulate
    const staffList = await findCustomWithPopulate({
      model: Staff.find(filter, null, options),
      populateOptions: populateOption,
    });

    // Get total count of documents matching the filter for pagination info
    const total = await Staff.countDocuments(filter);

    // Send paginated response
    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: staffList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStaffUnitLess = async (req, res) => {
  try {
    // Lấy danh sách nhân viên chưa có đơn vị
    const staffWithoutUnit = await Staff.find({ unit: null }).select("name mscb");

    if (!staffWithoutUnit.length) {
      // Nếu không có kết quả, trả về thông báo
      return res.status(404).json({ message: "No staff members without unit found" });
    }

    // Trả về danh sách
    res.status(200).json(staffWithoutUnit);
  } catch (err) {
    // Log lỗi chi tiết để debug nếu cần
    console.error("Error fetching staff without unit:", err.message);
    res.status(500).json({ message: "An error occurred while fetching staff without unit" });
  }
};
