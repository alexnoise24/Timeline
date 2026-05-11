/**
 * send-beta-reminder.js
 *
 * Sends the "beta ends in 5 days" email to all active beta users
 * (current_plan: 'studio', role !== 'master').
 *
 * Scheduled to run once on May 3, 2026 via server cron.
 * Safe to dry-run: pass --dry-run to log recipients without sending.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendBetaEndReminderEmail } from '../services/email.js';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

async function sendBetaReminders() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');
  console.log(DRY_RUN ? '🔍 DRY RUN — no se enviarán emails' : '📧 Enviando emails...');
  console.log('');

  // Beta users: studio plan, not master
  const users = await User.find({
    current_plan: 'studio',
    role: { $ne: 'master' }
  }).select('name email current_plan role').lean();

  console.log(`📋 Usuarios beta encontrados: ${users.length}`);
  console.log('');

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    if (DRY_RUN) {
      console.log(`  → ${user.name} <${user.email}>`);
      continue;
    }

    try {
      await sendBetaEndReminderEmail(user);
      console.log(`  ✅ ${user.name} <${user.email}>`);
      sent++;
      // Small delay to avoid hitting Gmail rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ❌ ${user.name} <${user.email}>:`, err.message);
      failed++;
    }
  }

  console.log('');
  console.log('══════════════════════════════════════');
  if (DRY_RUN) {
    console.log(`Destinatarios que recibirían el email: ${users.length}`);
    console.log('Ejecuta sin --dry-run para enviar.');
  } else {
    console.log(`Enviados:  ${sent}`);
    console.log(`Fallidos:  ${failed}`);
  }
  console.log('══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

sendBetaReminders().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
