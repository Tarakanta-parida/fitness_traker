import { Response } from 'express';
import { db } from '../config/db';
import { cache } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

const getTodayString = () => new Date().toISOString().split('T')[0];

export const LogController = {
  /**
   * Fetch today's health metrics summary consolidated
   */
  async getTodaySummary(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const todayStr = getTodayString();
    const cacheKey = `lifetrack_log_${userId}_${todayStr}`;

    try {
      // 1. Try checking cache first
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('Retrieving today summary log from Redis Cache...');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // 2. Query core user dimensions
      const userRes = await db.query(
        'SELECT name, email, age, gender, height, weight, goal, budget, steps_target, sleep_target FROM users WHERE id = $1',
        [userId]
      );
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      const user = userRes.rows[0];

      // 3. Query steps & activity details
      const activityRes = await db.query(
        'SELECT steps, distance, calories_burned, exercise_time FROM daily_activity WHERE user_id = $1 AND date = $2',
        [userId, todayStr]
      );
      const activity = activityRes.rows[0] || { steps: 0, distance: 0.00, calories_burned: 0, exercise_time: 0 };

      // 4. Query water intake glasses vs target goal
      const waterRes = await db.query(
        'SELECT glasses, goal FROM water_intake WHERE user_id = $1 AND date = $2',
        [userId, todayStr]
      );
      const waterLog = waterRes.rows[0] || { glasses: 0, goal: 12 }; // default 12 glasses (3000ml)

      // 5. Query sleep details
      const sleepRes = await db.query(
        'SELECT hours, quality FROM sleep WHERE user_id = $1 AND date = $2',
        [userId, todayStr]
      );
      const sleepLog = sleepRes.rows[0] || { hours: 0.0, quality: 'neutral' };

      // 6. Query weight progress details (today's record or the latest historical record)
      const progressRes = await db.query(
        `SELECT weight, bmi, body_fat FROM progress 
         WHERE user_id = $1 
         ORDER BY date DESC LIMIT 1`,
        [userId]
      );
      const progressLog = progressRes.rows[0] || { weight: user.weight, bmi: 22.0, body_fat: 18.5 };

      // 7. Query calorie consumption from logged meals today
      const mealsRes = await db.query(
        'SELECT SUM(calories) as total_consumed FROM meals WHERE user_id = $1 AND "date"::date = $2',
        [userId, todayStr]
      );
      const caloriesConsumedVal = parseInt(mealsRes.rows[0]?.total_consumed || 0);

      // 8. Query active exercises logged today
      const exerciseRes = await db.query(
        'SELECT id, exercise_name as type, duration, calories, "date"::time as start_time FROM exercise WHERE user_id = $1 AND "date"::date = $2',
        [userId, todayStr]
      );

      // Consolidate response payload
      const responsePayload = {
        profile: {
          name: user.name,
          age: user.age,
          gender: user.gender,
          weight: user.weight,
          height: user.height,
          goal: user.goal,
          budget: user.budget,
          stepsTarget: user.steps_target || 10000,
          waterTarget: waterLog.goal * 250, // convert glasses to mL
          sleepTarget: user.sleep_target || 8.0
        },
        log: {
          steps: activity.steps,
          water: waterLog.glasses * 250, // convert glasses to mL
          sleep: parseFloat(sleepLog.hours || 0).toFixed(1),
          caloriesConsumed: caloriesConsumedVal,
          caloriesBurned: activity.calories_burned,
          weight: parseFloat(progressLog.weight || user.weight).toFixed(1),
          mood: sleepLog.quality // mood proxy mapped to sleep quality
        },
        workouts: exerciseRes.rows.map(row => ({
          id: row.id,
          type: row.type,
          duration: row.duration,
          calories: row.calories,
          start_time: row.start_time || '08:00',
          end_time: row.start_time || '08:45'
        }))
      };

      // 9. Cache in Redis for 10 minutes
      await cache.set(cacheKey, JSON.stringify(responsePayload), 600);

      return res.status(200).json(responsePayload);
    } catch (err) {
      console.error('Get today summary error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Log/Update daily health metrics
   */
  async updateMetrics(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { steps, water, sleep, weight, mood } = req.body;
    const todayStr = getTodayString();

    try {
      // 1. Log steps to daily_activity table
      if (steps !== undefined) {
        const stepsVal = parseInt(steps);
        const distanceVal = parseFloat((stepsVal * 0.00075).toFixed(2)); // 0.75m stride length
        const caloriesBurnedVal = Math.round(stepsVal * 0.04); // ~0.04 kcal per step

        await db.query(
          `INSERT INTO daily_activity (user_id, date, steps, distance, calories_burned)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, date) 
           DO UPDATE SET steps = $3, distance = $4, calories_burned = $5`,
          [userId, todayStr, stepsVal, distanceVal, caloriesBurnedVal]
        );
      }

      // 2. Log water (mL) to water_intake table
      if (water !== undefined) {
        const glassesVal = Math.round(parseInt(water) / 250); // 1 glass = 250ml
        // Fetch current water target or set default 12 glasses
        const defaultGoal = 12;

        await db.query(
          `INSERT INTO water_intake (user_id, date, glasses, goal)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, date) 
           DO UPDATE SET glasses = $3`,
          [userId, todayStr, glassesVal, defaultGoal]
        );
      }

      // 3. Log sleep hours & quality (mood mapped to quality) to sleep table
      if (sleep !== undefined || mood !== undefined) {
        const sleepHours = sleep !== undefined ? parseFloat(sleep) : null;
        const sleepQuality = mood || null;

        await db.query(
          `INSERT INTO sleep (user_id, date, hours, quality)
           VALUES ($1, $2, COALESCE($3, 0.00), COALESCE($4, 'neutral'))
           ON CONFLICT (user_id, date) 
           DO UPDATE SET hours = COALESCE($3, sleep.hours), quality = COALESCE($4, sleep.quality)`,
          [userId, todayStr, sleepHours, sleepQuality]
        );
      }

      // 4. Log weight progress to progress table
      if (weight !== undefined) {
        const weightVal = parseFloat(weight);
        // Fetch height to calculate BMI
        const userRes = await db.query('SELECT height FROM users WHERE id = $1', [userId]);
        const heightCm = userRes.rows[0]?.height || 175.00;
        const heightM = heightCm / 100.0;
        const bmiVal = parseFloat((weightVal / (heightM * heightM)).toFixed(2));

        await db.query(
          `INSERT INTO progress (user_id, date, weight, bmi, body_fat)
           VALUES ($1, $2, $3, $4, 18.5)
           ON CONFLICT (user_id, date) 
           DO UPDATE SET weight = $3, bmi = $4`,
          [userId, todayStr, weightVal, bmiVal]
        );

        // Sync weight on primary users table too
        await db.query('UPDATE users SET weight = $2 WHERE id = $1', [userId, weightVal]);
      }

      // 5. Clear Redis Cache
      await cache.del(`lifetrack_log_${userId}_${todayStr}`);

      return res.status(200).json({ success: true, message: 'Metrics updated successfully.' });
    } catch (err) {
      console.error('Update metrics error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Log an exercise activity
   */
  async addWorkout(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, duration, distance, startTime } = req.body;
    const todayStr = getTodayString();

    try {
      // Calculate workout burned calories (e.g. Walking=5kcal/min, Running=10kcal/min, Cycling=8kcal/min, Gym/Yoga=6kcal/min)
      let kcalPerMin = 6;
      if (type === 'Running') kcalPerMin = 10;
      else if (type === 'Cycling') kcalPerMin = 8;
      else if (type === 'Walking') kcalPerMin = 5;

      const caloriesBurned = duration * kcalPerMin;

      // 1. Insert into exercise table
      const dateWithTime = `${todayStr} ${startTime || '08:00'}:00`;
      const exerciseRes = await db.query(
        `INSERT INTO exercise (user_id, exercise_name, duration, calories, date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, type, duration, caloriesBurned, dateWithTime]
      );

      // 2. Increment active steps & calories on daily_activity totals
      let additionalSteps = 0;
      if (type === 'Running') additionalSteps = duration * 150; // ~150 steps/min
      else if (type === 'Walking') additionalSteps = duration * 100; // ~100 steps/min

      const distanceKm = distance ? parseFloat(distance) : parseFloat((additionalSteps * 0.00075).toFixed(2));

      await db.query(
        `INSERT INTO daily_activity (user_id, date, steps, distance, calories_burned, exercise_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, date) 
         DO UPDATE SET steps = daily_activity.steps + $3, 
                       distance = daily_activity.distance + $4, 
                       calories_burned = daily_activity.calories_burned + $5,
                       exercise_time = daily_activity.exercise_time + $6`,
        [userId, todayStr, additionalSteps, distanceKm, caloriesBurned, duration]
      );

      // 3. Clear Cache
      await cache.del(`lifetrack_log_${userId}_${todayStr}`);

      return res.status(201).json({
        success: true,
        workout: exerciseRes.rows[0]
      });
    } catch (err) {
      console.error('Add workout error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Remove an activity log entry
   */
  async deleteWorkout(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    const workoutId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const todayStr = getTodayString();

    try {
      // 1. Fetch workout details first
      const exerciseRes = await db.query(
        'SELECT duration, calories, exercise_name FROM exercise WHERE id = $1 AND user_id = $2',
        [workoutId, userId]
      );
      if (exerciseRes.rows.length === 0) {
        return res.status(404).json({ error: 'Workout log entry not found.' });
      }
      const workout = exerciseRes.rows[0];

      // 2. Delete workout row
      await db.query('DELETE FROM exercise WHERE id = $1', [workoutId]);

      // 3. Subtract from daily activity totals
      let subtractSteps = 0;
      if (workout.exercise_name === 'Running') subtractSteps = workout.duration * 150;
      else if (workout.exercise_name === 'Walking') subtractSteps = workout.duration * 100;

      await db.query(
        `UPDATE daily_activity 
         SET steps = GREATEST(0, steps - $2), 
             calories_burned = GREATEST(0, calories_burned - $3), 
             exercise_time = GREATEST(0, exercise_time - $4)
         WHERE user_id = $1 AND date = $5`,
        [userId, subtractSteps, workout.calories, workout.duration, todayStr]
      );

      // 4. Clear Cache
      await cache.del(`lifetrack_log_${userId}_${todayStr}`);

      return res.status(200).json({ success: true, message: 'Workout log deleted successfully.' });
    } catch (err) {
      console.error('Delete workout error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Fetch historical logs for analytics (compiled by dates)
   */
  async getHistory(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      // Fetch combined daily values from all daily tables
      const historyRes = await db.query(
        `SELECT 
           COALESCE(a.date, w.date, s.date, p.date) as date,
           COALESCE(a.steps, 0) as steps,
           COALESCE(a.distance, 0.00) as distance,
           COALESCE(w.glasses * 250, 0) as water_intake,
           COALESCE(s.hours, 0.00) as sleep_hours,
           COALESCE(p.weight, 0.00) as weight,
           COALESCE(a.calories_burned, 0) as calories_burned
         FROM daily_activity a
         FULL OUTER JOIN water_intake w ON a.user_id = w.user_id AND a.date = w.date
         FULL OUTER JOIN sleep s ON COALESCE(a.user_id, w.user_id) = s.user_id AND COALESCE(a.date, w.date) = s.date
         FULL OUTER JOIN progress p ON COALESCE(a.user_id, w.user_id, s.user_id) = p.user_id AND COALESCE(a.date, w.date, s.date) = p.date
         WHERE COALESCE(a.user_id, w.user_id, s.user_id, p.user_id) = $1
         ORDER BY date DESC LIMIT 30`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        history: historyRes.rows
      });

    } catch (err) {
      console.error('Get history error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
