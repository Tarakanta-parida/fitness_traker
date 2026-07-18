"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Utensils, 
  Flame, 
  Award, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Sparkles,
  ShoppingBag,
  Loader2,
  Trash
} from "lucide-react";
import confetti from "canvas-confetti";

interface MealItem {
  id: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  price: string;
  date: string;
}

export default function FoodPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState(150.0);
  const [weeklySpent, setWeeklySpent] = useState(0.0);
  const [budgetRemaining, setBudgetRemaining] = useState(150.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Log Form State
  const [showModal, setShowModal] = useState(false);
  const [mealType, setMealType] = useState("BREAKFAST");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [price, setPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchFoodData = async () => {
    try {
      const res = await fetch("/api/food");
      if (res.ok) {
        const json = await res.json();
        setMeals(json.meals || []);
        setWeeklyBudget(json.weeklyBudget || 150.0);
        setWeeklySpent(json.weeklySpent || 0.0);
        setBudgetRemaining(json.budgetRemaining || 150.0);
      }
    } catch (err) {
      setError("Failed to load nutrition logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodData();
  }, []);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories || !protein) return;
    setFormLoading(true);

    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          foodName,
          calories: parseInt(calories),
          protein: parseInt(protein),
          price: price ? parseFloat(price) : 0.0,
        }),
      });

      if (res.ok) {
        setFoodName("");
        setCalories("");
        setProtein("");
        setPrice("");
        setShowModal(false);
        await fetchFoodData();
        
        // Trigger small celebration for protein goals!
        if (parseInt(protein) >= 20) {
          confetti({
            particleCount: 50,
            spread: 40,
            colors: ["#10b981", "#60a5fa"]
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Calculate totals for today
  const kcalToday = meals.reduce((sum, m) => sum + m.calories, 0);
  const proteinToday = meals.reduce((sum, m) => sum + m.protein, 0);
  
  // Categorize meals
  const breakfastMeals = meals.filter(m => m.mealType === "BREAKFAST");
  const lunchMeals = meals.filter(m => m.mealType === "LUNCH");
  const dinnerMeals = meals.filter(m => m.mealType === "DINNER");
  const snackMeals = meals.filter(m => m.mealType === "SNACKS");

  const categories = [
    { title: "Breakfast", list: breakfastMeals, type: "BREAKFAST" },
    { title: "Lunch", list: lunchMeals, type: "LUNCH" },
    { title: "Dinner", list: dinnerMeals, type: "DINNER" },
    { title: "Snacks", list: snackMeals, type: "SNACKS" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Habit Nutrition</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Food & Meal Planner</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your daily meals, track protein goals, and check budget remaining.</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/food/planner"
            className="flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 bg-white rounded-xl text-xs font-bold text-gray-700 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-green-550" />
            Budget Meal Planner
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log Custom Meal
          </button>
        </div>
      </div>

      {/* Budget & Calorie Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly budget */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Weekly Food Budget</span>
            <DollarSign className="w-5 h-5 text-green-550" />
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">${budgetRemaining.toFixed(2)}</span>
            <span className="text-xs text-gray-450 font-medium block mt-1">Remaining of ${weeklyBudget.toFixed(2)} total</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (weeklySpent / weeklyBudget) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Calories Consumed */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Calories Consumed</span>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">{kcalToday} kcal</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">Goal: {user?.goal === "WEIGHT_LOSS" ? "2,000" : "2,500"} kcal</span>
          </div>
          <div className="text-xs text-gray-500">
            Coach recommendation: <span className="font-semibold text-gray-850">Mind your portion sizes</span>
          </div>
        </div>

        {/* Protein Consumed */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Protein Intake</span>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">{proteinToday}g</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">Daily goal: ~110g protein</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Essential for muscle preservation</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Meals categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meals Logs list */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map((cat) => (
            <div key={cat.title} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-gray-400" />
                  <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">{cat.title}</h3>
                </div>
                <button
                  onClick={() => { setMealType(cat.type); setShowModal(true); }}
                  className="text-xs text-blue-600 hover:underline flex items-center font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" />
                  Add
                </button>
              </div>

              {cat.list.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-150 rounded-2xl">
                  No {cat.title.toLowerCase()} logged today.
                </div>
              ) : (
                <div className="space-y-3">
                  {cat.list.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-3 border border-gray-50 rounded-2xl text-xs bg-gray-50/20">
                      <div>
                        <span className="font-bold text-gray-800 capitalize block">{m.foodName}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{m.protein}g protein &bull; Cost: ${Number(m.price).toFixed(2)}</span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className="font-black text-gray-850">{m.calories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Meal planner promo cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-tr from-green-50 to-blue-50 border border-green-100/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-800">Budget Meal Planner</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Struggling to hit protein targets within your food budget? Try our automated meal planner. It calculates a healthy veg/non-veg menu for you and populates a grocery list instantly.
              </p>
            </div>
            <Link
              href="/food/planner"
              className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-2xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              Generate Weekly Plan
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-9 h-9 bg-blue-50/50 text-blue-500 border border-blue-100/30 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-800">Weekly Grocery List</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Check out your compiled grocery list generated from your active meal planner! Shop budget-friendly eggs, chicken breast, paneer, and oats.
              </p>
            </div>
            <Link
              href="/food/planner#grocery"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              View Shopping List
            </Link>
          </div>
        </div>
      </div>

      {/* Log Meal Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Today's Meal</h3>
              <p className="text-xs text-gray-400 mb-4 font-medium">Record nutritional values and pricing details.</p>

              <form onSubmit={handleLogMeal} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACKS">Snacks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Food Dish Name</label>
                    <input
                      type="text"
                      required
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Greek Yogurt Bowl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. 280"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Protein (g)</label>
                    <input
                      type="number"
                      required
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Estimated Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. 3.20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        Log Meal
                        <Plus className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
