// LifeTrack Charting & Analytics Engine
import { DataEngine } from './data.js';

// Cache for chart instances to destroy them before re-drawing
const charts = {
  weightBmi: null,
  calories: null,
  stepsWater: null,
  sleep: null
};

export const AnalyticsEngine = {
  /**
   * Initialize all Chart.js instances with 30 days of data
   */
  initCharts() {
    const userData = DataEngine.getCurrentUserData();
    if (!userData) return;

    const logs = userData.logs;
    const profile = userData.profile;

    // Get sorted dates (limit to past 30 days for clarity)
    const sortedDates = Object.keys(logs).sort((a, b) => new Date(a) - new Date(b));
    const dates30 = sortedDates.slice(-30);

    // If today has no records, make sure it is rendered
    const todayStr = DataEngine.getTodayDateString();
    if (!dates30.includes(todayStr)) {
      dates30.push(todayStr);
    }

    // Extract datasets
    const labels = dates30.map(d => {
      const parts = d.split('-');
      return `${parts[1]}/${parts[2]}`; // MM/DD format
    });

    const weightData = dates30.map(d => logs[d]?.weight || profile.weight);
    
    // Height in meters for BMI: (height / 100)
    const heightM = profile.height / 100;
    const bmiData = weightData.map(w => parseFloat((w / (heightM * heightM)).toFixed(1)));
    
    const consumedData = dates30.map(d => logs[d]?.caloriesConsumed || 0);
    const burnedData = dates30.map(d => logs[d]?.caloriesBurned || 0);
    const stepsData = dates30.map(d => logs[d]?.steps || 0);
    const waterData = dates30.map(d => logs[d]?.water || 0);
    const sleepData = dates30.map(d => logs[d]?.sleep || 0);

    // Update today's BMI badge on the card header
    const currentWeight = logs[todayStr]?.weight || profile.weight;
    const currentBmi = parseFloat((currentWeight / (heightM * heightM)).toFixed(1));
    const bmiBadge = document.getElementById('analytics-bmi-badge');
    if (bmiBadge) {
      let category = 'Normal';
      if (currentBmi < 18.5) category = 'Underweight';
      else if (currentBmi >= 25 && currentBmi < 30) category = 'Overweight';
      else if (currentBmi >= 30) category = 'Obese';
      
      bmiBadge.innerText = `BMI: ${currentBmi} (${category})`;
      
      // Color coding BMI status
      if (category === 'Normal') bmiBadge.className = 'badge badge-steps';
      else if (category === 'Overweight') bmiBadge.className = 'badge badge-workout';
      else bmiBadge.className = 'badge badge-calories';
    }

    // Chart Configuration Helpers
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const textColor = '#94a3b8'; // tailwind slate-400
    const fontSettings = {
      family: "'Inter', sans-serif",
      size: 11
    };

    // --- 1. Weight Trend & BMI Chart (Dual Axis) ---
    if (charts.weightBmi) charts.weightBmi.destroy();
    const ctxWeight = document.getElementById('chart-weight-bmi')?.getContext('2d');
    if (ctxWeight) {
      charts.weightBmi = new Chart(ctxWeight, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Weight (kg)',
              data: weightData,
              borderColor: '#8b5cf6', // Violet
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              yAxisID: 'yWeight',
              tension: 0.4,
              borderWidth: 3,
              fill: true
            },
            {
              label: 'BMI Index',
              data: bmiData,
              borderColor: '#3b82f6', // Blue
              yAxisID: 'yBmi',
              tension: 0.4,
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: fontSettings } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: fontSettings } },
            yWeight: {
              type: 'linear',
              position: 'left',
              grid: { color: gridColor },
              ticks: { color: textColor, font: fontSettings },
              title: { display: true, text: 'Weight (kg)', color: textColor }
            },
            yBmi: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: textColor, font: fontSettings },
              title: { display: true, text: 'BMI Score', color: textColor }
            }
          }
        }
      });
    }

    // --- 2. Calories Consumed vs Burned Chart ---
    if (charts.calories) charts.calories.destroy();
    const ctxCals = document.getElementById('chart-calories')?.getContext('2d');
    if (ctxCals) {
      charts.calories = new Chart(ctxCals, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Consumed (kcal)',
              data: consumedData,
              borderColor: '#f43f5e', // Rose
              backgroundColor: 'rgba(244, 63, 94, 0.05)',
              tension: 0.35,
              borderWidth: 2.5,
              fill: true
            },
            {
              label: 'Burned (kcal)',
              data: burnedData,
              borderColor: '#f97316', // Orange
              backgroundColor: 'rgba(249, 115, 22, 0.05)',
              tension: 0.35,
              borderWidth: 2.5,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: fontSettings } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: fontSettings } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: fontSettings } }
          }
        }
      });
    }

    // --- 3. Steps & Water Chart (Dual Axis) ---
    if (charts.stepsWater) charts.stepsWater.destroy();
    const ctxStepsWater = document.getElementById('chart-steps-water')?.getContext('2d');
    if (ctxStepsWater) {
      // For visual neatness, show only past 10 days of steps/water so bars don't squeeze
      const labelPast10 = labels.slice(-10);
      const stepsPast10 = stepsData.slice(-10);
      const waterPast10 = waterData.slice(-10);

      charts.stepsWater = new Chart(ctxStepsWater, {
        type: 'bar',
        data: {
          labels: labelPast10,
          datasets: [
            {
              label: 'Steps Taken',
              data: stepsPast10,
              backgroundColor: 'rgba(16, 185, 129, 0.55)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              yAxisID: 'ySteps'
            },
            {
              label: 'Water (mL)',
              data: waterPast10,
              backgroundColor: 'rgba(59, 130, 246, 0.55)',
              borderColor: '#3b82f6',
              borderWidth: 1.5,
              yAxisID: 'yWater'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: fontSettings } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: fontSettings } },
            ySteps: {
              type: 'linear',
              position: 'left',
              grid: { color: gridColor },
              ticks: { color: textColor, font: fontSettings },
              title: { display: true, text: 'Steps count', color: textColor }
            },
            yWater: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: textColor, font: fontSettings },
              title: { display: true, text: 'Water Intake (mL)', color: textColor }
            }
          }
        }
      });
    }

    // --- 4. Sleep Chart ---
    if (charts.sleep) charts.sleep.destroy();
    const ctxSleep = document.getElementById('chart-sleep')?.getContext('2d');
    if (ctxSleep) {
      // Show past 10 days
      const labelPast10 = labels.slice(-10);
      const sleepPast10 = sleepData.slice(-10);

      charts.sleep = new Chart(ctxSleep, {
        type: 'bar',
        data: {
          labels: labelPast10,
          datasets: [
            {
              label: 'Sleep Hours',
              data: sleepPast10,
              backgroundColor: 'rgba(139, 92, 246, 0.45)',
              borderColor: '#8b5cf6',
              borderWidth: 1.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: fontSettings } },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: fontSettings },
              title: { display: true, text: 'Hours', color: textColor }
            }
          }
        }
      });
    }
  }
};
