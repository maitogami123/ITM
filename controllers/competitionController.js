const Competition = require('../models/competitionModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const path = require('path');
const { Parser } = require('json2csv');
const xlsx = require('xlsx');
const {
  findCustomWithPopulate,
  populateOptions,
} = require('../custom/CustomFinding');
const Reward = require('../models/rewardModel');

// Create a new competition
exports.createCompetition = async (req, res) => {
  const competition = new Competition(req.body);
  try {
    const newCompetition = await competition.save();
    res.status(201).json({
      message: 'Competition created successfully',
      competition: newCompetition,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all competitions
exports.getCompetitions = async (req, res) => {
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
          { title: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for name
          { year: { $regex: `^${search}`, $options: 'i' } }, // case-insensitive search for email
        ],
      };
    }

    // Pagination and sorting options
    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === 'asc' ? 1 : -1 },
    };

    const competitions = await findCustomWithPopulate({
      model: Competition.find(filter, null, options),
      // populateOptions: populateOption,
    });
    const total = await Competition.countDocuments(filter);

    // Send paginated response
    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: competitions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single competition by ID
exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).populate(
      'rewards staffs'
    );
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });
    res.json(competition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a competition by ID
exports.updateCompetition = async (req, res) => {
  const { year, title, description, projects, staffs, rewards } = req.body;
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });

    competition.year = year || competition.year;
    competition.title = title || competition.title;
    competition.description = description || competition.description;
    competition.projects = projects || competition.projects;
    competition.staffs = staffs || competition.staffs;
    competition.rewards = rewards || competition.rewards;

    await competition.save();
    res.json({ message: 'Competition updated successfully', competition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a competition by ID
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });
    res.json({ message: 'Competition deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a research project to a competition
exports.addProjectToCompetition = async (req, res) => {
  const { title, description, startDate, endDate } = req.body;
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });

    competition.projects.push({ title, description, startDate, endDate });
    await competition.save();
    res.json({ message: 'Project added successfully', competition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a research project from a competition
exports.removeProjectFromCompetition = async (req, res) => {
  const { projectId } = req.params;
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });

    competition.projects.remove(projectId).remove();
    await competition.save();
    res.json({ message: 'Project removed successfully', competition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeStaffFromCompetition = async (req, res) => {
  const { id: competitionId, staffId } = req.params;
  try {
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (!competition.staffs.includes(staffId)) {
      return res
        .status(404)
        .json({ message: 'Staff not found in this competition' });
    }

    competition.staffs = competition.staffs.filter(
      (id) => id.toString() !== staffId
    );
    await competition.save();

    // Tìm Staff và xóa Competition khỏi danh sách competitions
    const staff = await Staff.findById(staffId);
    if (staff) {
      staff.competitions = staff.competitions.filter(
        (compId) => compId.toString() !== competitionId
      );
      await staff.save();
    }

    return res.json({
      message: 'Staff removed from competition successfully',
      competition,
    });
  } catch (error) {
    console.error('Error removing staff from unit:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeRewardFromCompetition = async (req, res) => {
  const { id: competitionId, rewardId } = req.params;

  try {
    // Tìm Competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Kiểm tra xem Reward có nằm trong Competition hay không
    if (!competition.rewards.includes(rewardId)) {
      return res.status(400).json({
        message: 'Reward not associated with this competition',
      });
    }

    // Xóa Reward khỏi danh sách rewards của Competition
    competition.rewards = competition.rewards.filter(
      (id) => id.toString() !== rewardId
    );
    await competition.save();

    // Tìm Reward và cập nhật liên kết Competition
    const reward = await Reward.findById(rewardId);
    if (reward) {
      if (
        reward.competition &&
        reward.competition.toString() === competitionId
      ) {
        reward.competition = null; // Xóa liên kết
        await reward.save();
      }
    }

    // Phản hồi JSON
    res.json({
      message: 'Reward removed from competition successfully',
      competition,
    });
  } catch (error) {
    console.error('Error removing reward from competition:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.addStaffToCompetition = async (req, res) => {
  const { id: competitionId, staffId } = req.params;

  try {
    // Tìm Competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Kiểm tra xem Staff đã có trong Competition chưa
    if (competition.staffs.includes(staffId)) {
      return res
        .status(400)
        .json({ message: 'Staff already added to this competition' });
    }

    // Thêm Staff vào danh sách Staffs của Competition
    competition.staffs.push(staffId);
    await competition.save();

    // Tìm Staff và cập nhật danh sách Competitions
    const staff = await Staff.findById(staffId);
    if (staff) {
      if (!staff.competitions.includes(competitionId)) {
        staff.competitions.push(competitionId);
        await staff.save();
      }
    }

    // Phản hồi JSON
    res.json({
      message: 'Staff added to competition successfully',
      competition,
    });
  } catch (error) {
    console.error('Error adding staff to competition:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addRewardToCompetition = async (req, res) => {
  const { id: competitionId, rewardId } = req.params;

  try {
    // Tìm Competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    // Tìm Reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Kiểm tra nếu Reward đã được liên kết với một Competition
    if (reward.competition && reward.competition.toString() !== competitionId) {
      return res.status(400).json({
        message: 'This reward is already linked to another competition',
      });
    }

    // Cập nhật Reward với Competition mới
    reward.competition = competitionId;
    await reward.save();

    // Thêm Reward vào danh sách rewards của Competition nếu chưa tồn tại
    if (!competition.rewards.includes(rewardId)) {
      competition.rewards.push(rewardId);
      await competition.save();
    }
    // Phản hồi JSON
    res.json({
      message: 'Reward added to competition successfully',
      competition,
      reward,
    });
  } catch (error) {
    console.error('Error adding staff to competition:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCompetitionStaffLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm cuộc thi dựa trên competitionId
    const competition = await Competition.findById(id).select('staffs');

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Lấy danh sách ID của các nhân viên đã tham gia cuộc thi
    const staffInCompetition = competition.staffs || [];

    // Tìm tất cả nhân viên chưa có trong cuộc thi
    const staffNotInCompetition = await Staff.find({
      _id: { $nin: staffInCompetition }, // Loại trừ các staff đã tham gia
    }).select('name mscb mainSpecialization');

    if (!staffNotInCompetition.length) {
      return res
        .status(404)
        .json({ message: 'No staff members available for this competition' });
    }

    // Trả về danh sách nhân viên chưa tham gia cuộc thi
    res.status(200).json(staffNotInCompetition);
  } catch (err) {
    console.error('Error fetching staff not in competition:', err.message);
    res.status(500).json({
      message: 'An error occurred while fetching staff not in competition',
    });
  }
};

exports.getCompetitionRewardLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm cuộc thi dựa trên competitionId
    const competition = await Competition.findById(id).select('rewards');

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Lấy danh sách ID của các nhân viên đã tham gia cuộc thi
    const rewardsInCompetition = competition.rewards || [];

    // Tìm tất cả các rewards chưa liên kết với bất kỳ Competition nào
    // Hoặc không thuộc Competition này
    const rewardsNotInCompetition = await Reward.find({
      $and: [
        { competition: null }, // Chưa liên kết với bất kỳ Competition nào
        { competition: { $ne: id } }, // Không thuộc Competition đang xét
      ],
    }).select('title date');

    if (!rewardsNotInCompetition.length) {
      return res
        .status(404)
        .json({ message: 'No reward members available for this competition' });
    }

    // Trả về danh sách nhân viên chưa tham gia cuộc thi
    res.status(200).json(rewardsNotInCompetition);
  } catch (err) {
    console.error('Error fetching reward not in competition:', err.message);
    res.status(500).json({
      message: 'An error occurred while fetching reward not in competition',
    });
  }
};

exports.getCompetitionRewardLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm cuộc thi dựa trên competitionId
    const competition = await Competition.findById(id).select('rewards');

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Lấy danh sách ID của các nhân viên đã tham gia cuộc thi
    const rewardsInCompetition = competition.rewards || [];

    // Tìm tất cả các rewards chưa liên kết với bất kỳ Competition nào
    // Hoặc không thuộc Competition này
    const rewardsNotInCompetition = await Reward.find({
      $and: [
        { competition: null }, // Chưa liên kết với bất kỳ Competition nào
        { competition: { $ne: id } }, // Không thuộc Competition đang xét
      ],
    }).select('title date');

    if (!rewardsNotInCompetition.length) {
      return res
        .status(404)
        .json({ message: 'No reward members available for this competition' });
    }

    // Trả về danh sách nhân viên chưa tham gia cuộc thi
    res.status(200).json(rewardsNotInCompetition);
  } catch (err) {
    console.error('Error fetching reward not in competition:', err.message);
    res.status(500).json({
      message: 'An error occurred while fetching reward not in competition',
    });
  }
};

// Export statistics of competitions

exports.exportCompetitionStatistics = async (req, res) => {
  try {
    let option = populateOptions('staffs rewards');
    const competitions = await findCustomWithPopulate({
      model: Competition,
      populateOptions: option,
    });

    // Chuẩn bị dữ liệu cho file XLSX
    const data = competitions.map((competition) => ({
      Year: competition.year,
      Title: competition.title,
      Description: competition.description,
      Staffs: competition.staffs.map((p) => p.name).join(', '),
      Rewards: competition.rewards.map((p) => p.title).join(', '),
    }));

    // Chuyển đổi dữ liệu JSON thành worksheet
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Thêm định dạng cho tiêu đề (header)
    const range = xlsx.utils.decode_range(worksheet['!ref']); // Lấy phạm vi của bảng
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col }); // Lấy ô tiêu đề
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: {
            bold: true, // In đậm
            italic: true, // In nghiêng
            sz: 12, // Kích thước chữ
            color: { rgb: 'FFFFFF' }, // Màu chữ trắng
          },
          fill: {
            fgColor: { rgb: '4F81BD' }, // Màu nền xanh
          },
          alignment: {
            horizontal: 'center', // Canh giữa
            vertical: 'center',
          },
        };
        worksheet[cellAddress].v = worksheet[cellAddress].v.toUpperCase(); // In hoa
      }
    }

    // Tạo workbook và thêm worksheet
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Competition Statistics');

    // Ghi file XLSX ra disk
    const filePath = path.join(
      __dirname,
      '..',
      'exports',
      'competition_statistics.xlsx'
    );
    xlsx.writeFile(workbook, filePath);

    // Gửi file XLSX về client
    res.download(filePath, 'competition_statistics.xlsx');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveCompetitions = async (req, res) => {
  try {
    const { staffId } = req.params;

    const user = await User.findById(staffId).populate('staff');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Find the staff member by ID
    const staff = await Staff.findById(user.staff.id).populate('competitions');
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Get the list of competition IDs the staff member has participated in
    const participatedCompetitionIds = staff.competitions.map(
      (comp) => comp._id
    );

    // Find active competitions where the staff member has not participated
    const activeCompetitions = await Competition.find({
      _id: { $nin: participatedCompetitionIds },
      year: { $gte: new Date().getFullYear() }, // Assuming the endDate field marks the end of the competition
    });

    res.status(200).json(activeCompetitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerStaff = async (req, res) => {
  try {
    const { competitionId, staffId } = req.params;

    // Find the competition by ID
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Find the staff member by ID
    const user = await User.findById(staffId).populate('staff');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Find the staff member by ID
    const staff = await Staff.findById(user.staff.id).populate('competitions');
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Check if the competition is still active
    if (new Date() > competition.endDate) {
      return res.status(400).json({ message: 'Competition has ended' });
    }

    // Register the staff member for the competition
    competition.registerStaff(staffId);

    staff.competitions.push(competition);
    await staff.save();

    // Save the competition with the updated staff list
    await competition.save();

    res
      .status(200)
      .json({ message: 'Staff registered for competition successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
