import mongoose from 'mongoose';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import { MASTER_EMAIL, ROLES, PLANS } from '../config/constants.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to fix/update master user to correct values
 */

const fixMasterUser = async () => {
  try {
    console.log('🔧 Fixing Master User Configuration...');
    console.log('📊 Connecting to database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find master user
    const masterUser = await User.findOne({ email: MASTER_EMAIL });
    
    if (!masterUser) {
      console.error(`❌ Master user not found with email: ${MASTER_EMAIL}`);
      process.exit(1);
    }

    console.log(`👑 Found master user: ${masterUser.email}`);
    console.log(`📋 Current values:`);
    console.log(`   - role: ${masterUser.role}`);
    console.log(`   - current_plan: ${masterUser.current_plan}`);
    console.log(`   - is_trial_active: ${masterUser.is_trial_active}`);
    console.log(`   - is_payment_required: ${masterUser.is_payment_required}`);

    // Count timelines
    const timelinesCount = await Timeline.countDocuments({ owner: masterUser._id });
    console.log(`   - Owns ${timelinesCount} timelines\n`);

    // Update to master values
    console.log('🔄 Updating to master configuration...');
    
    masterUser.role = ROLES.MASTER;
    masterUser.current_plan = PLANS.MASTER;
    masterUser.is_trial_active = true; // Always active
    masterUser.trial_start_date = null; // No trial needed
    masterUser.trial_end_date = null; // Never expires
    masterUser.is_payment_required = false; // Never required
    masterUser.plan_start_date = masterUser.createdAt;
    masterUser.plan_expiration_date = null; // Never expires

    await masterUser.save();

    console.log('✅ Master user updated successfully!\n');
    console.log(`📋 New values:`);
    console.log(`   - role: ${masterUser.role} ✓`);
    console.log(`   - current_plan: ${masterUser.current_plan} ✓`);
    console.log(`   - is_trial_active: ${masterUser.is_trial_active} ✓`);
    console.log(`   - is_payment_required: ${masterUser.is_payment_required} ✓`);
    console.log(`   - trial_end_date: ${masterUser.trial_end_date} (null = never expires) ✓`);
    console.log(`   - plan_expiration_date: ${masterUser.plan_expiration_date} (null = never expires) ✓`);

    // Verify timelines are intact
    const timelinesAfter = await Timeline.countDocuments({ owner: masterUser._id });
    console.log(`\n📊 Verification:`);
    console.log(`   - Timelines before: ${timelinesCount}`);
    console.log(`   - Timelines after: ${timelinesAfter}`);
    console.log(`   - Data preserved: ${timelinesCount === timelinesAfter ? '✅ YES' : '❌ NO'}`);

    console.log('\n🎉 Master user configuration fixed successfully!');
    console.log('👑 You now have unlimited access to all features');
    
  } catch (error) {
    console.error('❌ Failed to fix master user:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run fix
console.log('╔══════════════════════════════════════╗');
console.log('║   FIX MASTER USER - PHASE 1          ║');
console.log('║   Update Master Configuration        ║');
console.log('╚══════════════════════════════════════╝\n');

fixMasterUser()
  .then(() => {
    console.log('\n✅ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
