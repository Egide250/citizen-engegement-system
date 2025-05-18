import mongoose from 'mongoose';
import User from '../models/User.js';


import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./server/.env') });


console.log("MONGO_URI:", process.env.MONGO_URI);
async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
    } else {
      const adminUser = new User({
        username: 'admin',
        password: 'admin123', // will be hashed automatically
        role: 'admin',
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.disconnect();
  }
}

createAdminUser();
