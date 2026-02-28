import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer uses memory storage for processing with Sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image/.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

export const uploadInspiration = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB before compression
  fileFilter
});

export const processInspirationImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const timelineId = req.params.id;
  const uploadsDir = path.join(__dirname, `../uploads/inspiration/${timelineId}`);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `insp-${uniqueSuffix}.webp`;
  const thumbFilename = `thumb-${uniqueSuffix}.webp`;
  
  try {
    // Compressed full image (max 1920px, quality 80%)
    await sharp(req.file.buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(uploadsDir, filename));
    
    // Thumbnail (300px, quality 70%)
    await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(path.join(uploadsDir, thumbFilename));
    
    req.processedImage = {
      imageUrl: `/uploads/inspiration/${timelineId}/${filename}`,
      thumbnailUrl: `/uploads/inspiration/${timelineId}/${thumbFilename}`,
      originalName: req.file.originalname
    };
    
    next();
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
};

export default { uploadInspiration, processInspirationImage };
