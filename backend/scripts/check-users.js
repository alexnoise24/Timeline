import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    
    console.log('\n=== ALL USERS ===');
    users.forEach(user => {
      console.log(`\nName: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`ID: ${user._id}`);
      console.log(`Invited Timelines: ${user.invitedTimelines.length}`);
      user.invitedTimelines.forEach(inv => {
        console.log(`  - Timeline: ${inv.timelineId}, Status: ${inv.status}`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
