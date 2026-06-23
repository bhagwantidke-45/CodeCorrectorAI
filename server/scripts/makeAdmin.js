import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Set password of test@example.com to Password123 and promote to admin
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      testUser.password = 'Password123';
      testUser.role = 'admin';
      await testUser.save();
      console.log('Successfully updated test@example.com password to Password123 and role to admin');
    } else {
      const newAdmin = await User.create({
        name: 'Test Admin',
        email: 'test@example.com',
        password: 'Password123',
        role: 'admin',
      });
      console.log('Created test@example.com as admin with password Password123');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
