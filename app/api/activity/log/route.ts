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

    const body = await request.json();
    const { exerciseName, duration, calories } = body;

    if (!exerciseName || !duration || !calories) {
      return NextResponse.json(
        { error: "Activity name, duration, and calories are required" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create custom exercise log entry
    const exercise = await prisma.exercise.create({
      data: {
        userId: user.id,
        exerciseName,
        duration: parseInt(duration),
        calories: parseInt(calories),
        date: today,
      },
    });

    // Update or create the daily activity summary totals
    await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        caloriesBurned: {
          increment: parseInt(calories),
        },
        exerciseTime: {
          increment: parseInt(duration),
        },
      },
      create: {
        userId: user.id,
        steps: 0,
        distance: 0.0,
        caloriesBurned: parseInt(calories),
        exerciseTime: parseInt(duration),
        date: today,
      },
    });

    return NextResponse.json({ success: true, exercise });
  } catch (error: any) {
    console.error("Exercise logging error:", error);
    return NextResponse.json(
      { error: "Failed to log workout session" },
      { status: 550 }
    );
  }
}
