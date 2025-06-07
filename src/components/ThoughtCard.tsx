import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Edit, X, Check, MoreHorizontal } from 'lucide-react';
import { useSpring, animated } from 'react-spring';
import { Thought, ThoughtCategory } from '../types';
import { useThoughts } from '../context/ThoughtContext';
import { analyzeAdvancedSentiment, findRelatedThoughts } from '../utils/enhancedNLP';
import { format } from 'date-fns';

const categoryEmojis: Record<ThoughtCategory, string> = {
  idea: '💡',
  feeling: '💭',
  memory: '📝',
  task: '✅',
  question: '❓',
  observation: '👀',
  reflection: '🤔'
};

const categoryLabels: Record<ThoughtCategory, string> = {
  idea: 'Idea',
  feeling: 'Feeling',
  memory: 'Memory',
  task: 'Task',
  question: 'Question',
  observation: 'Note',
  reflection: 'Reflection'
};

interface ThoughtCardProps {
  thought: Thought;
  onDelete: (id: string) => void;
  isExpanded?: boolean;
}

const ThoughtCard: React.FC<ThoughtCardProps> = ({ 
  thought, 
  onDelete,
  isExpanded = false
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(isExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(thought.content);
  const { updateThought } = useThoughts();
  
  // Format the date
  const timeAgo = formatDistanceToNow(thought.createdAt, { addSuffix: true });
  
  // Card appearance animations
  const cardStyle = useSpring({
    boxShadow: isEditing || isHovering || isFullyExpanded 
      ? '0 10px 25px rgba(0, 0, 0, 0.08)' 
      : '0 2px 8px rgba(0, 0, 0, 0.04)',
    transform: isEditing 
      ? 'scale(1.01)' 
      : 'scale(1)',
    config: { tension: 300, friction: 20 }
  });
  
  // Actions menu animation
  const actionsAnimation = useSpring({
    opacity: showActions ? 1 : 0,
    transform: showActions ? 'translateX(0)' : 'translateX(10px)',
    config: { tension: 300, friction: 20 }
  });
  
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(thought.id);
  };
  
  const cancelDelete = () => {
    setConfirmDelete(false);
  };
  
  const toggleExpand = () => {
    if (!isEditing) {
      setIsFullyExpanded(!isFullyExpanded);
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsFullyExpanded(true);
    setEditedContent(thought.content);
    setShowActions(false);
  };
  
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedContent(thought.content);
  };
  
  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedContent.trim() !== '') {
      updateThought(thought.id, editedContent);
      setIsEditing(false);
    }
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <animated.div 
      style={cardStyle}
      className="mb-4 rounded-2xl overflow-hidden relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => { 
        setIsHovering(false);
        if (!isFullyExpanded && !isEditing) {
          setConfirmDelete(false);
          setShowActions(false);
        }
      }}
    >
      <div 
        className={`p-6 cursor-pointer transition-all duration-200 ${
          isEditing ? 'ring-2 ring-indigo-200 dark:ring-indigo-600' : ''
        }`}
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{categoryEmojis[thought.category]}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {categoryLabels[thought.category]}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo}
            </span>
            
            {!isEditing && (
              <div className="relative">
                <button 
                  onClick={toggleActions}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showActions && (
                  <animated.div 
                    style={actionsAnimation}
                    className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10"
                  >
                    <button 
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </animated.div>
                )}
              </div>
            )}
            
            {isEditing && (
              <div className="flex space-x-2">
                <button 
                  onClick={handleSaveEdit}
                  className="p-2 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-2">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 resize-none text-lg leading-relaxed"
              rows={Math.max(4, editedContent.split('\n').length)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              placeholder="What's on your mind?"
            />
          ) : (
            <div className={`text-gray-800 dark:text-gray-200 whitespace-pre-line text-lg leading-relaxed ${!isFullyExpanded && 'line-clamp-4'}`}>
              {thought.content}
            </div>
          )}
        </div>
        
        {!isFullyExpanded && !isEditing && thought.content.length > 200 && (
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            Read more...
          </button>
        )}
      </div>
      
      {/* Delete confirmation */}
      {confirmDelete && (
        <div 
          className="bg-red-50 dark:bg-red-900/30 p-4 border-t border-red-100 dark:border-red-800 flex justify-between items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm text-red-700 dark:text-red-300">Are you sure you want to delete this thought?</span>
          <div className="flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                cancelDelete();
              }}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(thought.id);
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </animated.div>
  );
};

export default ThoughtCard;