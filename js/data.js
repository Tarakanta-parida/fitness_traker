// LifeTrack Data Layer & Persistence Engine

const STORAGE_PREFIX = 'lifetrack_';

// Default configuration for a new profile
const DEFAULT_PROFILE = {
  name: 'Health Enthusiast',
  weight: 70, // kg
  height: 175, // cm
  age: 28,
  gender: 'male',
  goal: 'maintain', // 'lose', 'gain', 'maintain'
  diet: 'veg', // 'veg', 'nonveg'
  preference: 'balanced',
  allergy: 'none',
  budget: 150, // weekly budget in USD or local currency
  waterTarget: 3000, // ml
  stepsTarget: 10000,
  sleepTarget: 8 // hours
};

// Reminder presets
const DEFAULT_REMINDERS = {
  water: { active: true, interval: 120, target: 3000 }, // 120 mins
  workout: { active: true, days: ['Monday', 'Wednesday', 'Friday'], type: 'cardio' },
  sleep: { active: true, time: '22:30' },
  meal: { active: true, breakfast: '08:00', lunch: '13:00', dinner: '20:00' },
  walk: { active: false, interval: 60 } // every 60 mins of sitting
};

/**
 * Initialize storage with key utilities
 */
export const DataEngine = {
  /**
   * Helper to write to LocalStorage
   */
  write(key, data) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  },

  /**
   * Helper to read from LocalStorage
   */
  read(key) {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : null;
  },

  /**
   * Check if a user exists
   */
  userExists(username) {
    const users = this.read('users') || [];
    return users.some(u => u.username.toLowerCase() === username.toLowerCase());
  },

  /**
   * Register a new user and generate mock history
   */
  registerUser(username, password, fullName) {
    if (this.userExists(username)) return { success: false, error: 'User already exists' };

    const users = this.read('users') || [];
    users.push({ username, password, fullName });
    this.write('users', users);

    // Create user-specific data store
    const userData = {
      profile: { ...DEFAULT_PROFILE, name: fullName },
      reminders: { ...DEFAULT_REMINDERS },
      logs: this.generateMockHistory(DEFAULT_PROFILE),
      mealPlan: null
    };
    
    this.write(`userdata_${username}`, userData);
    return { success: true };
  },

  /**
   * Authenticate a user
   */
  loginUser(username, password) {
    const users = this.read('users') || [];
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) return { success: false, error: 'Invalid username or password' };
    
    // Set current active user session
    localStorage.setItem(STORAGE_PREFIX + 'current_user', username);
    return { success: true, user };
  },

  /**
   * Log out current user
   */
  logout() {
    localStorage.removeItem(STORAGE_PREFIX + 'current_user');
  },

  /**
   * Get active logged in user
   */
  getCurrentUser() {
    return localStorage.getItem(STORAGE_PREFIX + 'current_user');
  },

  /**
   * Get current user's full data
   */
  getCurrentUserData() {
    const username = this.getCurrentUser();
    if (!username) return null;
    let data = this.read(`userdata_${username}`);
    
    // Ensure today's log entry exists
    if (data) {
      const todayStr = this.getTodayDateString();
      if (!data.logs[todayStr]) {
        data.logs[todayStr] = this.createNewDayLog(data.profile);
        this.write(`userdata_${username}`, data);
      }
    }
    return data;
  },

  /**
   * Save current user's data
   */
  saveCurrentUserData(data) {
    const username = this.getCurrentUser();
    if (!username) return false;
    this.write(`userdata_${username}`, data);
    return true;
  },

  /**
   * Helper to get date string YYYY-MM-DD
   */
  getTodayDateString(offsetDays = 0) {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Structure for a new blank day log
   */
  createNewDayLog(profile) {
    return {
      steps: 0,
      water: 0,
      caloriesConsumed: 0,
      caloriesBurned: 0,
      sleep: 0,
      mood: '', // 'excellent', 'good', 'neutral', 'tired', 'stressed'
      weight: profile.weight, // default to profile weight
      workouts: []
    };
  },

  /**
   * Generate 30 days of mock history for charts visualization
   */
  generateMockHistory(profile) {
    const logs = {};
    const workoutTypes = ['Running', 'Walking', 'Cycling', 'Workout', 'Yoga'];
    const moods = ['excellent', 'good', 'neutral', 'tired', 'stressed'];
    
    // Generate data for past 30 days
    for (let i = 30; i >= 0; i--) {
      const dateStr = this.getTodayDateString(-i);
      
      // Seed step values with slight fluctuations and progression
      const steps = Math.floor(4000 + Math.random() * 8000);
      const water = Math.floor(1500 + Math.random() * 2000); // 1.5L to 3.5L
      const sleep = parseFloat((5.5 + Math.random() * 3).toFixed(1)); // 5.5 to 8.5 hrs
      
      // Calculate workout burned calories
      const workouts = [];
      let burnedWorkoutCals = 0;
      
      // 50% chance of a workout on any mock day
      if (Math.random() > 0.5) {
        const type = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
        const duration = Math.floor(20 + Math.random() * 50); // 20 - 70 mins
        let met = 3.0; // metabolic equivalent
        if (type === 'Running') met = 8.0;
        else if (type === 'Cycling') met = 6.0;
        else if (type === 'Workout') met = 5.0;
        else if (type === 'Yoga') met = 2.5;
        
        // calories = MET * weight_kg * (duration_mins / 60)
        const calories = Math.round(met * profile.weight * (duration / 60));
        const distance = parseFloat(((met * 1.5 * (duration / 60))).toFixed(1)); // mock distance in km

        const startHour = Math.floor(7 + Math.random() * 11);
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(startHour + Math.floor(duration/60)).padStart(2, '0')}:${String(duration%60).padStart(2, '0')}`;

        workouts.push({
          type,
          startTime,
          endTime,
          duration,
          calories,
          distance
        });
        burnedWorkoutCals = calories;
      }
      
      // Steps calories burned: ~0.04 calories per step
      const stepsBurned = Math.round(steps * 0.04);
      const baseMetabolism = 1600; // Average BMR
      const caloriesBurned = baseMetabolism + stepsBurned + burnedWorkoutCals;
      
      // Calories consumed (close to BMR/burned for maintenance, or higher/lower)
      let caloriesConsumed = 2000 + Math.floor(Math.random() * 600) - 300;
      if (profile.goal === 'lose') {
        caloriesConsumed = Math.round(caloriesBurned - 400 + (Math.random() * 200 - 100));
      } else if (profile.goal === 'gain') {
        caloriesConsumed = Math.round(caloriesBurned + 300 + (Math.random() * 200 - 100));
      }

      // Weight trend: gradual change over the 30 days
      let weightOffset = 0;
      if (profile.goal === 'lose') {
        // Lose ~1.5kg over 30 days
        weightOffset = -((30 - i) * 0.05) + (Math.random() * 0.4 - 0.2);
      } else if (profile.goal === 'gain') {
        weightOffset = ((30 - i) * 0.04) + (Math.random() * 0.4 - 0.2);
      } else {
        weightOffset = Math.random() * 0.6 - 0.3;
      }
      
      logs[dateStr] = {
        steps,
        water,
        caloriesConsumed,
        caloriesBurned,
        sleep,
        mood: moods[Math.floor(Math.random() * moods.length)],
        weight: parseFloat((profile.weight + weightOffset).toFixed(1)),
        workouts
      };
    }
    
    // Today's log initialized to 0s for user tracking
    const todayStr = this.getTodayDateString(0);
    logs[todayStr] = this.createNewDayLog(profile);
    
    return logs;
  },

  /**
   * Calculate current streak (days in a row meeting steps or water goal)
   */
  calculateStreak(username) {
    const data = this.read(`userdata_${username}`);
    if (!data) return 0;
    
    const logs = data.logs;
    const stepGoal = data.profile.stepsTarget;
    let streak = 0;
    
    // Start scanning backwards from yesterday
    let checkDay = 1; // start checking yesterday
    while (true) {
      const dateStr = this.getTodayDateString(-checkDay);
      const log = logs[dateStr];
      
      // If we don't have a log or step goal wasn't met, streak breaks
      if (!log || log.steps < stepGoal) {
        break;
      }
      
      streak++;
      checkDay++;
    }
    
    // Check if today also achieved the goal (adds to current streak display)
    const todayStr = this.getTodayDateString(0);
    if (logs[todayStr] && logs[todayStr].steps >= stepGoal) {
      streak++;
    }
    
    return streak;
  }
};
