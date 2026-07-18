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

    // Get last 7 days dates
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const startDate = days[0];
    const endDate = days[6];

    // Fetch activities for the last 7 days
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch water intake for the last 7 days
    const waterIntakes = await prisma.waterIntake.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch sleep logs for the last 7 days
    const sleepLogs = await prisma.sleep.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch meals for the last 7 days
    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch progress weight logs
    const progressLogs = await prisma.progress.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc", },
      take: 10, // last 10 records
    });

    // Calculate Habit Step Streak
    // Count consecutive days going backward starting from today/yesterday where steps >= stepsTarget
    let currentStreak = 0;
    const stepsGoal = user.stepsTarget || 10000;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Fetch all activities sorted descending
    const allActivities = await prisma.dailyActivity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // Check today first, then yesterday, and so on...
    for (const act of allActivities) {
      if ((act.steps || 0) >= stepsGoal) {
        currentStreak++;
      } else {
        // If it's today and steps are not met yet, don't break the streak immediately
        const actDate = new Date(act.date);
        actDate.setHours(0, 0, 0, 0);
        if (actDate.getTime() === checkDate.getTime()) {
          continue; 
        }
        break; // Streak broken
      }
    }

    // Compile 7-day reports chart data structure
    const dailyStats = days.map((date) => {
      const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
      
      const act = activities.find((a) => new Date(a.date).getTime() === date.getTime());
      const water = waterIntakes.find((w) => new Date(w.date).getTime() === date.getTime());
      const sleep = sleepLogs.find((s) => new Date(s.date).getTime() === date.getTime());
      
      const dayMeals = meals.filter((m) => new Date(m.date).getTime() === date.getTime());
      const caloriesConsumed = dayMeals.reduce((sum, m) => sum + m.calories, 0);

      return {
        dayName: dateStr,
        steps: act ? act.steps : 0,
        caloriesBurned: act ? act.caloriesBurned : 0,
        caloriesConsumed,
        waterGlasses: water ? water.glasses : 0,
        sleepHours: sleep ? Number(sleep.hours) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      currentStreak,
      dailyStats,
      weightTrend: progressLogs.map(p => ({
        date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: Number(p.weight),
        bmi: Number(p.bmi),
      })),
    });
  } catch (error: any) {
    console.error("Fetch analytics error:", error);
    return NextResponse.json(
      { error: "Failed to compile progress analytics" },
      { status: 550 }
    );
  }
}
