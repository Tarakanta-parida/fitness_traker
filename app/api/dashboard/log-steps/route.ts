import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { steps } = body;

    if (steps === undefined || isNaN(Number(steps))) {
      return NextResponse.json(
        { error: "Valid step count is required" },
        { status: 400 }
      );
    }

    const stepsCount = Math.max(0, parseInt(steps));
    const distanceVal = stepsCount * 0.000762; // 0.762m average stride length
    const stepCalories = Math.round(stepsCount * 0.04); // 0.04 kcal average per step

    // Fetch today's logged exercises to include them in the total calories burned
    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id, date: today },
    });
    const exerciseCalories = exercises.reduce((sum, ex) => sum + ex.calories, 0);
    const totalCaloriesBurned = stepCalories + exerciseCalories;
    const exerciseMinutes = exercises.reduce((sum, ex) => sum + ex.duration, 0);

    const activity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        steps: stepsCount,
        distance: distanceVal,
        caloriesBurned: totalCaloriesBurned,
        exerciseTime: exerciseMinutes,
      },
      create: {
        userId: user.id,
        steps: stepsCount,
        distance: distanceVal,
        caloriesBurned: totalCaloriesBurned,
        exerciseTime: exerciseMinutes,
        date: today,
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error("Log steps error:", error);
    return NextResponse.json(
      { error: "Failed to log step activity" },
      { status: 500 }
    );
  }
}
