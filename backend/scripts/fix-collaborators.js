import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Timeline from '../models/Timeline.js';
import User from '../models/User.js';

dotenv.config();

async function fixCollaborators() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with accepted invitations
    const users = await User.find({
      'invitedTimelines.status': 'accepted'
    });

    console.log(`Found ${users.length} users with accepted invitations`);

    for (const user of users) {
      for (const invite of user.invitedTimelines) {
        if (invite.status === 'accepted') {
          const timeline = await Timeline.findById(invite.timelineId);
          
          if (!timeline) {
            console.log(`⚠️ Timeline ${invite.timelineId} not found`);
            continue;
          }

          // Check if user is already a collaborator
          const alreadyCollaborator = timeline.collaborators.some(
            collab => collab.user.toString() === user._id.toString()
          );

          if (!alreadyCollaborator) {
            // Add user to collaborators
            timeline.collaborators.push({
              user: user._id,
              role: 'editor',
              addedAt: new Date()
            });
            await timeline.save();
            console.log(`✅ Added ${user.email} to timeline "${timeline.title}"`);
          } else {
            console.log(`ℹ️ ${user.email} already in "${timeline.title}"`);
          }
        }
      }
    }

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCollaborators();
