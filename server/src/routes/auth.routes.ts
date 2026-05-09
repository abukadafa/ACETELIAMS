import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, changeRequiredPassword, setupMFA, verifyMFASetup, finalizeMFALogin, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../schemas/security.schema';
import { authRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/change-required-password', authRateLimit, changeRequiredPassword);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password/:token', authRateLimit, resetPassword);

// MFA Routes (TASK 2)
router.post('/mfa/setup', authenticate, setupMFA);
router.post('/mfa/verify-setup', authenticate, verifyMFASetup);
router.post('/mfa/finalize-login', authRateLimit, finalizeMFALogin);

// Session Routes
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
