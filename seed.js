const mongoose = require("mongoose");
const User = require("./models/userModel");
const Staff = require("./models/staffModel");
const Position = require("./models/posistionModel");
const UserRole = require("./models/enum/UserRole"); // Import your UserRole enum
const QualificationCode = require("./models/enum/QualificationCode"); // Import your QualificationCode enum
const Gender = require("./models/enum/Gender"); // Import your Gender enum
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

    const newPosition = new Position({
      title: "Lecturer",
    });

    await newPosition.save();

    // Create a new staff member
    const newStaff = new Staff({
      mscb: "12345",
      name: "Jane Doe",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1990-01-01"),
      phone: "0123456789",
      qualificationCode: QualificationCode.MASTER,
      isPermanent: true,
      startDate: new Date("2020-01-01"),
      mainSpecialization: "Computer Science",
      notes: "Senior Lecturer",
      positions: [newPosition],
    });

    await newStaff.save();

    // Create a new user associated with the staff member
    const newUser = new User({
      username: "jane.doe",
      password: "password123", // This will be hashed in the pre-save hook
      email: "example@domain.com",
      description:
        "Hi, I'm Alec Thompson, Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
      role: UserRole.LECTURER,
      staff: newStaff._id,
    });

    await newUser.save();

    console.log("Seed data created successfully");
  } catch (err) {
    console.error("Error creating seed data", err);
  } finally {
    mongoose.connection.close();
  }
};

createSeedData();
