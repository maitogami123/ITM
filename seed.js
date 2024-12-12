// const mongoose = require("mongoose");
// const User = require("./models/userModel");
// const Staff = require("./models/staffModel");
// const Position = require("./models/posistionModel");
// const UserRole = require("./models/enum/UserRole"); // Import your UserRole enum
// const QualificationCode = require("./models/enum/QualificationCode"); // Import your QualificationCode enum
// const Gender = require("./models/enum/Gender"); // Import your Gender enum
// const dotenv = require("dotenv");
// dotenv.config();

// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MongoDB", err);
//   });

// const createSeedData = async () => {
//   try {
//     // Clear the collections first
//     await User.deleteMany({});
//     await Staff.deleteMany({});
//     await Position.deleteMany({});

//     const newPosition = new Position({
//       title: "Lecturer",
//     });

//     await newPosition.save();

//     // Create a new staff member
//     const newStaff = new Staff({
//       mscb: "12345",
//       name: "Jane Doe",
//       gender: Gender.FEMALE,
//       dateOfBirth: new Date("1990-01-01"),
//       phone: "0123456789",
//       qualificationCode: QualificationCode.MASTER,
//       isPermanent: true,
//       startDate: new Date("2020-01-01"),
//       mainSpecialization: "Computer Science",
//       notes: "Senior Lecturer",
//       positions: [newPosition],
//     });

//     await newStaff.save();

//     // Create a new user associated with the staff member
//     const newUser = new User({
//       username: "jane.doe",
//       password: "password123", // This will be hashed in the pre-save hook
//       email: "example@domain.com",
//       description:
//         "Hi, I'm Alec Thompson, Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
//       role: UserRole.LECTURER,
//       staff: newStaff._id,
//     });

//     await newUser.save();

//     console.log("Seed data created successfully");
//   } catch (err) {
//     console.error("Error creating seed data", err);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// createSeedData();

const mongoose = require("mongoose");
const User = require("./models/userModel");
const Staff = require("./models/staffModel");
const Position = require("./models/posistionModel");
const Competition = require("./models/competitionModel");
const Unit = require("./models/unitModel");
const Reward = require("./models/rewardModel");
const UserRole = require("./models/enum/UserRole");
const QualificationCode = require("./models/enum/QualificationCode");
const Gender = require("./models/enum/Gender");
const TeacherGrade = require("./models/enum/TeacherGrade");
const dotenv = require("dotenv");
dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const createSeedData = async () => {
  try {
    // Clear the collections first
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Position.deleteMany({});
    await Competition.deleteMany({});
    await Reward.deleteMany({});
    await Unit.deleteMany({});
    // Create positions
    const positions = [
      "Lecturer",
      "Assistant",
      "Professor",
      "Researcher",
      "Dean",
    ];
    const savedPositions = await Promise.all(
      positions.map(async (title) => {
        const newPosition = new Position({ title });
        return await newPosition.save();
      })
    );

    const units = ["Unit 1", "Unit 2", "Unit 3"];
    const savedUnits = await Promise.all(
      units.map(async (name) => {
        const newUnit = new Unit({ name });
        return await newUnit.save();
      })
    );

    const users = [];
    const staffMembers = [];

    // Create staff members and users
    for (let i = 1; i <= 10; i++) {
      const newStaff = new Staff({
        mscb: `mscb-${i}`,
        name: `Staff ${i}`,
        gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
        dateOfBirth: new Date(`1990-0${i}-01`),
        phone: `012345678${i}`,
        qualificationCode: QualificationCode.MASTER,
        isPermanent: i % 2 === 0,
        startDate: new Date(`2020-01-0${i}`),
        mainSpecialization: "Computer Science",
        notes: "Nhân viên chính thức",
        positions: [savedPositions[i % savedPositions.length]],
        unit: savedUnits[i % savedUnits.length]._id,
        teacherGrade: TeacherGrade.GRADE_I,
      });

      await newStaff.save();
      staffMembers.push(newStaff);

      const newUser = new User({
        username: `user${i}`,
        password: "password123",
        email: `user${i}@domain.com`,
        description: `User ${i} description.`,
        role: UserRole.LECTURER,
        staff: newStaff._id,
      });

      await newUser.save();
      users.push(newUser);
    }

    for (let unit of savedUnits) {
      unit.staffs = staffMembers
        .filter((staff) => staff.unit.toString() === unit._id.toString())
        .map((staff) => staff._id);
      await unit.save();
    }

    // Create competitions
    const researchProjects = [
      {
        title: "Project 1",
        description: "Description for project 1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      },
      {
        title: "Project 2",
        description: "Description for project 2",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
      },
      {
        title: "Project 3",
        description: "Description for project 3",
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-12-31"),
      },
    ];

    const competitions = ["Competition 1", "Competition 2", "Competition 3"];
    const savedCompetitions = await Promise.all(
      competitions.map(async (title, index) => {
        const newCompetition = new Competition({
          title,
          year: 2024 - index,
          description: `Description for ${title}`,
          projects: researchProjects,
          staffs: staffMembers.map((staff) => staff._id),
          status: index === 2 ? "ended" : "ongoing",
        });
        return await newCompetition.save();
      })
    );

    const endedCompetition = savedCompetitions.find(
      (c) => c.status === "ended"
    );
    if (endedCompetition) {
      const newReward = new Reward({
        title: "Reward for Competition 3",
        user: users[Math.floor(Math.random() * users.length)]._id,
        competition: endedCompetition._id,
      });
      await newReward.save(); // Assign reward to a random user
      endedCompetition.rewards.push(newReward._id);
      await endedCompetition.save();
    }

    console.log("Seed data created successfully");
  } catch (err) {
    console.error("Error creating seed data", err);
  } finally {
    mongoose.connection.close();
  }
};

createSeedData();
