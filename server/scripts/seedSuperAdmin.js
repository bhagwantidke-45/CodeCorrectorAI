import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://CodeCorrector:bhagwan451045@codecorrector.cbtv0uh.mongodb.net/?appName=CodeCorrector';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const email = 'bhagwantidke2004@gmail.com';
    const password = 'zxcvbnm';
    const name = 'Super Admin';
    const role = 'admin';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.password = password;
      existingUser.role = role;
      existingUser.name = name;
      existingUser.isActive = true;
      await existingUser.save();
      console.log(`Successfully updated ${email} in the database with password '${password}' and role '${role}'.`);
    } else {
      const newAdmin = await User.create({
        name,
        email,
        password,
        role,
        isActive: true,
      });
      console.log(`Created new super admin user: ${email} with password '${password}' and role '${role}'.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
