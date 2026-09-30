import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOT under backend/uploads — that folder is served statically without auth.
// Documents are only reachable through the authenticated download endpoint.
export const documentsDir = path.join(__dirname, '../private_uploads/documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + '.pdf');
  }
});

// PDFs only (iOS sometimes reports PDFs as application/octet-stream)
const fileFilter = (req, file, cb) => {
  const extOk = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mimeOk = /application\/(pdf|octet-stream)/.test(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Only PDF files are allowed!'));
};

const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

export default uploadDocument;
