const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const positionRoutes = require('./routes/positionRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const staffRoutes = require('./routes/staffRoutes');
const unitRoutes = require('./routes/unitRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const app = express();
const port = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/unit', unitRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
