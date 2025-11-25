import mongoose from 'mongoose';
import User from '../models/User.js';
import { MASTER_EMAIL } from '../config/constants.js';
import { generateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const testAuthMe = async () => {
  try {
    console.log('🔍 Testing /auth/me endpoint simulation...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find master user
    const masterUser = await User.findOne({ email: MASTER_EMAIL });
    
    if (!masterUser) {
      console.error(`❌ Master user not found: ${MASTER_EMAIL}`);
      process.exit(1);
    }

    console.log('👑 Master User from Database:');
    console.log(`   Email: ${masterUser.email}`);
    console.log(`   Role: ${masterUser.role}`);
    console.log(`   Plan: ${masterUser.current_plan}`);
    console.log(`   ID: ${masterUser._id}\n`);

    // Test what toJSON returns
    console.log('📋 What toJSON() returns:');
    const jsonUser = masterUser.toJSON();
    console.log(JSON.stringify(jsonUser, null, 2));
    console.log('');

    // Generate a new token
    const newToken = generateToken(masterUser._id);
    console.log('🔑 New Token Generated:');
    console.log(newToken);
    console.log('');

    // Test login response simulation
    console.log('📤 What /auth/login should return:');
    const loginResponse = {
      message: 'Login successful',
      token: newToken,
      user: masterUser.toJSON()
    };
    console.log(JSON.stringify(loginResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

console.log('╔══════════════════════════════════════╗');
console.log('║   TEST AUTH/ME ENDPOINT              ║');
console.log('║   Verify User Data Return            ║');
console.log('╚══════════════════════════════════════╝\n');

testAuthMe()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
