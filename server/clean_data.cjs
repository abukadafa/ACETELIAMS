const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/acetel_iams';

async function cleanData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const targetCollections = [
            'applications',
            'students',
            'alumnis',
            'academiccourses',
            'courses',
            'academicevents',
            'notifications',
            'auditlogs',
            'systemauditlogs'
        ];
        
        console.log(`Cleaning ${targetCollections.length} target collections...`);
        
        for (const name of targetCollections) {
            const collections = await db.listCollections({ name }).toArray();
            if (collections.length > 0) {
                await db.collection(name).deleteMany({});
                console.log(`- Cleared ${name}`);
            } else {
                console.log(`- Skipped ${name} (not found)`);
            }
        }
        
        console.log('\n✅ DYNAMIC DATA CLEANED. System accounts and config preserved.');
        process.exit(0);
    } catch (err) {
        console.error('Clean failed:', err);
        process.exit(1);
    }
}

cleanData();
