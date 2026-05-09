import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * ACETEL IAMS Local File Upload Service
 * Manages institutional document storage on local filesystem
 */

// Ensure root upload directory exists
const uploadRoot = path.resolve(env.UPLOAD_PATH);
if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        // Use user ID or 'anonymous' if not authenticated (though routes should be protected)
        const subDir = req.user?.id || 'public';
        const finalPath = path.join(uploadRoot, subDir);
        
        if (!fs.existsSync(finalPath)) {
            fs.mkdirSync(finalPath, { recursive: true });
        }
        
        cb(null, finalPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    }
});

/**
 * Multer instance with institutional constraints
 */
export const upload = multer({
    storage,
    limits: {
        fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to Bytes
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only PDF, JPG, and PNG files are allowed for institutional records.'));
    }
});

/**
 * Returns the relative storage path for DB storage
 */
export const getStoragePath = (file: Express.Multer.File): string => {
    // We store the relative path from the upload root to keep DB portable
    const subDir = path.basename(path.dirname(file.path));
    return path.join(subDir, file.filename);
};
