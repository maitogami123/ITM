const User = require("../models/userModel");
const Staff = require("../models/staffModel");
const bcrypt = require("bcryptjs");
const { findCustomWithPopulate } = require("../custom/CustomFinding");
const { getStaffSalaryIncrementStatus } = require("./staffController");
const { calculateNextIncrementDate } = require("../utils/salaryIncrement");

// Create a new user
exports.createUser = async (req, res) => {
  let { username, password, role, email, staff } = req.body;
  try {
    if (staff) {
      staff = await Staff.findById(staff);
    }
    const newUser = new User({ username, password, role, email, staff });
    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for name
          { email: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for email
        ],
      };
    }

    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === "asc" ? 1 : -1 },
    };

    const userList = await findCustomWithPopulate({
      model: User.find(filter, null, options).select("-password"),
    });
    const total = await User.countDocuments(filter);
    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: userList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("staff")
      .populate({
        path: "staff",
        populate: { path: "competitions rewards positions unit" },
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.staff && user.staff._id) {
      const staffId = user.staff._id; // Assuming the ID is passed as a URL parameter
      const staff = await Staff.findById(staffId).populate("rewards");
      const nextIncrementDate = calculateNextIncrementDate(staff.qualificationCode, staff.lastIncrementDate, staff.rewards);
      if (!staff.lastIncrementDate) {
        staff.lastIncrementDate = new Date().toLocaleDateString().split("T")[0];
        await staff.save();
      }
      return res.json({
        ...user._doc,
        lastIncrementDate: new Date(staff.lastIncrementDate).toLocaleDateString().split("T")[0],
        nextIncrementDate: new Date(nextIncrementDate).toLocaleDateString().split("T")[0],
      });
    }
    return res.json({...user._doc})
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  let { username, password, role, description, email, staff } = req.body;
  try {
    if (staff) {
      staff = await Staff.findById(staff);
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = username || user.username;
    user.email = email || user.email;
    user.staff = staff || user.staff;

    const foundStaff = await Staff.findById(user.staff);
    foundStaff.user = user;
    await foundStaff.save();

    if (password) user.password = await bcrypt.hash(password, 10);
    user.role = role || user.role;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
