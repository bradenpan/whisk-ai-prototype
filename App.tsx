
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { UserProfile, Recipe, WeeklyPlan, ShoppingItem, DAYS_OF_WEEK } from './types';
import { generateRecipes, generateShoppingListFromPlan, categorizeItem, customizeRecipe } from './services/geminiService';
import { HealthProfile } from './components/HealthProfile';
import { RecipeCard } from './components/RecipeCard';
import { ChefHat, Calendar, ShoppingCart, User, Loader2, Menu, Plus, Trash2, Users, XCircle, Heart, Check, Clock, RefreshCw, ListPlus, Wand2, Sparkles, Info, CheckCircle2, Tag, ArrowRightLeft } from 'lucide-react';

// --- Mock Initial Data ---
const initialProfile: UserProfile = {
  name: "Guest User",
  healthGoals: [],
  nutritionalFocus: [],
  dietaryRestrictions: [],
  maxCookingMinutes: 60,
  cookingAppliances: []
};

// --- Page Components Defined Outside App to Prevent Re-Mounting ---

interface ProfilePageProps {
  userProfile: UserProfile;
  setUserProfile: (p: UserProfile) => void;
}
const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, setUserProfile }) => (
  <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Profile</h1>
          <p className="text-slate-600">Customize your nutrition strategy and cooking preferences.</p>
      </div>
      <HealthProfile profile={userProfile} onUpdate={setUserProfile} />
  </div>
);

interface AutoPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: Recipe[];
    onGenerate: (favoriteCount: number, ingredients: string, servings: number, selectedDays: string[], maxTime: number) => Promise<void>;
    setPantryItems: (items: string) => void;
    currentPantry: string;
}

