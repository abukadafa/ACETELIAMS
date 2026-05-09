const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/acetel_iams';

async function resetDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log(`Found ${collections.length} collections. Purging...`);
        
        for (const collection of collections) {
            await db.collection(collection.name).deleteMany({});
            console.log(`- Cleared ${collection.name}`);
        }
        
        console.log('\n✅ ALL DATA DELETED SUCCESSFULLY.');
        process.exit(0);
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
}

resetDB();
