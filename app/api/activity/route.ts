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

    // Fetch last 30 entries of daily activity
    const activities = await prisma.dailyActivity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    // Fetch last 30 logged exercises
    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      activities,
      exercises,
    });
  } catch (error: any) {
    console.error("Fetch activities error:", error);
    return NextResponse.json(
      { error: "Failed to load activity logs" },
      { status: 550 }
    );
  }
}
