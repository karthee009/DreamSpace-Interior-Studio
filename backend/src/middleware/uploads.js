
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const uploadPath = path.resolve(process.cwd(), env.uploadDir);
const catalogueUploadPath = path.join(uploadPath, 'catalogue');

fs.mkdirSync(uploadPath, { recursive: true });
fs.mkdirSync(catalogueUploadPath, { recursive: true });

const allowed = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

function imageFilter(_req, file, cb) {
  if (!allowed.has(file.mimetype)) {
    return cb(
      new Error('Only JPEG, PNG, and WebP images are allowed.')
    );
  }

  cb(null, true);
}

function createStorage(destination) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },

    filename: (_req, file, cb) => {
      const extension = extensionByMime[file.mimetype] || '';
      cb(null, `${crypto.randomUUID()}${extension}`);
    }
  });
}

// Existing room photo upload configuration
export const roomPhotosUpload = multer({
  storage: createStorage(uploadPath),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 8
  },
  fileFilter: imageFilter
});

// New catalogue image upload configuration
export const catalogueImageUpload = multer({
  storage: createStorage(catalogueUploadPath),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  },
  fileFilter: imageFilter
});

export { uploadPath, catalogueUploadPath };
