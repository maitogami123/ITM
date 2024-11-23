const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 30000, // Thời gian chờ kết nối (30 giây)
      serverSelectionTimeoutMS: 5000, // Thời gian chọn server (5 giây)
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
