import mongoose from 'mongoose';

/**
 * Ensures all critical indexes are created in the database.
 * This should be called during application startup after DB connection.
 */
export const ensureIndexes = async () => {
    const db = mongoose.connection;
    
    console.log('🔍 Verifying database indexes...');
    
    try {
        // Users collection
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('users').createIndex({ studentId: 1 }, { unique: true, sparse: true });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ createdAt: 1 });

        // Students collection
        await db.collection('students').createIndex({ matricNo: 1 }, { unique: true, sparse: true });
        await db.collection('students').createIndex({ email: 1 }, { sparse: true });
        await db.collection('students').createIndex({ instEmail: 1 }, { sparse: true });
        await db.collection('students').createIndex({ status: 1 });
        await db.collection('students').createIndex({ cohort: 1 });
        await db.collection('students').createIndex({ programme: 1 });
        await db.collection('students').createIndex({ cohort: 1, programme: 1 });
        await db.collection('students').createIndex({ createdAt: 1 });

        // Applications collection
        await db.collection('applications').createIndex({ email: 1 });
        await db.collection('applications').createIndex({ status: 1 });
        await db.collection('applications').createIndex({ programme: 1, status: 1 });
        await db.collection('applications').createIndex({ cohort: 1 });
        await db.collection('applications').createIndex({ appliedDate: -1 });
        await db.collection('applications').createIndex({ status: 1, appliedDate: -1 });
        await db.collection('applications').createIndex({ createdAt: -1 });

        // Alumni
        await db.collection('alumni').createIndex({ cohort: 1 });
        await db.collection('alumni').createIndex({ programme: 1 });
        await db.collection('alumni').createIndex({ createdAt: 1 });

        // Academic courses (analytics / filters)
        await db.collection('academiccourses').createIndex({ programme: 1 });
        await db.collection('academiccourses').createIndex({ semester: 1 });
        await db.collection('academiccourses').createIndex({ category: 1 });

        // AuditLogs collection
        await db.collection('auditlogs').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('auditlogs').createIndex({ action: 1 });
        await db.collection('auditlogs').createIndex({ resource: 1 });
        // TTL index for 2-year retention as requested in Part 2B, Step 5
        // 2 years = 63072000 seconds
        await db.collection('auditlogs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

        console.log('✅ Database indexes verified successfully.');
    } catch (error) {
        console.error('❌ Failed to ensure database indexes:', error);
        // We don't exit the process here, but it's a warning
    }
};
