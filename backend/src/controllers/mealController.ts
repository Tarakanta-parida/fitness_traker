import { Response } from 'express';
import { db } from '../config/db';
import { cache } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

const getTodayString = () => new Date().toISOString().split('T')[0];

const getWeekString = (date: Date) => {
  const tempDate = new Date(date.valueOf());
  // Adjust to Thursday to get ISO week
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const year = tempDate.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil((((tempDate.getTime() - startOfYear.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

export const MealController = {
  /**
   * Fetch current meal plan for today
   */
  async getMealPlan(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const todayStr = getTodayString();
    const weekStr = getWeekString(new Date());

    try {
      // 1. Query meals logged/planned for today
      const mealsRes = await db.query(
        'SELECT meal_type, food_name, calories, protein, price FROM meals WHERE user_id = $1 AND date = $2',
        [userId, todayStr]
      );

      if (mealsRes.rows.length === 0) {
        return res.status(200).json({ success: true, mealPlan: null });
      }

      // 2. Query grocery list for current week
      const groceryRes = await db.query(
        'SELECT item as name, quantity, price as cost FROM grocery_list WHERE user_id = $1 AND week = $2',
        [userId, weekStr]
      );

      // Reconstruct target formats
      const mealsObj: any = {};
      let totalCals = 0;
      let totalProtein = 0;
      let weeklyGroceryTotal = 0;

      for (const row of mealsRes.rows) {
        mealsObj[row.meal_type] = {
          name: row.food_name,
          ingredients: row.food_name, // fallback ingredients
          calories: row.calories,
          protein: row.protein,
          cost: parseFloat(row.price || 0).toFixed(2)
        };
        totalCals += row.calories;
        totalProtein += row.protein;
      }

      const groceryList = groceryRes.rows.map(row => {
        const priceNum = parseFloat(row.cost || 0);
        weeklyGroceryTotal += priceNum;
        return {
          name: row.name,
          quantity: row.quantity,
          cost: priceNum
        };
      });

      const responsePayload = {
        calories: totalCals,
        protein: totalProtein,
        weekly_budget: parseFloat(weeklyGroceryTotal.toFixed(2)),
        meals: mealsObj,
        grocery_list: groceryList
      };

      return res.status(200).json({
        success: true,
        mealPlan: responsePayload
      });

    } catch (err) {
      console.error('Get meal plan error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Generate customized budget-friendly meal recommendations
   */
  async generateMealPlan(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { weight, height, age, gender, goal, diet, preference, allergy, budget } = req.body;

    try {
      const userWeight = weight ? parseFloat(weight) : 70;
      const userHeight = height ? parseFloat(height) : 175;
      const userAge = age ? parseInt(age) : 28;
      const userBudget = budget ? parseFloat(budget) : 150;
      console.log('User weekly target budget constraints:', userBudget);

      // 1. Calculate Mifflin-St Jeor TDEE
      let bmr = 0;
      if (gender === 'male') {
        bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge + 5;
      } else {
        bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge - 161;
      }

      const tdee = Math.round(bmr * 1.375); // Active sedentary activity multiplier

      // 2. Adjust target calories based on goals
      let targetCals = tdee;
      if (goal === 'lose') targetCals = tdee - 500;
      else if (goal === 'gain') targetCals = tdee + 400;

      // 3. Protein target (1.6g to 2.2g per kg of weight)
      let proteinMultiplier = 1.6;
      if (preference === 'highprotein') proteinMultiplier = 2.2;
      else if (preference === 'lowcarb') proteinMultiplier = 1.8;

      const targetProtein = Math.round(userWeight * proteinMultiplier);

      // 4. Formulate optimized meal menu recommendations
      const isVeg = diet === 'veg';
      const isGlutenFree = allergy === 'gluten';
      const isNutFree = allergy === 'nuts';

      const breakfastName = isVeg ? 'Oats, Milk, Fruits, Honey & Chia Seeds' : 'Eggs Scramble, Whole wheat bread & Berries';
      const lunchName = isVeg ? 'Tofu Stir Fry with Brown Rice & Broccoli' : 'Grilled Chicken breast with Quinoa & Salads';
      const dinnerName = isVeg ? 'Lentil soup with Garlic Toast & Salad' : 'Baked Salmon with Sweet Potato mash & Asparagus';
      const snackName = isVeg ? 'Hummus & Celery sticks with Walnuts' : 'Tuna salad with low-fat Crackers';

      // Est breakfast, lunch, dinner, snacks calorie ratios: 25%, 35%, 30%, 10%
      const meals = [
        {
          type: 'breakfast',
          name: breakfastName,
          calories: Math.round(targetCals * 0.25),
          protein: Math.round(targetProtein * 0.20),
          price: isVeg ? 1.50 : 2.20
        },
        {
          type: 'lunch',
          name: lunchName,
          calories: Math.round(targetCals * 0.35),
          protein: Math.round(targetProtein * 0.40),
          price: isVeg ? 2.50 : 3.80
        },
        {
          type: 'dinner',
          name: dinnerName,
          calories: Math.round(targetCals * 0.30),
          protein: Math.round(targetProtein * 0.30),
          price: isVeg ? 2.20 : 4.50
        },
        {
          type: 'snacks',
          name: snackName,
          calories: Math.round(targetCals * 0.10),
          protein: Math.round(targetProtein * 0.10),
          price: isVeg ? 0.90 : 1.50
        }
      ];

      // 5. Compile Grocery checklist mapping
      const breadName = isGlutenFree ? 'Gluten-Free Bread loaf' : 'Whole Wheat Bread loaf';
      const nutsName = isNutFree ? 'Sunflower/Pumpkin Seeds pack' : 'Mixed Almonds & Walnuts pack';

      const groceryList = [
        { name: isVeg ? 'Fresh Tofu / Paneer block' : 'Chicken Breast (Boneless)', quantity: '1.8 kg', cost: isVeg ? 12.20 : 13.50 }
      ];

      if (!isVeg) {
        groceryList.push({ name: 'Fresh Eggs', quantity: '1 Dozen', cost: 2.80 });
      }

      groceryList.push(
        { name: 'Brown Rice', quantity: '1 kg', cost: 2.50 },
        { name: breadName, quantity: '1 Loaf', cost: isGlutenFree ? 4.00 : 2.00 },
        { name: 'Mixed Vegetables (Broccoli, Peppers, Carrots)', quantity: '2 kg', cost: 7.00 },
        { name: 'Fruits (Bananas & Apples)', quantity: '2 kg', cost: 8.00 },
        { name: nutsName, quantity: '1 Pack', cost: isNutFree ? 3.50 : 5.00 }
      );

      const totalWeeklyCost = parseFloat(groceryList.reduce((sum, item) => sum + item.cost, 0).toFixed(2));
      console.log('Weekly grocery total cost:', totalWeeklyCost);

      const todayStr = getTodayString();
      const weekStr = getWeekString(new Date());

      // 6. Save Meal Plan - Write meals to database (Delete today's existing records first)
      await db.query('DELETE FROM meals WHERE user_id = $1 AND date = $2', [userId, todayStr]);
      for (const meal of meals) {
        await db.query(
          `INSERT INTO meals (user_id, meal_type, food_name, calories, protein, price, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, meal.type, meal.name, meal.calories, meal.protein, meal.price, todayStr]
        );
      }

      // 7. Save Grocery checklist items (Delete current week's existing records first)
      await db.query('DELETE FROM grocery_list WHERE user_id = $1 AND week = $2', [userId, weekStr]);
      for (const item of groceryList) {
        await db.query(
          `INSERT INTO grocery_list (user_id, week, item, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, weekStr, item.name, item.quantity, item.cost]
        );
      }

      // 8. Clear log summary cache
      await cache.del(`lifetrack_log_${userId}_${todayStr}`);

      // Map back payload for controller response
      const responsePayload = {
        calories: targetCals,
        protein: targetProtein,
        weekly_budget: totalWeeklyCost,
        meals: {
          breakfast: meals[0],
          lunch: meals[1],
          dinner: meals[2],
          snacks: meals[3]
        },
        grocery_list: groceryList
      };

      return res.status(200).json({
        success: true,
        mealPlan: responsePayload
      });

    } catch (err) {
      console.error('Generate meal plan error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
