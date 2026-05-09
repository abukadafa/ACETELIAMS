import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class StorageService {
    private uploadDir: string;

    constructor() {
        this.uploadDir = path.resolve(env.UPLOAD_PATH);
        this.ensureDirectoryExists();
    }

    private ensureDirectoryExists() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Get the absolute path for a stored file
     */
    getFilePath(fileName: string): string {
        return path.join(this.uploadDir, fileName);
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(fileName: string): Promise<void> {
        const filePath = this.getFilePath(fileName);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    /**
     * Test if the storage directory is writable
     */
    async testConnection(): Promise<void> {
        try {
            const testFile = path.join(this.uploadDir, '.test-write');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
        } catch (error: any) {
            throw new Error(`Storage directory is not writable: ${error.message}`);
        }
    }
}

export default new StorageService();
