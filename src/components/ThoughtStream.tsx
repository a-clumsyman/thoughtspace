import React from 'react';
import ThoughtCard from './ThoughtCard';
import { useThoughts } from '../context/ThoughtContext';
import { format } from 'date-fns';
import { Thought } from '../types';
import { useSpring, animated } from 'react-spring';
import { MessageCircle, Lightbulb, Heart } from 'lucide-react';

interface ThoughtStreamProps {
  thoughts?: Thought[];
  onDeleteThought?: (id: string) => void;
}

const ThoughtStream: React.FC<ThoughtStreamProps> = ({ thoughts, onDeleteThought }) => {
  // Use context if props not provided
  const { thoughts: contextThoughts, deleteThought } = useThoughts();
  
  const displayThoughts = thoughts || contextThoughts;
  const handleDelete = onDeleteThought || deleteThought;
  
  // Animation for stream - moved before conditional return to maintain hook order
  const streamAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 }
  });
  
  if (!displayThoughts || displayThoughts.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center py-16 px-8">
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <MessageCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Lightbulb className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your thought space is ready!
          </h3>
          
          <div className="space-y-3 text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            <p className="text-lg">
              Start by capturing what's on your mind above. Whether it's:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Daily thoughts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ideas, worries, plans</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Inspiration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Creative ideas, insights</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Feelings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Emotions, reflections</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              Everything you write is saved securely on your device and organized automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Sort thoughts by date (newest first)
  const sortedThoughts = [...displayThoughts].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Group thoughts by date for better organization
  const groupedThoughts = sortedThoughts.reduce((groups: { [key: string]: Thought[] }, thought) => {
    const date = format(new Date(thought.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(thought);
    return groups;
  }, {});
  
  return (
    <animated.div style={streamAnimation} className="w-full max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Thoughts
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {displayThoughts.length} thought{displayThoughts.length !== 1 ? 's' : ''} captured
        </p>
      </div>
      
      <div className="space-y-8">
        {Object.entries(groupedThoughts).map(([date, thoughtsForDate]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            </div>
            
            <div className="space-y-4">
              {thoughtsForDate.map((thought) => (
                <ThoughtCard 
                  key={thought.id} 
                  thought={thought} 
                  onDelete={handleDelete}
                  isExpanded={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </animated.div>
  );
};

export default ThoughtStream;