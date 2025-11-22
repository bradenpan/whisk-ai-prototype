
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, UserProfile, Ingredient, ShoppingItem } from '../types';

// Helper to initialize AI
const getAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean and extract JSON from response text
const extractAndParseJSON = (text: string, isArray: boolean = true): any => {
    let cleanText = text || "";
    
    // 1. Clean Markdown Code Blocks
    if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "");
    }

    // 2. Find Start/End Indices based on expected type
    const startChar = isArray ? '[' : '{';
    const endChar = isArray ? ']' : '}';
    
    const startIndex = cleanText.indexOf(startChar);
    if (startIndex !== -1) {
        cleanText = cleanText.substring(startIndex);
    }

    // 3. Attempt Parse
    try {
        return JSON.parse(cleanText);
    } catch (error) {
        if (!isArray) throw error; // Harder to recover single objects
        
        console.warn("JSON Parse failed, attempting recovery from truncation:", error);
        
        // 4. Array Recovery Logic
        // Try to find the last sequence of `},` which indicates a closed object followed by another
        let lastEndIndex = cleanText.lastIndexOf('},');
        
        if (lastEndIndex === -1) {
            // Fallback: Try to find just the last `}` (maybe it was the last item or only item)
            const lastCloseBrace = cleanText.lastIndexOf('}');
            if (lastCloseBrace !== -1 && lastCloseBrace > cleanText.indexOf('{')) {
                 lastEndIndex = lastCloseBrace;
            }
        }

        if (lastEndIndex !== -1) {
            // Construct a valid array ending
            const recoveredText = cleanText.substring(0, lastEndIndex + 1) + ']';
            try {
                const recovered = JSON.parse(recoveredText);
                console.log(`Successfully recovered ${recovered.length} items.`);
                return recovered;
            } catch (recoveryError) {
                console.error("JSON recovery failed:", recoveryError);
                throw recoveryError;
            }
        } else {
            throw new Error("Could not recover JSON: No valid objects found.");
        }
    }
}

