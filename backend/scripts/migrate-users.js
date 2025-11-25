import mongoose from 'mongoose';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import { MASTER_EMAIL, ROLES, PLANS, TRIAL_DURATION_DAYS } from '../config/constants.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to add role and trial fields to existing users
 * This script is SAFE and NON-DESTRUCTIVE
 * It only ADDS new fields, never removes or modifies existing data
 */

const migrateUsers = async () => {
  try {
    console.log('🚀 Starting user migration...');
    console.log('📊 Connecting to database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find();
    console.log(`\n📋 Found ${users.length} users to migrate`);

    let masterCount = 0;
    let creatorCount = 0;
    let guestCount = 0;
    let alreadyMigratedCount = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);

      // Check if user already has the new fields (already migrated)
      if (user.current_plan !== undefined && user.current_plan !== null) {
        console.log(`   ⏭️  User already migrated, skipping...`);
        alreadyMigratedCount++;
        continue;
      }

      // Check if this is the MASTER user
      if (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
        console.log(`   👑 MASTER USER detected!`);
        
        // Count timelines owned by master
        const timelinesCount = await Timeline.countDocuments({ owner: user._id });
        console.log(`   📊 Master owns ${timelinesCount} timelines`);

        user.role = ROLES.MASTER;
        user.current_plan = PLANS.MASTER;
        user.is_trial_active = true; // Always active for master
        user.trial_start_date = null; // No trial needed
        user.trial_end_date = null; // No expiration
        user.is_payment_required = false; // Never required
        user.plan_start_date = user.createdAt;
        user.plan_expiration_date = null; // Never expires

        await user.save();
        console.log(`   ✅ Master user migrated successfully`);
        masterCount++;
        continue;
      }

      // For other existing users, check their current role
      if (user.role === 'photographer' || user.role === 'creator') {
        // Existing creators/photographers
        console.log(`   🎨 Existing ${user.role} detected`);
        
        // Count timelines owned
        const timelinesCount = await Timeline.countDocuments({ owner: user._id });
        console.log(`   📊 User owns ${timelinesCount} timelines`);

        // Keep their role as creator (photographer is equivalent)
        if (user.role === 'photographer') {
          user.role = ROLES.CREATOR;
        }

        // Give them a grace period - activate trial from now
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

        user.trial_start_date = now;
        user.trial_end_date = trialEnd;
        user.is_trial_active = true;
        user.current_plan = PLANS.TRIAL;
        user.is_payment_required = false; // Will be true after trial ends
        user.plan_start_date = now;
        user.plan_expiration_date = trialEnd;

        await user.save();
        console.log(`   ✅ Creator migrated with ${TRIAL_DURATION_DAYS}-day trial`);
        console.log(`   ⏰ Trial expires: ${trialEnd.toLocaleDateString()}`);
        creatorCount++;
      } else {
        // Guest users
        console.log(`   👥 Guest user detected`);
        
        user.role = ROLES.GUEST;
        user.current_plan = PLANS.NONE;
        user.is_trial_active = false;
        user.trial_start_date = null;
        user.trial_end_date = null;
        user.is_payment_required = false; // Guests don't need plans
        user.plan_start_date = null;
        user.plan_expiration_date = null;

        await user.save();
        console.log(`   ✅ Guest user migrated`);
        guestCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users processed: ${users.length}`);
    console.log(`👑 Master users: ${masterCount}`);
    console.log(`🎨 Creators (with trial): ${creatorCount}`);
    console.log(`👥 Guests: ${guestCount}`);
    console.log(`⏭️  Already migrated: ${alreadyMigratedCount}`);
    console.log('='.repeat(50));

    // Verification - count timelines by master
    const masterUser = await User.findOne({ email: MASTER_EMAIL });
    if (masterUser) {
      const masterTimelines = await Timeline.countDocuments({ owner: masterUser._id });
      console.log(`\n✅ VERIFICATION: Master user has ${masterTimelines} timelines`);
      console.log(`✅ Master user role: ${masterUser.role}`);
      console.log(`✅ Master user plan: ${masterUser.current_plan}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('💾 All data preserved, only new fields added');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run migration
console.log('╔══════════════════════════════════════╗');
console.log('║   USER MIGRATION SCRIPT - PHASE 1    ║');
console.log('║   Safe & Non-Destructive Migration   ║');
console.log('╚══════════════════════════════════════╝\n');

migrateUsers()
  .then(() => {
    console.log('\n✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
