const Reward = require("../models/rewardModel");

// Create a new reward
exports.createReward = async (req, res) => {
  const reward = new Reward(req.body);
  try {
    const newReward = await reward.save();
    res.status(201).json({ message: "Reward created successfully", reward: newReward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all rewards
exports.getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find().populate("staff");
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single reward by ID
exports.getRewardById = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id).populate("staff");
    if (!reward) return res.status(404).json({ message: "Reward not found" });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a reward by ID
exports.updateReward = async (req, res) => {
  const { title, date, staff, competition } = req.body;
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: "Reward not found" });

    reward.title = title || reward.title;
    reward.date = date || reward.date;
    reward.staff = staff || reward.staff;
    reward.competition = competition || reward.competition;

    await reward.save();
    res.json({ message: "Reward updated successfully", reward });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a reward by ID
exports.deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) return res.status(404).json({ message: "Reward not found" });
    res.json({ message: "Reward deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
