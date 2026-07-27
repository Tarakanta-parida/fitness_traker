import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { logs } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ message: "No logs to sync." }, { status: 200 });
    }

    // Process logs in transaction to guarantee consistency
    await prisma.$transaction(async (tx) => {
      for (const log of logs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);

        // 1. Create step log details row
        await tx.dailyStepLog.create({
          data: {
            userId: user.id,
            steps: log.steps,
            distance: log.distance,
            caloriesBurned: log.caloriesBurned,
            activeSeconds: log.activeSeconds,
            date: logDate,
            createdAt: new Date(log.createdAt)
          }
        });

        // 2. Aggregate and sync back to DailyActivity
        const todayActivity = await tx.dailyActivity.findUnique({
          where: {
            userId_date: {
              userId: user.id,
              date: logDate
            }
          }
        });

        if (todayActivity) {
          await tx.dailyActivity.update({
            where: { id: todayActivity.id },
            data: {
              steps: (todayActivity.steps || 0) + log.steps,
              distance: Number(todayActivity.distance || 0) + log.distance,
              caloriesBurned: (todayActivity.caloriesBurned || 0) + Math.round(log.caloriesBurned),
              exerciseTime: (todayActivity.exerciseTime || 0) + Math.round(log.activeSeconds / 60)
            }
          });
        } else {
          await tx.dailyActivity.create({
            data: {
              userId: user.id,
              steps: log.steps,
              distance: log.distance,
              caloriesBurned: Math.round(log.caloriesBurned),
              exerciseTime: Math.round(log.activeSeconds / 60),
              date: logDate
            }
          });
        }

        // 3. Update or create Goals table progress
        const goalEntry = await tx.goal.findUnique({
          where: {
            userId_type_date: {
              userId: user.id,
              type: "STEPS",
              date: logDate
            }
          }
        });

        const currentStepsTarget = user.stepsTarget || 10000;

        if (goalEntry) {
          await tx.goal.update({
            where: { id: goalEntry.id },
            data: {
              current: Number(goalEntry.current) + log.steps,
              target: currentStepsTarget
            }
          });
        } else {
          await tx.goal.create({
            data: {
              userId: user.id,
              type: "STEPS",
              target: currentStepsTarget,
              current: log.steps,
              date: logDate
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Step logs synchronized successfully." });
  } catch (err: any) {
    console.error("Steps registration sync failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
