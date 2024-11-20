const Competition = require("../models/competitionModel");
const Staff = require("../models/staffModel");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");
const {
  findCustomWithPopulate,
  populateOptions,
} = require("../custom/CustomFinding");

// Create a new competition
exports.createCompetition = async (req, res) => {
  const competition = new Competition(req.body);
  try {
    const newCompetition = await competition.save();
    res.status(201).json({
      message: "Competition created successfully",
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
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: `\\b${search}`, $options: "i" } }, // case-insensitive search for name
          { year: { $regex: `^${search}`, $options: "i" } }, // case-insensitive search for email
        ],
      };
    }

    // Pagination and sorting options
    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === "asc" ? 1 : -1 },
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
      "rewards staffs"
    );
    if (!competition)
      return res.status(404).json({ message: "Competition not found" });
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
      return res.status(404).json({ message: "Competition not found" });

    competition.year = year || competition.year;
    competition.title = title || competition.title;
    competition.description = description || competition.description;
    competition.projects = projects || competition.projects;
    competition.staffs = staffs || competition.staffs;
    competition.rewards = rewards || competition.rewards;

    await competition.save();
    res.json({ message: "Competition updated successfully", competition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a competition by ID
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition)
      return res.status(404).json({ message: "Competition not found" });
    res.json({ message: "Competition deleted successfully" });
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
      return res.status(404).json({ message: "Competition not found" });

    competition.projects.push({ title, description, startDate, endDate });
    await competition.save();
    res.json({ message: "Project added successfully", competition });
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
      return res.status(404).json({ message: "Competition not found" });

    competition.projects.remove(projectId).remove();
    await competition.save();
    res.json({ message: "Project removed successfully", competition });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeStaffFromCompetition = async (req, res) => {
  const { id: competitionId, staffId } = req.params;
  try {
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (!competition.staffs.includes(staffId)) {
      return res
        .status(404)
        .json({ message: "Staff not found in this competition" });
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
      message: "Staff removed from competition successfully",
      competition,
    });
  } catch (error) {
    console.error("Error removing staff from unit:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addStaffToCompetition = async (req, res) => {
  const { id: competitionId, staffId } = req.params;

  try {
    // Tìm Competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Kiểm tra xem Staff đã có trong Competition chưa
    if (competition.staffs.includes(staffId)) {
      return res
        .status(400)
        .json({ message: "Staff already added to this competition" });
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
      message: "Staff added to competition successfully",
      competition,
    });
  } catch (error) {
    console.error("Error adding staff to competition:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCompetitionStaffLess = async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm cuộc thi dựa trên competitionId
    const competition = await Competition.findById(id).select("staffs");

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Lấy danh sách ID của các nhân viên đã tham gia cuộc thi
    const staffInCompetition = competition.staffs || [];

    // Tìm tất cả nhân viên chưa có trong cuộc thi
    const staffNotInCompetition = await Staff.find({
      _id: { $nin: staffInCompetition }, // Loại trừ các staff đã tham gia
    }).select("name mscb mainSpecialization");

    if (!staffNotInCompetition.length) {
      return res
        .status(404)
        .json({ message: "No staff members available for this competition" });
    }

    // Trả về danh sách nhân viên chưa tham gia cuộc thi
    res.status(200).json(staffNotInCompetition);
  } catch (err) {
    console.error("Error fetching staff not in competition:", err.message);
    res.status(500).json({
      message: "An error occurred while fetching staff not in competition",
    });
  }
};

// Export statistics of competitions
exports.exportCompetitionStatistics = async (req, res) => {
  try {
    let option = populateOptions("staffs");
    const competitions = await findCustomWithPopulate({
      model: Competition,
      populateOptions: option,
    });
    // Prepare data for CSV export
    const data = competitions.map((competition) => ({
      year: competition.year,
      title: competition.title,
      description: competition.description,
      staffs: competition.staffs.map((p) => p.name).join(", "),
    }));

    // Define fields for CSV
    const fields = ["year", "title", "description", "staffs"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    // Write CSV to file
    const filePath = path.join(
      __dirname,
      "..",
      "exports",
      "competition_statistics.csv"
    );
    fs.writeFileSync(filePath, csv);

    // Send file as response
    res.download(filePath, "competition_statistics.csv");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
