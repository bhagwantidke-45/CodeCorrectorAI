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
    const user = await User.findOne({ email });
    if (user) {
      console.log('User found in DB:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('IsActive:', user.isActive);
    } else {
      console.log(`User ${email} NOT found in DB.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
