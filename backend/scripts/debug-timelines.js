import mongoose from 'mongoose';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import { MASTER_EMAIL } from '../config/constants.js';
import dotenv from 'dotenv';

dotenv.config();

const debugTimelines = async () => {
  try {
    console.log('🔍 Debugging Timeline Issues...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find master user
    const masterUser = await User.findOne({ email: MASTER_EMAIL });
    
    if (!masterUser) {
      console.error(`❌ Master user not found: ${MASTER_EMAIL}`);
      process.exit(1);
    }

    console.log('👑 Master User Info:');
    console.log(`   Email: ${masterUser.email}`);
    console.log(`   ID: ${masterUser._id}`);
    console.log(`   Role: ${masterUser.role}`);
    console.log(`   Plan: ${masterUser.current_plan}\n`);

    // Find all timelines
    const allTimelines = await Timeline.find();
    console.log(`📊 Total timelines in database: ${allTimelines.length}\n`);

    if (allTimelines.length === 0) {
      console.log('⚠️  No timelines found in database!');
      process.exit(0);
    }

    // Check each timeline
    console.log('🔍 Checking each timeline:\n');
    for (const timeline of allTimelines) {
      console.log(`Timeline: "${timeline.title}"`);
      console.log(`   _id: ${timeline._id}`);
      console.log(`   owner: ${timeline.owner}`);
      console.log(`   owner type: ${typeof timeline.owner}`);
      console.log(`   Match master? ${timeline.owner.toString() === masterUser._id.toString()}`);
      console.log(`   Events: ${timeline.events.length}`);
      console.log(`   Created: ${timeline.createdAt}\n`);
    }

    // Find timelines owned by master
    const masterTimelines = await Timeline.find({ owner: masterUser._id });
    console.log(`\n📋 Timelines owned by master user: ${masterTimelines.length}`);
    
    if (masterTimelines.length > 0) {
      console.log('✅ Master timelines found:');
      masterTimelines.forEach(t => {
        console.log(`   - ${t.title} (${t._id})`);
      });
    } else {
      console.log('❌ No timelines found with master as owner');
      console.log('\n🔧 Checking if timelines have different owner...');
      
      // Find who owns each timeline
      const uniqueOwners = [...new Set(allTimelines.map(t => t.owner.toString()))];
      console.log(`\nFound ${uniqueOwners.length} unique owners:`);
      
      for (const ownerId of uniqueOwners) {
        const owner = await User.findById(ownerId);
        const count = allTimelines.filter(t => t.owner.toString() === ownerId).length;
        console.log(`   - ${owner ? owner.email : 'Unknown'} (${ownerId}): ${count} timelines`);
      }
    }

    // Check invitedTimelines
    console.log(`\n📨 Invited Timelines for master: ${masterUser.invitedTimelines.length}`);
    if (masterUser.invitedTimelines.length > 0) {
      masterUser.invitedTimelines.forEach(inv => {
        console.log(`   - Timeline: ${inv.timelineId}, Status: ${inv.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

console.log('╔══════════════════════════════════════╗');
console.log('║   DEBUG TIMELINES - PHASE 1          ║');
console.log('║   Find Why Dashboard is Empty        ║');
console.log('╚══════════════════════════════════════╝\n');

debugTimelines()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });
