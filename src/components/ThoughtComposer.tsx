import React, { useState, useEffect } from 'react';
import { useThoughts } from '../context/ThoughtContext';
import { useSpring, animated, config } from 'react-spring';
import { Send, Brain, Save } from 'lucide-react';

const ThoughtComposer: React.FC = () => {
  const [thought, setThought] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const { addThought, isAiProcessing } = useThoughts();

  // Update character count
  useEffect(() => {
    setCharacterCount(thought.length);
  }, [thought]);

  // Animation for the form
  const formAnimation = useSpring({
    transform: thought.length > 0 ? 'scale(1.02)' : 'scale(1)',
    boxShadow: thought.length > 0 
      ? '0 20px 40px rgba(99, 102, 241, 0.1)' 
      : '0 8px 16px rgba(0, 0, 0, 0.04)',
    config: { tension: 300, friction: 20 }
  });

  // Animation for save confirmation
  const saveConfirmationAnimation = useSpring({
    opacity: showSaveConfirmation ? 1 : 0,
    transform: showSaveConfirmation ? 'translateY(0)' : 'translateY(-10px)',
    config: config.gentle
  });

  // Handle submit event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || isAiProcessing) return;
    
    setIsSaving(true);
    
    try {
      await addThought(thought);
      setThought('');
      
      // Show save confirmation
      setShowSaveConfirmation(true);
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 2000);
      
    } catch (error) {
      // Error saving thought
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      {/* Save confirmation */}
      <animated.div 
        style={saveConfirmationAnimation}
        className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-10 flex items-center space-x-2"
      >
        <Save size={16} />
        <span>Thought saved!</span>
      </animated.div>
    
      <animated.div 
        style={formAnimation}
        className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
            <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              What's on your mind?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Share your thoughts, ideas, or feelings. They'll be saved automatically.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type anything that comes to mind... worries, ideas, plans, dreams, or just random thoughts."
              className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-lg leading-relaxed transition-all"
              disabled={isAiProcessing || isSaving}
            />
            
            {/* Character counter */}
            <div className={`absolute bottom-3 right-3 text-xs ${
              characterCount > 0 ? 'text-gray-400' : 'text-transparent'
            } transition-colors`}>
              {characterCount} characters
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Press Ctrl+Enter to save quickly</span>
              <span className="sm:hidden">Tap to save</span>
            </div>
            
            <button
              type="submit"
              disabled={!thought.trim() || isAiProcessing || isSaving}
              className={`px-8 py-3 rounded-xl flex items-center space-x-2 text-lg font-medium transition-all transform ${
                !thought.trim() || isAiProcessing || isSaving
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Save Thought</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Processing indicator */}
        {isAiProcessing && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Organizing your thoughts...
                </p>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  We're finding connections and grouping similar ideas together.
                </p>
              </div>
            </div>
          </div>
        )}
      </animated.div>
    </div>
  );
};

export default ThoughtComposer;