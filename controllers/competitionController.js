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
  try {
    const { id, staffId } = req.params;
    const competition = await Competition.findByIdAndUpdate(
      id,
      { $pull: { staffs: new mongoose.Types.ObjectId(staffId) } },
      { new: true } // Return the updated document
    );

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    staff.competitions = staff.competitions.filter(
      (id) => !id.equals(competition._id)
    );
    await staff.save();

    return res.json({
      message: "Staff member removed from competition successfully",
    });
  } catch (error) {
    console.error("Error removing staff from unit:", error);
    res.status(500).json({ message: error.message });
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
