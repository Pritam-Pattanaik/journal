import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticate, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { lockService } from '../services/lockService';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// POST /api/auth/signup
router.post('/signup', lockService.authRateLimit(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, avatarUrl: newUser.avatarUrl, timezone: newUser.timezone, role: newUser.role },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', lockService.authRateLimit(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, timezone: user.timezone, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, timezone: user.timezone, role: user.role },
    });
  } catch (err: any) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, avatarUrl, timezone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { fullName, avatarUrl, timezone, updatedAt: new Date() },
    });
    res.json({ user: { id: updated.id, email: updated.email, fullName: updated.fullName, avatarUrl: updated.avatarUrl, timezone: updated.timezone, role: updated.role } });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
