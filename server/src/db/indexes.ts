import mongoose from 'mongoose';

/**
 * Ensures all critical indexes are created in the database.
 * This should be called during application startup after DB connection.
 */
export const ensureIndexes = async () => {
    const db = mongoose.connection;

    console.log('🔍 Verifying database indexes...');

    const safeCreateIndex = async (
        collection: string,
        spec: Record<string, 1 | -1>,
        options: Record<string, any> = {}
    ) => {
        try {
            await db.collection(collection).createIndex(spec, options);
        } catch (error: any) {
            console.error(`⚠️  Skipped index on ${collection} (${JSON.stringify(spec)}):`, error.message);
        }
    };

    // Users collection
    await safeCreateIndex('users', { email: 1 }, { unique: true });
    await safeCreateIndex('users', { username: 1 }, { unique: true });
    await safeCreateIndex('users', { studentId: 1 }, { unique: true, sparse: true });
    await safeCreateIndex('users', { role: 1 });
    await safeCreateIndex('users', { createdAt: 1 });

    // Students collection
    await safeCreateIndex('students', { matricNo: 1 }, { unique: true, sparse: true });
    await safeCreateIndex('students', { email: 1 }, { unique: true, sparse: true });
    await safeCreateIndex('students', { instEmail: 1 }, { sparse: true });
    await safeCreateIndex('students', { status: 1 });
    await safeCreateIndex('students', { cohort: 1 });
    await safeCreateIndex('students', { programme: 1 });
    await safeCreateIndex('students', { cohort: 1, programme: 1 });
    await safeCreateIndex('students', { createdAt: 1 });

    // Applications collection
    await safeCreateIndex('applications', { email: 1 });
    await safeCreateIndex('applications', { status: 1 });
    await safeCreateIndex('applications', { programme: 1, status: 1 });
    await safeCreateIndex('applications', { cohort: 1 });
    await safeCreateIndex('applications', { appliedDate: -1 });
    await safeCreateIndex('applications', { status: 1, appliedDate: -1 });
    await safeCreateIndex('applications', { createdAt: -1 });

    // Alumni
    await safeCreateIndex('alumni', { cohort: 1 });
    await safeCreateIndex('alumni', { programme: 1 });
    await safeCreateIndex('alumni', { createdAt: 1 });

    // Academic courses (analytics / filters)
    await safeCreateIndex('academiccourses', { programme: 1 });
    await safeCreateIndex('academiccourses', { semester: 1 });
    await safeCreateIndex('academiccourses', { category: 1 });

    // AuditLogs collection
    await safeCreateIndex('auditlogs', { userId: 1, createdAt: -1 });
    await safeCreateIndex('auditlogs', { action: 1 });
    await safeCreateIndex('auditlogs', { resource: 1 });
    // TTL index for 2-year retention
    await safeCreateIndex('auditlogs', { createdAt: 1 }, { expireAfterSeconds: 63072000 });

    console.log('✅ Database indexes verified.');
};