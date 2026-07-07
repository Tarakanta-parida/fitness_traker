// LifeTrack Budget Meal Planner Module

export const MealPlanner = {
  /**
   * Database of budget-friendly ingredients and estimated prices
   */
  ingredients: {
    rice: { name: 'Brown Rice', unit: 'kg', pricePerUnit: 2.50, isVeg: true, gluten: false },
    oats: { name: 'Whole Grain Oats', unit: 'kg', pricePerUnit: 3.00, isVeg: true, gluten: false },
    eggs: { name: 'Fresh Eggs', unit: 'dozen', pricePerUnit: 2.80, isVeg: false, gluten: false },
    chicken: { name: 'Chicken Breast', unit: 'kg', pricePerUnit: 7.50, isVeg: false, gluten: false },
    paneer: { name: 'Fresh Paneer (or Tofu)', unit: 'kg', pricePerUnit: 6.80, isVeg: true, gluten: false },
    milk: { name: 'Skimmed Milk', unit: 'Liter', pricePerUnit: 1.20, isVeg: true, gluten: false },
    soymilk: { name: 'Soy Milk (Dairy-Free)', unit: 'Liter', pricePerUnit: 1.80, isVeg: true, gluten: false },
    vegetables: { name: 'Fresh Vegetables Mix', unit: 'kg', pricePerUnit: 3.50, isVeg: true, gluten: false },
    fruits: { name: 'Seasonal Fruits (Apples/Bananas)', unit: 'kg', pricePerUnit: 4.00, isVeg: true, gluten: false },
    almonds: { name: 'Almonds', unit: 'pack', pricePerUnit: 5.00, isVeg: true, gluten: false },
    sunflowerseeds: { name: 'Sunflower Seeds (Nut-Free)', unit: 'pack', pricePerUnit: 3.50, isVeg: true, gluten: false },
    bread: { name: 'Whole Wheat Bread', unit: 'loaf', pricePerUnit: 2.00, isVeg: true, gluten: true },
    glutenfreebread: { name: 'Gluten-Free Bread', unit: 'loaf', pricePerUnit: 4.00, isVeg: true, gluten: false },
    lentils: { name: 'Yellow Split Lentils (Dal)', unit: 'kg', pricePerUnit: 2.20, isVeg: true, gluten: false },
    peanutbutter: { name: 'Peanut Butter', unit: 'jar', pricePerUnit: 3.00, isVeg: true, gluten: false }
  },

  /**
   * Generate meal plan based on profile
   */
  generate(profile) {
    const { weight, height, age, gender, goal, diet, allergy, budget } = profile;
    const userAge = age || 28;

    // 1. Calculate Calorie Target (Mifflin-St Jeor Equation)
    let bmr = 0;
    if (gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * userAge - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * userAge + 5;
    }

    // Multiply BMR by activity multiplier (assume moderately active 1.375)
    const tdee = Math.round(bmr * 1.375);
    
    let targetCals = tdee;
    if (goal === 'lose') {
      targetCals = Math.round(tdee - 500);
    } else if (goal === 'gain') {
      targetCals = Math.round(tdee + 400);
    }
    // Cap at safe absolute minimum
    targetCals = Math.max(1300, targetCals);

    // 2. Calculate Protein Target (grams)
    let proteinMultiplier = 1.6;
    if (goal === 'lose') proteinMultiplier = 1.8;
    else if (goal === 'gain') proteinMultiplier = 2.2;
    
    const targetProtein = Math.round(weight * proteinMultiplier);

    // 3. Assemble meal contents based on constraints
    const isVeg = diet === 'veg';
    const isGlutenFree = allergy === 'gluten';
    const isLactoseFree = allergy === 'dairy';
    const isNutFree = allergy === 'nuts';

    // Build recipes dynamically based on constraints
    const plan = this.buildMenu(isVeg, isGlutenFree, isLactoseFree, isNutFree, targetCals, targetProtein);

    // 4. Calculate total grocery checklist and weekly costs
    const groceryList = this.compileWeeklyGrocery(plan, isVeg, isGlutenFree, isLactoseFree, isNutFree);
    
    // Total weekly budget cost
    const totalWeeklyCost = groceryList.reduce((sum, item) => sum + item.cost, 0);

    return {
      dailyCalories: targetCals,
      dailyProtein: targetProtein,
      meals: plan,
      groceryList,
      totalWeeklyCost: parseFloat(totalWeeklyCost.toFixed(2)),
      budgetLimit: budget,
      budgetStatus: totalWeeklyCost <= budget ? 'under' : 'over'
    };
  },

  /**
   * Build individual recipes dynamically based on allergies and vegetarian choices
   */
  buildMenu(isVeg, isGlutenFree, isLactoseFree, isNutFree, targetCals, targetProtein) {
    // Portions are scaled up/down depending on target calories
    const scaleFactor = targetCals / 1850; // 1850 is base plan calories

    // Dairy Substitute
    const milkName = isLactoseFree ? 'Soy Milk (Dairy-Free)' : 'Skimmed Milk';
    // Nut Substitute
    const nutsName = isNutFree ? 'Sunflower Seeds' : 'Almonds';
    // Bread Substitute
    const breadName = isGlutenFree ? 'Gluten-Free Bread' : 'Whole Wheat Bread';
    // Protein Base
    const proteinLunch = isVeg ? 'Sauteed Tofu' : 'Grilled Chicken Breast';
    const proteinDinner = isVeg ? 'Spiced Paneer Block' : 'Chicken Stir Fry';

    const menu = {
      breakfast: {
        name: `High-Fiber Oatmeal bowl`,
        ingredients: `Oats (60g), ${milkName} (250ml), 1 Banana, Honey (1 tbsp), ${nutsName} (15g)`,
        calories: Math.round(410 * scaleFactor),
        protein: Math.round(16 * (isLactoseFree ? 0.9 : 1.0)),
        cost: 1.25
      },
      lunch: {
        name: `Brown Rice & ${proteinLunch}`,
        ingredients: `${isVeg ? 'Tofu' : 'Chicken Breast'} (150g), Brown Rice (100g raw), Broccoli & Mixed Greens (120g), Olive Oil (1 tsp)`,
        calories: Math.round(620 * scaleFactor),
        protein: Math.round(isVeg ? 24 * scaleFactor : 42 * scaleFactor),
        cost: isVeg ? 1.80 : 2.40
      },
      dinner: {
        name: `${proteinDinner} with Bread`,
        ingredients: `${isVeg ? 'Paneer' : 'Chicken'} (120g), Mixed Vegetables (150g), 2 Slices of ${breadName}`,
        calories: Math.round(560 * scaleFactor),
        protein: Math.round(isVeg ? 26 * scaleFactor : 36 * scaleFactor),
        cost: isVeg ? 2.10 : 2.00
      },
      snacks: {
        name: `${isLactoseFree ? 'Gluten-Free Oats bar' : 'High-Protein Greek Yogurt'} & Fruits`,
        ingredients: `${isLactoseFree ? 'Oats (30g) and Apple' : 'Plain Greek Yogurt (150g)'}, 1 Apple, Chia Seeds (1 tsp), ${isNutFree ? 'Pumpkin Seeds' : 'Peanut Butter'} (1 tbsp)`,
        calories: Math.round(260 * scaleFactor),
        protein: Math.round(14 * scaleFactor),
        cost: 1.10
      }
    };

    return menu;
  },

  /**
   * Compile and estimate grocery list items for 7 days
   */
  compileWeeklyGrocery(menu, isVeg, isGlutenFree, isLactoseFree, isNutFree) {
    const list = [];
    
    // Scale weights of weekly grocery items
    const baseMult = 7;

    // 1. Oats
    list.push({
      name: 'Whole Grain Oats',
      quantity: '500 g',
      cost: 1.50
    });

    // 2. Milk / Soy Milk
    const milkName = isLactoseFree ? 'Soy Milk (Dairy-Free)' : 'Skimmed Milk';
    list.push({
      name: milkName,
      quantity: '2 Liters',
      cost: isLactoseFree ? 3.60 : 2.40
    });

    // 3. Protein Source (Chicken or Paneer/Tofu)
    if (isVeg) {
      list.push({
        name: 'Fresh Tofu / Paneer block',
        quantity: '1.8 kg',
        cost: 12.20
      });
    } else {
      list.push({
        name: 'Chicken Breast (Boneless)',
        quantity: '1.8 kg',
        cost: 13.50
      });
      list.push({
        name: 'Fresh Eggs',
        quantity: '1 Dozen',
        cost: 2.80
      });
    }

    // 4. Rice
    list.push({
      name: 'Brown Rice',
      quantity: '1 kg',
      cost: 2.50
    });

    // 5. Bread
    const breadName = isGlutenFree ? 'Gluten-Free Bread' : 'Whole Wheat Bread';
    list.push({
      name: breadName,
      quantity: '1 Loaf',
      cost: isGlutenFree ? 4.00 : 2.00
    });

    // 6. Vegetables & Fruits
    list.push({
      name: 'Mixed Vegetables (Broccoli, Peppers, Carrots)',
      quantity: '2 kg',
      cost: 7.00
    });
    list.push({
      name: 'Fruits (Bananas & Apples)',
      quantity: '2 kg',
      cost: 8.00
    });

    // 7. Healthy Fats / Nuts
    const nutsName = isNutFree ? 'Mixed Seeds (Sunflower / Pumpkin)' : 'Almonds & Peanut Butter';
    list.push({
      name: nutsName,
      quantity: '1 Pack',
      cost: isNutFree ? 3.50 : 5.00
    });

    return list;
  },

  /**
   * Render generated plan into index.html elements
   */
  displayPlan(mealPlan) {
    const resultsArea = document.getElementById('meal-plan-results-area');
    if (!resultsArea) return;

    resultsArea.style.display = 'block';

    // Daily totals
    document.getElementById('meal-calories-summary').innerText = `Daily targets: ${mealPlan.dailyCalories} kcal | ${mealPlan.dailyProtein}g Protein`;
    
    const badge = document.getElementById('meal-pricing-badge');
    if (mealPlan.budgetStatus === 'under') {
      badge.innerText = `Budget Target Met (Under $${mealPlan.budgetLimit})`;
      badge.className = 'badge badge-steps'; // green
    } else {
      badge.innerText = `Over Budget Limit ($${mealPlan.budgetLimit})`;
      badge.className = 'badge badge-calories'; // red
    }

    // Breakfast
    document.getElementById('meal-breakfast-name').innerText = mealPlan.meals.breakfast.name;
    document.getElementById('meal-breakfast-ingredients').innerText = mealPlan.meals.breakfast.ingredients;
    document.getElementById('meal-breakfast-cals').innerText = mealPlan.meals.breakfast.calories;
    document.getElementById('meal-breakfast-protein').innerText = mealPlan.meals.breakfast.protein;
    document.getElementById('meal-breakfast-cost').innerText = `$${mealPlan.meals.breakfast.cost.toFixed(2)}`;

    // Lunch
    document.getElementById('meal-lunch-name').innerText = mealPlan.meals.lunch.name;
    document.getElementById('meal-lunch-ingredients').innerText = mealPlan.meals.lunch.ingredients;
    document.getElementById('meal-lunch-cals').innerText = mealPlan.meals.lunch.calories;
    document.getElementById('meal-lunch-protein').innerText = mealPlan.meals.lunch.protein;
    document.getElementById('meal-lunch-cost').innerText = `$${mealPlan.meals.lunch.cost.toFixed(2)}`;

    // Dinner
    document.getElementById('meal-dinner-name').innerText = mealPlan.meals.dinner.name;
    document.getElementById('meal-dinner-ingredients').innerText = mealPlan.meals.dinner.ingredients;
    document.getElementById('meal-dinner-cals').innerText = mealPlan.meals.dinner.calories;
    document.getElementById('meal-dinner-protein').innerText = mealPlan.meals.dinner.protein;
    document.getElementById('meal-dinner-cost').innerText = `$${mealPlan.meals.dinner.cost.toFixed(2)}`;

    // Snacks
    document.getElementById('meal-snacks-name').innerText = mealPlan.meals.snacks.name;
    document.getElementById('meal-snacks-ingredients').innerText = mealPlan.meals.snacks.ingredients;
    document.getElementById('meal-snacks-cals').innerText = mealPlan.meals.snacks.calories;
    document.getElementById('meal-snacks-protein').innerText = mealPlan.meals.snacks.protein;
    document.getElementById('meal-snacks-cost').innerText = `$${mealPlan.meals.snacks.cost.toFixed(2)}`;

    // Grocery checklist
    const checklist = document.getElementById('grocery-checklist-container');
    checklist.innerHTML = '';

    mealPlan.groceryList.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'grocery-item';
      li.innerHTML = `
        <label class="grocery-name">
          <input type="checkbox" id="grocery-item-${index}" style="margin-right: 0.5rem; cursor:pointer;">
          <span>${item.name} (${item.quantity})</span>
        </label>
        <span class="grocery-cost">$${item.cost.toFixed(2)}</span>
      `;
      checklist.appendChild(li);
    });

    document.getElementById('grocery-total-cost').innerText = `$${mealPlan.totalWeeklyCost.toFixed(2)}`;
  }
};
