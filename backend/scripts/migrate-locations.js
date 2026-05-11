import mongoose from 'mongoose';
import Timeline from '../models/Timeline.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: populate locationsList from existing location/locationUrl fields
 * SAFE and NON-DESTRUCTIVE — only adds locationsList, never removes anything
 */
const migrateLocations = async () => {
  try {
    console.log('🚀 Starting locations migration...');

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-timeline';
    await mongoose.connect(uri);
    console.log('✅ Connected to database');

    const timelines = await Timeline.find({});
    console.log(`📊 Found ${timelines.length} timelines`);

    let migrated = 0;
    let skipped = 0;

    for (const timeline of timelines) {
      // Only migrate if locationsList is empty and there's existing location data
      if (timeline.locationsList && timeline.locationsList.length > 0) {
        skipped++;
        continue;
      }

      if (timeline.location && timeline.location.trim() !== '') {
        timeline.locationsList = [{
          name: timeline.location,
          url: timeline.locationUrl || ''
        }];
        await timeline.save();
        migrated++;
        console.log(`  ✅ Migrated: "${timeline.title}" → "${timeline.location}"`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📈 Migration complete:`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped (no location or already migrated): ${skipped}`);

    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateLocations();