export const generateRecipes = async (
  profile: UserProfile,
  count: number,
  servings: number,
  ingredientsToUseUp?: string,
  maxCookingMinutes?: number
): Promise<Recipe[]> => {
  const ai = getAi();
  
  // Safe accessors for array fields and calculations for context
  const restrictions = (profile.dietaryRestrictions || []).join(', ') || 'None';
  const healthGoals = (profile.healthGoals || []).join(', ') || 'General Health';
  const nutritionalFocus = (profile.nutritionalFocus || []).join(', ') || 'Balanced';
  const appliances = (profile.cookingAppliances && profile.cookingAppliances.length > 0) 
    ? profile.cookingAppliances.join(', ') 
    : 'Standard Kitchen (Oven/Stove)';
    
  // Use the passed maxCookingMinutes, or fallback to profile if it exists, or default to none
  const timeLimit = maxCookingMinutes || profile.maxCookingMinutes;
  const maxTimeConstraint = timeLimit 
    ? `MAX COOKING TIME: The TOTAL prep + cook time MUST be under ${timeLimit} minutes.` 
    : '';

  const useUpContext = ingredientsToUseUp 
    ? `PRIORITY - INGREDIENTS TO USE UP: The user has these items to use: "${ingredientsToUseUp}". 
       Task: Distribute these ingredients across the ${count} recipes generated in this batch. 
       - You do NOT need to use all of these ingredients in a single recipe.
       - You do NOT need to use them in every recipe. 
       - Ideally, ensure at least one of the recipes utilizes some of these ingredients.
       - Example: If user has Chicken and Kale, you can make one Chicken recipe and a separate Kale recipe.
       `
    : '';

  const systemInstruction = `
    You are an expert Longevity Nutritionist and Chef. Your goal is to create personalized DINNER recipes that optimize for the user's specific health profile.
    
    CRITICAL RULES:
    1. DIETARY RESTRICTIONS: Strictly adhere to the user's restrictions (e.g. ${restrictions}). Never include forbidden ingredients. If "No Red Meat" is selected, do NOT use beef, pork, lamb, or duck.
    2. SERVINGS: Adjust ingredient quantities for exactly ${servings} servings.
    3. UNITS: ALWAYS use IMPERIAL units for ingredients (e.g. cups, oz, lbs, tbsp, tsp). DO NOT use grams or ml for ingredients.
    4. CONCISENESS: Keep descriptions, instructions, and reasoning concise to ensure the output fits within token limits.
    5. TIME: ${maxTimeConstraint}
    6. APPLIANCES: The user has access to: ${appliances}. Incorporate these cooking methods where appropriate/efficient.

    NUTRITIONAL STRATEGY:
    The user has requested the following Nutritional Focus Areas. You MUST tailor the ingredients to meet these needs:
    - ${nutritionalFocus}

    Examples of Focus Application:
    - "Limit Saturated Fats": Use olive oil instead of butter, lean proteins, avoid cream.
    - "High Fiber": Heavy emphasis on legumes, vegetables, whole grains.
    - "Anti-Inflammatory": Use turmeric, ginger, berries, fatty fish, leafy greens. Avoid processed oils.
    - "Low Glycemic Index": Complex carbs only, pair with fats/proteins.
    - "High Iron": Rich in leafy greens, legumes, or lean meats (if permitted), Vitamin C pairing.
    - "Gut Health": Fermented foods, high fiber diversity.
  `;

  const userContext = JSON.stringify(profile);
  const prompt = `
    Generate ${count} distinct DINNER recipes based on this user profile: ${userContext}.
    
    Context Overrides & Specific Instructions:
    - Dietary Restrictions: ${restrictions} (STRICT ADHERENCE REQUIRED)
    - Health Goals: ${healthGoals}
    - Key Nutritional Focus: ${nutritionalFocus}
    - Appliances Available: ${appliances}
    - ${maxTimeConstraint}
    - ${useUpContext}

    Provide a specific 'reasoning' for each recipe connecting the ingredients to the user's specific nutritional focus areas and health goals.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING, description: "Short summary (max 20 words)" },
              servings: { type: Type.NUMBER },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING, description: "Human readable amount in IMPERIAL units, e.g. '1 cup', '4 oz'" },
                    quantity: { type: Type.NUMBER, description: "Numeric amount for scaling, e.g. 1.0" },
                    unit: { type: Type.STRING, description: "Unit string, e.g. 'cup', 'oz', 'lb'" },
                    category: { type: Type.STRING },
                  }
                }
              },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step instructions. Keep concise." },
              prepTimeMinutes: { type: Type.NUMBER },
              cookTimeMinutes: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  fiber: { type: Type.NUMBER },
                }
              },
              healthTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING, description: "Brief explanation of health benefits (max 40 words)" },
            }
          }
        }
      }
    });

    let recipes = [];
    try {
        recipes = extractAndParseJSON(response.text || "[]", true);
    } catch (e) {
        console.error("Final JSON recovery failed:", e);
        return [];
    }

    // Ensure IDs are unique-ish and servings are set
    return recipes.map((r: any) => ({ 
        ...r, 
        id: r.id || Math.random().toString(36).substring(7),
        servings: r.servings || servings 
    }));

  } catch (error) {
    console.error("Error generating recipes:", error);
    return [];
  }
};

export const customizeRecipe = async (
  originalRecipe: Recipe,
  instruction: string,
  profile: UserProfile
): Promise<Recipe | null> => {
  const ai = getAi();

  const restrictions = (profile.dietaryRestrictions || []).join(', ') || 'None';
  const focus = (profile.nutritionalFocus || []).join(', ') || 'None';
  
  const prompt = `
    You are an expert chef and nutritionist.
    
    Original Recipe JSON:
    ${JSON.stringify(originalRecipe)}
    
    User Instruction for Modification:
    "${instruction}"
    
    User Dietary Restrictions (MUST MAINTAIN):
    ${restrictions}

    User Nutritional Focus:
    ${focus}
    
    Task:
    Modify the Original Recipe based on the User Instruction.
    - Update title, ingredients, instructions, macros, and reasoning as needed.
    - Maintain the exact same JSON structure.
    - Keep the same ID.
    - Ensure IMPERIAL units.
    - Ensure Servings count remains the same unless explicitly asked to change.
    
    Return ONLY the valid JSON object for the single recipe.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  servings: { type: Type.NUMBER },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        category: { type: Type.STRING },
                      }
                    }
                  },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  prepTimeMinutes: { type: Type.NUMBER },
                  cookTimeMinutes: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fats: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                    }
                  },
                  healthTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reasoning: { type: Type.STRING },
                }
            }
        }
    });

    try {
        return extractAndParseJSON(response.text || "{}", false);
    } catch (e) {
        console.error("Failed to parse customized recipe:", e);
        return null;
    }
  } catch (error) {
    console.error("Error customizing recipe:", error);
    return null;
  }
}

