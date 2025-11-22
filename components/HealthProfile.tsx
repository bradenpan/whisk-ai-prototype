
import React from 'react';
import { UserProfile, HealthGoal } from '../types';
import { Activity, Save, Info, Utensils, Target, HeartPulse, Clock, ChefHat, Leaf } from 'lucide-react';

interface HealthProfileProps {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

const DIETARY_OPTIONS = [
  "No Red Meat", "High Protein", "Vegetarian", "Vegan", "Pescatarian",
  "Gluten-Free", "Dairy-Free", "Nut-Free",
  "Shellfish-Free", "Soy-Free",
  "Keto", "Paleo", "Low Carb",
  "Low Sodium", "Low Sugar", "Halal", "Kosher"
];

const NUTRITIONAL_FOCUS_OPTIONS = [
  "Limit Saturated Fats",
  "High Fiber",
  "Reduce Simple Carbs",
  "Anti-Inflammatory",
  "High Iron",
  "Low Iron",
  "Low Glycemic Index",
  "Gut Health / Probiotic",
  "High Calcium",
  "Omega-3 Rich",
  "Low Cholesterol"
];

const APPLIANCE_OPTIONS = [
  "Air Fryer", "Instant Pot", "Slow Cooker", "Grill", "Blender", "Food Processor"
];

export const HealthProfile: React.FC<HealthProfileProps> = ({ profile, onUpdate }) => {

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onUpdate({ ...profile, [field]: value });
  };

  const toggleRestriction = (restriction: string) => {
    const current = profile.dietaryRestrictions || [];
    const newRestrictions = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    onUpdate({ ...profile, dietaryRestrictions: newRestrictions });
  };

  const toggleNutritionalFocus = (focus: string) => {
    const current = profile.nutritionalFocus || [];
    const newFocus = current.includes(focus)
      ? current.filter(f => f !== focus)
      : [...current, focus];
    onUpdate({ ...profile, nutritionalFocus: newFocus });
  };

  const toggleHealthGoal = (goal: HealthGoal) => {
      const current = profile.healthGoals || [];
      const newGoals = current.includes(goal)
        ? current.filter(g => g !== goal)
        : [...current, goal];
      onUpdate({ ...profile, healthGoals: newGoals });
  };

  const toggleAppliance = (appliance: string) => {
      const current = profile.cookingAppliances || [];
      const newAppliances = current.includes(appliance)
        ? current.filter(a => a !== appliance)
        : [...current, appliance];
      onUpdate({ ...profile, cookingAppliances: newAppliances });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Profile & Preferences
          </h2>
      </div>

      <div className="space-y-8">
        
        {/* Health Goals */}
        <div>
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Target className="w-4 h-4" /> Health Priorities
             </h3>
             <div className="flex flex-wrap gap-2">
                {Object.values(HealthGoal).map(goal => {
                    const isSelected = (profile.healthGoals || []).includes(goal);
                    return (
                        <button
                            key={goal}
                            onClick={() => toggleHealthGoal(goal)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                                isSelected
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            {goal}
                        </button>
                    )
                })}
             </div>
        </div>

        {/* Nutritional Focus - NEW */}
        <div className="pt-6 border-t border-slate-100">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4" /> Nutritional Focus Areas
             </h3>
             <p className="text-xs text-slate-500 mb-4">Select specific nutritional adjustments you want the AI to prioritize in your recipes.</p>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {NUTRITIONAL_FOCUS_OPTIONS.map(opt => {
                    const isSelected = (profile.nutritionalFocus || []).includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => toggleNutritionalFocus(opt)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all flex items-center justify-between ${
                                isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {opt}
                            {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </button>
                    )
                })}
             </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="pt-6 border-t border-slate-100">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4" /> Dietary Restrictions
             </h3>
             <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => {
                    const isSelected = (profile.dietaryRestrictions || []).includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => toggleRestriction(opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                        >
                            {opt}
                        </button>
                    )
                })}
             </div>
        </div>

        {/* Cooking Preferences */}
        <div className="pt-6 border-t border-slate-100">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ChefHat className="w-4 h-4" /> Appliances Available
             </h3>
             
             <div className="flex flex-wrap gap-2">
                {APPLIANCE_OPTIONS.map(app => {
                    const isSelected = (profile.cookingAppliances || []).includes(app);
                    return (
                        <button
                            key={app}
                            onClick={() => toggleAppliance(app)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                isSelected
                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            {app}
                        </button>
                    )
                })}
             </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
             <button 
                onClick={() => alert("Profile Saved!")} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
             >
                <Save className="w-5 h-5" />
                Save Profile
             </button>
        </div>
      </div>
    </div>
  );
};
