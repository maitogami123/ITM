const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generateRandomId = require("../utils/generateRandomId");
const Staff = require("../models/staffModel");

exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const staff = new Staff({
      mscb: generateRandomId(),
      name: "",
      dateOfBirth: "",
      phone: "",
      isPermanent: false,
      startDate: "",
      lastIncrementDate: "",
      mainSpecialization: "",
    });
    await staff.save();
    const newUser = new User({ username, password, staff: staff._id });
    await newUser.save();
    staff.user = newUser._id;
    await staff.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
