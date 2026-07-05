import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import facilitatorRoutes from './routes/facilitator.routes';
import admissionHubRoutes from './routes/admissionHub.routes';
import monitoringRoutes from './routes/monitoring.routes';
import academicEventRoutes from './routes/academicEvent.routes';
import shortCourseRoutes from './routes/shortCourse.routes';
import studentRoutes from './routes/student.routes';
import academicCourseRoutes from './routes/academicCourse.routes';
import applicationRoutes from './routes/application.routes';
import alumniRoutes from './routes/alumni.routes';
import dashboardRoutes from './routes/dashboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import rbacRoutes from './routes/rbac.routes';
import notificationRoutes from './routes/notification.routes';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrf.middleware';
import { initNotifications } from './services/notification.service';
import { initCronJobs } from './services/cron.service';
import { apiRateLimit, authRateLimit } from './middleware/rate-limit.middleware';
import { auditMiddleware } from './middleware/audit-log.middleware';

dotenv.config();

import { env } from './config/env';

// Initialize services
initNotifications();
initCronJobs();

const app: Application = express();
const PORT = env.PORT;

// Security Middleware
app.use(cors({
    origin: env.NODE_ENV === 'production'
        ? (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : [env.FRONTEND_URL])
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://acetel.nou.edu.ng", "https://*.nou.edu.ng"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5001", "http://localhost:5173"].filter(Boolean),
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : undefined,
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
    noSniff: true,
    xssFilter: true,
    frameguard: {
        action: 'deny',
    },
}));

app.use(cookieParser());
app.use(csrfProtection);
app.use(auditMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiters
app.use('/api', apiRateLimit);
app.use('/api/auth', authRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/facilitators', facilitatorRoutes);
app.use('/api/admission-hub', admissionHubRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/academic-events', academicEventRoutes);
app.use('/api/short-courses', shortCourseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic-courses', academicCourseRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
import { getDbHealth } from './controllers/health.controller';
app.get('/api/health/db', getDbHealth);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'ACETEL Student Database Management System API is running' });
});

import { ensureIndexes } from './db/indexes';

// Connect to database and start server
connectDB().then(async () => {
    await ensureIndexes();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});

// Graceful Shutdown (D8)
const shutdown = () => {
    console.log('Stopping server gracefully...');
    // Add additional cleanup logic here if needed (e.g., closing Redis, DB)
    process.exit(0);
};

import { globalErrorHandler } from './middleware/error.middleware';

app.use(globalErrorHandler);

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
