import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch daily activities (for weekly and monthly graph data)
    const last30Days = await prisma.dailyActivity.findMany({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: "asc" }
    });

    // Compute weekly metrics
    const last7Days = last30Days.filter(activity => new Date(activity.date) >= sevenDaysAgo);

    const weeklySummary = last7Days.map(d => ({
      date: d.date.toLocaleDateString("sv-SE"), // YYYY-MM-DD
      steps: d.steps || 0,
      distance: Number(d.distance || 0),
      calories: d.caloriesBurned || 0,
      activeMinutes: d.exerciseTime || 0
    }));

    const monthlySummary = last30Days.map(d => ({
      date: d.date.toLocaleDateString("sv-SE"),
      steps: d.steps || 0,
      distance: Number(d.distance || 0),
      calories: d.caloriesBurned || 0
    }));

    // Calculate current streak
    let streak = 0;
    const sortedDesc = [...last30Days].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let checkDate = new Date(today);
    
    for (const activity of sortedDesc) {
      const actDate = new Date(activity.date);
      actDate.setHours(0, 0, 0, 0);

      // Check if this matches checkDate or yesterday
      const diffTime = Math.abs(checkDate.getTime() - actDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        if ((activity.steps || 0) >= (user.stepsTarget || 10000)) {
          streak++;
          checkDate = actDate;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return NextResponse.json({
      streak,
      weekly: weeklySummary,
      monthly: monthlySummary
    });
  } catch (err: any) {
    console.error("Steps history query failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
