import React, { useState, useEffect } from 'react';
import { useThoughts } from '../context/ThoughtContext';
import { analyzeAdvancedSentiment } from '../utils/enhancedNLP';
import { ThoughtCategory } from '../types';
import ThoughtCard from './ThoughtCard';
import { format } from 'date-fns';
import { BarChart3, Brain, Heart, TrendingUp, Users, Target, Zap, Calendar, Star, Lightbulb } from 'lucide-react';

// Weekly Recap Section Component
const WeeklyRecapSection: React.FC<{
  thoughts: any[];
  categoryDistribution: Record<string, number>;
  avgSentiment: number;
}> = ({ thoughts, categoryDistribution, avgSentiment }) => {
  const { deleteThought, weeklyRecap } = useThoughts();
  
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

  // Get date range for this week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartFormatted = format(weekStart, 'MMM d');
  const weekEndFormatted = format(now, 'MMM d, yyyy');

  // Find a thought worth revisiting (longest or most recent)
  const suggestedRevisit = thoughts.length > 0 
    ? thoughts.sort((a, b) => b.content.length - a.content.length)[0]
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Weekly Recap: {weekStartFormatted} - {weekEndFormatted}
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            What You Focused On
          </h4>
          {Object.keys(categoryDistribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(categoryDistribution)
                .filter(([_, count]) => count > 0)
                .sort(([_, countA], [__, countB]) => countB - countA)
                .map(([category, count]) => {
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
                              width: `${(count / thoughts.length) * 100}%`,
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

        {/* Week Summary */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Week Summary
          </h4>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {thoughts.length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Thoughts this week</div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              avgSentiment > 0.2 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                : avgSentiment < -0.2
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20'
            }`}>
              <div className={`text-lg font-semibold ${
                avgSentiment > 0.2 ? 'text-green-600 dark:text-green-400' :
                avgSentiment < -0.2 ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {avgSentiment > 0.2 ? '😊 Positive Week' :
                 avgSentiment < -0.2 ? '😔 Challenging Week' :
                 '😐 Neutral Week'}
              </div>
              <div className={`text-sm ${
                avgSentiment > 0.2 ? 'text-green-700 dark:text-green-300' :
                avgSentiment < -0.2 ? 'text-red-700 dark:text-red-300' :
                'text-gray-700 dark:text-gray-300'
              }`}>
                Overall mood: {(avgSentiment * 100).toFixed(0)}% sentiment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thought Worth Revisiting */}
      {suggestedRevisit && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Star className="h-5 w-5 text-amber-500 mr-2" />
            Worth Revisiting
          </h4>
          <div className="border-l-4 border-amber-400 pl-4">
            <p className="text-sm text-amber-700 dark:text-amber-400 italic mb-3">
              This thought stood out this week:
            </p>
            <ThoughtCard 
              thought={suggestedRevisit} 
              onDelete={deleteThought}
              isExpanded={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Insights Section Component
const InsightsSection: React.FC<{
  analytics: any;
  clusters: any[];
  timeRange: string;
}> = ({ analytics, clusters, timeRange }) => {
  const insights = [];
  
  // Generate insights based on analytics
  if (analytics.avgSentiment > 0.3) {
    insights.push({
      type: 'positive',
      icon: Heart,
      title: 'Positive Outlook',
      description: `Your thoughts show a generally positive emotional tone in the past ${timeRange}.`
    });
  } else if (analytics.avgSentiment < -0.3) {
    insights.push({
      type: 'concern',
      icon: Heart,
      title: 'Emotional Challenges',
      description: 'Consider reaching out for support if you\'re going through a tough time.'
    });
  }

  // Productivity insights
  const taskRatio = Object.keys(analytics.categoryDistribution).includes('task') 
    ? analytics.categoryDistribution.task / analytics.totalThoughts 
    : 0;
  if (taskRatio > 0.4) {
    insights.push({
      type: 'productivity',
      icon: Target,
      title: 'Task-Focused',
      description: 'You\'ve been thinking a lot about tasks and goals lately.'
    });
  }

  // Creativity insights
  const ideaRatio = Object.keys(analytics.categoryDistribution).includes('idea')
    ? analytics.categoryDistribution.idea / analytics.totalThoughts
    : 0;
  if (ideaRatio > 0.3) {
    insights.push({
      type: 'creativity',
      icon: Lightbulb,
      title: 'Creative Flow',
      description: 'Your mind has been generating lots of creative ideas.'
    });
  }

  // Clustering insights
  if (clusters.length > 3) {
    insights.push({
      type: 'diversity',
      icon: Users,
      title: 'Diverse Thinking',
      description: 'Your thoughts span many different topics and themes.'
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      icon: Brain,
      title: 'Keep Going!',
      description: `You've captured ${analytics.totalThoughts} thoughts. Keep writing to discover more patterns and insights.`
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
        Personal Insights
      </h3>
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div 
              key={index}
              className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className={`p-2 mr-3 rounded-full ${
                insight.type === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                insight.type === 'concern' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                insight.type === 'productivity' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                insight.type === 'creativity' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                insight.type === 'diversity' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ThoughtAnalytics: React.FC = () => {
  const { thoughts, clusters } = useThoughts();
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (thoughts.length === 0) return;

    const filterThoughts = () => {
      if (timeRange === 'all') return thoughts;
      
      const now = new Date();
      const cutoff = new Date();
      
      if (timeRange === 'week') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        cutoff.setDate(now.getDate() - 30);
      }
      
      return thoughts.filter(t => new Date(t.createdAt) >= cutoff);
    };

    const analyzeThoughts = () => {
      const filteredThoughts = filterThoughts();
      
      if (filteredThoughts.length === 0) {
        setAnalytics(null);
        return;
      }

      // Analyze sentiments
      const sentiments = filteredThoughts.map(t => analyzeAdvancedSentiment(t.content));
      const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const avgMagnitude = sentiments.reduce((sum, s) => sum + s.magnitude, 0) / sentiments.length;

      // Category distribution
      const categoryDist = filteredThoughts.reduce((acc, thought) => {
        acc[thought.category] = (acc[thought.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Emotion analysis
      const emotions = sentiments.flatMap(s => s.emotions);
      const emotionDist = emotions.reduce((acc, emotion) => {
        acc[emotion.emotion] = (acc[emotion.emotion] || 0) + emotion.intensity;
        return acc;
      }, {} as Record<string, number>);

      // Time patterns
      const hourPattern = Array(24).fill(0);
      const dayPattern = Array(7).fill(0);
      
      filteredThoughts.forEach(thought => {
        const date = new Date(thought.createdAt);
        hourPattern[date.getHours()]++;
        dayPattern[date.getDay()]++;
      });

      setAnalytics({
        totalThoughts: filteredThoughts.length,
        avgSentiment,
        avgMagnitude,
        categoryDistribution: categoryDist,
        emotionDistribution: emotionDist,
        hourPattern,
        dayPattern,
        filteredThoughts,
        insights: []
      });
    };

    analyzeThoughts();
  }, [thoughts, timeRange, clusters]);

  const generateInsights = (thoughts: any[], sentiments: any[], clusters: any[]) => {
    const insights = [];

    // Sentiment insights
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    if (avgSentiment > 0.3) {
      insights.push({
        type: 'positive',
        icon: Heart,
        title: 'Positive Outlook',
        description: 'Your thoughts show a generally positive emotional tone.'
      });
    } else if (avgSentiment < -0.3) {
      insights.push({
        type: 'concern',
        icon: Heart,
        title: 'Emotional Challenges',
        description: 'Consider reaching out for support if you\'re going through a tough time.'
      });
    }

    // Productivity insights
    const taskRatio = thoughts.filter(t => t.category === 'task').length / thoughts.length;
    if (taskRatio > 0.4) {
      insights.push({
        type: 'productivity',
        icon: Target,
        title: 'Task-Focused',
        description: 'You\'ve been thinking a lot about tasks and goals lately.'
      });
    }

    // Creativity insights
    const ideaRatio = thoughts.filter(t => t.category === 'idea').length / thoughts.length;
    if (ideaRatio > 0.3) {
      insights.push({
        type: 'creativity',
        icon: Zap,
        title: 'Creative Flow',
        description: 'Your mind has been generating lots of creative ideas.'
      });
    }

    // Clustering insights
    if (clusters.length > 3) {
      insights.push({
        type: 'diversity',
        icon: Users,
        title: 'Diverse Thinking',
        description: 'Your thoughts span many different topics and themes.'
      });
    }

    return insights;
  };

  const formatTimeLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Category styling details for weekly recap
  const CATEGORY_DETAILS: Record<ThoughtCategory, { emoji: string; color: string; bgColor: string; label: string }> = {
    idea: { emoji: '💡', color: '#3B82F6', bgColor: '#EBF8FF', label: 'Ideas' },
    task: { emoji: '✅', color: '#10B981', bgColor: '#F0FDF4', label: 'Tasks' },
    feeling: { emoji: '💭', color: '#8B5CF6', bgColor: '#F5F3FF', label: 'Feelings' },
    memory: { emoji: '📝', color: '#F59E0B', bgColor: '#FFFBEB', label: 'Memories' },
    reflection: { emoji: '🤔', color: '#06B6D4', bgColor: '#F0FDFA', label: 'Reflections' },
    question: { emoji: '❓', color: '#EC4899', bgColor: '#FDF2F8', label: 'Questions' },
    observation: { emoji: '👁️', color: '#84CC16', bgColor: '#F7FEE7', label: 'Observations' }
  };

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Thought Insights
          </h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No thoughts in the selected time range.</p>
          <p className="text-sm mt-2">Start writing to see your insights!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Thought Insights
            </h2>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.totalThoughts}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total Thoughts</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.avgSentiment > 0 ? '+' : ''}{(analytics.avgSentiment * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Mood Score</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {clusters.length}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Topics</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(analytics.avgMagnitude * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Intensity</div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            What You Think About
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryDistribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {category}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${((count as number) / analytics.totalThoughts) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {count as number}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Weekly Recap Section */}
      {timeRange === 'week' && analytics.filteredThoughts && (
        <WeeklyRecapSection 
          thoughts={analytics.filteredThoughts}
          categoryDistribution={analytics.categoryDistribution}
          avgSentiment={analytics.avgSentiment}
        />
      )}

      {/* General Insights */}
      <InsightsSection 
        analytics={analytics} 
        clusters={clusters}
        timeRange={timeRange}
      />
    </div>
  );
};

export default ThoughtAnalytics; 