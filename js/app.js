// LifeTrack Main Application Controller
import { DataEngine } from './data.js';
import { MealPlanner } from './mealPlanner.js';
import { AnalyticsEngine } from './analytics.js';
import { ReminderEngine } from './reminders.js';

// Application State
const state = {
  currentView: 'dashboard',
  historyFilter: 'daily'
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Initialize application routing, login gates, and global event listeners
 */
function initApp() {
  const username = DataEngine.getCurrentUser();

  if (!username) {
    showAuth();
  } else {
    showWorkspace();
  }

  setupEventListeners();
}

/**
 * Switch views to Authorization Panel
 */
function showAuth() {
  document.getElementById('auth-container').style.display = 'flex';
  document.getElementById('app-workspace').style.display = 'none';
  document.getElementById('login-card').style.display = 'block';
  document.getElementById('signup-card').style.display = 'none';
}

/**
 * Switch views to Main Workspace
 */
function showWorkspace() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-workspace').style.display = 'flex';
  
  // Set date text
  updateDateDisplay();
  
  // Synchronize profile details to header/sidebar
  syncProfileData();
  
  // Go to default view
  switchView('dashboard');
  
  // Initialize reminder alert background checks
  ReminderEngine.startReminders();
}

/**
 * Update the UI displays for the current date
 */
function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', options);
  
  document.getElementById('current-date-display').innerText = dateStr;
}

/**
 * Sync user name and credentials across widgets
 */
function syncProfileData() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;

  const fullName = userData.profile.name || 'User';
  document.getElementById('sidebar-user-name').innerText = fullName;
  
  // Initials for avatar
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('sidebar-avatar').innerText = initials;
  
  const profileAvatar = document.getElementById('profile-avatar-display');
  if (profileAvatar) profileAvatar.innerText = initials;
  const profileDisplayName = document.getElementById('profile-display-name');
  if (profileDisplayName) profileDisplayName.innerText = fullName;
}

/**
 * SPA View Switching (Routing)
 */
function switchView(viewName) {
  state.currentView = viewName;
  
  // Hide all views
  const views = document.querySelectorAll('.view-section');
  views.forEach(v => v.classList.remove('active'));
  
  // Show active view
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) targetView.classList.add('active');

  // Update navigation items active status
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Render view-specific content
  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');

  switch (viewName) {
    case 'dashboard':
      viewTitle.innerText = 'Dashboard';
      viewSubtitle.innerText = "Welcome back! Here's your lifestyle report.";
      renderDashboard();
      break;
    case 'activity':
      viewTitle.innerText = 'Log Activity';
      viewSubtitle.innerText = 'Add details about your movements, workouts, and steps.';
      renderActivityTracker();
      break;
    case 'meals':
      viewTitle.innerText = 'Meal Planner';
      viewSubtitle.innerText = 'Generate personalized, budget-friendly meal guides and shopping lists.';
      renderMealPlanner();
      break;
    case 'reminders':
      viewTitle.innerText = 'Reminders';
      viewSubtitle.innerText = 'Set custom timers and notification schedules for daily habits.';
      renderReminders();
      break;
    case 'analytics':
      viewTitle.innerText = 'Analytics Dashboard';
      viewSubtitle.innerText = 'View visual charts of your progress, weight trends, and calories.';
      renderAnalytics();
      break;
    case 'history':
      viewTitle.innerText = 'Health Logs';
      viewSubtitle.innerText = 'Review past metrics and export high-fidelity reports.';
      renderHistory();
      break;
    case 'profile':
      viewTitle.innerText = 'User Profile';
      viewSubtitle.innerText = 'Adjust your personal dimensions, dietary requirements, and daily targets.';
      renderProfile();
      break;
  }
  
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Today's Dashboard stats & progress circle
 */
