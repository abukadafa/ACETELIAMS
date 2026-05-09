
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/acetel-iams';

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- Collections ---');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }

        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
        const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const students = await Student.find({}).limit(10).lean();
        const applications = await Application.find({}).limit(10).lean();
        const users = await User.find({}).limit(5).lean();

        console.log('\n--- Sample Students ---');
        students.forEach(s => console.log(`Name: ${s.name}, Email: ${s.email}, Status: ${s.status}`));

        console.log('\n--- Sample Applications ---');
        applications.forEach(a => console.log(`Name: ${a.name}, Email: ${a.email}, Status: ${a.status}`));

        console.log('\n--- Sample Users ---');
        users.forEach(u => console.log(`Name: ${u.name}, Role: ${u.role}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
