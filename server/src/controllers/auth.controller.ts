import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import { AuthRequest } from '../middleware/auth.middleware';
import emailService from '../services/email.service';
import auditLogService from '../services/audit-log.service';
import * as OTPAuth from 'otpauth';
// @ts-ignore
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import { env } from '../config/env';
import logger from '../utils/logger';

const generateTokens = async (user: IUser, ipAddress: string) => {
    // Access Token
    const accessToken = jwt.sign(
        { id: user._id, role: user.role, programmes: user.programmes },
        env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    // Refresh Token
    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const refreshToken = new RefreshToken({
        user: user._id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revokedByIp: ipAddress
    });
    await refreshToken.save();

    return { accessToken, refreshToken: refreshToken.token };
};

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const cookieOptions = {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

// Register a new user
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, username, email, password, role, programmes, studentId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (userExists) {
        return errorResponse(res, userExists.email === email ? 'User with this email already exists' : 'Username already taken');
    }

    // Create new user
    const user = new User({
        name,
        username,
        email,
        password,
        role: 'student', // Force student role for security (D2)
        programmes: programmes || [],
        studentId,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, req.ip || 'unknown');
    setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email
    try {
        await emailService.sendEmail(user.email, 'welcome', { name: user.name });
    } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
    }

    return successResponse(res, {
        token: accessToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            programmes: user.programmes,
            studentId: user.studentId
        },
    }, 'User registered successfully', 201);
});

// Login user
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { identifier, password, role } = req.body;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({
        $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }]
    });

    if (!user) {
        logger.warn('Failed login attempt: User not found', { identifier: normalizedIdentifier, ip: req.ip });
        await auditLogService.logAuthAttempt(undefined, normalizedIdentifier, false, 'User not found', req.ip);
        return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check for account lockout (D2)
    if (user.isLocked()) {
        return errorResponse(res, 'Account temporarily locked due to too many failed attempts. Please try again later.', 423);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        // Increment failed attempts
        user.failedAttempts += 1;
        if (user.failedAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        }
        await user.save();
        logger.warn('Failed login attempt: Invalid password', { userId: user._id, identifier: normalizedIdentifier, ip: req.ip });
        await auditLogService.logAuthAttempt(String(user._id), normalizedIdentifier, false, 'Invalid password', req.ip);
        return errorResponse(res, 'Invalid credentials', 401);
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0) {
        user.failedAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
    }

    logger.info('User login successful', { userId: user._id, role: user.role, ip: req.ip });
    await auditLogService.logAuthAttempt(String(user._id), normalizedIdentifier, true, 'Login successful', req.ip);

    // Verify role
    if (role && user.role !== role) {
        return errorResponse(res, `Access denied. You are registered as a ${user.role}, but you selected ${role}.`, 401);
    }

    // Check enrollment status (Institutional validation: Must be active or enrolled)
    if (!['active', 'enrolled'].includes(user.status)) {
        return errorResponse(res, 'Your account is not active. Please contact the administrator.', 403);
    }
    
    // Check if user must change password (New Security Policy)
    if (user.mustChangePassword) {
        const tempToken = jwt.sign(
            { id: user._id, must_change_password: true },
            env.JWT_SECRET,
            { expiresIn: '10m' }
        );
        return successResponse(res, {
            must_change_password: true,
            temp_token: tempToken
        }, 'Institutional policy requires you to change your password before continuing.');
    }

    // MFA Enforcement for Admin and Staff (TASK 2.2 / 2.4)
    // TEMPORARILY DISABLED FOR LOCAL DEVELOPMENT — uncomment to re-enable
    // if (['admin', 'staff'].includes(user.role)) {
    //     if (user.mfaEnabled) {
    //         const tempToken = jwt.sign(
    //             { id: user._id, mfa_pending: true },
    //             env.JWT_SECRET,
    //             { expiresIn: '5m' }
    //         );
    //         return successResponse(res, {
    //             mfa_required: true,
    //             temp_token: tempToken
    //         }, 'Multi-factor authentication required');
    //     } else {
    //         const tempToken = jwt.sign(
    //             { id: user._id, role: user.role, mfa_setup: true },
    //             env.JWT_SECRET,
    //             { expiresIn: '15m' }
    //         );
    //         return successResponse(res, {
    //             mfa_setup_required: true,
    //             temp_token: tempToken
    //         }, 'Institutional policy requires MFA setup for your role.');
    //     }
    // }

    // Standard Login
    const { accessToken, refreshToken } = await generateTokens(user, req.ip || 'unknown');
    setTokenCookies(res, accessToken, refreshToken);

    return successResponse(res, {
        token: accessToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            programmes: user.programmes,
            studentId: user.studentId
        },
    }, 'Login successful');
});

