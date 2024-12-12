const Staff = require("../models/staffModel");
const Unit = require("../models/unitModel");
const User = require("../models/userModel");
const { calculateNextIncrementDate } = require("../utils/salaryIncrement");
const formatDate = require("../utils/formatDate");
const mongoose = require("mongoose");
const {
  findCustomWithPopulate,
  populateOptions,
} = require("../custom/CustomFinding");
const XLSX = require("xlsx");
const userModel = require("../models/userModel");
const TeacherGrade = require("../models/enum/TeacherGrade");

// Create a new staff member
exports.createStaff = async (req, res) => {
  try {
    // Kiểm tra mã ngạch hợp lệ
    if (!Object.values(TeacherGrade).includes(req.body.teacherGrade)) {
      return res.status(400).json({ message: "Mã ngạch không hợp lệ" });
    }

    req.body.lastIncrementDate = req.body.startDate;
    const staff = new Staff(req.body);
    const newStaff = await staff.save();

    const unit = await Unit.findById(req.body.unit);
    if (unit) {
      unit.staffs.push(newStaff);
      await unit.save();
    }

    res.status(201).json({
      message: "Tạo giảng viên thành công",
      staff: newStaff,
    });
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
    const availableStaff = allStaff.filter(
      (staff) => !linkedStaffIds.includes(staff._id.toString())
    );

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
    teacherGrade,
  } = req.body;
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ message: "Staff member not found" });

    // Validate teacherGrade if it's being updated
    if (teacherGrade && !Object.values(TeacherGrade).includes(teacherGrade)) {
      return res.status(400).json({ message: "Mã ngạch không hợp lệ" });
    }

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
    staff.teacherGrade = teacherGrade || staff.teacherGrade;

    if (unit && staff.unit !== unit) {
      await Unit.findByIdAndUpdate(
        staff.unit,
        { $pull: { staffs: new mongoose.Types.ObjectId(req.params.id) } },
        { new: true }
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
    if (!staff)
      return res.status(404).json({ message: "Staff member not found" });

    // Ensure teacherGrade exists before updating unit
    if (!staff.teacherGrade) {
      return res
        .status(400)
        .json({ message: "Giảng viên chưa được phân ngạch" });
    }

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
    // First find the staff to get the unit reference before deletion
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // If staff has a unit, remove staff from unit's staffs array
    if (staff.unit) {
      await Unit.findByIdAndUpdate(
        staff.unit,
        { $pull: { staffs: staff._id } },
        { new: true }
      );
    }

    // Now delete the staff
    await Staff.findByIdAndDelete(req.params.id);

    res.json({ message: "Staff member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List listSalaryIncrements
exports.listSalaryIncrements = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: "i" } },
          { mscb: { $regex: `\\b${search}`, $options: "i" } },
          { qualificationCode: { $regex: `\\b${search}`, $options: "i" } },
        ],
      };
    }

    const options = {
      skip: (page - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: order === "asc" ? 1 : -1 },
    };

    const populateOption = populateOptions("rewards");

    const staffList = await findCustomWithPopulate({
      model: Staff.find(filter, null, options),
      populateOptions: populateOption,
    });

    const total = await Staff.countDocuments(filter);

    const salaryIncrements = await Promise.all(
      staffList.map(async (staff) => {
        const nextIncrementDate = calculateNextIncrementDate(
          staff.teacherGrade,
          staff.lastIncrementDate,
          staff.rewards
        );

        // Calculate remaining time
        const today = new Date();
        const nextDate = new Date(nextIncrementDate);
        const remainingMonths = Math.max(
          0,
          Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24 * 30.44))
        );

        return {
          mscb: staff.mscb,
          name: staff.name,
          qualificationCode: staff.qualificationCode,
          teacherGrade: staff.teacherGrade,
          salaryLevel: staff.salaryLevel,
          salaryCoefficent: staff.salaryCoefficent,
          salary: staff.salary,
          lastIncrementDate:
            staff.lastIncrementDate &&
            new Date(staff.lastIncrementDate).toLocaleDateString("vi-VN"),
          nextIncrementDate:
            nextIncrementDate &&
            new Date(nextIncrementDate).toLocaleDateString("vi-VN"),
          remainingMonths: remainingMonths,
          rewardsCount:
            staff.rewards?.filter((r) => r.type === "REWARD").length || 0,
          competitionsCount:
            staff.rewards?.filter((r) => r.type === "COMPETITION").length || 0,
        };
      })
    );

    res.json({
      total,
      page: parseInt(page),
      search: search,
      sortBy: sortBy,
      order: order,
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      data: salaryIncrements,
    });
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

    const nextIncrementDate = calculateNextIncrementDate(
      staff.qualificationCode,
      staff.lastIncrementDate,
      staff.rewards
    );

    if (!staff.lastIncrementDate) {
      staff.lastIncrementDate = new Date().toLocaleDateString().split("T")[0];
      await staff.save();
    }

    const salaryIncrementStatus = {
      mscb: staff.mscb,
      name: staff.name,
      qualificationCode: staff.qualificationCode,
      lastIncrementDate: new Date(staff.lastIncrementDate)
        .toLocaleDateString()
        .split("T")[0],
      nextIncrementDate: new Date(nextIncrementDate)
        .toLocaleDateString()
        .split("T")[0],
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
    const populateOption = [
      populateOptions("positions"),
      populateOptions("unit"),
      populateOptions("rewards"),
      populateOptions("competitions"),
      populateOptions("user"), // Populate user
    ];

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
    const staffWithoutUnit = await Staff.find({ unit: null }).select(
      "name mscb"
    );

    if (!staffWithoutUnit.length) {
      // Nếu không có kết quả, trả về thông báo
      return res
        .status(404)
        .json({ message: "No staff members without unit found" });
    }

    // Trả về danh sách
    res.status(200).json(staffWithoutUnit);
  } catch (err) {
    // Log lỗi chi tiết để debug nếu cần
    console.error("Error fetching staff without unit:", err.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching staff without unit" });
  }
};

