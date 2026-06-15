import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { startCronJobs } from './jobs/examJobs.js';
import initAdmin from './utils/initAdmin.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // Initialize Admin
  initAdmin();
  
  // Start Background Jobs
  startCronJobs();
  
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
