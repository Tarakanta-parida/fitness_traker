import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST() {
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

    // Mock fetching steps from device sensor/Google Fit
    // Generate random values: steps between 6000 and 11500
    const mockSteps = Math.floor(Math.random() * (11500 - 6000 + 1)) + 6000;
    const strideLength = 0.000762; // in km
    const mockDistance = parseFloat((mockSteps * strideLength).toFixed(2));
    const mockCalories = Math.round(mockSteps * 0.04) + 120; // steps kcal + general activity
    const mockMinutes = Math.floor(Math.random() * 20) + 15; // 15 to 35 minutes

    // Log the sync to DailyActivity database table
    const activity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        steps: mockSteps,
        distance: mockDistance,
        caloriesBurned: {
          increment: mockCalories,
        },
        exerciseTime: {
          increment: mockMinutes,
        },
      },
      create: {
        userId: user.id,
        steps: mockSteps,
        distance: mockDistance,
        caloriesBurned: mockCalories,
        exerciseTime: mockMinutes,
        date: today,
      },
    });

    // Add a mocked workout exercise entry for "Walking (Health Connect)"
    await prisma.exercise.create({
      data: {
        userId: user.id,
        exerciseName: "Walking (Health Connect Sync)",
        duration: mockMinutes,
        calories: mockCalories,
        date: today,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${mockSteps.toLocaleString()} steps and ${mockMinutes} active minutes from Google Fit & Health Connect.`,
      syncData: {
        steps: mockSteps,
        distance: mockDistance,
        caloriesBurned: mockCalories,
        minutes: mockMinutes,
        source: "Google Fit / Health Connect"
      }
    });
  } catch (error: any) {
    console.error("Health sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync device health logs" },
      { status: 550 }
    );
  }
}
