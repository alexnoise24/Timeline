/**
 * clean-orphan-invitations.js
 *
 * Limpia entradas huérfanas en user.invitedTimelines[]:
 * entradas que apuntan a timelines donde el usuario ya NO está
 * en timeline.collaborators[].
 *
 * Modo seco (DRY RUN) por defecto — pasa --execute para aplicar cambios.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Timeline from '../models/Timeline.js';
import User from '../models/User.js';

dotenv.config();

const DRY_RUN = !process.argv.includes('--execute');

async function cleanOrphanInvitations() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');
  console.log(DRY_RUN ? '🔍 MODO DRY RUN — no se modificará nada' : '⚠️  MODO EJECUTAR — aplicando cambios');
  console.log('');

  // Usuarios que tienen al menos una entrada en invitedTimelines
  const users = await User.find({ 'invitedTimelines.0': { $exists: true } });
  console.log(`📋 Usuarios con invitedTimelines[]: ${users.length}`);

  let totalOrphans = 0;
  let usersAffected = 0;

  for (const user of users) {
    const orphans = [];

    for (const invite of user.invitedTimelines) {
      const timelineId = invite.timelineId?.toString();
      if (!timelineId) {
        orphans.push(invite);
        continue;
      }

      const timeline = await Timeline.findById(timelineId).select('collaborators title').lean();

      if (!timeline) {
        // Timeline eliminado — entrada huérfana
        orphans.push(invite);
        console.log(`  ⚠️  ${user.email} → timeline ${timelineId} (no existe en BD)`);
        continue;
      }

      const isCollaborator = timeline.collaborators.some(
        c => c.user?.toString() === user._id.toString()
      );

      if (!isCollaborator) {
        orphans.push(invite);
        console.log(`  🚫 ${user.email} → "${timeline.title}" (no está en collaborators[])`);
      }
    }

    if (orphans.length > 0) {
      totalOrphans += orphans.length;
      usersAffected++;

      if (!DRY_RUN) {
        const orphanIds = orphans.map(o => o._id.toString());
        user.invitedTimelines = user.invitedTimelines.filter(
          inv => !orphanIds.includes(inv._id.toString())
        );
        await user.save();
        console.log(`  ✅ ${user.email}: ${orphans.length} entrada(s) eliminada(s)`);
      }
    }
  }

  console.log('');
  console.log('══════════════════════════════════════');
  console.log(`Entradas huérfanas encontradas: ${totalOrphans}`);
  console.log(`Usuarios afectados:             ${usersAffected}`);
  if (DRY_RUN && totalOrphans > 0) {
    console.log('');
    console.log('Para aplicar los cambios ejecuta:');
    console.log('  node --experimental-vm-modules backend/scripts/clean-orphan-invitations.js --execute');
  }
  console.log('══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

cleanOrphanInvitations().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
