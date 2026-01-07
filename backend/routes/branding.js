import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { isMaster } from '../config/constants.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/branding');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp, svg)'));
  }
});

// Check if user can use branding (Studio plan or Master)
const canUseBranding = (user) => {
  return isMaster(user) || user.current_plan === 'studio';
};

// Get branding settings
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!canUseBranding(user)) {
      return res.status(403).json({ 
        message: 'Custom branding solo disponible para plan Studio',
        requires_plan: 'studio'
      });
    }

    res.json({
      branding: user.branding || {
        enabled: false,
        studioName: null,
        logo: null,
        accentColor: null,
        subdomain: null,
        emailFooter: null
      }
    });
  } catch (error) {
    console.error('Error getting branding:', error);
    res.status(500).json({ message: 'Error al obtener configuración de branding' });
  }
});

// Update branding settings
router.put('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!canUseBranding(user)) {
      return res.status(403).json({ 
        message: 'Custom branding solo disponible para plan Studio',
        requires_plan: 'studio'
      });
    }

    const { enabled, studioName, accentColor, subdomain, emailFooter } = req.body;

    // Validate subdomain if provided
    if (subdomain) {
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        return res.status(400).json({ 
          message: 'El subdominio solo puede contener letras minúsculas, números y guiones' 
        });
      }

      // Check if subdomain is already taken
      const existingUser = await User.findOne({ 
        'branding.subdomain': subdomain,
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Este subdominio ya está en uso' });
      }
    }

    // Update branding
    user.branding = {
      ...user.branding,
      enabled: enabled !== undefined ? enabled : user.branding?.enabled,
      studioName: studioName !== undefined ? studioName : user.branding?.studioName,
      accentColor: accentColor !== undefined ? accentColor : user.branding?.accentColor,
      subdomain: subdomain !== undefined ? subdomain : user.branding?.subdomain,
      emailFooter: emailFooter !== undefined ? emailFooter : user.branding?.emailFooter,
    };

    await user.save();

    res.json({ 
      message: 'Branding actualizado correctamente',
      branding: user.branding 
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ message: 'Error al actualizar branding' });
  }
});

// Upload logo
router.post('/logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!canUseBranding(user)) {
      return res.status(403).json({ 
        message: 'Custom branding solo disponible para plan Studio',
        requires_plan: 'studio'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó imagen' });
    }

    // Delete old logo if exists
    if (user.branding?.logo) {
      const oldLogoPath = path.join(__dirname, '..', user.branding.logo.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Save new logo URL
    const logoUrl = `/uploads/branding/${req.file.filename}`;
    
    if (!user.branding) {
      user.branding = {};
    }
    user.branding.logo = logoUrl;
    await user.save();

    res.json({ 
      message: 'Logo subido correctamente',
      logo: logoUrl 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Error al subir logo' });
  }
});

// Delete logo
router.delete('/logo', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.branding?.logo) {
      const logoPath = path.join(__dirname, '..', user.branding.logo.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      user.branding.logo = null;
      await user.save();
    }

    res.json({ message: 'Logo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Error al eliminar logo' });
  }
});

// Get branding by subdomain (public)
router.get('/subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const user = await User.findOne({ 
      'branding.subdomain': subdomain,
      'branding.enabled': true
    });

    if (!user) {
      return res.status(404).json({ message: 'Subdomain no encontrado' });
    }

    res.json({
      studioName: user.branding.studioName,
      logo: user.branding.logo,
      accentColor: user.branding.accentColor,
      ownerId: user._id
    });
  } catch (error) {
    console.error('Error getting branding by subdomain:', error);
    res.status(500).json({ message: 'Error al obtener branding' });
  }
});

export default router;
