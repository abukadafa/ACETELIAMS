import SystemConfig from '../models/SystemConfig.model';
import secretManagerService from './secret-manager.service';

export class ConfigService {
    private cache: Map<string, any> = new Map();
    private cacheTTL = 60000; // 1 minute
    private lastFetch: Map<string, number> = new Map();

    async get<T>(key: string, envFallback?: string): Promise<T> {
        const now = Date.now();
        const last = this.lastFetch.get(key) || 0;

        if (this.cache.has(key) && (now - last < this.cacheTTL)) {
            return this.cache.get(key) as T;
        }

        try {
            const config = await SystemConfig.findOne({ key });
            if (config) {
                this.cache.set(key, config.value);
                this.lastFetch.set(key, now);
                return config.value as T;
            }
        } catch (error) {
            console.error(`Error fetching config for ${key}:`, error);
        }

        // Fallback to Secure Secret Provider if provided
        if (envFallback) {
            const val = await secretManagerService.getSecret(envFallback);
            return (val as unknown) as T;
        }

        return null as unknown as T;
    }

    async set(key: string, value: any, userId: string): Promise<void> {
        await SystemConfig.findOneAndUpdate(
            { key },
            { value, updatedBy: userId },
            { upsert: true, new: true }
        );
        this.cache.set(key, value);
        this.lastFetch.set(key, Date.now());
    }

    /**
     * Helper for SMTP settings
     */
    async getSMTPConfig() {
        const dbConfig = await this.get<any>('smtp');
        if (dbConfig) return dbConfig;

        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            secure: process.env.SMTP_SECURE === 'true',
            from: process.env.SMTP_FROM || 'no-reply@acetel.edu.ng'
        };
    }
}

const configService = new ConfigService();
export default configService;