exports.exportSalaryIncrementsToExcel = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: "i" } },
          { mscb: { $regex: `\\b${search}`, $options: "i" } },
          { qualificationCode: { $regex: `\\b${search}`, $options: "i" } },
        ],
      };
    }

    const staffList = await Staff.find(filter).populate("rewards");

    const salaryIncrements = await Promise.all(
      staffList.map(async (staff, index) => {
        const nextIncrementDate = calculateNextIncrementDate(
          staff.qualificationCode,
          staff.lastIncrementDate,
          staff.rewards
        );

        return {
          STT: index + 1,
          "Mã số cán bộ": staff.mscb,
          "Họ và tên": staff.name,
          "Mã năng lực": staff.qualificationCode,
          "Ngày cuối tăng lương":
            staff.lastIncrementDate &&
            new Date(staff.lastIncrementDate).toLocaleDateString("vi-VN"),
          "Ngày tiếp theo tăng lương":
            nextIncrementDate &&
            new Date(nextIncrementDate).toLocaleDateString("vi-VN"),
        };
      })
    );

    // Tạo worksheet và thêm dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(salaryIncrements);

    // Định dạng tiêu đề in đậm
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
      };
    }

    // Định dạng cột STT in đậm
    for (let R = 1; R <= range.e.r; ++R) {
      const sttCellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (worksheet[sttCellAddress]) {
        worksheet[sttCellAddress].s = {
          font: { bold: true },
        };
      }
    }

    // Tạo workbook và thêm worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Increments");

    // Ghi workbook vào buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true, // Đảm bảo hỗ trợ cell styles
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SalaryIncrements.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to calculate reduced promotion date
const calculateReducedPromotionDate = (
  baseDate,
  rewards = [],
  competitions = []
) => {
  let reducedDate = new Date(baseDate);

  // Reduce 3 months for each reward
  const rewardReduction = rewards.length * 3;

  // Reduce 1 month for each competition
  const competitionReduction = competitions.length;

  // Total reduction in months
  const totalReductionMonths = rewardReduction + competitionReduction;

  // Apply reduction
  reducedDate.setMonth(reducedDate.getMonth() - totalReductionMonths);

  return reducedDate;
};

