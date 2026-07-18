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
    const { 
      age, 
      gender, 
      height, 
      weight, 
      goal, 
      budget, 
      stepsTarget, 
      sleepTarget,
      reminders
    } = body;

    // Convert values appropriately for Prisma/PostgreSQL
    const ageVal = age ? parseInt(age) : undefined;
    const heightVal = height ? parseFloat(height) : undefined;
    const weightVal = weight ? parseFloat(weight) : undefined;
    const budgetVal = budget ? parseFloat(budget) : undefined;
    const stepsVal = stepsTarget ? parseInt(stepsTarget) : undefined;
    const sleepVal = sleepTarget ? parseFloat(sleepTarget) : undefined;

    // Update user profile info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        age: ageVal,
        gender,
        height: heightVal,
        weight: weightVal,
        goal,
        budget: budgetVal,
        stepsTarget: stepsVal,
        sleepTarget: sleepVal,
        isOnboarded: true,
      },
    });

    // Create default reminders if provided
    if (reminders && Array.isArray(reminders)) {
      // Clear existing reminders first
      await prisma.reminder.deleteMany({
        where: { userId: user.id }
      });

      // Create new reminders
      await prisma.reminder.createMany({
        data: reminders.map((r: any) => ({
          userId: user.id,
          type: r.type,
          time: new Date(`1970-01-01T${r.time}:00Z`), // HH:MM
          repeat: r.repeat || "daily",
          enabled: r.enabled ?? true,
        })),
      });
    }

    // Initialize daily activity and water tracking for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: user.id,
        steps: 0,
        distance: 0.0,
        caloriesBurned: 0,
        exerciseTime: 0,
        date: today,
      },
    });

    await prisma.waterIntake.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: user.id,
        glasses: 0,
        goal: 10,
        date: today,
      },
    });

    // Create an initial progress entry
    if (weightVal) {
      const heightInMeters = heightVal ? heightVal / 100 : 1.75;
      const bmi = weightVal / (heightInMeters * heightInMeters);

      await prisma.progress.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        update: {
          weight: weightVal,
          bmi: bmi,
        },
        create: {
          userId: user.id,
          weight: weightVal,
          bmi: bmi,
          bodyFat: 18.5,
          date: today,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isOnboarded: updatedUser.isOnboarded,
      },
    });
  } catch (error: any) {
    console.error("Onboarding setup error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during onboarding setup" },
      { status: 500 }
    );
  }
}
