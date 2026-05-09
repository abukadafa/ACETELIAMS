import { Response } from 'express';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Get all users (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user by ID (Admin/Facilitator)
export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user (Admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { username, password, programmes, facilitatorCourses, ...updates } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle username update with uniqueness check
        if (username && username !== user.username) {
            const existing = await User.findOne({ username: username.toLowerCase() });
            if (existing) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            user.username = username;
        }

        // Handle password update
        if (password) {
            user.password = password;
        }

        // Handle programmes update
        if (programmes) {
            user.programmes = programmes;
        }

        if (facilitatorCourses !== undefined && user.role === 'facilitator') {
            (user as any).facilitatorCourses = facilitatorCourses;
        }

        // Handle other updates explicitly to prevent mass assignment (D5)
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email.toLowerCase();
        if (updates.status && req.user!.role === 'admin') user.status = updates.status;
        if (updates.studentId) user.studentId = updates.studentId;
        if (updates.department !== undefined) (user as any).department = updates.department;
        if (updates.specialization !== undefined) (user as any).specialization = updates.specialization;
        if (updates.phone !== undefined) (user as any).phone = updates.phone;
        if (updates.nationality !== undefined) (user as any).nationality = updates.nationality;

        // Strictly protect role updates (D3)
        if (updates.role && req.user!.role === 'admin') {
            const validRoles = ['student', 'facilitator', 'admin'];
            if (validRoles.includes(updates.role)) {
                user.role = updates.role;
            }
        }

        await user.save();

        const { password: _, ...userResponse } = user.toObject();
        res.json(userResponse);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create single user (Admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role, programmes, studentId, department, specialization, phone, facilitatorCourses } = req.body;

        // Generate username from email if not provided
        let username = req.body.username;
        if (!username && email) {
            username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }
        if (!username) {
            return res.status(400).json({ message: 'Username or email is required' });
        }

        // Make username unique if it already exists
        let finalUsername = username;
        const existingByUsername = await User.findOne({ username: finalUsername });
        if (existingByUsername) {
            finalUsername = `${username}_${Date.now().toString(36)}`;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const userData: any = {
            name,
            username: finalUsername,
            email,
            password: password || 'Welcome123',
            role: role || 'student',
            programmes: programmes || [],
            status: role === 'facilitator' ? 'active' : 'enrolled',
            department: department || undefined,
            specialization: specialization || undefined,
            phone: phone || undefined,
            facilitatorCourses: facilitatorCourses || [],
        };

        if (studentId && studentId.trim() !== '') {
            userData.studentId = studentId.trim();
        }

        const user = new User(userData);

        await user.save();
        const { password: _, ...userResponse } = user.toObject();
        res.status(201).json(userResponse);
    } catch (error: any) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `Duplicate entry: ${field} already exists` });
        }
        res.status(500).json({ message: error.message || 'Server error', error: error.message });
    }
};

// Bulk create users (Admin only)
export const bulkCreateUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { users, defaultPassword } = req.body;

        if (!Array.isArray(users)) {
            return res.status(400).json({ message: 'Users must be an array' });
        }

        const results = {
            created: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const userData of users) {
            try {
                // Generate username from email if missing
                if (!userData.username && userData.email) {
                    userData.username = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
                }
                if (!userData.username) {
                    results.failed++;
                    results.errors.push(`User missing username and email`);
                    continue;
                }

                // Check if user exists by email first
                const existingByEmail = await User.findOne({ email: userData.email });
                if (existingByEmail) {
                    results.failed++;
                    results.errors.push(`User with email ${userData.email} already exists`);
                    continue;
                }

                // Make username unique
                let finalUsername = userData.username;
                const existingByUsername = await User.findOne({ username: finalUsername });
                if (existingByUsername) {
                    finalUsername = `${userData.username}_${Date.now().toString(36)}`;
                }

                const userPayload: any = {
                    ...userData,
                    username: finalUsername,
                    programmes: userData.programmes || (userData.programme ? [userData.programme] : []),
                    password: userData.password || defaultPassword || 'Welcome123',
                    status: userData.role === 'facilitator' ? 'active' : 'enrolled',
                    mustChangePassword: true
                };

                if (!userPayload.studentId || (typeof userPayload.studentId === 'string' && userPayload.studentId.trim() === '')) {
                    delete userPayload.studentId;
                }

                const user = new User(userPayload);

                await user.save();
                results.created++;
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Error creating ${userData.username || userData.email}: ${err.message}`);
            }
        }

        res.status(201).json(results);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get public statistics for landing page
export const getPublicStats = async (_req: any, res: Response) => {
    try {
        const Student = (await import('../models/Student.model')).default;

        const totalStudents = await Student.countDocuments();

        // Aggregate by nationality
        const nationalities = await Student.aggregate([
            { $match: { nationality: { $exists: true, $ne: '' } } },
            { $group: { _id: '$nationality', count: { $sum: 1 } } },
            { $project: { country: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        res.json({ totalStudents, nationalities });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