export const generateShoppingListFromPlan = async (
  recipes: Recipe[],
  pantryItems?: string
): Promise<ShoppingItem[]> => {
  const ai = getAi();
  
  if (recipes.length === 0) return [];

  const ingredientsList = recipes.flatMap(r => r.ingredients).map(i => `${i.amount} ${i.name}`).join(", ");
  
  const pantryContext = pantryItems ? `USER PANTRY ITEMS: "${pantryItems}". If a generated shopping item matches one of these pantry items, set the 'note' field to "Less the amount you already have" or "Check pantry for existing amount".` : '';

  const prompt = `
    Here is a list of ingredients from multiple recipes:
    ${ingredientsList}
    
    ${pantryContext}

    Tasks:
    1. Combine similar items and sum up their amounts (e.g. "2 onions" + "1 onion" = "3 onions").
    2. Categorize each item into one of these categories: "Produce", "Meat & Seafood", "Pantry", "Spices", "Dairy & Eggs", "Frozen", "Bakery", "Other".
    3. Ensure all units are displayed in IMPERIAL units (oz, lbs, cups).
    
    Return a clean JSON list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of item" },
              amount: { type: Type.STRING, description: "Total quantity with unit (Imperial)" },
              category: { type: Type.STRING, description: "Category (e.g. Produce)" },
              checked: { type: Type.BOOLEAN, description: "Always false" },
              alreadyHave: { type: Type.BOOLEAN, description: "Always false" },
              note: { type: Type.STRING, description: "Optional note, e.g. 'Check pantry for existing amount'" }
            }
          }
        }
      }
    });
    
    try {
        return extractAndParseJSON(response.text || "[]", true);
    } catch (e) {
        console.error("Error parsing shopping list JSON:", e);
        // Fallback to plain list if AI fails
        return recipes.flatMap(r => r.ingredients).map(i => ({ 
            name: i.name, 
            amount: i.amount, 
            category: 'Uncategorized', 
            checked: false, 
            alreadyHave: false 
        }));
    }
  } catch (e) {
    console.error("Error generating shopping list:", e);
    return recipes.flatMap(r => r.ingredients).map(i => ({ 
      name: i.name, 
      amount: i.amount, 
      category: 'Uncategorized', 
      checked: false, 
      alreadyHave: false 
    }));
  }
};

export const categorizeItem = async (itemName: string): Promise<string> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Categorize this shopping item: "${itemName}" into one of: Produce, Meat & Seafood, Pantry, Spices, Dairy & Eggs, Frozen, Bakery, Other. Return ONLY the category name.`,
        });
        return response.text?.trim() || 'Other';
    } catch (error) {
        console.error("Error categorizing item:", error);
        return 'Other';
    }
};