// Get current user profile
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password/${resetToken}`;
        
        try {
            await emailService.sendEmail(user.email, 'password_reset', { 
                name: user.name,
                resetUrl 
            });
            res.json({ message: 'Password reset link sent to your email' });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            res.status(500).json({ message: 'Error sending email' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Set new password (will be hashed by pre-save hook)
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Handle mandatory first-time password change
 */
export const changeRequiredPassword = asyncHandler(async (req: Request, res: Response) => {
    const { tempToken, newPassword } = req.body;
    
    try {
        const decoded = jwt.verify(tempToken, env.JWT_SECRET) as { id: string, must_change_password?: boolean };
        if (!decoded.must_change_password) {
            return errorResponse(res, 'Invalid password change session', 401);
        }

        const user = await User.findById(decoded.id);
        if (!user) return errorResponse(res, 'User not found', 404);

        // Update password (hashed by pre-save hook)
        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();

        return successResponse(res, null, 'Password updated successfully. You can now login.');
    } catch (err: any) {
        return errorResponse(res, 'Session expired or invalid', 401);
    }
});

// --- MFA ENDPOINTS (TASK 2) ---

/**
 * Step 1: Generate MFA Secret and QR Code for Setup
 */
export const setupMFA = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate new secret
        const secret = new OTPAuth.Secret({ size: 20 });
        const secretBase32 = secret.base32;

        const totp = new OTPAuth.TOTP({
            issuer: 'ACETEL IAMS',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret,
        });

        const otpauthUrl = totp.toString();
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        // Store secret temporarily (not enabled yet)
        user.mfaSecret = secretBase32;
        await user.save();

        res.json({
            qrCode: qrCodeDataUrl,
            secret: secretBase32,
            message: 'Scan the QR code with your authenticator app'
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error setting up MFA', error: error.message });
    }
};

/**
 * Step 2: Verify first code and enable MFA
 */
export const verifyMFASetup = async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user?.id);
        if (!user || !user.mfaSecret) return res.status(404).json({ message: 'User not found or setup not initiated' });

        const totp = new OTPAuth.TOTP({
            issuer: 'ACETEL IAMS',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
        });

        const delta = totp.validate({ token: code, window: 1 });
        if (delta === null) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Generate 8 backup recovery codes (TASK 2.5)
        const recoveryCodes = [];
        const rawRecoveryCodes = [];
        for (let i = 0; i < 8; i++) {
            const raw = crypto.randomBytes(4).toString('hex'); // 8 char hex
            rawRecoveryCodes.push(raw);
            recoveryCodes.push(await bcrypt.hash(raw, 10));
        }

        user.mfaEnabled = true;
        user.mfaRecoveryCodes = recoveryCodes;
        await user.save();

        res.json({
            message: 'MFA enabled successfully',
            recoveryCodes: rawRecoveryCodes
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error verifying MFA setup', error: error.message });
    }
};

/**
 * Step 3: Finalize login with TOTP code
 */
export const finalizeMFALogin = async (req: AuthRequest, res: Response) => {
    try {
        const { code, tempToken } = req.body;
        
        // Verify temp token
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as { id: string, mfa_pending?: boolean };
        if (!decoded.mfa_pending) return res.status(401).json({ message: 'Invalid session' });

        const user = await User.findById(decoded.id);
        if (!user || !user.mfaSecret) return res.status(404).json({ message: 'User not found' });

        // Check if it is a recovery code
        let isRecovery = false;
        for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
            if (await bcrypt.compare(code, user.mfaRecoveryCodes[i])) {
                isRecovery = true;
                // Remove used recovery code
                user.mfaRecoveryCodes.splice(i, 1);
                await user.save();
                break;
            }
        }

        if (!isRecovery) {
            const totp = new OTPAuth.TOTP({
                issuer: 'ACETEL IAMS',
                label: user.email,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
            });

            const delta = totp.validate({ token: code, window: 1 });
            if (delta === null) {
                return res.status(401).json({ message: 'Invalid TOTP code' });
            }
        }

        // Login successful
        const finalToken = jwt.sign(
            { id: user._id, role: user.role, programmes: user.programmes },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.json({
            token: finalToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                programmes: user.programmes,
                studentId: user.studentId
            },
        });
    } catch (error: any) {
        res.status(401).json({ message: 'MFA session expired or invalid', error: error.message });
    }
};

/**
 * Admin: Reset user MFA
 */
export const resetUserMFA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.mfaEnabled = false;
        user.mfaSecret = undefined;
        user.mfaRecoveryCodes = [];
        await user.save();

        res.json({ message: `MFA has been reset for user ${user.name}` });
    } catch (error: any) {
        res.status(500).json({ message: 'Error resetting MFA', error: error.message });
    }
};

// Refresh Token rotation
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip || 'unknown';

    if (!token) {
        return errorResponse(res, 'Refresh token missing', 401);
    }

    const refreshToken = await RefreshToken.findOne({ token }).populate('user');

    if (!refreshToken || !refreshToken.isActive) {
        // Potential reuse attack!
        if (refreshToken?.revokedAt) {
            // Revoke all tokens for this user
            await RefreshToken.updateMany({ user: refreshToken.user }, { revokedAt: new Date(), revokedByIp: ipAddress });
            return errorResponse(res, 'Token reuse detected. All sessions revoked.', 401);
        }
        return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const user = refreshToken.user as any;

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user, ipAddress);

    // Replace old token
    refreshToken.revokedAt = new Date();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken;
    await refreshToken.save();

    setTokenCookies(res, accessToken, newRefreshToken);

    return successResponse(res, { token: accessToken }, 'Token refreshed successfully');
});

// Logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (token) {
        const refreshToken = await RefreshToken.findOne({ token });
        if (refreshToken) {
            refreshToken.revokedAt = new Date();
            refreshToken.revokedByIp = req.ip || 'unknown';
            await refreshToken.save();
        }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return successResponse(res, null, 'Logged out successfully');
});
