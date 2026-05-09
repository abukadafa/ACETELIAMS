// mongo-init.js
const adminDb = db.getSiblingDB('admin');

// Create root user if not exists
// Note: MONGO_INITDB_ROOT_USERNAME/PASSWORD handles this automatically, 
// but we ensure the app database and user are set up correctly.

const appDb = db.getSiblingDB('acetel_iams');

// Create app user
appDb.createUser({
  user: 'acetel_app',
  pwd: 'change-me-in-production', // Should be passed via env if possible, but mongo-init.js has limitations with env vars unless processed
  roles: [{ role: 'readWrite', db: 'acetel_iams' }]
});

// Create collections with initial indexes
appDb.createCollection('users');
appDb.collection('users').createIndex({ email: 1 }, { unique: true });
appDb.collection('users').createIndex({ username: 1 }, { unique: true });

appDb.createCollection('students');
appDb.collection('students').createIndex({ studentId: 1 }, { unique: true, sparse: true });
appDb.collection('students').createIndex({ email: 1 }, { unique: true, sparse: true });

appDb.createCollection('courses');
appDb.collection('courses').createIndex({ courseCode: 1 }, { unique: true });

appDb.createCollection('applications');
appDb.collection('applications').createIndex({ studentId: 1, status: 1 });

appDb.createCollection('auditlogs');
appDb.collection('auditlogs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years TTL

console.log('✅ MongoDB initialization completed successfully.');
