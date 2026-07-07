// LifeTrack Reminders & Notifications Engine
import { DataEngine } from './data.js';
import { toast } from './app.js';

let intervalTimer = null;

export const ReminderEngine = {
  /**
   * Request system-level browser notifications permission
   */
  requestBrowserPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast('System notifications enabled! 🔔', 'success');
          }
        });
      }
    }
  },

  /**
   * Start checking notification schedules
   */
  startReminders() {
    if (intervalTimer) clearInterval(intervalTimer);

    // Initial check on login/load
    this.runReminderChecks();
    this.checkWorkoutDailySplit();

    // Check schedules every 15 seconds
    intervalTimer = setInterval(() => {
      this.runReminderChecks();
    }, 15000);
  },

  /**
   * Trigger in-app toast and desktop popup if allowed
   */
  notify(title, message, type = 'info') {
    // 1. In-app toast
    toast(message, type);

    // 2. Desktop notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico' // fallback
        });
      } catch (err) {
        console.warn('Notification creation failed: ', err);
      }
    }
  },

  /**
   * Main checking ticks
   */
  runReminderChecks() {
    const userData = DataEngine.getCurrentUserData();
    if (!userData) return;

    const rem = userData.reminders;
    const now = new Date();
    const todayStr = DataEngine.getTodayDateString();
    
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Helper to check if alert was already sent today
    const wasAlertedToday = (key) => {
      return localStorage.getItem(`lifetrack_alert_${key}`) === todayStr;
    };
    const setAlertedToday = (key) => {
      localStorage.setItem(`lifetrack_alert_${key}`, todayStr);
    };

    // --- A. Water Intake Reminder ---
    if (rem.water.active) {
      const lastWaterLog = parseFloat(localStorage.getItem('lifetrack_last_water_log') || now.getTime());
      
      // Convert water interval mins to milliseconds
      const intervalMs = rem.water.interval * 60 * 1000;
      
      if (now.getTime() - lastWaterLog >= intervalMs) {
        this.notify('Hydration Reminder', 'Time to drink a glass of water to reach your daily goal! 💧', 'info');
        // Reset last water log to current time to avoid constant firing
        localStorage.setItem('lifetrack_last_water_log', now.getTime());
      }
    }

    // --- B. Sleep Bedtime Reminder ---
    if (rem.sleep.active && rem.sleep.time) {
      // Calculate wind down time (30 minutes before sleep target)
      const [h, m] = rem.sleep.time.split(':').map(Number);
      const sleepMinutes = h * 60 + m;
      const windDownMinutes = (sleepMinutes - 30 + 1440) % 1440; // 30 mins before, handle underflow
      
      const windDownHourMin = `${String(Math.floor(windDownMinutes / 60)).padStart(2, '0')}:${String(windDownMinutes % 60).padStart(2, '0')}`;
      
      if (currentHourMin === windDownHourMin && !wasAlertedToday('sleep')) {
        this.notify('Bedtime Wind-down', 'Time to turn off screens and prepare for sleep in 30 minutes. 😴', 'info');
        setAlertedToday('sleep');
      }
    }

    // --- C. Meal Time Reminders ---
    if (rem.meal.active) {
      // Breakfast Alert
      if (rem.meal.breakfast && currentHourMin === rem.meal.breakfast && !wasAlertedToday('meal_breakfast')) {
        this.notify('Breakfast Time', 'Time for your healthy breakfast! Keep your metabolism active. 🍳', 'success');
        setAlertedToday('meal_breakfast');
      }
      
      // Lunch Alert
      if (rem.meal.lunch && currentHourMin === rem.meal.lunch && !wasAlertedToday('meal_lunch')) {
        this.notify('Lunch Time', 'Don\'t skip your lunch! Time to refuel your energy. 🥗', 'success');
        setAlertedToday('meal_lunch');
      }
      
      // Dinner Alert
      if (rem.meal.dinner && currentHourMin === rem.meal.dinner && !wasAlertedToday('meal_dinner')) {
        this.notify('Dinner Time', 'Time for dinner. Keep it light for a restful sleep. 🍲', 'success');
        setAlertedToday('meal_dinner');
      }
    }

    // --- D. Sedentary/Walking Reminder ---
    if (rem.walk.active) {
      const lastStepsLog = parseFloat(localStorage.getItem('lifetrack_last_steps_log') || now.getTime());
      const intervalMs = rem.walk.interval * 60 * 1000;

      if (now.getTime() - lastStepsLog >= intervalMs) {
        this.notify('Sedentary Alert', 'You have been sitting for a while. Stand up and take a 5-minute walk! 🚶', 'warning');
        // Reset steps timer so it doesn't fire immediately again
        localStorage.setItem('lifetrack_last_steps_log', now.getTime());
      }
    }
  },

  /**
   * Check daily workout target muscle group split on app launch
   */
  checkWorkoutDailySplit() {
    const userData = DataEngine.getCurrentUserData();
    if (!userData) return;

    const rem = userData.reminders;
    if (!rem.workout.active) return;

    const todayStr = DataEngine.getTodayDateString();
    const alertedKey = `lifetrack_alert_workout_split`;
    
    if (localStorage.getItem(alertedKey) === todayStr) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[new Date().getDay()];
    
    const splits = {
      'Monday': 'Chest Day',
      'Tuesday': 'Back Day',
      'Wednesday': 'Legs Day',
      'Thursday': 'Cardio Focus',
      'Friday': 'Shoulder Day',
      'Saturday': 'Core Workout',
      'Sunday': 'Active Rest Stretch'
    };

    const targetSplit = splits[dayName] || 'Rest Day';
    
    if (targetSplit !== 'Rest Day') {
      setTimeout(() => {
        this.notify('Today\'s Workout Split', `Ready for exercise? Today is ${targetSplit}! 🏋️`, 'success');
        localStorage.setItem(alertedKey, todayStr);
      }, 5000); // delay slightly on launch
    }
  },

  /**
   * Helper called by logging triggers to reset timer timestamps
   */
  resetWaterTimer() {
    localStorage.setItem('lifetrack_last_water_log', Date.now());
  },

  resetStepsTimer() {
    localStorage.setItem('lifetrack_last_steps_log', Date.now());
  }
};
