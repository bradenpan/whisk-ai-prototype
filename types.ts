
export enum HealthGoal {
  LONGEVITY = 'Longevity',
  HEART_HEALTH = 'Heart Health',
  WEIGHT_LOSS = 'Weight Loss',
  MUSCLE_GAIN = 'Muscle Gain',
  BRAIN_HEALTH = 'Brain Health',
  BLOOD_SUGAR_CONTROL = 'Blood Sugar Control'
}

export interface Ingredient {
  name: string;
  amount: string; // Display string (e.g. "1 cup")
  quantity: number; // Numeric value for scaling (e.g. 1)
  unit: string; // Unit for scaling (e.g. "cup")
  category?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number; // Base servings for the generated recipe
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number; // Added fiber
  };
  healthTags: string[];
  reasoning: string; // Why this fits the user's biology
}

export interface UserProfile {
  name: string;
  
  // Core Preferences
  healthGoals: HealthGoal[];
  nutritionalFocus: string[]; // Replaces specific labs (e.g. "Low Saturated Fat")
  dietaryRestrictions: string[];
  
  // Cooking Logistics
  maxCookingMinutes?: number; 
  cookingAppliances: string[]; 
}

export interface WeeklyPlan {
  [key: string]: Recipe[]; // key is "Monday", "Tuesday", etc.
}

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface ShoppingItem {
  name: string;
  amount: string;
  category: string; // Produce, Meat, etc.
  checked: boolean; // "Bought"
  alreadyHave: boolean; // "Already in pantry"
  note?: string; // e.g. "Check pantry for existing amount"
}
