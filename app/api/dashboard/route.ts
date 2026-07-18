import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch Today's Activity (Steps, Distance, Active Calories)
    let activity = await prisma.dailyActivity.findFirst({
      where: { userId: user.id, date: today },
    });

    if (!activity) {
      activity = await prisma.dailyActivity.create({
        data: {
          userId: user.id,
          steps: 0,
          distance: 0.0,
          caloriesBurned: 0,
          exerciseTime: 0,
          date: today,
        },
      });
    }

    // 2. Fetch Today's Water Intake
    let water = await prisma.waterIntake.findFirst({
      where: { userId: user.id, date: today },
    });

    if (!water) {
      water = await prisma.waterIntake.create({
        data: {
          userId: user.id,
          glasses: 0,
          goal: 10,
          date: today,
        },
      });
    }

    // 3. Fetch Today's Sleep
    const sleep = await prisma.sleep.findFirst({
      where: { userId: user.id, date: today },
    });

    // 4. Fetch Today's Meals
    const meals = await prisma.meal.findMany({
      where: { userId: user.id, date: today },
    });

    // Calculate calories consumed and budget spent today
    const caloriesConsumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const proteinConsumed = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const todayFoodCost = meals.reduce((sum, meal) => sum + (meal.price ? Number(meal.price) : 0), 0);

    // 5. Fetch Today's Exercises
    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id, date: today },
    });

    const totalExerciseMinutes = exercises.reduce((sum, ex) => sum + ex.duration, 0);
    const caloriesBurnedFromExercises = exercises.reduce((sum, ex) => sum + ex.calories, 0);

    // Calorie count depends on both steps (0.04 kcal per step) and exercises logged
    const stepCalories = Math.round((activity.steps || 0) * 0.04);
    const totalCaloriesBurned = stepCalories + caloriesBurnedFromExercises;
    const totalExerciseTime = totalExerciseMinutes;

    // Update DailyActivity in database to ensure it stores the combined sum
    await prisma.dailyActivity.update({
      where: { id: activity.id },
      data: {
        caloriesBurned: totalCaloriesBurned,
        exerciseTime: totalExerciseTime,
      },
    });

    activity.caloriesBurned = totalCaloriesBurned;
    activity.exerciseTime = totalExerciseTime;

    // 6. Fetch Progress weight
    const progress = await prisma.progress.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // Calculate weekly budget remaining
    // Get start of the current week (Monday)
    const currentMonday = new Date(today);
    const dayOfWeek = currentMonday.getDay();
    const diff = currentMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const weeklyMeals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: {
          gte: currentMonday,
          lte: today,
        },
      },
    });
    
    const weeklySpent = weeklyMeals.reduce((sum, meal) => sum + (meal.price ? Number(meal.price) : 0), 0);
    const weeklyBudget = user.budget ? Number(user.budget) : 150.0;
    const budgetRemaining = Math.max(0, weeklyBudget - weeklySpent);

    return NextResponse.json({
      success: true,
      summary: {
        date: today,
        steps: activity.steps || 0,
        stepsGoal: user.stepsTarget || 10000,
        distance: Number(activity.distance) || 0,
        caloriesBurned: activity.caloriesBurned || 0,
        caloriesConsumed,
        proteinConsumed,
        waterGlasses: water.glasses || 0,
        waterGoal: water.goal || 10,
        sleepHours: sleep ? Number(sleep.hours) : null,
        sleepQuality: sleep ? sleep.quality : null,
        workoutMinutes: activity.exerciseTime || 0,
        workoutCompleted: exercises.length > 0,
        todayFoodCost,
        budgetRemaining,
        currentWeight: progress ? Number(progress.weight) : Number(user.weight) || 70,
        currentBmi: progress ? Number(progress.bmi) : null,
        meals,
        exercises,
      },
    });
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading dashboard data" },
      { status: 550 }
    );
  }
}
