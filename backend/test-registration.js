import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRegistration() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔄 Testing user creation...');
    const testUser = new User({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'test123'
    });
    
    await testUser.save();
    console.log('✅ User created successfully');
    
    // Clean up
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test user deleted');
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  }
}

testRegistration();
