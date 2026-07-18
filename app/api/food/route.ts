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

    const meals = await prisma.meal.findMany({
      where: { userId: user.id, date: today },
      orderBy: { date: "desc" },
    });

    // Calculate weekly spent
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

    const weeklySpent = weeklyMeals.reduce((sum, m) => sum + (m.price ? Number(m.price) : 0), 0);
    const weeklyBudget = user.budget ? Number(user.budget) : 150.0;

    return NextResponse.json({
      success: true,
      meals,
      weeklyBudget,
      weeklySpent,
      budgetRemaining: Math.max(0, weeklyBudget - weeklySpent),
    });
  } catch (error: any) {
    console.error("Fetch food error:", error);
    return NextResponse.json(
      { error: "Failed to load meal logs" },
      { status: 550 }
    );
  }
}
