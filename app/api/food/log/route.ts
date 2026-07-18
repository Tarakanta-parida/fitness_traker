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
    const { mealType, foodName, calories, protein, price } = body;

    if (!mealType || !foodName || calories === undefined || protein === undefined) {
      return NextResponse.json(
        { error: "Meal type, food name, calories, and protein are required" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        mealType,
        foodName,
        calories: parseInt(calories),
        protein: parseInt(protein),
        price: price ? parseFloat(price) : 0.0,
        date: today,
      },
    });

    return NextResponse.json({ success: true, meal });
  } catch (error: any) {
    console.error("Meal logging error:", error);
    return NextResponse.json(
      { error: "Failed to log meal" },
      { status: 550 }
    );
  }
}
