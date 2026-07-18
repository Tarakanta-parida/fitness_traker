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
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.update({
      where: { id, userId: user.id },
      data: { enabled },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error: any) {
    console.error("Toggle reminder error:", error);
    return NextResponse.json(
      { error: "Failed to update reminder status" },
      { status: 550 }
    );
  }
}