// Cập nhật ngạch giảng viên
exports.updateTeacherGrade = async (req, res) => {
  try {
    const { teacherGrade } = req.body;
    const staff = await Staff.findById(req.params.id).populate(
      "rewards competitions"
    );

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    // Kiểm tra mã ngạch hợp lệ
    if (!Object.values(TeacherGrade).includes(teacherGrade)) {
      return res.status(400).json({ message: "Mã ngạch không hợp lệ" });
    }

    // Cập nhật mã ngạch và reset về bậc 1
    staff.teacherGrade = teacherGrade;
    staff.salaryLevel = 1;

    // Calculate base promotion date based on grade
    const today = new Date();
    let basePromotionDate;
    switch (teacherGrade) {
      case TeacherGrade.GRADE_I:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 5)
        );
        break;
      case TeacherGrade.GRADE_II:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 3)
        );
        break;
      case TeacherGrade.GRADE_III:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 2)
        );
        break;
      default:
        basePromotionDate = today;
    }

    // Calculate reduced promotion date based on rewards and competitions
    staff.nextPromotionDate = calculateReducedPromotionDate(
      basePromotionDate,
      staff.rewards,
      staff.competitions
    );

    // Lưu thay đổi (middleware sẽ tự động tính toán hệ số và lương)
    await staff.save();

    res.json({
      message: "Cập nhật mã ngạch thành công",
      staff: {
        teacherGrade: staff.teacherGrade,
        salaryLevel: staff.salaryLevel,
        salaryCoefficent: staff.salaryCoefficent,
        salary: staff.salary,
        nextPromotionDate: staff.nextPromotionDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Nâng bậc lương
exports.promoteSalaryLevel = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate(
      "rewards competitions"
    );

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    // Kiểm tra giới hạn bậc theo ngạch
    const maxLevel = {
      [TeacherGrade.GRADE_I]: 6,
      [TeacherGrade.GRADE_II]: 8,
      [TeacherGrade.GRADE_III]: 9,
    }[staff.teacherGrade];

    if (staff.salaryLevel >= maxLevel) {
      return res.status(400).json({ message: "Đã đạt bậc lương tối đa" });
    }

    // Kiểm tra thời gian nâng bậc
    const today = new Date();
    const nextPromotionDate = new Date(staff.nextPromotionDate);

    if (today < nextPromotionDate) {
      return res.status(400).json({
        message: "Chưa đến thời gian nâng bậc lương",
        nextPromotionDate: nextPromotionDate.toLocaleDateString("vi-VN"),
      });
    }

    // Tăng bậc lương
    staff.salaryLevel += 1;

    // Calculate new base promotion date
    let basePromotionDate;
    switch (staff.teacherGrade) {
      case TeacherGrade.GRADE_I:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 5)
        );
        break;
      case TeacherGrade.GRADE_II:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 3)
        );
        break;
      case TeacherGrade.GRADE_III:
        basePromotionDate = new Date(
          today.setFullYear(today.getFullYear() + 2)
        );
        break;
      default:
        basePromotionDate = today;
    }

    // Calculate reduced promotion date based on rewards and competitions
    staff.nextPromotionDate = calculateReducedPromotionDate(
      basePromotionDate,
      staff.rewards,
      staff.competitions
    );

    // Lưu thay đổi (middleware sẽ tự động tính toán hệ số và lương)
    await staff.save();

    res.json({
      message: "Nâng bậc lương thành công",
      staff: {
        teacherGrade: staff.teacherGrade,
        salaryLevel: staff.salaryLevel,
        salaryCoefficent: staff.salaryCoefficent,
        salary: staff.salary,
        nextPromotionDate: staff.nextPromotionDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy thông tin lương của giảng viên
exports.getSalaryInfo = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    const maxLevel = {
      [TeacherGrade.GRADE_I]: 6,
      [TeacherGrade.GRADE_II]: 8,
      [TeacherGrade.GRADE_III]: 9,
    }[staff.teacherGrade];

    res.json({
      teacherGrade: staff.teacherGrade,
      salaryLevel: staff.salaryLevel,
      maxSalaryLevel: maxLevel,
      salaryCoefficent: staff.salaryCoefficent,
      salary: staff.salary,
      nextPromotionDate: staff.nextPromotionDate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Giảm bậc lương
exports.demoteSalaryLevel = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    // Kiểm tra bậc lương tối thiểu
    if (staff.salaryLevel <= 1) {
      return res.status(400).json({ message: "Đã đạt bậc lương tối thiểu" });
    }

    // Giảm bậc lương
    staff.salaryLevel -= 1;

    // Lưu thay đổi (middleware sẽ tự động tính toán hệ số và lương)
    await staff.save();

    res.json({
      message: "Giảm bậc lương thành công",
      staff: {
        teacherGrade: staff.teacherGrade,
        salaryLevel: staff.salaryLevel,
        salaryCoefficent: staff.salaryCoefficent,
        salary: staff.salary,
        nextPromotionDate: staff.nextPromotionDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