const AutoPlannerModal: React.FC<AutoPlannerModalProps> = ({ isOpen, onClose, favorites, onGenerate, setPantryItems, currentPantry }) => {
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [ingredients, setIngredients] = useState(currentPantry || '');
    const [servings, setServings] = useState(2);
    const [maxTime, setMaxTime] = useState(45); // Default 45 mins
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>(DAYS_OF_WEEK);

    // Number of meal slots to fill based on user selection
    const totalSlots = selectedDays.length;
    
    // Max number of favorites we can actually use
    // Cannot exceed total slots (selected days) AND cannot exceed available favorites
    const maxAvailableFavorites = Math.min(favorites.length, totalSlots);

    useEffect(() => {
        if (isOpen) {
            // Default logic: try to use some favorites if possible
            // Re-clamp favoriteCount if selectedDays changes to reduce totalSlots below current count
            setFavoriteCount(prev => Math.min(prev, Math.min(favorites.length, selectedDays.length)));
        }
    }, [isOpen, favorites.length, selectedDays.length]);
    
    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(prev => prev.filter(d => d !== day));
        } else {
            setSelectedDays(prev => [...prev, day]);
        }
    };

    const handleGenerate = async () => {
        if (totalSlots === 0) return;
        setIsGenerating(true);
        // Save the ingredients to the global pantry state
        setPantryItems(ingredients);
        await onGenerate(favoriteCount, ingredients, servings, selectedDays, maxTime);
        setIsGenerating(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative p-6 max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                         <Sparkles className="w-5 h-5 text-emerald-600" />
                         Auto-Generate Week
                     </h2>
                     <button onClick={onClose}><XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                 </div>

                 <p className="text-sm text-slate-600 mb-6">
                     Mix favorites with new AI recipes tailored to your pantry for the days you select.
                 </p>

                 <div className="space-y-6">
                     {/* Day Selection */}
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                             Select Days to Cook ({totalSlots})
                         </label>
                         <div className="flex flex-wrap justify-between gap-2">
                             {DAYS_OF_WEEK.map(day => {
                                 const isSelected = selectedDays.includes(day);
                                 return (
                                     <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            isSelected 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                        title={day}
                                     >
                                         {day.substring(0, 1)}
                                     </button>
                                 )
                             })}
                         </div>
                     </div>

                     {/* Favorite Balance */}
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                             <span>Balance</span>
                             <span className="text-emerald-600 font-mono">
                                {favoriteCount > 0 ? `${favoriteCount} Favorites` : 'All New'} / {totalSlots - favoriteCount} New
                             </span>
                         </label>
                         
                         <input 
                            type="range" 
                            min="0" 
                            max={Math.max(0, maxAvailableFavorites)} 
                            value={favoriteCount}
                            onChange={(e) => setFavoriteCount(parseInt(e.target.value))}
                            disabled={maxAvailableFavorites === 0}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
                         />
                         
                         <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                            <span>All New</span>
                            <span>Max Favorites ({maxAvailableFavorites})</span>
                         </div>

                         {favorites.length === 0 && (
                             <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-100">
                                 <Info className="w-3 h-3 inline mr-1" />
                                 No favorites saved yet.
                             </p>
                         )}
                     </div>

                     {/* Max Cooking Time */}
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                             <span>Max Cooking Time</span>
                             <span className="text-emerald-600 font-mono">{maxTime} min</span>
                         </label>
                         <input 
                             type="range"
                             min="15"
                             max="120"
                             step="5"
                             value={maxTime}
                             onChange={(e) => setMaxTime(parseInt(e.target.value))}
                             className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                         />
                         <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                             <span>15m</span>
                             <span>120m</span>
                         </div>
                     </div>

                     {/* Servings */}
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                             Servings per Meal
                         </label>
                         <input 
                             type="number"
                             min="1"
                             max="10"
                             value={servings}
                             onChange={(e) => setServings(parseInt(e.target.value))}
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                         />
                     </div>

                     {/* Pantry */}
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                             Ingredients to Use Up (Optional)
                         </label>
                         <textarea 
                            rows={2}
                            placeholder="e.g. Spinach, Milk, Tomatoes..."
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                         />
                     </div>
                     
                     <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || totalSlots === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                         {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                         {isGenerating ? 'Designing Plan...' : `Plan ${totalSlots} Meals`}
                     </button>
                 </div>
            </div>
        </div>
    );
};

interface PlannerPageProps {
  weeklyPlan: WeeklyPlan;
  handleRemoveFromPlan: (day: string, recipeId: string) => void;
  handleRegenerateRecipe: (day: string, recipe: Recipe) => void;
  handleMoveRecipe: (fromDay: string, toDay: string, recipe: Recipe) => void;
  setSelectedRecipe: (r: Recipe | null) => void;
  handleClearPlan: () => void;
  userProfile: UserProfile;
  favorites: Recipe[];
  handleToggleFavorite: (recipe: Recipe) => void;
  setWeeklyPlan: (plan: WeeklyPlan) => void;
  setPantryItems: (items: string) => void;
  pantryItems: string;
}
const PlannerPage: React.FC<PlannerPageProps> = ({
  weeklyPlan, handleRemoveFromPlan, handleRegenerateRecipe, handleMoveRecipe, setSelectedRecipe, handleClearPlan, userProfile, favorites, handleToggleFavorite, setWeeklyPlan, setPantryItems, pantryItems
}) => {
    const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    // Count total meals to decide if we show the hero state
    const totalMeals = Object.values(weeklyPlan).flat().length;

    const onNewWeek = () => {
        if (window.confirm("Start a new week? This will clear your current meal plan and shopping list.")) {
            handleClearPlan();
        }
    };

    const onRegenerateClick = async (day: string, recipe: Recipe) => {
        setRegeneratingId(recipe.id);
        await handleRegenerateRecipe(day, recipe);
        setRegeneratingId(null);
    };

    const handleAutoGenerateWeek = async (favoriteCount: number, ingredientsToUseUp: string, servings: number, selectedDays: string[], maxTime: number) => {
        const totalNeeded = selectedDays.length;
        if (totalNeeded === 0) return;

        const newCount = totalNeeded - favoriteCount;
        let generatedNewRecipes: Recipe[] = [];

        // 1. Generate New Recipes
        if (newCount > 0) {
            if (ingredientsToUseUp && ingredientsToUseUp.trim().length > 0) {
                const useUpCount = Math.min(newCount, 2);
                const remainderCount = newCount - useUpCount;
                
                let useUpRecipes: Recipe[] = [];
                let remainderRecipes: Recipe[] = [];

                if (useUpCount > 0) {
                    useUpRecipes = await generateRecipes(userProfile, useUpCount, servings, ingredientsToUseUp, maxTime);
                }

                if (remainderCount > 0) {
                    remainderRecipes = await generateRecipes(userProfile, remainderCount, servings, undefined, maxTime);
                }
                
                generatedNewRecipes = [...useUpRecipes, ...remainderRecipes];

            } else {
                generatedNewRecipes = await generateRecipes(userProfile, newCount, servings, undefined, maxTime);
            }
        }

        // 2. Get Favorites
        let selectedFavorites: Recipe[] = [];
        if (favoriteCount > 0 && favorites.length > 0) {
            const shuffled = [...favorites].sort(() => 0.5 - Math.random());
            selectedFavorites = shuffled.slice(0, favoriteCount).map(r => ({...r, servings: servings}));
        }

        // 3. Combine and Distribute
        const finalRecipes = [...generatedNewRecipes, ...selectedFavorites];
        const newPlan: WeeklyPlan = {};
        DAYS_OF_WEEK.forEach(day => newPlan[day] = []);

        let recipeIndex = 0;
        DAYS_OF_WEEK.forEach(day => {
            if (selectedDays.includes(day) && finalRecipes[recipeIndex]) {
                newPlan[day] = [finalRecipes[recipeIndex]];
                recipeIndex++;
            }
        });

        setWeeklyPlan(newPlan);
    };

    return (
        <div className="max-w-screen-2xl mx-auto animate-fadeIn">
          <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Meal Planner</h1>
                <p className="text-slate-600">Your personalized nutrition roadmap.</p>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAutoModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium shadow-md shadow-emerald-200"
                  >
                      <Wand2 className="w-4 h-4" />
                      Auto-Generate Week
                  </button>
                  {totalMeals > 0 && (
                    <button 
                        onClick={onNewWeek}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-all text-sm font-medium shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </button>
                  )}
              </div>
          </div>

          {totalMeals === 0 ? (
               <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                       <ChefHat className="w-10 h-10" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900 mb-2">Start Your Week</h2>
                   <p className="text-slate-500 max-w-md mb-8">
                       Create a personalized meal plan blending your favorite recipes with new AI suggestions tailored to your health goals.
                   </p>
                   <button 
                       onClick={() => setIsAutoModalOpen(true)}
                       className="px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl shadow-xl hover:bg-emerald-700 transition-transform hover:-translate-y-1 flex items-center gap-3"
                   >
                       <Wand2 className="w-6 h-6" />
                       Generate Meal Plan
                   </button>
               </div>
          ) : (
              /* Grid Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden h-full">
                          <div className="p-3 bg-white border-b border-slate-100 font-bold text-center text-slate-700 text-sm uppercase tracking-wider">
                              {day}
                          </div>
                          <div className="p-2 flex-grow space-y-3 min-h-[150px]">
                              {weeklyPlan[day]?.map(recipe => (
                                  <div key={recipe.id} className="relative">
                                      {regeneratingId === recipe.id && (
                                          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                                              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                                          </div>
                                      )}
                                      <RecipeCard 
                                          recipe={recipe}
                                          onAddToPlan={() => {}} // Not needed in planner mode
                                          onToggleFavorite={handleToggleFavorite}
                                          isFavorite={favorites.some(f => f.id === recipe.id)}
                                          isAddedToPlan={true}
                                          onClick={() => setSelectedRecipe(recipe)}
                                          plannerMode={true}
                                          currentDay={day}
                                          onRegenerate={() => onRegenerateClick(day, recipe)}
                                          onMove={(toDay) => handleMoveRecipe(day, toDay, recipe)}
                                          onRemove={() => handleRemoveFromPlan(day, recipe.id)}
                                      />
                                  </div>
                              ))}
                              {(!weeklyPlan[day] || weeklyPlan[day].length === 0) && (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-1">
                                         <Plus className="w-5 h-5" />
                                      </div>
                                      <span className="text-[10px] font-medium uppercase tracking-wide">Free Day</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          <AutoPlannerModal 
              isOpen={isAutoModalOpen} 
              onClose={() => setIsAutoModalOpen(false)} 
              favorites={favorites}
              onGenerate={handleAutoGenerateWeek}
              setPantryItems={setPantryItems}
              currentPantry={pantryItems}
          />
        </div>
    )
};

interface FavoritesPageProps {
  favorites: Recipe[];
  handleAddToPlan: (day: string, recipe: Recipe) => void;
  handleToggleFavorite: (recipe: Recipe) => void;
  isRecipeInPlan: (id: string) => boolean;
  setSelectedRecipe: (r: Recipe | null) => void;
}
const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favorites, handleAddToPlan, handleToggleFavorite, isRecipeInPlan, setSelectedRecipe
}) => {
  return (
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Favorites</h1>
            <p className="text-slate-600">Recipes you have saved for quick access.</p>
        </div>

        {favorites.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <Heart className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No favorites yet</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">Click the heart icon on any recipe to save it to this collection.</p>
            </div>
        ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(recipe => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onAddToPlan={handleAddToPlan} 
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={true}
                        isAddedToPlan={isRecipeInPlan(recipe.id)}
                        onClick={() => setSelectedRecipe(recipe)}
                    />
                ))}
            </div>
        )}
      </div>
  );
};


interface ShoppingListPageProps {
  shoppingList: ShoppingItem[];
  setShoppingList: (items: ShoppingItem[]) => void;
  weeklyPlan: WeeklyPlan;
  pantryItems: string;
}
const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ shoppingList, setShoppingList, weeklyPlan, pantryItems }) => {
    const [generating, setGenerating] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [addingItem, setAddingItem] = useState(false);
    
    const safeShoppingList = (shoppingList || []) as ShoppingItem[];

    const generateList = async () => {
        setGenerating(true);
        const allRecipes = Object.values(weeklyPlan).flat() as Recipe[];
        const list = await generateShoppingListFromPlan(allRecipes, pantryItems);
        setShoppingList(list);
        setGenerating(false);
    };

    const toggleAlreadyHave = (index: number) => {
        const newList = [...safeShoppingList];
        newList[index].alreadyHave = !newList[index].alreadyHave;
        setShoppingList(newList);
    };
    
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemAmount) return;
        
        setAddingItem(true);
        const category = await categorizeItem(newItemName);
        
        const newItem: ShoppingItem = {
            name: newItemName,
            amount: newItemAmount,
            category: category,
            checked: false,
            alreadyHave: false
        };
        
        setShoppingList([...safeShoppingList, newItem]);
        setNewItemName('');
        setNewItemAmount('');
        setAddingItem(false);
    };
    
    const groupedItems = safeShoppingList.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);

    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
           <div className="flex items-center justify-between mb-8">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Shopping List</h1>
                  <p className="text-slate-600">Aggregated from your weekly meal plan.</p>
              </div>
              <button 
                  onClick={generateList}
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm disabled:opacity-70"
              >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Regenerate List
              </button>
           </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <ListPlus className="w-4 h-4" /> Add Extra Item
                </h3>
                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="text" 
                        placeholder="Item name (e.g. Almond Milk)" 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-grow border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input 
                        type="text" 
                        placeholder="Amount (e.g. 1 carton)" 
                        value={newItemAmount}
                        onChange={(e) => setNewItemAmount(e.target.value)}
                        className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button 
                        type="submit"
                        disabled={addingItem || !newItemName}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
                    >
                        {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                    </button>
                </form>
            </div>

           <div className="space-y-6">
              {safeShoppingList.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center h-64 text-slate-400">
                      <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                      <p>Click "Regenerate List" to build your shopping list from the planner.</p>
                  </div>
              ) : (
                  Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{category}</h3>
                              <span className="text-xs text-slate-400">{items.length} items</span>
                          </div>
                          <ul className="divide-y divide-slate-100">
                              {items.map((item, originalIdx) => {
                                  const realIndex = safeShoppingList.indexOf(item);
                                  return (
                                      <li key={originalIdx} className={`p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group ${item.alreadyHave ? 'bg-slate-50/50' : ''}`}>
                                          <button 
                                              onClick={() => toggleAlreadyHave(realIndex)}
                                              className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                  item.alreadyHave 
                                                  ? 'bg-slate-200 border-slate-300 text-slate-500' 
                                                  : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-200'
                                              }`}
                                              title="I already have this"
                                          >
                                              <Check className="w-3 h-3" />
                                          </button>
                                          
                                          <div className={`flex-grow ${item.alreadyHave ? 'opacity-40 grayscale' : ''}`}>
                                              <div className="flex flex-col">
                                                <div className="flex items-baseline">
                                                    <span className={`text-slate-900 font-medium ${item.alreadyHave ? 'line-through' : ''}`}>{item.name}</span>
                                                    <span className="text-slate-500 text-sm ml-2 font-mono bg-slate-100 px-2 py-0.5 rounded-full">{item.amount}</span>
                                                </div>
                                                {item.note && (
                                                    <span className="text-[10px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> {item.note}
                                                    </span>
                                                )}
                                              </div>
                                          </div>

                                          {item.alreadyHave && <span className="text-xs text-slate-400 font-medium">Have</span>}
                                      </li>
                                  );
                              })}
                          </ul>
                      </div>
                  ))
              )}
           </div>
      </div>
    );
};

interface RecipeModalProps {
    selectedRecipe: Recipe | null;
    setSelectedRecipe: (r: Recipe | null) => void;
    handleAddToPlan: (day: string, recipe: Recipe) => void;
    handleToggleFavorite: (recipe: Recipe) => void;
    isFavorite: boolean;
    isAddedToPlan: boolean;
    onCustomize: (instruction: string) => Promise<void>;
}
const RecipeModal: React.FC<RecipeModalProps> = ({ selectedRecipe, setSelectedRecipe, handleAddToPlan, handleToggleFavorite, isFavorite, isAddedToPlan, onCustomize }) => {
  if (!selectedRecipe) return null;
  return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
               <button 
                    onClick={() => setSelectedRecipe(null)}
                    className="absolute top-4 right-4 z-20 bg-white/90 p-2 rounded-full hover:bg-slate-100 transition-all shadow-sm"
               >
                   <XCircle className="w-6 h-6 text-slate-500" />
               </button>
               <div className="overflow-y-auto h-full">
                    <RecipeCard 
                        recipe={selectedRecipe} 
                        onAddToPlan={(d, r) => { handleAddToPlan(d, r); setSelectedRecipe(null); }}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={isFavorite}
                        isAddedToPlan={isAddedToPlan}
                        expanded={true}
                        onCustomize={onCustomize}
                    />
               </div>
          </div>
      </div>
  )
}

const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link 
        to={to} 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-500'}`} />
        {label}
    </Link>
  );
}

const App = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
        return { ...initialProfile, ...JSON.parse(saved) };
    }
    return initialProfile;
  });
  
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() => {
      const saved = localStorage.getItem('weeklyPlan');
      return saved ? JSON.parse(saved) : {};
  });
  
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
      const saved = localStorage.getItem('shoppingList');
      return saved ? JSON.parse(saved) : [];
  });

  const [pantryItems, setPantryItems] = useState<string>(() => {
      const saved = localStorage.getItem('pantryItems');
      return saved ? saved : '';
  });

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);
  
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
      localStorage.setItem('pantryItems', pantryItems);
  }, [pantryItems]);

  // --- Handlers ---
  const handleAddToPlan = (day: string, recipe: Recipe) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), recipe]
    }));
  };

  const handleRemoveFromPlan = (day: string, recipeId: string) => {
      setWeeklyPlan(prev => ({
          ...prev,
          [day]: prev[day].filter(r => r.id !== recipeId)
      }));
  }

  const handleMoveRecipe = (fromDay: string, toDay: string, recipe: Recipe) => {
      if (fromDay === toDay) return;
      setWeeklyPlan(prev => {
          const newPlan = { ...prev };
          // Remove
          newPlan[fromDay] = newPlan[fromDay].filter(r => r.id !== recipe.id);
          // Add
          newPlan[toDay] = [...(newPlan[toDay] || []), recipe];
          return newPlan;
      });
  };

  const handleRegenerateRecipe = async (day: string, recipe: Recipe) => {
      // Generate 1 new recipe
      const newRecipes = await generateRecipes(userProfile, 1, recipe.servings, undefined);
      if (newRecipes && newRecipes.length > 0) {
          const newRecipe = newRecipes[0];
          setWeeklyPlan(prev => {
              const newPlan = { ...prev };
              // Replace specific recipe by ID
              newPlan[day] = newPlan[day].map(r => r.id === recipe.id ? newRecipe : r);
              return newPlan;
          });
      }
  };

  const handleClearPlan = () => {
      setWeeklyPlan({});
      setShoppingList([]);
      setPantryItems('');
  }

  const handleToggleFavorite = (recipe: Recipe) => {
    if (favorites.some(f => f.id === recipe.id)) {
      setFavorites(prev => prev.filter(f => f.id !== recipe.id));
    } else {
      setFavorites(prev => [...prev, recipe]);
    }
  };

  const isRecipeInPlan = (recipeId: string) => {
    return (Object.values(weeklyPlan) as Recipe[][]).some(dayRecipes => dayRecipes.some(r => r.id === recipeId));
  };

  const handleCustomizeRecipe = async (instruction: string) => {
      if (!selectedRecipe) return;
      
      const updatedRecipe = await customizeRecipe(selectedRecipe, instruction, userProfile);
      
      if (updatedRecipe) {
          const updateList = (list: Recipe[]) => list.map(r => r.id === selectedRecipe.id ? updatedRecipe : r);
          
          setFavorites(prev => updateList(prev));
          setWeeklyPlan(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(day => {
                  next[day] = updateList(next[day]);
              });
              return next;
          });
          
          setSelectedRecipe(updatedRecipe);
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-emerald-200 shadow-lg">
                        <ChefHat className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">Longevity<span className="text-emerald-600">Chef</span></span>
                </div>
                
                <nav className="hidden md:flex items-center gap-2">
                    <NavLink to="/" icon={Calendar} label="Meal Plan" />
                    <NavLink to="/favorites" icon={Heart} label="Favorites" />
                    <NavLink to="/shopping" icon={ShoppingCart} label="Shopping" />
                    <NavLink to="/profile" icon={User} label="Profile" />
                </nav>

                <button className="md:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button>
            </div>
        </header>

        <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
            <Routes>
                <Route 
                  path="/" 
                  element={
                    <PlannerPage 
                      weeklyPlan={weeklyPlan}
                      handleRemoveFromPlan={handleRemoveFromPlan}
                      handleRegenerateRecipe={handleRegenerateRecipe}
                      handleMoveRecipe={handleMoveRecipe}
                      setSelectedRecipe={setSelectedRecipe}
                      handleClearPlan={handleClearPlan}
                      userProfile={userProfile}
                      favorites={favorites}
                      handleToggleFavorite={handleToggleFavorite}
                      setWeeklyPlan={setWeeklyPlan}
                      setPantryItems={setPantryItems}
                      pantryItems={pantryItems}
                    />
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProfilePage 
                      userProfile={userProfile} 
                      setUserProfile={setUserProfile} 
                    />
                  } 
                />
                <Route 
                  path="/favorites" 
                  element={
                    <FavoritesPage 
                      favorites={favorites}
                      handleAddToPlan={handleAddToPlan}
                      handleToggleFavorite={handleToggleFavorite}
                      isRecipeInPlan={isRecipeInPlan}
                      setSelectedRecipe={setSelectedRecipe}
                    />
                  } 
                />
                <Route 
                  path="/shopping" 
                  element={
                    <ShoppingListPage 
                      shoppingList={shoppingList}
                      setShoppingList={setShoppingList}
                      weeklyPlan={weeklyPlan}
                      pantryItems={pantryItems}
                    />
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>

        <RecipeModal 
          selectedRecipe={selectedRecipe}
          setSelectedRecipe={setSelectedRecipe}
          handleAddToPlan={handleAddToPlan}
          handleToggleFavorite={handleToggleFavorite}
          isFavorite={selectedRecipe ? favorites.some(f => f.id === selectedRecipe.id) : false}
          isAddedToPlan={selectedRecipe ? isRecipeInPlan(selectedRecipe.id) : false}
          onCustomize={handleCustomizeRecipe}
        />

        <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-slate-500 text-sm">© 2023 Longevity Chef. Powered by Gemini 2.5.</p>
                <p className="text-slate-400 text-xs mt-1">Disclaimer: This is a demo app. Consult a doctor before changing your diet.</p>
            </div>
        </footer>
    </div>
  );
};

const Root = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default Root;
