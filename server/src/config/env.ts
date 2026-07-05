import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Server
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    
    // Database
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').default('mongodb://localhost:27017/acetel_iams'),
    
    // Auth
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    
    // Frontend
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    CORS_ORIGIN: z.string().optional(),
    
    // Storage
    UPLOAD_PATH: z.string().default('/opt/acetel-iams/uploads'),
    BACKUP_DIR: z.string().default('/opt/acetel-iams/backups'),
    MAX_FILE_SIZE_MB: z.coerce.number().default(10),
    
    // Institutional
    LOGO_URL: z.string().url().default('https://acetel.nou.edu.ng/logo.png'),
    
    // Email (Optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
});

const validateEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
        process.exit(1);
    }
    
    return parsed.data;
};

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
