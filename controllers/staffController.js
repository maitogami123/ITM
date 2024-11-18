const Staff = require('../models/staffModel');
const { calculateNextIncrementDate } = require('../utils/salaryIncrement');
const formatDate = require('../utils/formatDate');
const {
  findCustomWithPopulate,
  populateOptions,
} = require('../custom/CustomFinding');

// Create a new staff member
exports.createStaff = async (req, res) => {
  req.body.lastIncrementDate = req.body.startDate;
  const staff = new Staff(req.body);
  try {
    const newStaff = await staff.save();
    res
      .status(201)
      .json({ message: 'Staff member created successfully', staff: newStaff });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all staff members
// exports.getStaff = async (req, res) => {
//   try {
//     let option = populateOptions("positions unit rewards competitions");
//     const staffList = await findCustomWithPopulate({
//       model: Staff,
//       populateOptions: option,
//     });
//     res.json(staffList);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getStaffBasicInfo = async (req, res) => {
  try {
    const staffs = await Staff.find().select('mscb name');
    res.json(staffs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .select('-password')
      .populate('positions unit rewards competitions');
    if (!staff)
      return res.status(404).json({ message: 'Staff member not found' });
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
    if (!staff)
      return res.status(404).json({ message: 'Staff member not found' });

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
    staff.unit = unit || staff.unit;
    staff.rewards = rewards || staff.rewards;
    staff.competitions = competitions || staff.competitions;

    await staff.save();
    res.json({ message: 'Staff member updated successfully', staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a staff member by ID
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff)
      return res.status(404).json({ message: 'Staff member not found' });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List listSalaryIncrements
exports.listSalaryIncrements = async (req, res) => {
  try {
    const staffList = await Staff.find().populate('rewards');
    const salaryIncrements = staffList.map((staff) => {
      const nextIncrementDate = calculateNextIncrementDate(
        staff.qualificationCode,
        staff.lastIncrementDate,
        staff.rewards
      );
      return {
        mscb: staff.mscb,
        name: staff.name,
        qualificationCode: staff.qualificationCode,
        lastIncrementDate: formatDate(staff.lastIncrementDate),
        nextIncrementDate: formatDate(nextIncrementDate),
      };
    });
    res.json(salaryIncrements);
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
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build the search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for name
          { email: { $regex: `\\b${search}`, $options: 'i' } }, // case-insensitive search for email
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
    const populateOption = populateOptions(
      'positions unit rewards competitions'
    );

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