export function renderDashboard() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;

  const todayStr = DataEngine.getTodayDateString();
  const log = userData.logs[todayStr] || DataEngine.createNewDayLog(userData.profile);
  const profile = userData.profile;

  // Set metric text values
  document.getElementById('dash-steps').innerText = log.steps.toLocaleString();
  document.getElementById('dash-steps-goal').innerText = `Goal: ${profile.stepsTarget.toLocaleString()} steps`;
  
  document.getElementById('dash-water').innerText = `${log.water.toLocaleString()} mL`;
  document.getElementById('dash-water-goal').innerText = `Goal: ${profile.waterTarget.toLocaleString()} mL`;

  const netCals = log.caloriesConsumed - log.caloriesBurned;
  document.getElementById('dash-calories-net').innerText = `${netCals.toLocaleString()} kcal`;
  document.getElementById('dash-calories-consumed').innerText = log.caloriesConsumed.toLocaleString();
  document.getElementById('dash-calories-burned').innerText = log.caloriesBurned.toLocaleString();

  document.getElementById('dash-sleep').innerText = `${log.sleep} hrs`;
  document.getElementById('dash-sleep-goal').innerText = `Goal: ${profile.sleepTarget} hrs`;

  // Calculate and update progress bars
  const stepPercent = Math.min(100, Math.round((log.steps / profile.stepsTarget) * 100));
  const waterPercent = Math.min(100, Math.round((log.water / profile.waterTarget) * 100));

  document.getElementById('dash-steps-bar').style.width = `${stepPercent}%`;
  document.getElementById('dash-water-bar').style.width = `${waterPercent}%`;
  document.getElementById('dash-water-percent').innerText = `${waterPercent}%`;

  // Main Daily Goal Achievement Ring (average of steps & water percentages)
  const averageGoalPercent = Math.round((stepPercent + waterPercent) / 2);
  document.getElementById('today-progress-percent').innerText = `${averageGoalPercent}%`;
  
  // Circular dash offsets calculation (circumference is 2 * pi * r = 2 * 3.14159 * 70 = 439.8 -> 440)
  const circle = document.getElementById('today-progress-circle');
  if (circle) {
    const circumference = 440;
    const offset = circumference - (circumference * (averageGoalPercent / 100));
    circle.style.strokeDashoffset = offset;
  }
  
  // Dashboard Text recommendation summary
  let progressText = `Keep moving! You are ${averageGoalPercent}% towards steps & water targets.`;
  if (averageGoalPercent >= 100) {
    progressText = "Fantastic! You've crushed today's targets! 🎉";
  } else if (averageGoalPercent >= 70) {
    progressText = "Almost there! A short walk or a glass of water will seal the day.";
  }
  document.getElementById('today-progress-summary').innerText = progressText;

  // Active Mood state highlight
  const moodButtons = document.querySelectorAll('.mood-btn');
  moodButtons.forEach(btn => {
    if (btn.getAttribute('data-mood') === log.mood) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Streaks count
  const username = DataEngine.getCurrentUser();
  const stepStreak = DataEngine.calculateStreak(username);
  document.getElementById('steps-streak-count').innerText = stepStreak;
  
  // Log count streak (days logged in the database)
  const totalDaysLogged = Object.keys(userData.logs).filter(k => {
    const day = userData.logs[k];
    return day.steps > 0 || day.water > 0 || day.sleep > 0 || day.workouts.length > 0;
  }).length;
  document.getElementById('overall-streak-count').innerText = totalDaysLogged;

  // Exercise Split display
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[new Date().getDay()];
  
  // Split Mapping
  const splits = {
    'Monday': { title: 'Chest Day', desc: 'Suggested: Bench press, Incline dumbbell flies, Pushups' },
    'Tuesday': { title: 'Back Day', desc: 'Suggested: Pullups, Barbell rows, Lat pulldowns, Deadlifts' },
    'Wednesday': { title: 'Legs Day', desc: 'Suggested: Squats, Lunges, Calf raises, Leg extensions' },
    'Thursday': { title: 'Cardio Focus', desc: 'Suggested: 30 min Running, Cycling or HIIT workout' },
    'Friday': { title: 'Shoulders Day', desc: 'Suggested: Overhead press, Lateral raises, Shrugs' },
    'Saturday': { title: 'Core Split', desc: 'Suggested: Planks, Leg raises, Russian twists, Crunches' },
    'Sunday': { title: 'Active Rest Day', desc: 'Suggested: Gentle yoga stretch or 45 min light walking' }
  };
  
  const currentSplit = splits[dayName] || { title: 'Rest Day', desc: 'Enjoy rest!' };
  document.getElementById('workout-split-day-label').innerText = `${dayName} Split`;
  document.getElementById('dash-workout-target-name').innerText = currentSplit.title;
  document.getElementById('dash-workout-target-desc').innerText = currentSplit.desc;

  // Logged activities summary list on dashboard
  const activitiesList = document.getElementById('dash-today-activities-list');
  activitiesList.innerHTML = '';
  
  if (log.workouts.length === 0) {
    activitiesList.innerHTML = '<div style="color: hsl(var(--text-muted)); text-align: center; padding: 1rem 0;">No activities logged today yet.</div>';
  } else {
    log.workouts.forEach(w => {
      const item = document.createElement('div');
      item.className = 'glass-card';
      item.style.padding = '0.75rem';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-weight:600;">${w.type}</span>
          <span style="font-size:0.75rem; color:hsl(var(--text-secondary));">(${w.duration} mins)</span>
        </div>
        <span style="font-weight:700; color:hsl(var(--accent-workout));">+${w.calories} kcal</span>
      `;
      activitiesList.appendChild(item);
    });
  }
}

/**
 * Render steps details and activities inside the Activity Logger view
 */
function renderActivityTracker() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;
  
  const todayStr = DataEngine.getTodayDateString();
  const log = userData.logs[todayStr] || DataEngine.createNewDayLog(userData.profile);
  
  document.getElementById('log-steps-display').innerText = log.steps.toLocaleString();
  
  // Set current time as workout start default
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  document.getElementById('workout-start').value = timeStr;

  // Populate logged workouts table
  const tbody = document.getElementById('today-workouts-table-body');
  tbody.innerHTML = '';
  
  if (log.workouts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: hsl(var(--text-muted));">No activities logged today.</td>
      </tr>
    `;
  } else {
    log.workouts.forEach((w, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${w.type}</td>
        <td>${w.startTime} - ${w.endTime || 'N/A'}</td>
        <td>${w.duration} mins</td>
        <td>${w.distance > 0 ? w.distance + ' km' : '-'}</td>
        <td style="color: hsl(var(--accent-workout)); font-weight:700;">${w.calories} kcal</td>
        <td>
          <button class="btn btn-danger btn-icon remove-workout-btn" data-index="${index}" style="width:28px; height:28px;">
            <i data-lucide="trash-2" style="width:14px;"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Add remove listeners
    document.querySelectorAll('.remove-workout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        removeWorkout(idx);
      });
    });
    
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Handle workout removal
 */
function removeWorkout(index) {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;

  const todayStr = DataEngine.getTodayDateString();
  const log = userData.logs[todayStr];
  
  if (log && log.workouts[index]) {
    const workout = log.workouts[index];
    log.caloriesBurned -= workout.calories;
    log.workouts.splice(index, 1);
    
    DataEngine.saveCurrentUserData(userData);
    toast('Activity removed', 'info');
    renderActivityTracker();
  }
}

/**
 * Render Meal Recommendations form & items
 */
function renderMealPlanner() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;

  const profile = userData.profile;
  
  // Prefill details from profile
  document.getElementById('meal-weight').value = profile.weight;
  document.getElementById('meal-height').value = profile.height;
  document.getElementById('meal-goal').value = profile.goal;
  document.getElementById('meal-diet').value = profile.diet;
  document.getElementById('meal-pref').value = profile.preference || 'balanced';
  document.getElementById('meal-allergy').value = profile.allergy || 'none';
  document.getElementById('meal-budget').value = profile.budget || 150;

  // Render existing meal plan if generated
  if (userData.mealPlan) {
    MealPlanner.displayPlan(userData.mealPlan);
  } else {
    document.getElementById('meal-plan-results-area').style.display = 'none';
  }
}

/**
 * Render active notifications triggers settings
 */
function renderReminders() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;
  
  const rem = userData.reminders;
  
  // Bind toggle checkboxes
  document.getElementById('remind-water-toggle').checked = rem.water.active;
  document.getElementById('remind-workout-toggle').checked = rem.workout.active;
  document.getElementById('remind-sleep-toggle').checked = rem.sleep.active;
  document.getElementById('remind-meal-toggle').checked = rem.meal.active;
  document.getElementById('remind-walk-toggle').checked = rem.walk.active;

  // Bind values
  document.getElementById('remind-water-interval').value = Math.round(rem.water.interval / 60) || 2;
  document.getElementById('remind-water-amount').value = rem.water.target || 3000;
  
  document.getElementById('remind-sleep-time').value = rem.sleep.time || '22:30';
  
  document.getElementById('remind-breakfast-time').value = rem.meal.breakfast || '08:00';
  document.getElementById('remind-lunch-time').value = rem.meal.lunch || '13:00';
  document.getElementById('remind-dinner-time').value = rem.meal.dinner || '20:00';
  
  document.getElementById('remind-walk-interval').value = rem.walk.interval || 60;
}

/**
 * Render visual analytics
 */
function renderAnalytics() {
  AnalyticsEngine.initCharts();
}

/**
 * Render history tab logs and pdf compiling
 */
function renderHistory() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;
  
  const tbody = document.getElementById('history-table-body');
  tbody.innerHTML = '';

  const logs = userData.logs;
  const sortedDates = Object.keys(logs).sort((a, b) => new Date(b) - new Date(a));

  if (state.historyFilter === 'daily') {
    // Standard daily list
    sortedDates.forEach(date => {
      const day = logs[date];
      const workoutNames = day.workouts.map(w => w.type).join(', ') || 'None';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${date}</td>
        <td>${day.steps.toLocaleString()}</td>
        <td>${day.water.toLocaleString()} ml</td>
        <td style="color: hsl(var(--accent-calories));">${day.caloriesConsumed} kcal</td>
        <td style="color: hsl(var(--accent-workout));">${day.caloriesBurned} kcal</td>
        <td>${day.sleep} hrs</td>
        <td>${day.weight} kg</td>
        <td style="font-size:0.8rem; color:hsl(var(--text-secondary));">${workoutNames}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    // Aggregate by weekly / monthly / yearly
    const groupings = groupLogs(sortedDates, logs, state.historyFilter);
    groupings.forEach(g => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${g.label}</td>
        <td>Avg: ${Math.round(g.steps).toLocaleString()}</td>
        <td>Avg: ${Math.round(g.water).toLocaleString()} ml</td>
        <td style="color: hsl(var(--accent-calories));">Avg: ${Math.round(g.caloriesConsumed)} kcal</td>
        <td style="color: hsl(var(--accent-workout));">Avg: ${Math.round(g.caloriesBurned)} kcal</td>
        <td>Avg: ${g.sleep.toFixed(1)} hrs</td>
        <td>Avg: ${g.weight.toFixed(1)} kg</td>
        <td style="font-size:0.8rem; color:hsl(var(--text-secondary));">Count: ${g.workoutCount}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

/**
 * Group logic for history filtering
 */
function groupLogs(dates, logs, type) {
  const groups = {};

  dates.forEach(d => {
    const dateObj = new Date(d);
    let key, label;

    if (type === 'weekly') {
      // Get start date of the week (Sunday)
      const first = dateObj.getDate() - dateObj.getDay();
      const firstDay = new Date(dateObj.setDate(first));
      key = firstDay.toISOString().split('T')[0];
      label = `Week of ${firstDay.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`;
    } else if (type === 'monthly') {
      key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      label = dateObj.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
    } else if (type === 'yearly') {
      key = `${dateObj.getFullYear()}`;
      label = `Year ${dateObj.getFullYear()}`;
    }

    if (!groups[key]) {
      groups[key] = { label, steps: [], water: [], caloriesConsumed: [], caloriesBurned: [], sleep: [], weight: [], workoutCount: 0 };
    }

    const day = logs[d];
    groups[key].steps.push(day.steps);
    groups[key].water.push(day.water);
    groups[key].caloriesConsumed.push(day.caloriesConsumed);
    groups[key].caloriesBurned.push(day.caloriesBurned);
    groups[key].sleep.push(day.sleep);
    groups[key].weight.push(day.weight);
    groups[key].workoutCount += day.workouts.length;
  });

  return Object.keys(groups).map(k => {
    const g = groups[k];
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      label: g.label,
      steps: avg(g.steps),
      water: avg(g.water),
      caloriesConsumed: avg(g.caloriesConsumed),
      caloriesBurned: avg(g.caloriesBurned),
      sleep: avg(g.sleep),
      weight: avg(g.weight),
      workoutCount: g.workoutCount
    };
  });
}

/**
 * Render Profile management form
 */
function renderProfile() {
  const userData = DataEngine.getCurrentUserData();
  if (!userData) return;
  
  const p = userData.profile;
  document.getElementById('profile-name').value = p.name;
  document.getElementById('profile-gender').value = p.gender;
  document.getElementById('profile-age').value = p.age;
  document.getElementById('profile-weight').value = p.weight;
  document.getElementById('profile-height').value = p.height;
  document.getElementById('profile-goal').value = p.goal;
  
  document.getElementById('profile-target-steps').value = p.stepsTarget;
  document.getElementById('profile-target-water').value = p.waterTarget;
  document.getElementById('profile-target-sleep').value = p.sleepTarget;
}

/**
 * Initialize event handlers for modals, toggles, form submits
 */
function setupEventListeners() {
  // Navigation Links
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute('data-view');
      switchView(view);
    });
  });

  // Auth screen toggle links
  document.getElementById('switch-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('signup-card').style.display = 'block';
  });

  document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-card').style.display = 'none';
    document.getElementById('login-card').style.display = 'block';
  });

  // Submit Sign In form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value;

    const res = DataEngine.loginUser(userVal, passVal);
    if (res.success) {
      toast('Login Successful!', 'success');
      showWorkspace();
    } else {
      toast(res.error, 'warning');
    }
  });

  // Submit Sign Up form
  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('signup-name').value.trim();
    const userVal = document.getElementById('signup-username').value.trim();
    const passVal = document.getElementById('signup-password').value;

    const res = DataEngine.registerUser(userVal, passVal, nameVal);
    if (res.success) {
      toast('Registration complete! Signing in...', 'success');
      DataEngine.loginUser(userVal, passVal);
      showWorkspace();
    } else {
      toast(res.error, 'warning');
    }
  });

  // Logout button
  document.getElementById('logout-button').addEventListener('click', () => {
    DataEngine.logout();
    toast('Logged Out Successfully', 'info');
    showAuth();
  });

  // Today Date details button clicks
  document.getElementById('header-today-btn').addEventListener('click', () => {
    updateDateDisplay();
    toast('Date display synchronized', 'info');
  });

  // QUICK LOG MODAL bindings
  const qlModal = document.getElementById('quick-log-modal');
  document.getElementById('quick-log-btn').addEventListener('click', () => {
    // Prefill modal weight/sleep if logged
    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      const todayStr = DataEngine.getTodayDateString();
      const log = userData.logs[todayStr] || {};
      document.getElementById('quick-weight-input').value = log.weight || userData.profile.weight;
      document.getElementById('quick-sleep-input').value = log.sleep || '';
    }
    
    // Clear other quick fields
    document.getElementById('quick-water-input').value = '';
    document.getElementById('quick-calories-input').value = '';

    qlModal.classList.add('show');
  });

  document.getElementById('close-quick-log-modal').addEventListener('click', () => {
    qlModal.classList.remove('show');
  });

  // Close modal clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === qlModal) {
      qlModal.classList.remove('show');
    }
  });

  // Submit Quick Metrics Log
  document.getElementById('quick-log-metrics-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const water = parseInt(document.getElementById('quick-water-input').value) || 0;
    const cals = parseInt(document.getElementById('quick-calories-input').value) || 0;
    const sleep = parseFloat(document.getElementById('quick-sleep-input').value) || 0;
    const weight = parseFloat(document.getElementById('quick-weight-input').value) || 0;

    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      const todayStr = DataEngine.getTodayDateString();
      const log = userData.logs[todayStr];
      
      log.water += water;
      log.caloriesConsumed += cals;
      if (sleep > 0) log.sleep = sleep;
      if (weight > 0) log.weight = weight;

      DataEngine.saveCurrentUserData(userData);
      qlModal.classList.remove('show');
      toast('Health metrics logged successfully', 'success');
      
      if (water > 0) {
        ReminderEngine.resetWaterTimer();
      }
      
      if (state.currentView === 'dashboard') renderDashboard();
      else if (state.currentView === 'activity') renderActivityTracker();
    }
  });

  // Quick hydration clickers (+250ml / +500ml)
  document.querySelectorAll('.water-btn[data-water]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const waterAmt = parseInt(e.currentTarget.getAttribute('data-water'));
      const userData = DataEngine.getCurrentUserData();
      if (userData) {
        const todayStr = DataEngine.getTodayDateString();
        userData.logs[todayStr].water += waterAmt;
        DataEngine.saveCurrentUserData(userData);
        toast(`Added +${waterAmt}mL Water 💧`, 'success');
        ReminderEngine.resetWaterTimer();
        renderDashboard();
      }
    });
  });

  // Mood Tracker buttons
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const moodVal = e.currentTarget.getAttribute('data-mood');
      const userData = DataEngine.getCurrentUserData();
      if (userData) {
        const todayStr = DataEngine.getTodayDateString();
        userData.logs[todayStr].mood = moodVal;
        DataEngine.saveCurrentUserData(userData);
        toast(`Mood set to: ${moodVal}`, 'info');
        
        // Update selection UI
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      }
    });
  });

  // Step increments in activity log view
  document.querySelectorAll('[data-steps-inc]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const stepsInc = parseInt(e.currentTarget.getAttribute('data-steps-inc'));
      const userData = DataEngine.getCurrentUserData();
      if (userData) {
        const todayStr = DataEngine.getTodayDateString();
        userData.logs[todayStr].steps += stepsInc;
        
        // Steps calories burned: ~0.04 calories per step
        userData.logs[todayStr].caloriesBurned += Math.round(stepsInc * 0.04);
        
        DataEngine.saveCurrentUserData(userData);
        toast(`Added +${stepsInc} steps 👟`, 'success');
        ReminderEngine.resetStepsTimer();
        renderActivityTracker();
      }
    });
  });

  // Submit manual steps
  document.getElementById('submit-steps-btn').addEventListener('click', () => {
    const input = document.getElementById('add-steps-input');
    const stepsInc = parseInt(input.value) || 0;
    if (stepsInc <= 0) {
      toast('Please enter a valid step count', 'warning');
      return;
    }
    
    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      const todayStr = DataEngine.getTodayDateString();
      userData.logs[todayStr].steps += stepsInc;
      
      // Calories burned steps
      userData.logs[todayStr].caloriesBurned += Math.round(stepsInc * 0.04);
      
      DataEngine.saveCurrentUserData(userData);
      input.value = '';
      toast(`Successfully logged ${stepsInc} steps`, 'success');
      ReminderEngine.resetStepsTimer();
      renderActivityTracker();
    }
  });

  // Submit workout logger form
  document.getElementById('log-workout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('workout-type').value;
    const duration = parseInt(document.getElementById('workout-duration').value);
    const startTime = document.getElementById('workout-start').value;
    const distance = parseFloat(document.getElementById('workout-distance').value) || 0;

    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      const todayStr = DataEngine.getTodayDateString();
      
      // Calculate workout burned calories
      let met = 3.0; // metabolic equivalent
      if (type === 'Running') met = 8.0;
      else if (type === 'Cycling') met = 6.0;
      else if (type === 'Workout') met = 5.0;
      else if (type === 'Yoga') met = 2.5;
      
      const calories = Math.round(met * userData.profile.weight * (duration / 60));
      
      // Calculate end time
      const [h, m] = startTime.split(':').map(Number);
      const endMinsTotal = h * 60 + m + duration;
      const endH = String(Math.floor(endMinsTotal / 60) % 24).padStart(2, '0');
      const endM = String(endMinsTotal % 60).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const newWorkout = {
        type,
        startTime,
        endTime,
        duration,
        calories,
        distance
      };

      userData.logs[todayStr].workouts.push(newWorkout);
      userData.logs[todayStr].caloriesBurned += calories;

      DataEngine.saveCurrentUserData(userData);
      
      // Clear fields
      document.getElementById('workout-duration').value = '';
      document.getElementById('workout-distance').value = '0';
      
      toast(`Logged ${type} Workout: +${calories} kcal burned!`, 'success');
      renderActivityTracker();
    }
  });

  // Dashboard "Log Workout" shortcut
  document.getElementById('dash-mark-workout-btn').addEventListener('click', () => {
    switchView('activity');
  });

  // Meal Planner Form submit
  document.getElementById('meal-planner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const weight = parseFloat(document.getElementById('meal-weight').value);
    const height = parseFloat(document.getElementById('meal-height').value);
    const goal = document.getElementById('meal-goal').value;
    const diet = document.getElementById('meal-diet').value;
    const preference = document.getElementById('meal-pref').value;
    const allergy = document.getElementById('meal-allergy').value;
    const budget = parseFloat(document.getElementById('meal-budget').value);

    // Save choices to profile
    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      userData.profile.weight = weight;
      userData.profile.height = height;
      userData.profile.goal = goal;
      userData.profile.diet = diet;
      userData.profile.preference = preference;
      userData.profile.allergy = allergy;
      userData.profile.budget = budget;
      
      // Generate meal plan
      const mealPlan = MealPlanner.generate(userData.profile);
      userData.mealPlan = mealPlan;
      
      DataEngine.saveCurrentUserData(userData);
      toast('Custom budget meal plan generated!', 'success');
      
      // Render
      MealPlanner.displayPlan(mealPlan);
    }
  });

  // Grocery printing button click
  document.getElementById('grocery-print-btn').addEventListener('click', () => {
    window.print();
  });

  // Reminders Notification Settings form
  document.getElementById('save-reminders-settings-btn').addEventListener('click', () => {
    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      userData.reminders.water.active = document.getElementById('remind-water-toggle').checked;
      userData.reminders.workout.active = document.getElementById('remind-workout-toggle').checked;
      userData.reminders.sleep.active = document.getElementById('remind-sleep-toggle').checked;
      userData.reminders.meal.active = document.getElementById('remind-meal-toggle').checked;
      userData.reminders.walk.active = document.getElementById('remind-walk-toggle').checked;

      userData.reminders.water.interval = (parseInt(document.getElementById('remind-water-interval').value) || 2) * 60;
      userData.reminders.water.target = parseInt(document.getElementById('remind-water-amount').value) || 3000;
      
      userData.reminders.sleep.time = document.getElementById('remind-sleep-time').value;
      
      userData.reminders.meal.breakfast = document.getElementById('remind-breakfast-time').value;
      userData.reminders.meal.lunch = document.getElementById('remind-lunch-time').value;
      userData.reminders.meal.dinner = document.getElementById('remind-dinner-time').value;
      
      userData.reminders.walk.interval = parseInt(document.getElementById('remind-walk-interval').value) || 60;

      // Update base profile water target to match
      userData.profile.waterTarget = userData.reminders.water.target;

      DataEngine.saveCurrentUserData(userData);
      
      // Request browser permission if needed
      ReminderEngine.requestBrowserPermission();
      
      toast('Notification settings saved', 'success');
      
      // Restart background timers
      ReminderEngine.startReminders();
    }
  });

  // Profile Settings Form submit
  document.getElementById('profile-settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const gender = document.getElementById('profile-gender').value;
    const age = parseInt(document.getElementById('profile-age').value);
    const weight = parseFloat(document.getElementById('profile-weight').value);
    const height = parseFloat(document.getElementById('profile-height').value);
    const goal = document.getElementById('profile-goal').value;
    
    const stepsTarget = parseInt(document.getElementById('profile-target-steps').value);
    const waterTarget = parseInt(document.getElementById('profile-target-water').value);
    const sleepTarget = parseFloat(document.getElementById('profile-target-sleep').value);

    const userData = DataEngine.getCurrentUserData();
    if (userData) {
      userData.profile.name = name;
      userData.profile.gender = gender;
      userData.profile.age = age;
      userData.profile.weight = weight;
      userData.profile.height = height;
      userData.profile.goal = goal;
      
      userData.profile.stepsTarget = stepsTarget;
      userData.profile.waterTarget = waterTarget;
      userData.profile.sleepTarget = sleepTarget;

      DataEngine.saveCurrentUserData(userData);
      syncProfileData();
      toast('Profile settings updated successfully', 'success');
    }
  });

  // History views filters
  document.querySelectorAll('.history-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.historyFilter = e.currentTarget.getAttribute('data-filter');
      
      // Dynamic Headers for grouping
      const headers = document.getElementById('history-table-headers');
      if (state.historyFilter === 'daily') {
        headers.innerHTML = `
          <th>Date</th>
          <th>Steps</th>
          <th>Water</th>
          <th>Cals Consumed</th>
          <th>Cals Burned</th>
          <th>Sleep Hours</th>
          <th>Weight</th>
          <th>Workouts Logged</th>
        `;
      } else {
        headers.innerHTML = `
          <th>Time Period</th>
          <th>Steps (Daily Avg)</th>
          <th>Water (Daily Avg)</th>
          <th>Cals Consumed (Daily Avg)</th>
          <th>Cals Burned (Daily Avg)</th>
          <th>Sleep Hours (Daily Avg)</th>
          <th>Weight (Daily Avg)</th>
          <th>Workouts Logged (Total)</th>
        `;
      }
      renderHistory();
    });
  });

  // Export health report as PDF
  document.getElementById('export-history-pdf').addEventListener('click', () => {
    window.print();
  });
}

/**
 * Toast Notification Popup Helper
 */
export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  else if (type === 'warning') icon = 'alert-triangle';

  toastEl.innerHTML = `
    <i class="toast-icon" data-lucide="${icon}"></i>
    <span style="font-size:0.9rem; font-weight:500;">${message}</span>
  `;

  container.appendChild(toastEl);
  if (window.lucide) window.lucide.createIcons();

  // Remove toast after 4 seconds
  setTimeout(() => {
    toastEl.classList.add('hide');
    toastEl.addEventListener('animationend', () => {
      toastEl.remove();
    });
  }, 4000);
}
