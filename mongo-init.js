/**
 * ACETEL IAMS Database Initialization Script
 * Runs on first MongoDB startup to configure institutional collections and security
 */

db = db.getSiblingDB('admin');

// Authenticate as root (if already running with auth)
// db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

// Create the institutional database
db = db.getSiblingDB('acetel_iams');

// Create Application User
db.createUser({
  user: 'acetel_app',
  pwd: 'SECURE_PASSWORD_REPLACE_ME', // Will be overridden if provided via env during first run
  roles: [
    { role: 'readWrite', db: 'acetel_iams' }
  ]
});

// Create Collections with basic structures
db.createCollection('users');
db.createCollection('students');
db.createCollection('courses');
db.createCollection('applications');
db.createCollection('auditlogs');
db.createCollection('notifications');

// Apply Unique Indexes (Idempotent)
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ studentId: 1 }, { unique: true, sparse: true });

db.students.createIndex({ studentId: 1 }, { unique: true, sparse: true });
db.students.createIndex({ matricNo: 1 }, { unique: true, sparse: true });
db.students.createIndex({ email: 1 }, { unique: true, sparse: true });

db.courses.createIndex({ courseCode: 1 }, { unique: true });

db.applications.createIndex({ studentId: 1, status: 1 });
db.applications.createIndex({ email: 1 });

// TTL Index for Audit Logs (2 years)
db.auditlogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

console.log('✅ ACETEL IAMS: Database initialization complete.');
