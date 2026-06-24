import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const email = 'bhagwantidke2004@gmail.com';
const password = 'zxcvbnm';
const name = 'Super Admin';
const role = 'admin';

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://CodeCorrector:bhagwan451045@codecorrector.cbtv0uh.mongodb.net/?appName=CodeCorrector';
    
    // Connect to the cluster
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB cluster');

    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    const dbNames = dbList.databases.map(d => d.name);
    console.log('Available databases on cluster:', dbNames);

    // Schema definition for User
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String },
      role: { type: String, default: 'user' },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true, collection: 'users' });

    // Loop through each database and update the user
    for (const dbName of dbNames) {
      // Skip system databases
      if (['admin', 'local', 'config'].includes(dbName)) continue;

      console.log(`Processing database: ${dbName}...`);
      
      // Create connection to the specific database
      const dbConnection = mongoose.connection.useDb(dbName);
      
      // Define model on the connection
      const UserModel = dbConnection.model('User', userSchema);

      const userDoc = await UserModel.findOne({ email });
      if (userDoc) {
        // We need to hash the password properly using bcrypt since the pre-save hook is on the original model
        // Or we can just import bcryptjs and hash it directly
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(12);
        const hashedPassword = await bcrypt.default.hash(password, salt);

        userDoc.password = hashedPassword;
        userDoc.role = role;
        userDoc.name = name;
        userDoc.isActive = true;
        await userDoc.save();
        console.log(`✅ Successfully updated user in database [${dbName}]: Role set to '${role}'.`);
      } else {
        // If user doesn't exist, create one
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(12);
        const hashedPassword = await bcrypt.default.hash(password, salt);

        await UserModel.create({
          name,
          email,
          password: hashedPassword,
          role,
          isActive: true
        });
        console.log(`✅ Created new user in database [${dbName}]: Email='${email}', Role='${role}'.`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
