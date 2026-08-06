import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const deviceId = subscription.endpoint.slice(-32);

    // Save or update device push session
    await prisma.deviceSession.upsert({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId,
        },
      },
      update: {
        lastSyncAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId,
        osName: "web_push_sw",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push Subscription Error:", error);
    return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 });
  }
}
