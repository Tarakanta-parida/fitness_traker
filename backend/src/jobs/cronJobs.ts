import cron from 'node-cron';
import { db } from '../config/db';
import { cache } from '../config/redis';

export const initCronJobs = () => {
  console.log('Initializing background automated cron scheduler...');

  // --- 1. Daily Midnight Streak Calculation Job (Runs at 00:00 every day) ---
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily midnight user streak recalculation sweep...');
    try {
      // Fetch users
      const usersRes = await db.query('SELECT id FROM users');
      const today = new Date();
      
      // Calculate yesterday date string YYYY-MM-DD
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      for (const user of usersRes.rows) {
        const userId = user.id;

        // Fetch yesterday's log vs step targets
        const logRes = await db.query(
          `SELECT l.steps, p.steps_target 
           FROM daily_logs l 
           JOIN profiles p ON l.user_id = p.user_id 
           WHERE l.user_id = $1 AND l.date = $2`,
          [userId, yesterdayStr]
        );

        if (logRes.rows.length > 0) {
          const log = logRes.rows[0];
          const achieved = log.steps >= log.steps_target;
          console.log(`User ${userId} yesterday steps goal: ${achieved ? 'ACHIEVED' : 'FAILED'}`);
        }

        // Clear yesterday's and today's cache keys
        await cache.del(`lifetrack_log_${userId}_${yesterdayStr}`);
        const todayStr = today.toISOString().split('T')[0];
        await cache.del(`lifetrack_log_${userId}_${todayStr}`);
      }

      console.log('Daily midnight streak calculation sweep completed successfully.');
    } catch (err) {
      console.error('Error during daily streak cron execution:', err);
    }
  });

  // --- 2. Weekly Summary Reports compiler (Runs at 00:00 every Sunday) ---
  cron.schedule('0 0 * * 0', async () => {
    console.log('Compiling weekly summary logs for active user profiles...');
    try {
      const usersRes = await db.query('SELECT id, email, name FROM users');
      
      for (const user of usersRes.rows) {
        const userId = user.id;

        // Aggregate past 7 days steps, water, sleep
        const reportRes = await db.query(
          `SELECT AVG(steps) as avg_steps, AVG(water_intake) as avg_water, AVG(sleep_hours) as avg_sleep
           FROM daily_logs
           WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
          [userId]
        );

        const stats = reportRes.rows[0];
        if (stats && stats.avg_steps !== null) {
          console.log(`Weekly Report Compiled for ${user.name} (${user.email}):`);
          console.log(`- Avg Steps: ${Math.round(stats.avg_steps)}`);
          console.log(`- Avg Water: ${Math.round(stats.avg_water)} mL`);
          console.log(`- Avg Sleep: ${parseFloat(stats.avg_sleep || 0).toFixed(1)} hrs`);
        }
      }
      console.log('Weekly summary reports compiling completed.');
    } catch (err) {
      console.error('Error during weekly report compiler cron execution:', err);
    }
  });
};
