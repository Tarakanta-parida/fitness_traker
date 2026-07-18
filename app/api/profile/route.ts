import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function PUT(request: Request) {
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
      name,
      age, 
      gender, 
      height, 
      weight, 
      goal, 
      budget, 
      stepsTarget, 
      sleepTarget 
    } = body;

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
        name,
        age: ageVal,
        gender,
        height: heightVal,
        weight: weightVal,
        goal,
        budget: budgetVal,
        stepsTarget: stepsVal,
        sleepTarget: sleepVal,
      },
    });

    // Record weight progress if it changed
    if (weightVal) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
        age: updatedUser.age,
        gender: updatedUser.gender,
        height: Number(updatedUser.height),
        weight: Number(updatedUser.weight),
        goal: updatedUser.goal,
        budget: Number(updatedUser.budget),
        stepsTarget: updatedUser.stepsTarget,
        sleepTarget: Number(updatedUser.sleepTarget),
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile settings" },
      { status: 550 }
    );
  }
}
