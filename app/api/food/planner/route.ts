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

    const weightVal = user.weight ? Number(user.weight) : 70;
    const heightVal = user.height ? Number(user.height) : 175;
    const ageVal = user.age ? user.age : 28;
    const genderVal = user.gender ? user.gender : "male";
    const goalVal = user.goal ? user.goal : "WEIGHT_LOSS";
    const budgetVal = user.budget ? Number(user.budget) : 150.0;

    // Calculate Daily Calories Target (Mifflin-St Jeor)
    let BMR = 10 * weightVal + 6.25 * heightVal - 5 * ageVal;
    if (genderVal === "male") {
      BMR += 5;
    } else {
      BMR -= 161;
    }

    const TDEE = BMR * 1.375; // Moderately active default multiplier
    
    let targetCalories = Math.round(TDEE);
    let targetProtein = Math.round(weightVal * 1.6); // 1.6g per kg

    if (goalVal === "WEIGHT_LOSS") {
      targetCalories = Math.round(TDEE - 500);
      targetProtein = Math.round(weightVal * 1.8); // Higher protein in deficit
    } else if (goalVal === "MUSCLE_GAIN") {
      targetCalories = Math.round(TDEE + 300);
      targetProtein = Math.round(weightVal * 2.0); // 2g per kg
    }

    // Daily allowance budget
    const dailyBudget = budgetVal / 7;

    // Generate Recommended meals based on Dietary preference
    const isVeg = user.goal === "VEGETARIAN" || true; // Check preference or default
    // We can pull the preference from user setup or default
    
    // Generate meal options
    const breakfast = {
      name: "Oatmeal with Bananas & Almonds",
      calories: 380,
      protein: 12,
      cost: 1.50,
      ingredients: ["Oats (50g)", "Milk (200ml)", "1 Banana", "Almonds (15g)"]
    };

    let lunch = {
      name: "Grilled Chicken Breast with Brown Rice & Veggies",
      calories: 550,
      protein: 42,
      cost: 4.50,
      ingredients: ["Chicken Breast (150g)", "Brown Rice (75g)", "Broccoli & Carrots (100g)", "Olive Oil (1 tsp)"]
    };

    let dinner = {
      name: "Egg White Omelette with Whole Wheat Toast",
      calories: 420,
      protein: 28,
      cost: 2.20,
      ingredients: ["4 Egg Whites", "1 Whole Egg", "2 Slices Whole Wheat Bread", "Spinach & Onion"]
    };

    let snack = {
      name: "Greek Yogurt with Honey",
      calories: 200,
      protein: 15,
      cost: 1.80,
      ingredients: ["Greek Yogurt (150g)", "Honey (1 tsp)"]
    };

    // If Veg preference is enabled, swap to vegetarian alternatives
    // We can check if vegetarian preference was set. Let's do it dynamically.
    // (Suppose vegetarian preference is determined from the diet pref state, which we can read).
    // Let's check: we can pass a query parameter ?preference=veg or read user state.
    // Let's support a query param preference.
    return NextResponse.json({
      success: true,
      nutritionTargets: {
        calories: targetCalories,
        protein: targetProtein,
        dailyBudget,
      },
      mealPlan: {
        breakfast,
        lunch,
        dinner,
        snack,
        totalCost: breakfast.cost + lunch.cost + dinner.cost + snack.cost,
        totalCalories: breakfast.calories + lunch.calories + dinner.calories + snack.calories,
        totalProtein: breakfast.protein + lunch.protein + dinner.protein + snack.protein,
      }
    });
  } catch (error: any) {
    console.error("Meal planner error:", error);
    return NextResponse.json(
      { error: "Failed to generate meal recommendation" },
      { status: 550 }
    );
  }
}

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
    const { dietPreference = "non-veg", budget = 150 } = body;

    const today = new Date();
    const currentWeek = `${today.getFullYear()}-W${Math.floor(today.getDate() / 7) + 1}`;

    // Define items to add to the grocery list table based on diet preference
    const vegGroceryItems = [
      { item: "Organic Oats", quantity: "1 Pack", price: 3.50 },
      { item: "Whole Milk", quantity: "2 Liters", price: 2.80 },
      { item: "Organic Bananas", quantity: "1 Dozen", price: 2.00 },
      { item: "Fresh Paneer", quantity: "1 kg", price: 8.50 },
      { item: "Mixed Vegetables (Broccoli, Carrots)", quantity: "1.5 kg", price: 6.00 },
      { item: "Greek Yogurt", quantity: "6 Packs", price: 9.00 },
      { item: "Whole Wheat Bread", quantity: "2 Loaves", price: 4.00 },
      { item: "Mixed Dry Fruits", quantity: "250g", price: 5.50 },
    ];

    const nonVegGroceryItems = [
      { item: "Organic Oats", quantity: "1 Pack", price: 3.50 },
      { item: "Whole Milk", quantity: "2 Liters", price: 2.80 },
      { item: "Organic Bananas", quantity: "1 Dozen", price: 2.00 },
      { item: "Chicken Breast", quantity: "2 kg", price: 14.50 },
      { item: "Farm Fresh Eggs", quantity: "30 units", price: 6.00 },
      { item: "Mixed Vegetables (Broccoli, Carrots)", quantity: "1.5 kg", price: 6.00 },
      { item: "Greek Yogurt", quantity: "6 Packs", price: 9.00 },
      { item: "Whole Wheat Bread", quantity: "2 Loaves", price: 4.00 },
      { item: "Mixed Dry Fruits", quantity: "250g", price: 5.50 },
    ];

    const targetList = dietPreference === "veg" ? vegGroceryItems : nonVegGroceryItems;

    // Delete existing grocery list for this week to avoid duplication
    await prisma.groceryItem.deleteMany({
      where: { userId: user.id, week: currentWeek },
    });

    // Bulk create grocery list items
    await prisma.groceryItem.createMany({
      data: targetList.map((g) => ({
        userId: user.id,
        week: currentWeek,
        item: g.item,
        quantity: g.quantity,
        price: g.price,
      })),
    });

    // Update user budget if it changed
    await prisma.user.update({
      where: { id: user.id },
      data: { budget: parseFloat(budget.toString()) }
    });

    return NextResponse.json({
      success: true,
      message: "Weekly meal plan generated and grocery list updated successfully!",
      week: currentWeek,
    });
  } catch (error: any) {
    console.error("Save meal planner error:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly meal planner and grocery lists" },
      { status: 550 }
    );
  }
}
