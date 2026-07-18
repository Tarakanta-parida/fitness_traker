import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");

    if (!week) {
      return NextResponse.json(
        { error: "Week parameter is required" },
        { status: 400 }
      );
    }

    const groceryList = await prisma.groceryItem.findMany({
      where: { userId: user.id, week },
      orderBy: { price: "desc" },
    });

    return NextResponse.json({ success: true, groceryList });
  } catch (error: any) {
    console.error("Fetch grocery list error:", error);
    return NextResponse.json(
      { error: "Failed to load grocery items" },
      { status: 550 }
    );
  }
}
