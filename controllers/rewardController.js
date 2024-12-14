const { model } = require('mongoose');
const { populateOptions, findCustomWithPopulate } = require('../custom/CustomFinding');
const Reward = require('../models/rewardModel');
const Staff = require('../models/staffModel');
const Competition = require('../models/competitionModel');
const { calculateNextIncrementDate } = require('../utils/salaryIncrement');

// Create a new reward
exports.createReward = async (req, res) => {
  const reward = new Reward(req.body);
  try {
    const newReward = await reward.save();
    res.status(201).json({ message: 'Reward created successfully', reward: newReward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all rewards
exports.getRewards = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for name
          // { date: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for email
        ],
      };
    }

    // Pagination and sorting options
    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === 'asc' ? 1 : -1 },
    };

    // Populate options for related fields
    const populateOption = [
      populateOptions('staff'), // Lấy toàn bộ thông tin từ staff
      populateOptions('competition'), // Lấy toàn bộ thông tin từ competition
    ];

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
      populateOptions: populateOptions('staff competition'),
    });
    if (!reward) return res.status(404).json({ message: 'Reward not found' });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Staff not in Reward
exports.getRewardStaffLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Find reward based on rewardId
    const reward = await Reward.findById(id).select('staff');

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Get ID of staff linked to reward (if any)
    const staffLinkedToReward = reward.staff;

    // Find all staff not linked to this reward, including teacherGrade
    const staffNotLinkedToReward = await Staff.find({
      _id: { $ne: staffLinkedToReward }, // Exclude already linked staff
      teacherGrade: { $exists: true }, // Only include staff with teacherGrade
    }).select('name mscb mainSpecialization teacherGrade');

    if (!staffNotLinkedToReward.length) {
      return res.status(404).json({ message: 'No staff available for this reward' });
    }

    // Return list of unlinked staff
    res.status(200).json(staffNotLinkedToReward);
  } catch (err) {
    console.error('Error fetching staff not linked to reward:', err.message);
    res.status(500).json({
      message: 'An error occurred while fetching staff not linked to reward',
    });
  }
};

exports.addStaffToReward = async (req, res) => {
  const { id: rewardId, staffId } = req.params;

  try {
    // Find Reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Find Staff
    const staff = await Staff.findById(staffId).populate('rewards competitions');
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Check if staff is already added to this reward
    if (reward.staff?.toString() === staffId) {
      return res.status(400).json({ message: 'Staff already added to this reward' });
    }

    // Add Staff to Reward
    reward.staff = staffId;
    await reward.save();

    // Add reward to Staff's rewards array if not already present
    if (!staff.rewards.includes(rewardId)) {
      staff.rewards.push(rewardId);
      await staff.save(); // This will trigger the pre-save middleware that recalculates nextPromotionDate
    }

    // Update competition if present
    if (reward.competition) {
      const competition = await Competition.findById(reward.competition);
      if (competition && !competition.staffs.includes(staffId)) {
        competition.staffs.push(staffId);
        await competition.save();
      }
    }

    // Fetch the updated staff to get the new promotion date
    const updatedStaff = await Staff.findById(staffId);

    res.json({
      message: 'Staff added to reward successfully',
      reward,
      nextPromotionDate: updatedStaff.nextPromotionDate,
    });
  } catch (error) {
    console.error('Error adding staff to reward:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a reward by ID
exports.updateReward = async (req, res) => {
  const { title, date, staff, competition } = req.body;
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    reward.title = title || reward.title;
    reward.date = date || reward.date;
    reward.staff = staff || reward.staff;
    reward.competition = competition || reward.competition;

    await reward.save();
    res.json({ message: 'Reward updated successfully', reward });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a reward by ID
exports.deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });
    res.json({ message: 'Reward deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeStaffFromReward = async (req, res) => {
  const { id: rewardId, staffId } = req.params;

  try {
    // Find Reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Find Staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Check if Staff is linked to Reward
    if (reward.staff?.toString() !== staffId) {
      return res.status(400).json({ message: 'Staff is not associated with this reward' });
    }

    // Remove Staff from Reward
    reward.staff = null;
    await reward.save();

    // Remove Reward from Staff's rewards array
    staff.rewards = staff.rewards.filter((id) => id.toString() !== rewardId);
    await staff.save(); // This will trigger the pre-save middleware that recalculates nextPromotionDate

    // Fetch the updated staff to get the new promotion date
    const updatedStaff = await Staff.findById(staffId);

    res.json({
      message: 'Staff removed from reward successfully',
      reward,
      nextPromotionDate: updatedStaff.nextPromotionDate,
    });
  } catch (error) {
    console.error('Error removing staff from reward:', error);
    res.status(500).json({ message: error.message });
  }
};
