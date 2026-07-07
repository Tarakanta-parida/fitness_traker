import { Response } from 'express';
import { db } from '../config/db';
import { cache } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

const getTodayString = () => new Date().toISOString().split('T')[0];

export const ProfileController = {
  /**
   * Fetch current user profile details
   */
  async getProfile(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const result = await db.query(
        `SELECT id, name, email, age, gender, height, weight, goal, budget, is_onboarded, steps_target, sleep_target
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      const user = result.rows[0];

      // Fetch the daily water goal from the latest water_intake log (or default to 12 glasses / 3000ml)
      const waterLogRes = await db.query(
        'SELECT goal FROM water_intake WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
        [userId]
      );
      const waterTargetGlasses = waterLogRes.rows.length > 0 ? waterLogRes.rows[0].goal : 12;

      // Construct a unified profile response compatible with frontend expects
      const profile = {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        goal: user.goal,
        budget: user.budget,
        is_onboarded: user.is_onboarded,
        steps_target: user.steps_target || 10000,
        water_target: waterTargetGlasses * 250, // convert glasses to mL
        sleep_target: user.sleep_target || 8.0
      };

      return res.status(200).json({ success: true, profile });
    } catch (err) {
      console.error('Get profile error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Update user profile details
   */
  async updateProfile(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { 
      name, gender, age, weight, height, goal, stepsTarget, waterTarget, sleepTarget, isOnboarded 
    } = req.body;

    try {
      // 1. Update users table details
      const userRes = await db.query(
        `UPDATE users 
         SET name = COALESCE($2, name), 
             gender = COALESCE($3, gender), 
             age = COALESCE($4, age), 
             weight = COALESCE($5, weight), 
             height = COALESCE($6, height), 
             goal = COALESCE($7, goal), 
             steps_target = COALESCE($8, steps_target), 
             sleep_target = COALESCE($9, sleep_target),
             is_onboarded = COALESCE($10, is_onboarded)
         WHERE id = $1 
         RETURNING *`,
        [
          userId, 
          name, 
          gender, 
          age ? parseInt(age) : null, 
          weight ? parseFloat(weight) : null, 
          height ? parseFloat(height) : null, 
          goal, 
          stepsTarget ? parseInt(stepsTarget) : null, 
          sleepTarget ? parseFloat(sleepTarget) : null,
          isOnboarded !== undefined ? isOnboarded : null
        ]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // 2. If water target is updated, save or update goal glasses (1 glass = 250ml) in today's water_intake log
      if (waterTarget) {
        const todayStr = getTodayString();
        const glassesGoal = Math.round(parseInt(waterTarget) / 250);
        await db.query(
          `INSERT INTO water_intake (user_id, date, glasses, goal)
           VALUES ($1, $2, 0, $3)
           ON CONFLICT (user_id, date) 
           DO UPDATE SET goal = $3`,
          [userId, todayStr, glassesGoal]
        );
      }

      // 3. Clear today's cache key to sync targets immediately
      const todayStr = getTodayString();
      await cache.del(`lifetrack_log_${userId}_${todayStr}`);

      return res.status(200).json({
        success: true,
        profile: userRes.rows[0]
      });

    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Fetch reminder configuration mapped from rows
   */
  async getReminders(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const result = await db.query(
        'SELECT type, time, enabled FROM reminder WHERE user_id = $1',
        [userId]
      );

      // Default values mapping
      const remindersObj = {
        water_active: true,
        water_interval: 120, // default 2 hours
        water_target: 3000,
        sleep_active: true,
        sleep_time: '22:30',
        meal_active: true,
        meal_breakfast: '08:00',
        meal_lunch: '13:00',
        meal_dinner: '20:00',
        walk_active: false,
        walk_interval: 60
      };

      for (const row of result.rows) {
        const timeStr = row.time.substring(0, 5); // HH:MM
        if (row.type === 'water') {
          remindersObj.water_active = row.enabled;
        } else if (row.type === 'sleep') {
          remindersObj.sleep_active = row.enabled;
          remindersObj.sleep_time = timeStr;
        } else if (row.type === 'meal_breakfast') {
          remindersObj.meal_breakfast = timeStr;
          remindersObj.meal_active = row.enabled;
        } else if (row.type === 'meal_lunch') {
          remindersObj.meal_lunch = timeStr;
        } else if (row.type === 'meal_dinner') {
          remindersObj.meal_dinner = timeStr;
        } else if (row.type === 'walk') {
          remindersObj.walk_active = row.enabled;
        }
      }

      return res.status(200).json({
        success: true,
        reminders: remindersObj
      });

    } catch (err) {
      console.error('Get reminders error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Save reminder configurations to database rows
   */
  async updateReminders(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      waterActive, sleepActive, sleepTime, mealActive, mealBreakfast, mealLunch, mealDinner, walkActive
    } = req.body;

    try {
      // Upsert water reminder row
      if (waterActive !== undefined) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'water', '09:00:00', 'daily', $2)
           ON CONFLICT (user_id, type) DO UPDATE SET enabled = $2`,
          [userId, waterActive]
        );
      }

      // Upsert sleep reminder row
      if (sleepTime) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'sleep', $2, 'daily', $3)
           ON CONFLICT (user_id, type) DO UPDATE SET time = $2, enabled = $3`,
          [userId, `${sleepTime}:00`, sleepActive !== undefined ? sleepActive : true]
        );
      }

      // Upsert meal reminders rows
      if (mealBreakfast) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'meal_breakfast', $2, 'daily', $3)
           ON CONFLICT (user_id, type) DO UPDATE SET time = $2, enabled = $3`,
          [userId, `${mealBreakfast}:00`, mealActive !== undefined ? mealActive : true]
        );
      }
      if (mealLunch) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'meal_lunch', $2, 'daily', $3)
           ON CONFLICT (user_id, type) DO UPDATE SET time = $2, enabled = $3`,
          [userId, `${mealLunch}:00`, mealActive !== undefined ? mealActive : true]
        );
      }
      if (mealDinner) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'meal_dinner', $2, 'daily', $3)
           ON CONFLICT (user_id, type) DO UPDATE SET time = $2, enabled = $3`,
          [userId, `${mealDinner}:00`, mealActive !== undefined ? mealActive : true]
        );
      }

      // Upsert walk/standing reminder row
      if (walkActive !== undefined) {
        await db.query(
          `INSERT INTO reminder (user_id, type, time, repeat, enabled)
           VALUES ($1, 'walk', '12:00:00', 'daily', $2)
           ON CONFLICT (user_id, type) DO UPDATE SET enabled = $2`,
          [userId, walkActive]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Reminders configurations updated successfully.'
      });

    } catch (err) {
      console.error('Update reminders error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
