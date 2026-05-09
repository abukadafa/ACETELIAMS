import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IFacilitatorCourseAssignment {
    courseCode: string;
    programme: string;
    semester: number;
    category: 'Core' | 'Elective' | 'General';
}

export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'staff' | 'facilitator' | 'student';
    status: 'active' | 'inactive' | 'enrolled' | 'completed';
    programmes: string[];
    /** Course attachments for facilitators (programme + semester + category) */
    facilitatorCourses?: IFacilitatorCourseAssignment[];
    department?: string;
    specialization?: string;
    nationality?: string;
    studentId?: string;
    phone?: string;
    lastEnrollmentDate?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    failedAttempts: number;
    lockUntil?: Date;
    mfaEnabled: boolean;
    mfaSecret?: string;
    mfaRecoveryCodes: string[];
    mustChangePassword?: boolean;
    roleRef: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    isLocked(): boolean;
}

const UserSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['admin', 'staff', 'facilitator', 'student'],
            default: 'student',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'enrolled', 'completed'],
            default: 'active',
        },
        programmes: [
            {
                type: String,
                trim: true,
            },
        ],
        facilitatorCourses: [
            {
                courseCode: { type: String, required: true, trim: true, uppercase: true },
                programme: { type: String, required: true, trim: true },
                semester: { type: Number, required: true, min: 1, max: 3 },
                category: {
                    type: String,
                    required: true,
                    enum: ['Core', 'Elective', 'General'],
                },
            },
        ],
        department: {
            type: String,
            trim: true,
        },
        specialization: {
            type: String,
            trim: true,
        },
        nationality: {
            type: String,
            trim: true,
        },
        studentId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        phone: {
            type: String,
            trim: true,
        },
        lastEnrollmentDate: {
            type: Date,
            default: Date.now,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        failedAttempts: {
            type: Number,
            required: true,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
        mfaEnabled: {
            type: Boolean,
            default: false,
        },
        mfaSecret: {
            type: String,
        },
        mfaRecoveryCodes: [
            {
                type: String,
            },
        ],
        mustChangePassword: {
            type: Boolean,
            default: false,
        },
        roleRef: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(12); // Master prompt suggests saltRounds: 12
        this.password = await bcrypt.hash(this.password as string, salt);
    } catch (err: any) {
        throw err;
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model<IUser>('User', UserSchema);
