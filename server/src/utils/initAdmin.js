import User from '../models/User.js';

const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@quizzer.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('✅ Default admin account created successfully.');
    } else {
      // Force update password to ensure it is hashed properly
      // because seed.js used insertMany which skips pre-save hooks
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log('⚡ Admin account already exists. Password verified/hashed.');
    }
  } catch (error) {
    console.error('Failed to initialize admin account:', error.message);
  }
};

export default initAdmin;
