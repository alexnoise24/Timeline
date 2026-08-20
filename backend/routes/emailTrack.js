import express from 'express';
import EmailLog from '../models/EmailLog.js';

const router = express.Router();

// GIF transparente de 1×1
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// TEMP DEBUG (2026-08-19): diagnóstico del registro de token FCM en iOS.
// El cliente reporta etapas del arranque; solo console.log (visible en pm2).
// Eliminar cuando el push quede verificado.
router.get('/debug/:stage', (req, res) => {
  console.log(`🐛 [FCM-DEBUG] ${new Date().toISOString()} ${req.params.stage} | ua: ${(req.headers['user-agent'] || '').slice(0, 80)}`);
  res.status(204).end();
});

// GET /api/email-track/:trackingId(.png) — pixel de apertura.
// Público y sin auth: lo carga el cliente de correo del destinatario.
// Siempre responde el pixel, aunque el id no exista (no filtra información).
router.get('/:trackingId', (req, res) => {
  const trackingId = req.params.trackingId.replace(/\.png$/, '');

  // Fire-and-forget: nunca retrasar la respuesta del pixel
  EmailLog.findOneAndUpdate(
    { trackingId },
    {
      $inc: { openCount: 1 },
      $set: { lastOpenedAt: new Date() },
      $min: { openedAt: new Date() } // solo la primera vez (campo ausente)
    }
  ).catch(err => console.error('Email track error:', err));

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': PIXEL.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.send(PIXEL);
});

export default router;
