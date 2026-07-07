'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Utensils, Sparkles, Printer
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { LoadingScreen } from '../../../components/ui/loading-screen';
import { CustomSelect } from '../../../components/ui/custom-select';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('lifetrack_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const fetchProfile = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/profile`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.profile;
};

const fetchMealPlan = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/meals`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meal plan');
  const data = await res.json();
  return data.mealPlan;
};

export default function FoodPage() {
  const queryClient = useQueryClient();

  // Form states
  const [mealWeight, setMealWeight] = useState('');
  const [mealHeight, setMealHeight] = useState('');
  const [mealAge, setMealAge] = useState('28');
  const [mealGender, setMealGender] = useState('male');
  const [mealGoal, setMealGoal] = useState('maintain');
  const [mealDiet, setMealDiet] = useState('veg');
  const [mealPref, setMealPref] = useState('balanced');
  const [mealAllergy, setMealAllergy] = useState('none');
  const [mealBudget, setMealBudget] = useState('150');

  // Queries
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const { data: mealPlanData, isLoading } = useQuery({
    queryKey: ['mealPlan'],
    queryFn: fetchMealPlan,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  useEffect(() => {
    if (profileData) {
      setMealWeight(profileData.weight.toString());
      setMealHeight(profileData.height.toString());
      setMealAge(profileData.age.toString());
      setMealGender(profileData.gender);
      setMealGoal(profileData.goal);
      setMealDiet(profileData.diet || 'veg');
      setMealPref(profileData.preference || 'balanced');
      setMealAllergy(profileData.allergy || 'none');
      setMealBudget(profileData.budget?.toString() || '150');
    }
  }, [profileData]);

  // Mutations
  const generateMealMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BACKEND_URL}/api/v1/meals/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
    }
  });

  const handleGenerateMealsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMealMutation.mutate({
      weight: parseFloat(mealWeight),
      height: parseFloat(mealHeight),
      age: parseInt(mealAge),
      gender: mealGender,
      goal: mealGoal,
      diet: mealDiet,
      preference: mealPref,
      allergy: mealAllergy,
      budget: parseFloat(mealBudget)
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading nutrition planner..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Meal Planner
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Generate personalized, budget-friendly meal guides.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-text-primary">
            <Utensils size={18} className="text-primary" /> Budget-Friendly Meal Planner
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Configure your constraints to formulate an optimized weekly grocery checklist and menu.
          </p>
          <form onSubmit={handleGenerateMealsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={mealWeight}
                  onChange={(e) => setMealWeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={mealHeight}
                  onChange={(e) => setMealHeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Primary Goal</label>
                <CustomSelect
                  options={[
                    { value: 'lose', label: 'Weight Loss' },
                    { value: 'maintain', label: 'Maintain Weight' },
                    { value: 'gain', label: 'Muscle Gain' }
                  ]}
                  value={mealGoal}
                  onChange={setMealGoal}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Dietary Preference</label>
                <CustomSelect
                  options={[
                    { value: 'veg', label: 'Vegetarian' },
                    { value: 'nonveg', label: 'Non-Vegetarian' }
                  ]}
                  value={mealDiet}
                  onChange={setMealDiet}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Gym Focus</label>
                <CustomSelect
                  options={[
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'highprotein', label: 'High Protein' },
                    { value: 'lowcarb', label: 'Low Carb' }
                  ]}
                  value={mealPref}
                  onChange={setMealPref}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Allergies</label>
                <CustomSelect
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'nuts', label: 'Nut Free' },
                    { value: 'gluten', label: 'Gluten Free' },
                    { value: 'dairy', label: 'Lactose Free' }
                  ]}
                  value={mealAllergy}
                  onChange={setMealAllergy}
                />
              </div>
              <div className="flex flex-col col-span-2">
                <label className="text-xs text-text-secondary font-semibold mb-1">Weekly Grocery Budget ($)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={mealBudget}
                  onChange={(e) => setMealBudget(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3" disabled={generateMealMutation.isPending}>
              <Sparkles size={16} /> {generateMealMutation.isPending ? 'Generating plan...' : 'Generate Plan'}
            </Button>
          </form>
        </Card>

        {/* Generated results */}
        {mealPlanData && (
          <div className="space-y-6">
            {/* Budget Counters Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <span className="text-xs text-text-secondary font-bold uppercase block mb-1">Target Budget</span>
                <span className="text-xl font-extrabold text-text-primary">${parseFloat(mealBudget).toFixed(2)}</span>
              </Card>
              <Card className="p-4 text-center">
                <span className="text-xs text-text-secondary font-bold uppercase block mb-1">Remaining Budget</span>
                <span className="text-xl font-extrabold text-accent-steps">
                  ${(parseFloat(mealBudget) - (mealPlanData.weekly_budget || 0)).toFixed(2)}
                </span>
              </Card>
              <Card className="p-4 text-center">
                <span className="text-xs text-text-secondary font-bold uppercase block mb-1">Calories Target</span>
                <span className="text-xl font-extrabold text-primary">{mealPlanData.calories || 2200} kcal</span>
              </Card>
              <Card className="p-4 text-center">
                <span className="text-xs text-text-secondary font-bold uppercase block mb-1">Protein Goal</span>
                <span className="text-xl font-extrabold text-accent-workout">{mealPlanData.protein || 120}g</span>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Meal cards */}
              <div className="lg:col-span-8 space-y-4">
                {/* Breakfast */}
                <div className="p-4 bg-surface border border-border rounded-xl flex gap-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl h-max uppercase">Breakfast</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-sm">{mealPlanData.meals?.breakfast?.name || 'High-Fiber Oatmeal bowl'}</h5>
                    <p className="text-xs text-text-secondary mt-1">{mealPlanData.meals?.breakfast?.ingredients || 'Oats, Milk, Banana, Honey, Almonds'}</p>
                    <div className="flex gap-4 text-[10px] font-bold text-text-secondary mt-2">
                      <span>{mealPlanData.meals?.breakfast?.calories || 410} kcal</span>
                      <span>{mealPlanData.meals?.breakfast?.protein || 16}g Protein</span>
                      <span>Est: ${mealPlanData.meals?.breakfast?.cost || '1.25'}</span>
                    </div>
                  </div>
                </div>

                {/* Lunch */}
                <div className="p-4 bg-surface border border-border rounded-xl flex gap-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl h-max uppercase">Lunch</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-sm">{mealPlanData.meals?.lunch?.name || 'Brown Rice & Chicken Breast'}</h5>
                    <p className="text-xs text-text-secondary mt-1">{mealPlanData.meals?.lunch?.ingredients || 'Chicken Breast, Rice, Broccoli, Greens'}</p>
                    <div className="flex gap-4 text-[10px] font-bold text-text-secondary mt-2">
                      <span>{mealPlanData.meals?.lunch?.calories || 620} kcal</span>
                      <span>{mealPlanData.meals?.lunch?.protein || 42}g Protein</span>
                      <span>Est: ${mealPlanData.meals?.lunch?.cost || '2.40'}</span>
                    </div>
                  </div>
                </div>

                {/* Dinner */}
                <div className="p-4 bg-surface border border-border rounded-xl flex gap-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl h-max uppercase">Dinner</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-sm">{mealPlanData.meals?.dinner?.name || 'Chicken Stir Fry with Bread'}</h5>
                    <p className="text-xs text-text-secondary mt-1">{mealPlanData.meals?.dinner?.ingredients || 'Chicken Breast, Veggies, Bread'}</p>
                    <div className="flex gap-4 text-[10px] font-bold text-text-secondary mt-2">
                      <span>{mealPlanData.meals?.dinner?.calories || 560} kcal</span>
                      <span>{mealPlanData.meals?.dinner?.protein || 36}g Protein</span>
                      <span>Est: ${mealPlanData.meals?.dinner?.cost || '2.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Snacks */}
                <div className="p-4 bg-surface border border-border rounded-xl flex gap-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl h-max uppercase">Snacks</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-sm">Nuts & Protein Shake</h5>
                    <p className="text-xs text-text-secondary mt-1">Whey protein, Mixed berries, Raw almonds</p>
                    <div className="flex gap-4 text-[10px] font-bold text-text-secondary mt-2">
                      <span>280 kcal</span>
                      <span>24g Protein</span>
                      <span>Est: $1.10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grocery list */}
              <Card className="lg:col-span-4 p-6">
                <h4 className="font-bold text-sm mb-4">Weekly Grocery List</h4>
                <div className="space-y-3 divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                  {mealPlanData.grocery_list?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded-sm border-slate-300 cursor-pointer text-primary" />
                        <span className="text-text-primary font-semibold">{item.name} ({item.quantity})</span>
                      </label>
                      <span className="text-accent-steps font-bold">${parseFloat(item.cost || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary">Est. Grocery Total:</span>
                  <span className="text-base font-extrabold text-accent-steps">${mealPlanData.weekly_budget || 0.00}</span>
                </div>
                <Button variant="secondary" className="w-full mt-4" onClick={() => window.print()}>
                  <Printer size={14} /> Print Grocery Checklist
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
