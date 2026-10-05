import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Called by the moodboard server (same VPS, localhost) to validate the access
// tokens that GET /timelines/:id/moodboard-token issues. The token itself is
// the credential, so no auth middleware here — an invalid token just gets 401.
router.post('/verify', (req, res) => {
  try {
    const payload = jwt.verify(req.body?.token || '', process.env.JWT_SECRET);
    if (payload.type !== 'moodboard') {
      return res.status(401).json({ valid: false });
    }
    res.json({
      valid: true,
      scope: payload.scope,
      boardId: payload.boardId || null,
      userId: payload.userId,
      name: payload.name || null
    });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
