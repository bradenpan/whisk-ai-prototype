
import React, { useState } from 'react';
import { Recipe, DAYS_OF_WEEK } from '../types';
import { Clock, Flame, Activity, Heart, PlusCircle, MinusCircle, ChefHat, CheckCircle2, Info, Wheat, Droplet, Beef, Wand2, Send, Loader2, RefreshCw, Trash2, MoveRight, Calendar, Users } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onAddToPlan: (day: string, recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  isFavorite: boolean;
  isAddedToPlan?: boolean;
  onClick?: () => void;
  expanded?: boolean; // If true, show all details (Ingredients, Instructions, Reasoning)
  onCustomize?: (instruction: string) => Promise<void>;
  
  // Planner specific props
  plannerMode?: boolean;
  currentDay?: string;
  onRegenerate?: () => void;
  onMove?: (toDay: string) => void;
  onRemove?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onAddToPlan, 
  onToggleFavorite, 
  isFavorite, 
  isAddedToPlan,
  onClick,
  expanded = false,
  onCustomize,
  plannerMode = false,
  currentDay,
  onRegenerate,
  onMove,
  onRemove
}) => {
  const [selectedDay, setSelectedDay] = useState(currentDay || DAYS_OF_WEEK[0]);
  const [servings, setServings] = useState(recipe.servings || 1);
  const [customizationText, setCustomizationText] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);

  const baseServings = recipe.servings || 1;
  const scaleFactor = servings / baseServings;

  const formatAmount = (qty: number, unit: string) => {
    if (!qty) return '';
    // Simple scaling
    const val = Math.round(qty * scaleFactor * 100) / 100; 
    return `${val} ${unit}`;
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // If we are in summary mode (not expanded), clicking anywhere opens the modal
    if (!expanded && onClick) {
        onClick();
    }
  };

  // Stop propagation for interactive elements in summary mode
  const handleActionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  const handleCustomizeSubmit = async () => {
      if (!onCustomize || !customizationText.trim()) return;
      setIsCustomizing(true);
      await onCustomize(customizationText);
      setIsCustomizing(false);
      setCustomizationText('');
  };

  // Handle day move
  const handleMoveDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDay = e.target.value;
      setSelectedDay(newDay);
      if (onMove) {
          onMove(newDay);
      }
  };

  return (
    <div 
        onClick={handleContainerClick}
        className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-full transition-all ${
            expanded ? '' : 'cursor-pointer hover:shadow-md hover:border-emerald-300'
        } ${isAddedToPlan && !plannerMode ? 'border-emerald-300 ring-1 ring-emerald-50' : 'border-slate-200'}`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 relative ${plannerMode ? 'bg-white' : 'bg-gradient-to-r from-slate-50 to-white'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className="flex-grow pr-2">
                 <h3 className={`font-bold text-slate-800 leading-tight ${expanded ? 'text-2xl' : 'text-sm'}`}>
                     {recipe.title}
                 </h3>
            </div>
            <button 
                onClick={(e) => { handleActionClick(e); onToggleFavorite(recipe); }}
                className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isFavorite ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-100'}`}
            >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
        </div>
        
        {!plannerMode && (
            <p className={`text-slate-600 mb-3 ${expanded ? 'text-sm' : 'text-xs line-clamp-2'}`}>{recipe.description}</p>
        )}
        
        {/* Metadata - Always Visible */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
            <Flame className="w-3 h-3" />
            {Math.round(recipe.calories * scaleFactor)}
          </div>
           {plannerMode && (
               <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                <Users className="w-3 h-3" />
                {recipe.servings}
               </div>
           )}
        </div>
      </div>

      {/* Body */}
      <div className={`${plannerMode ? 'hidden' : 'p-5 flex-grow flex flex-col'}`}>
        
        {/* Expanded Content */}
        {expanded ? (
            <div className="animate-fadeIn space-y-6">
                {/* Macro Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase mb-1">
                            <Beef className="w-3 h-3" /> Protein
                        </div>
                        <span className="text-lg font-bold text-slate-800">{Math.round(recipe.macros.protein * scaleFactor)}g</span>
                     </div>
                     <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold uppercase mb-1">
                            <Wheat className="w-3 h-3" /> Carbs
                        </div>
                        <span className="text-lg font-bold text-slate-800">{Math.round(recipe.macros.carbs * scaleFactor)}g</span>
                     </div>
                     <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-rose-600 text-xs font-bold uppercase mb-1">
                            <Droplet className="w-3 h-3" /> Fats
                        </div>
                        <span className="text-lg font-bold text-slate-800">{Math.round(recipe.macros.fats * scaleFactor)}g</span>
                     </div>
                     <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold uppercase mb-1">
                            <Activity className="w-3 h-3" /> Fiber
                        </div>
                        <span className="text-lg font-bold text-slate-800">{Math.round((recipe.macros.fiber || 0) * scaleFactor)}g</span>
                     </div>
                </div>

                {/* Reasoning */}
                <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> Why this fits your profile
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {recipe.reasoning}
                    </p>
                </div>

                {/* Servings Control */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-sm font-bold text-slate-700 uppercase">Yields:</span>
                    <button onClick={() => setServings(Math.max(1, servings - 1))} className="text-slate-400 hover:text-slate-600"><MinusCircle className="w-5 h-5" /></button>
                    <span className="text-base font-bold text-slate-900 w-6 text-center">{servings}</span>
                    <button onClick={() => setServings(servings + 1)} className="text-slate-400 hover:text-slate-600"><PlusCircle className="w-5 h-5" /></button>
                    <span className="text-sm text-slate-500">Servings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ingredients */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase mb-3 border-b pb-2">Ingredients</h4>
                        <ul className="space-y-2">
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                                    <span>
                                        <span className="font-semibold text-slate-900">
                                            {ing.quantity ? formatAmount(ing.quantity, ing.unit) : ing.amount}
                                        </span> {ing.name}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase mb-3 border-b pb-2">Instructions</h4>
                        <ol className="space-y-4">
                            {recipe.instructions.map((step, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                                        {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Customization Section */}
                {onCustomize && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                            <Wand2 className="w-4 h-4 text-indigo-600" />
                            Customize Recipe
                        </h4>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={customizationText}
                                    onChange={(e) => setCustomizationText(e.target.value)}
                                    placeholder="e.g. Make it vegetarian, swap chicken for tofu, less spicy..."
                                    className="flex-grow border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomizeSubmit()}
                                />
                                <button 
                                    onClick={handleCustomizeSubmit}
                                    disabled={isCustomizing || !customizationText.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 flex-shrink-0 transition-colors"
                                >
                                    {isCustomizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Update
                                </button>
                            </div>
                            <p className="text-[10px] text-indigo-700 mt-2 ml-1">
                                Use AI to tweak this recipe while keeping your health profile in mind.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            /* Summary Mode Content */
            <div className="flex flex-col h-full justify-between">
                {/* Reasoning Preview */}
                <div className="mb-4 text-xs text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100">
                    "{recipe.reasoning.length > 100 ? recipe.reasoning.substring(0, 100) + '...' : recipe.reasoning}"
                </div>

                <div className="mt-auto pt-4 text-center">
                     <span className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-1 group-hover:underline">
                        <ChefHat className="w-4 h-4" /> Click to view full recipe
                     </span>
                </div>
            </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 border-t border-slate-100 flex items-center justify-between p-2 gap-2" onClick={handleActionClick}>
        {plannerMode ? (
            // Planner Mode Controls
            <>
                <div className="flex-grow relative">
                    <select 
                        value={selectedDay} 
                        onChange={handleMoveDayChange}
                        className="w-full text-[10px] font-medium border border-slate-300 rounded-md pl-2 pr-1 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
                    >
                        {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day === currentDay ? 'Move...' : `Move to ${day}`}</option>)}
                    </select>
                    <Calendar className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                    {onRegenerate && (
                        <button 
                            onClick={onRegenerate}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Regenerate this meal"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    )}
                     {onRemove && (
                        <button 
                            onClick={onRemove}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove from plan"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </>
        ) : (
            // Standard Mode Controls (Generator)
            <>
                <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white flex-grow focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                
                {isAddedToPlan ? (
                    <button 
                        disabled
                        className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold cursor-default"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Added
                    </button>
                ) : (
                    <button 
                        onClick={() => onAddToPlan(selectedDay, { ...recipe, servings: servings })} 
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add to Plan
                    </button>
                )}
            </>
        )}
      </div>
    </div>
  );
};
