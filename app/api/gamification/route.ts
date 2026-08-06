import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 1. Fetch user activities for streak & XP calculation
    const [activities, waterLogs, sleepLogs, mealsLogs, achievements] = await Promise.all([
      prisma.dailyActivity.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.waterIntake.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.sleep.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.meal.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
      }),
    ]);

    // 2. Calculate Daily Streak (consecutive days with any activity or goal met)
    const activeDates = new Set<string>();
    activities.forEach((a) => {
      if ((a.steps || 0) > 0 || (a.caloriesBurned || 0) > 0) {
        activeDates.add(new Date(a.date).toISOString().split("T")[0]);
      }
    });
    waterLogs.forEach((w) => {
      if ((w.glasses || 0) > 0) {
        activeDates.add(new Date(w.date).toISOString().split("T")[0]);
      }
    });
    sleepLogs.forEach((s) => {
      if (Number(s.hours || 0) > 0) {
        activeDates.add(new Date(s.date).toISOString().split("T")[0]);
      }
    });

    let streakDays = 0;
    let checkDate = new Date();
    
    // Check if today has activity
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!activeDates.has(todayStr)) {
      // If not today, check if yesterday had activity
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (activeDates.has(checkDate.toISOString().split("T")[0])) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 3. Calculate Total XP
    const totalSteps = activities.reduce((acc, curr) => acc + (curr.steps || 0), 0);
    const totalWaterGlasses = waterLogs.reduce((acc, curr) => acc + (curr.glasses || 0), 0);
    const totalSleepHours = sleepLogs.reduce((acc, curr) => acc + Number(curr.hours || 0), 0);
    const totalMeals = mealsLogs.length;

    const xpFromSteps = Math.floor(totalSteps / 100);
    const xpFromWater = totalWaterGlasses * 10;
    const xpFromSleep = Math.floor(totalSleepHours * 15);
    const xpFromMeals = totalMeals * 20;

    const totalXP = xpFromSteps + xpFromWater + xpFromSleep + xpFromMeals;

    // 4. Level Definitions
    let level = 1;
    let levelTitle = "Novice Mover";
    let nextLevelXP = 500;
    let prevLevelXP = 0;

    if (totalXP >= 10000) {
      level = 5;
      levelTitle = "Titan";
      nextLevelXP = 25000;
      prevLevelXP = 10000;
    } else if (totalXP >= 4000) {
      level = 4;
      levelTitle = "Master Athlete";
      nextLevelXP = 10000;
      prevLevelXP = 4000;
    } else if (totalXP >= 1500) {
      level = 3;
      levelTitle = "Fitness Pro";
      nextLevelXP = 4000;
      prevLevelXP = 1500;
    } else if (totalXP >= 500) {
      level = 2;
      levelTitle = "Habit Builder";
      nextLevelXP = 1500;
      prevLevelXP = 500;
    }

    const levelProgressPercent = Math.min(
      100,
      Math.max(0, Math.floor(((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100))
    );

    // 5. Check & Auto-unlock Badges
    const badgeDefinitions = [
      {
        title: "Hydration Hero",
        description: "Logged 10+ glasses of water!",
        condition: totalWaterGlasses >= 10,
      },
      {
        title: "10k Steps Club",
        description: "Reached 10,000+ total steps!",
        condition: totalSteps >= 10000,
      },
      {
        title: "Night Owl Rested",
        description: "Logged 7+ hours of quality sleep!",
        condition: totalSleepHours >= 7,
      },
      {
        title: "Streak Master",
        description: "Maintained a 3-day active streak!",
        condition: streakDays >= 3,
      },
    ];

    const unlockedTitles = new Set(achievements.map((a) => a.title));
    const newUnlocked: string[] = [];

    for (const badge of badgeDefinitions) {
      if (badge.condition && !unlockedTitles.has(badge.title)) {
        await prisma.achievement.create({
          data: {
            userId,
            title: badge.title,
            description: badge.description,
          },
        });
        newUnlocked.push(badge.title);
      }
    }

    const updatedAchievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      streakDays,
      xp: totalXP,
      level,
      levelTitle,
      nextLevelXP,
      levelProgressPercent,
      achievements: updatedAchievements,
      newUnlocked,
    });
  } catch (error: any) {
    console.error("Gamification API Error:", error);
    return NextResponse.json(
      { error: "Failed to load gamification data" },
      { status: 500 }
    );
  }
}
