import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Course from '../models/Course.model';
import Application from '../models/Application.model';

dotenv.config();

/**
 * ACETEL IAMS Institutional Seed Script
 * Populates the system with mandatory test entities for Proxmox validation.
 */

const seedDatabase = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acetel_iams';
        await mongoose.connect(mongoURI);
        console.log('✅ ACETEL IAMS: Connected for institutional seeding');

        // 1. Purge Existing Data
        await Promise.all([
            User.deleteMany({}),
            Course.deleteMany({}),
            Application.deleteMany({})
        ]);
        console.log('🗑️  Cleared legacy records');

        // 2. Create System Admin
        const admin = await User.create({
            name: 'ACETEL Director',
            username: 'admin',
            email: 'director@acetel.edu.ng',
            password: 'adminpassword123',
            role: 'admin',
            status: 'active',
            mfaEnabled: false
        });
        console.log('✅ Created Administrator');

        // 3. Create Facilitators (MSc & PhD)
        const facilitators = [
            { name: 'Dr. John Edutech', username: 'john_edutech', email: 'john@acetel.edu.ng', specialization: 'Educational Technology' },
            { name: 'Prof. Alice CS', username: 'alice_cs', email: 'alice@acetel.edu.ng', specialization: 'Computer Science' },
            { name: 'Dr. Bob InfoSys', username: 'bob_is', email: 'bob@acetel.edu.ng', specialization: 'Information Systems' },
            { name: 'Dr. Sarah Edutech', username: 'sarah_edutech', email: 'sarah@acetel.edu.ng', specialization: 'Educational Technology' },
            { name: 'Prof. Dave CS', username: 'dave_cs', email: 'dave@acetel.edu.ng', specialization: 'Computer Science' }
        ];

        for (const f of facilitators) {
            await User.create({
                ...f,
                password: 'facilitator123',
                role: 'facilitator',
                status: 'active',
                department: f.specialization
            });
        }
        console.log('✅ Created 5 Facilitators');

        // 4. Create Staff Members
        for (let i = 1; i <= 5; i++) {
            await User.create({
                name: `Staff Member ${i}`,
                username: `staff${i}`,
                email: `staff${i}@acetel.edu.ng`,
                password: 'staffpassword123',
                role: 'staff',
                status: 'active',
                department: 'Registry'
            });
        }
        console.log('✅ Created 5 Staff Members');

        // 5. Create Courses
        const courses = [
            { title: 'Advanced Educational Technology', courseCode: 'EDT801', programme: 'MSc Educational Technology', level: 'Postgraduate', credits: 3, facilitator: 'Dr. John Edutech', semester: 'First', year: 1 },
            { title: 'Computer Science Research Methods', courseCode: 'CSC901', programme: 'PhD Computer Science', level: 'Doctoral', credits: 4, facilitator: 'Prof. Alice CS', semester: 'First', year: 1 },
            { title: 'Information Systems Strategy', courseCode: 'ISM805', programme: 'MSc Information Systems', level: 'Postgraduate', credits: 3, facilitator: 'Dr. Bob InfoSys', semester: 'Second', year: 1 },
            { title: 'Digital Learning Environments', courseCode: 'EDT902', programme: 'PhD Educational Technology', level: 'Doctoral', credits: 4, facilitator: 'Dr. Sarah Edutech', semester: 'First', year: 1 },
            { title: 'Advanced Algorithms', courseCode: 'CSC802', programme: 'MSc Computer Science', level: 'Postgraduate', credits: 3, facilitator: 'Prof. Dave CS', semester: 'Second', year: 1 }
        ];

        await Course.insertMany(courses);
        console.log('✅ Created 5 Academic Courses');

        // 6. Create Applications
        await Application.create({
            surname: 'Student',
            otherNames: 'Pending One',
            name: 'Pending One Student',
            email: 'pending@example.com',
            programme: 'MSc Computer Science',
            degreeHeld: 'BSc Computer Science',
            cgpa: 4.2,
            nationality: 'Nigeria',
            status: 'pending',
            appliedDate: new Date()
        });

        await Application.create({
            surname: 'Student',
            otherNames: 'Approved One',
            name: 'Approved One Student',
            email: 'approved@example.com',
            programme: 'PhD Educational Technology',
            degreeHeld: 'MSc Educational Technology',
            cgpa: 4.5,
            nationality: 'Ghana',
            status: 'approved',
            appliedDate: new Date(Date.now() - 86400000) // Yesterday
        });
        console.log('✅ Created 2 Sample Applications');

        console.log('\n🌟 SEEDING COMPLETE: ACETEL IAMS is ready for Proxmox validation.');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Institutional Seeding Failed:', error);
        process.exit(1);
    }
};

seedDatabase();
