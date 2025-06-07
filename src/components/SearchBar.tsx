import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useThoughts } from '../context/ThoughtContext';
import { useSpring, animated } from 'react-spring';
import ThoughtCard from './ThoughtCard';

const SearchBar: React.FC = () => {
  const { searchThoughts, deleteThought } = useThoughts();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Search when query changes
  useEffect(() => {
    if (query.trim()) {
      const foundThoughts = searchThoughts(query);
      setResults(foundThoughts);
    } else {
      setResults([]);
    }
  }, [query, searchThoughts]);
  
  // Animations
  const expandAnimation = useSpring({
    width: isExpanded ? '100%' : '240px',
    config: { tension: 300, friction: 20 }
  });
  
  const resultsAnimation = useSpring({
    height: (isFocused && results.length > 0) ? 'auto' : '0px',
    opacity: (isFocused && results.length > 0) ? 1 : 0,
    config: { tension: 280, friction: 20 }
  });
  
  // Focus on input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsFocused(true);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  
  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  // Handle input blur
  const handleBlur = () => {
    // Delay to allow clicking on results
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className="relative">
      <animated.div 
        style={expandAnimation}
        className="flex items-center bg-white rounded-full shadow-sm pl-4 pr-2 py-2 border border-gray-200"
      >
        <Search size={18} className="text-gray-400 mr-2" />
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Search your thoughts..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 outline-none text-gray-700 text-sm"
        />
        
        {query && (
          <button 
            onClick={clearSearch}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </animated.div>
      
      {/* Search results */}
      <animated.div 
        style={resultsAnimation}
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50"
      >
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 px-2 py-1">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map(thought => (
                <ThoughtCard 
                  key={thought.id} 
                  thought={thought} 
                  onDelete={deleteThought}
                  isExpanded
                />
              ))}
            </div>
          ) : (
            query.trim() && (
              <p className="text-gray-500 p-4 text-center">
                No thoughts found matching "{query}"
              </p>
            )
          )}
        </div>
      </animated.div>
    </div>
  );
};

export default SearchBar;