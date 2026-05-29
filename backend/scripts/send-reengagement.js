/**
 * Sends a reengagement email to users whose plan expired in the last 60 days.
 * Each email contains a one-click link that extends their plan 30 days (Studio).
 *
 * Run: node scripts/send-reengagement.js
 * Dry run (no emails sent): node scripts/send-reengagement.js --dry-run
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendReengagementEmail } from '../services/email.js';

const DRY_RUN = process.argv.includes('--dry-run');

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-timeline');

const now = new Date();
const sixtyDaysAgo = new Date(now);
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

const users = await User.find({
  role: { $in: ['photographer', 'creator', 'planner'] },
  plan_expiration_date: { $lt: now, $gt: sixtyDaysAgo }
}).select('name email current_plan plan_expiration_date');

console.log(`Found ${users.length} expired users\n`);

let sent = 0;
let skipped = 0;

for (const user of users) {
  const token = jwt.sign(
    { userId: user._id.toString(), type: 'reengagement' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const extendUrl = `https://lenzu.app/api/auth/extend-plan?token=${token}`;

  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}→ ${user.name} <${user.email}> (expired: ${user.plan_expiration_date?.toLocaleDateString('es-MX')})`);
  if (DRY_RUN) {
    console.log(`  Link: ${extendUrl}\n`);
    skipped++;
    continue;
  }

  await sendReengagementEmail(user, token);
  sent++;
  // Small delay to avoid Gmail rate limits
  await new Promise(r => setTimeout(r, 800));
}

console.log(`\nDone. Sent: ${sent} | Skipped (dry run): ${skipped}`);
await mongoose.disconnect();
