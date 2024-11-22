const { model } = require("mongoose");
const {
  populateOptions,
  findCustomWithPopulate,
} = require("../custom/CustomFinding");
const Reward = require("../models/rewardModel");
const Staff = require("../models/staffModel");
const Competition = require("../models/competitionModel");

// Create a new reward
exports.createReward = async (req, res) => {
  const reward = new Reward(req.body);
  try {
    const newReward = await reward.save();
    res
      .status(201)
      .json({ message: "Reward created successfully", reward: newReward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all rewards
exports.getRewards = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for name
          // { date: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for email
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
    const populateOption = populateOptions("staff competition");

    // Get the staff list with search, pagination, and population using findCustomWithPopulate
    const rewards = await findCustomWithPopulate({
      model: Reward.find(filter, null, options),
      populateOptions: populateOption,
    });

    // Get total count of documents matching the filter for pagination info
    const total = await Reward.countDocuments(rewards);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: rewards,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single reward by ID
exports.getRewardById = async (req, res) => {
  try {
    // const reward = await Reward.findById(req.params.id).populate(
    //   "staff competition"
    // );
    const reward = await findCustomWithPopulate({
      model: Reward,
      id: req.params.id,
      populateOptions: populateOptions("staff competition"),
    });
    if (!reward) return res.status(404).json({ message: "Reward not found" });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Staff not in Reward
exports.getRewardStaffLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm phần thưởng dựa trên rewardId
    const reward = await Reward.findById(id).select("staff");

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    // Lấy ID của nhân viên đã liên kết với phần thưởng (nếu có)
    const staffLinkedToReward = reward.staff;

    // Tìm tất cả nhân viên chưa liên kết với phần thưởng này
    const staffNotLinkedToReward = await Staff.find({
      _id: { $ne: staffLinkedToReward }, // Loại trừ nhân viên đã liên kết
    }).select("name mscb mainSpecialization");

    if (!staffNotLinkedToReward.length) {
      return res
        .status(404)
        .json({ message: "No staff available for this reward" });
    }

    // Trả về danh sách nhân viên chưa liên kết
    res.status(200).json(staffNotLinkedToReward);
  } catch (err) {
    console.error("Error fetching staff not linked to reward:", err.message);
    res.status(500).json({
      message: "An error occurred while fetching staff not linked to reward",
    });
  }
};

exports.addStaffToReward = async (req, res) => {
  const { id: rewardId, staffId } = req.params;

  try {
    // Tìm Reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    // Tìm Staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Kiểm tra xem Reward đã có staff này chưa
    if (reward && reward.staff === staffId) {
      return res
        .status(400)
        .json({ message: "Staff already added to this reward" });
    }

    // Thêm Staff vào Reward
    reward.staff = staffId; // Gán staff vào phần thưởng
    await reward.save();

    // Thêm phần thưởng vào danh sách rewards của Staff nếu chưa có
    if (!staff.rewards.includes(rewardId)) {
      staff.rewards.push(rewardId);
      await staff.save();
    }

    // Kiểm tra và cập nhật nếu phần thưởng có liên kết với một competition
    if (reward.competition) {
      const competition = await Competition.findById(reward.competition);
      if (competition && !competition.staffs.includes(staffId)) {
        competition.staffs.push(staffId);
        await competition.save();
      }
    }

    // Phản hồi thành công
    res.json({
      message: "Staff added to reward successfully",
      reward,
    });
  } catch (error) {
    console.error("Error adding staff to reward:", error);
    res.status(500).json({ message: error.message });
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

exports.removeStaffFromReward = async (req, res) => {
  const { id: rewardId, staffId } = req.params; // Lấy rewardId và staffId từ URL params

  try {
    // Tìm Reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    // Tìm Staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Kiểm tra xem Staff có liên kết với Reward không
    if (reward.staff?.toString() !== staffId) {
      return res
        .status(400)
        .json({ message: "Staff is not associated with this reward" });
    }

    // Xóa liên kết Staff khỏi Reward
    reward.staff = null; // Gỡ liên kết staff khỏi phần thưởng
    await reward.save();

    // Xóa Reward khỏi danh sách rewards của Staff
    staff.rewards = staff.rewards.filter((id) => id.toString() !== rewardId);
    await staff.save();

    // Phản hồi thành công
    res.json({
      message: "Staff removed from reward successfully",
      reward,
    });
  } catch (error) {
    console.error("Error removing staff from reward:", error);
    res.status(500).json({ message: error.message });
  }
};
