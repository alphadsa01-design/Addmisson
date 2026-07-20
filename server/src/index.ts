import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load env variables
dotenv.config();

import authRoutes from './routes/auth';
import admissionRoutes from './routes/admissions';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports';
import { seedMetadata } from './seed';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Vercel reverse proxy for express-rate-limit & IP detection
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true, // Dynamically allow client origins (Vercel deployment, custom domain, and localhost)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth Rate Limiter (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit login/register requests
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Base Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    status: 'error',
    message: err?.message || 'Internal server error',
  });
});

// Start Server
const startServer = async () => {
  try {
    // Seed initial metadata
    await seedMetadata();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.VERCEL !== '1') {
  startServer();
} else {
  seedMetadata().catch((err) => console.error('Cold start seeding error:', err));
}

export default app;
