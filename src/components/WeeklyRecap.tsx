import React from 'react';
import { WeeklyRecap as WeeklyRecapType, ThoughtCategory } from '../types';
import { format } from 'date-fns';
import { useThoughts } from '../context/ThoughtContext';
import ThoughtCard from './ThoughtCard';

// Category styling details
const CATEGORY_DETAILS: Record<ThoughtCategory, { emoji: string; color: string; bgColor: string; label: string }> = {
  idea: { emoji: '💡', color: '#3B82F6', bgColor: '#EBF8FF', label: 'Ideas' },
  task: { emoji: '✅', color: '#10B981', bgColor: '#F0FDF4', label: 'Tasks' },
  feeling: { emoji: '💭', color: '#8B5CF6', bgColor: '#F5F3FF', label: 'Feelings' },
  memory: { emoji: '📝', color: '#F59E0B', bgColor: '#FFFBEB', label: 'Memories' },
  reflection: { emoji: '🤔', color: '#06B6D4', bgColor: '#F0FDFA', label: 'Reflections' },
  question: { emoji: '❓', color: '#EC4899', bgColor: '#FDF2F8', label: 'Questions' },
  observation: { emoji: '👁️', color: '#84CC16', bgColor: '#F7FEE7', label: 'Observations' }
};

interface WeeklyRecapProps {
  recap?: WeeklyRecapType;
}

const WeeklyRecap: React.FC<WeeklyRecapProps> = ({ recap }) => {
  const { weeklyRecap: contextRecap, deleteThought } = useThoughts();
  const displayRecap = recap || contextRecap;
  
  if (!displayRecap) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No weekly recap available yet. Add more thoughts to generate insights.
        </p>
      </div>
    );
  }
  
  // Format date range
  const weekStart = format(new Date(displayRecap.weekStarting), 'MMM d');
  const weekEnd = format(new Date(new Date(displayRecap.weekStarting).getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM d, yyyy');
  
  return (
    <div className="space-y-8">
      {/* Week Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
          Week of {weekStart} - {weekEnd}
        </h3>
        
        <div className="mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Thoughts</div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{displayRecap.thoughtCount}</div>
        </div>
        
        {/* Category Breakdown */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Thought Categories</div>
          {displayRecap.categoryBreakdown && Object.keys(displayRecap.categoryBreakdown).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(displayRecap.categoryBreakdown)
                .filter(([_, count]) => count > 0)
                .sort(([_, countA], [__, countB]) => countB - countA)
                .map(([category, count]) => {
                  // Safe category lookup with proper fallback
                  const categoryKey = category as ThoughtCategory;
                  const categoryDetail = CATEGORY_DETAILS[categoryKey] || {
                    emoji: '📌',
                    color: '#6B7280',
                    bgColor: '#F9FAFB',
                    label: 'Other'
                  };
                  
                  return (
                    <div key={category} className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ 
                          backgroundColor: categoryDetail?.bgColor || '#F9FAFB', 
                          color: categoryDetail?.color || '#6B7280' 
                        }}
                      >
                        {categoryDetail?.emoji || '📌'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                            {categoryDetail?.label || category}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{count}</div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full" 
                            style={{ 
                              width: `${(count / displayRecap.thoughtCount) * 100}%`,
                              backgroundColor: categoryDetail?.color || '#6B7280'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No category data available.</p>
          )}
        </div>
      </div>
      
      {/* Top Themes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Top Themes</h3>
        
        {displayRecap.topThemes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayRecap.topThemes.map((theme, index) => (
              <div 
                key={index}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium"
              >
                {theme}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No themes detected this week.</p>
        )}
      </div>
      
      {/* Thought to Revisit */}
      {displayRecap.suggestedRevisit && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Worth Revisiting</h3>
          <div className="border-l-4 border-amber-400 pl-4 py-1">
            <p className="text-sm text-amber-700 dark:text-amber-400 italic mb-2">
              This thought might be worth reflecting on further:
            </p>
            
            <ThoughtCard 
              thought={displayRecap.suggestedRevisit} 
              onDelete={deleteThought}
              isExpanded
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyRecap;