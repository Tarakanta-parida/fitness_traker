"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ChevronLeft, 
  DollarSign, 
  Utensils, 
  ShoppingBag, 
  Award, 
  Flame, 
  Check, 
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import confetti from "canvas-confetti";

interface MealRec {
  name: string;
  calories: number;
  protein: number;
  cost: number;
  ingredients: string[];
}

interface GroceryItem {
  id: string;
  item: string;
  quantity: string;
  price: string;
}

const formatPrice = (val: number) => {
  return val > 15 ? `₹${val.toFixed(0)}` : `$${val.toFixed(2)}`;
};

export default function MealPlannerPage() {
  const { user } = useAuth();
  const [dietPref, setDietPref] = useState("non-veg");
  const [weeklyBudget, setWeeklyBudget] = useState("150");
  const [loading, setLoading] = useState(false);
  const [fetchingRec, setFetchingRec] = useState(true);

  // Recommendation states
  const [nutritionTargets, setNutritionTargets] = useState<{ calories: number; protein: number; dailyBudget: number } | null>(null);
  const [mealPlan, setMealPlan] = useState<{
    breakfast: MealRec;
    lunch: MealRec;
    dinner: MealRec;
    snack: MealRec;
    totalCost: number;
    totalCalories: number;
    totalProtein: number;
  } | null>(null);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);

  const fetchPlannerRecommendations = async () => {
    setFetchingRec(true);
    try {
      const res = await fetch("/api/food/planner");
      if (res.ok) {
        const json = await res.json();
        setNutritionTargets(json.nutritionTargets);
        setMealPlan(json.mealPlan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingRec(false);
    }
  };

  const fetchGroceryList = async () => {
    try {
      const today = new Date();
      const currentWeek = `${today.getFullYear()}-W${Math.floor(today.getDate() / 7) + 1}`;
      const res = await fetch(`/api/food/grocery?week=${currentWeek}`);
      if (res.ok) {
        const json = await res.json();
        setGroceryItems(json.groceryList || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlannerRecommendations();
    fetchGroceryList();
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/food/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietPreference: dietPref,
          budget: parseFloat(weeklyBudget)
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        await fetchPlannerRecommendations();
        await fetchGroceryList();
      }
    } catch (err) {
      alert("Failed to compile weekly plan");
    } finally {
      setLoading(false);
    }
  };

  const totalGroceryCost = groceryItems.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50/10 dark:bg-slate-950 min-h-screen text-gray-900 dark:text-white transition-colors">
      {/* Breadcrumbs */}
      <div>
        <Link href="/food" className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline mb-3">
          <ChevronLeft className="w-4 h-4" />
          Back to Food Logs
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Budget Meal Planner</h1>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">Generate dietary programs and matching shopping lists under budget limits.</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Setup Config Card */}
        <div className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800/90 rounded-3xl p-6 shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Plan Parameters</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">Customize preferences to update recommended items.</p>
          </div>

          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">Weekly Budget ($)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-gray-500 font-bold text-xs">$</span>
                <input
                  type="number"
                  required
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-gray-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                  placeholder="e.g. 150"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">Dietary Preference</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "veg", label: "Vegetarian" },
                  { val: "non-veg", label: "Non-Veg" }
                ].map((pref) => (
                  <div
                    key={pref.val}
                    onClick={() => setDietPref(pref.val)}
                    className={`p-3.5 border rounded-2xl text-center cursor-pointer transition-all text-xs font-semibold ${
                      dietPref === pref.val 
                        ? "border-green-500 bg-green-50/20 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-400 font-bold" 
                        : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{pref.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  Generate Meal Plan
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Coach Advice */}
          {nutritionTargets && (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 block uppercase tracking-wider">Coach Targets</span>
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 dark:bg-slate-800/50 p-4 border border-gray-100/80 dark:border-slate-700/50 rounded-2xl">
                <div>
                  <span className="text-gray-400 dark:text-gray-400 block">Daily Kcal Limit</span>
                  <span className="font-bold text-gray-800 dark:text-white text-sm mt-0.5">{nutritionTargets.calories} kcal</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-400 block">Protein Target</span>
                  <span className="font-bold text-gray-800 dark:text-white text-sm mt-0.5">{nutritionTargets.protein}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results recommendations & Grocery List */}
        <div className="lg:col-span-2 space-y-8">
          {fetchingRec ? (
            <div className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800/90 rounded-3xl p-12 text-center shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-400 dark:text-gray-400">Fetching nutritional targets...</p>
            </div>
          ) : mealPlan ? (
            <>
              {/* Daily Meal Schedule */}
              <div className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800/90 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white tracking-tight">Today's Recommended Plan</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">Target: {mealPlan.totalCalories} kcal &bull; {mealPlan.totalProtein}g protein &bull; Cost: {formatPrice(mealPlan.totalCost)}/day</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "Breakfast", data: mealPlan.breakfast },
                    { key: "Lunch", data: mealPlan.lunch },
                    { key: "Dinner", data: mealPlan.dinner },
                    { key: "Snacks", data: mealPlan.snack },
                  ].map((meal) => (
                    <div key={meal.key} className="p-4 border border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/40 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full uppercase border border-blue-100 dark:border-blue-900/50">{meal.key}</span>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">{formatPrice(meal.data.cost)}</span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-800 dark:text-white capitalize leading-snug">{meal.data.name}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          <span>{meal.data.calories} kcal</span>
                          <span>&bull;</span>
                          <span>{meal.data.protein}g protein</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-800 pt-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="font-semibold block mb-0.5 text-gray-700 dark:text-gray-300">Ingredients:</span>
                        <p className="truncate text-gray-500 dark:text-gray-400">{meal.data.ingredients.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="grocery" className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800/90 rounded-3xl p-6 shadow-sm space-y-6 scroll-mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      Weekly Grocery List
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">Generated shopping cart list for your plan.</p>
                  </div>
                  {groceryItems.length > 0 && (
                    <span className="text-xs font-bold text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/60 border border-green-100 dark:border-emerald-900 px-3 py-1 rounded-full">
                      Cart Total: {formatPrice(totalGroceryCost)}
                    </span>
                  )}
                </div>

                {groceryItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                    No grocery items found for this week. Set parameters and click 'Generate Meal Plan' above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-2 px-1">
                      <span>Item Name</span>
                      <span>Quantity</span>
                      <span className="text-right">Est. Price</span>
                    </div>
                    {groceryItems.map((g) => (
                      <div key={g.id} className="grid grid-cols-3 text-xs py-2 px-1 items-center border-b border-gray-100/50 dark:border-slate-800/50">
                        <span className="font-bold text-gray-800 dark:text-slate-200">{g.item}</span>
                        <span className="text-gray-500 dark:text-slate-400">{g.quantity}</span>
                        <span className="text-right font-semibold text-gray-700 dark:text-emerald-400">{formatPrice(Number(g.price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800/90 rounded-3xl p-12 text-center shadow-sm">
              <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">No Active Plan</h3>
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Click 'Generate Meal Plan' on the left to compute nutrition targets, customized daily meals, and a weekly grocery list matching your budget.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
