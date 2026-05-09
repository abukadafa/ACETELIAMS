import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import Student from '../models/Student.model';
import Application from '../models/Application.model';
import { env } from '../config/env';

const seed = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('🌱 Connected to MongoDB for seeding...');

        // 1. Create Super Admin
        const adminEmail = 'admin@acetel.edu.ng';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const admin = new User({
                name: 'Super Admin',
                username: 'admin',
                email: adminEmail,
                password: 'adminpassword123', // Should be changed after first login
                role: 'admin',
                status: 'enrolled',
                mfaEnabled: false,
            });
            await admin.save();
            console.log('✅ Super Admin created.');
        } else {
            console.log('ℹ️ Super Admin already exists.');
        }

        // 2. Create Staff Accounts
        const staffEmails = ['staff1@acetel.edu.ng', 'staff2@acetel.edu.ng'];
        for (const email of staffEmails) {
            const exists = await User.findOne({ email });
            if (!exists) {
                const user = new User({
                    name: `Staff ${email.split('@')[0]}`,
                    username: email.split('@')[0],
                    email,
                    password: 'staffpassword123',
                    role: 'staff',
                    status: 'enrolled',
                    mfaEnabled: false,
                });
                await user.save();
                console.log(`✅ Staff ${email} created.`);
            }
        }

        // 3. Create Facilitator Accounts
        const facilitatorEmails = ['facilitator1@acetel.edu.ng', 'facilitator2@acetel.edu.ng'];
        for (const email of facilitatorEmails) {
            const exists = await User.findOne({ email });
            if (!exists) {
                const user = new User({
                    name: `Facilitator ${email.split('@')[0]}`,
                    username: email.split('@')[0],
                    email,
                    password: 'facilitatorpassword123',
                    role: 'facilitator',
                    status: 'enrolled',
                    mfaEnabled: false,
                    expertise: 'Information Technology',
                    dept: 'Computer Science'
                });
                await user.save();
                console.log(`✅ Facilitator ${email} created.`);
            }
        }

        // 4. Create sample Student profiles
        const studentData = [
            { matricNo: 'ACETEL/2024/001', name: 'John Doe', email: 'john.doe@example.com', programme: 'MSc Cybersecurity' },
            { matricNo: 'ACETEL/2024/002', name: 'Jane Smith', email: 'jane.smith@example.com', programme: 'MSc Artificial Intelligence' },
        ];

        for (const data of studentData) {
            const exists = await Student.findOne({ matricNo: data.matricNo });
            if (!exists) {
                const student = new Student({
                    ...data,
                    status: 'Active',
                    level: 100,
                    semester: 1
                });
                await student.save();

                // Create user account for student
                const user = new User({
                    name: data.name,
                    username: data.matricNo.replace(/\//g, '_'),
                    email: data.email,
                    password: 'studentpassword123',
                    role: 'student',
                    status: 'enrolled',
                    studentId: String(student._id)
                });
                await user.save();
                console.log(`✅ Student ${data.matricNo} and user account created.`);
            }
        }

        console.log('🚀 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
