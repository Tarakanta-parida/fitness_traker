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

    // 1. Curated local Indian budget diet fallbacks (in Rupees) if Gemini is not set or fails
    const isVeg = user.goal?.toLowerCase().includes("veg") || user.goal === "maintain"; // Check preference
    
    const vegFallback = {
      breakfast: {
        name: "Moong Dal Chilla & Roasted Chana",
        calories: 320,
        protein: 14,
        cost: 25.00,
        ingredients: ["Sprouted Moong Dal (70g)", "1 Green Chilli & Ginger", "Roasted Bengal Gram (30g)"]
      },
      lunch: {
        name: "Toor Dal Tadka, Roti (2) & Mixed Veg Subji",
        calories: 520,
        protein: 18,
        cost: 50.00,
        ingredients: ["Split Pigeon Peas (Toor Dal) (60g)", "2 Slices Whole Wheat Chapati", "Mixed Cauliflower/Beans (150g)", "Mustard Oil (1 tsp)"]
      },
      dinner: {
        name: "Soya Chunks Masala with Brown Rice",
        calories: 460,
        protein: 26,
        cost: 45.00,
        ingredients: ["High-protein Soya Chunks (50g)", "Boiled Brown Rice (80g)", "Onion & Tomato Gravy"]
      },
      snack: {
        name: "Sprouted Moong Salad with Lemon",
        calories: 150,
        protein: 8,
        cost: 15.00,
        ingredients: ["Sprouted Green Gram (100g)", "Lemon Juice", "1 Cucumber & Tomato"]
      }
    };

    const nonVegFallback = {
      breakfast: {
        name: "Egg Bhurji (3 Eggs) & Whole Wheat Toast",
        calories: 380,
        protein: 24,
        cost: 35.00,
        ingredients: ["3 Whole Eggs", "2 Slices Whole Wheat Bread", "Onion, Tomato & Chillies"]
      },
      lunch: {
        name: "Home Style Chicken Curry with Steamed Rice",
        calories: 590,
        protein: 38,
        cost: 75.00,
        ingredients: ["Lean Chicken Pieces (150g)", "White Basmati Rice (100g)", "Onion, Garlic & Spice Gravy"]
      },
      dinner: {
        name: "Double Egg Curry with Roti (2)",
        calories: 450,
        protein: 20,
        cost: 40.00,
        ingredients: ["2 Hard Boiled Eggs", "2 Whole Wheat Chapatis", "Tomato Curry Gravy"]
      },
      snack: {
        name: "Roasted Peanuts & Green Tea",
        calories: 180,
        protein: 8,
        cost: 15.00,
        ingredients: ["Dry Roasted Peanuts (30g)", "1 Cup Green Tea (No Sugar)"]
      }
    };

    let selectedPlan = isVeg ? vegFallback : nonVegFallback;

    // 2. Query Google Gemini AI API if a valid key is provided
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "PASTE_YOUR_GEMINI_API_KEY_HERE";

    if (hasValidKey) {
      try {
        const dietTypeStr = isVeg ? "strictly Vegetarian (Veg)" : "Non-Vegetarian (including eggs and chicken)";
        const prompt = `You are a professional nutritionist. Recommend a 1-day Indian budget meal plan (Breakfast, Lunch, Dinner, and 1 Snack) for a user with the following profile:
- Age: ${ageVal} years old
- Gender: ${genderVal}
- Weight: ${weightVal} kg
- Height: ${heightVal} cm
- Fitness Goal: ${goalVal}
- Daily Food Budget: Rs. ${Math.round(dailyBudget * 83)} INR (using 1 USD = 83 INR conversion)
- Diet Preference: ${dietTypeStr}

The meal plan must consist of real Indian foods (like Poha, Dal, Chapati, Rice, Egg Bhurji, Paneer, etc.) with affordable pricing in Indian Rupees (INR).
You must output a strict JSON object matching this structure exactly (do not output any markdown blocks or conversational text, only return the JSON):
{
  "breakfast": {
    "name": "string",
    "calories": number,
    "protein": number,
    "cost": number (approx cost in INR),
    "ingredients": ["string"]
  },
  "lunch": {
    "name": "string",
    "calories": number,
    "protein": number,
    "cost": number (approx cost in INR),
    "ingredients": ["string"]
  },
  "dinner": {
    "name": "string",
    "calories": number,
    "protein": number,
    "cost": number (approx cost in INR),
    "ingredients": ["string"]
  },
  "snack": {
    "name": "string",
    "calories": number,
    "protein": number,
    "cost": number (approx cost in INR),
    "ingredients": ["string"]
  }
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            }),
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText.trim());
            if (parsed.breakfast && parsed.lunch && parsed.dinner && parsed.snack) {
              selectedPlan = parsed;
              console.log("Successfully loaded dynamic meal plan from Google Gemini.");
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini API call failed, using local Indian fallbacks:", geminiErr);
      }
    }

    const { breakfast, lunch, dinner, snack } = selectedPlan;

    return NextResponse.json({
      success: true,
      isAiGenerated: hasValidKey,
      nutritionTargets: {
        calories: targetCalories,
        protein: targetProtein,
        dailyBudget: dailyBudget,
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

    // Define items to add to the grocery list table based on diet preference (in Indian Rupees ₹)
    const vegGroceryItems = [
      { item: "Fresh Paneer (Dairy)", quantity: "1 kg", price: 380 },
      { item: "Rolled Oats / Poha", quantity: "1 kg Pack", price: 120 },
      { item: "Tone Milk", quantity: "3 Liters", price: 180 },
      { item: "Toor & Chana Dal", quantity: "2 kg", price: 210 },
      { item: "Fresh Sabzi (Spinach, Tomatoes, Beans)", quantity: "2 kg", price: 140 },
      { item: "Whole Wheat Atta", quantity: "5 kg", price: 220 },
      { item: "High-Protein Soya Chunks", quantity: "500g", price: 65 },
      { item: "Almonds & Roasted Chana", quantity: "250g", price: 160 },
    ];

    const nonVegGroceryItems = [
      { item: "Fresh Chicken Breast / Curry Cut", quantity: "1.5 kg", price: 340 },
      { item: "Farm Fresh Eggs", quantity: "30 units (1 Tray)", price: 180 },
      { item: "Rolled Oats / Poha", quantity: "1 kg Pack", price: 120 },
      { item: "Tone Milk", quantity: "3 Liters", price: 180 },
      { item: "Basmati Rice / Wheat Atta", quantity: "5 kg", price: 240 },
      { item: "Fresh Green Veggies (Tomato, Onion, Palak)", quantity: "2 kg", price: 140 },
      { item: "High-Protein Soya Chunks", quantity: "500g", price: 65 },
      { item: "Almonds & Roasted Chana", quantity: "250g", price: 160 },
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
