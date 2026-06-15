import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    await mongoose.connection.collection('attempts').dropIndex('testId_1_studentId_1');
    console.log('Index testId_1_studentId_1 dropped successfully');
  } catch (error) {
    console.log('Error or index already dropped:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

dropIndex();
