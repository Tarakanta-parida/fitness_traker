import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'lifetrack-super-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

const createDefaultReminders = async (userId: string) => {
  const defaults = [
    { type: 'water', time: '09:00:00' },
    { type: 'sleep', time: '22:30:00' },
    { type: 'meal', time: '08:00:00' },
    { type: 'exercise', time: '18:00:00' }
  ];
  for (const r of defaults) {
    await db.query(
      `INSERT INTO reminder (user_id, type, time, repeat, enabled) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (user_id, type) DO NOTHING`,
      [userId, r.type, r.time, 'daily', true]
    );
  }
};

export const AuthController = {
  /**
   * Register a new user
   */
  async signup(req: Request, res: Response) {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Please enter all fields (email, name, password).' });
    }

    try {
      // Check if user exists
      const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert User (Dimensions are directly in users table and take default values)
      const userResult = await db.query(
        `INSERT INTO users (email, name, password, age, gender, height, weight, goal, budget, is_onboarded) 
         VALUES ($1, $2, $3, 28, 'other', 175.00, 70.00, 'maintain', 150.00, false) 
         RETURNING id, email, name`,
        [email.toLowerCase(), name, passwordHash]
      );
      
      const userId = userResult.rows[0].id;

      // Provision default reminders
      await createDefaultReminders(userId);

      // Generate token
      const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.status(201).json({
        success: true,
        token,
        user: userResult.rows[0]
      });

    } catch (err: any) {
      console.error('Signup Error:', err);
      return res.status(500).json({ error: 'Internal Server Error during registration.' });
    }
  },

  /**
   * Standard Email/Password login
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials. User not found.' });
      }

      const user = result.rows[0];
      if (!user.password) {
        return res.status(400).json({ error: 'Please login using your linked social sign-in account.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials. Password incorrect.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });

    } catch (err) {
      console.error('Login Error:', err);
      return res.status(500).json({ error: 'Internal Server Error during login.' });
    }
  },

  /**
   * Mock Google Sign-In Callback
   */
  async googleOAuthMock(req: Request, res: Response) {
    const { name, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Google OAuth mock requires email and name.' });
    }

    try {
      // Find or create user
      let userResult = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email.toLowerCase()]);
      let userId = '';
      let user = null;

      if (userResult.rows.length === 0) {
        // Create user with placeholder password
        const insertUser = await db.query(
          `INSERT INTO users (email, name, password, age, gender, height, weight, goal, budget, is_onboarded) 
           VALUES ($1, $2, $3, 28, 'other', 175.00, 70.00, 'maintain', 150.00, false) 
           RETURNING id, email, name`,
          [email.toLowerCase(), name, `google_mock_${Date.now()}`]
        );
        userId = insertUser.rows[0].id;
        user = insertUser.rows[0];

        // Provision defaults reminders
        await createDefaultReminders(userId);
      } else {
        userId = userResult.rows[0].id;
        user = userResult.rows[0];
      }

      const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.status(200).json({
        success: true,
        token,
        user
      });
    } catch (err) {
      console.error('Google OAuth error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Mock Apple Sign-In Callback
   */
  async appleOAuthMock(req: Request, res: Response) {
    const { name, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Apple OAuth mock requires email and name.' });
    }

    try {
      let userResult = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email.toLowerCase()]);
      let userId = '';
      let user = null;

      if (userResult.rows.length === 0) {
        const insertUser = await db.query(
          `INSERT INTO users (email, name, password, age, gender, height, weight, goal, budget, is_onboarded) 
           VALUES ($1, $2, $3, 28, 'other', 175.00, 70.00, 'maintain', 150.00, false) 
           RETURNING id, email, name`,
          [email.toLowerCase(), name, `apple_mock_${Date.now()}`]
        );
        userId = insertUser.rows[0].id;
        user = insertUser.rows[0];

        // Provision defaults
        await createDefaultReminders(userId);
      } else {
        userId = userResult.rows[0].id;
        user = userResult.rows[0];
      }

      const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.status(200).json({
        success: true,
        token,
        user
      });
    } catch (err) {
      console.error('Apple OAuth error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
