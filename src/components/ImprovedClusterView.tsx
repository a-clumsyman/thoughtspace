import React, { useState, useEffect } from 'react';
import { Cluster, Thought } from '../types';
import ThoughtCard from './ThoughtCard';
import { useThoughts } from '../context/ThoughtContext';
import { 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  Tag, 
  BookOpen, 
  Brain,
  Clock,
  Heart,
  Shuffle,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface ImprovedClusterViewProps {
  clusters?: Cluster[];
}

const ImprovedClusterView: React.FC<ImprovedClusterViewProps> = ({ clusters }) => {
  const { getThoughtsByCluster, deleteThought, refreshClusters } = useThoughts();
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [showAllThoughts, setShowAllThoughts] = useState<{ [key: string]: boolean }>({});
  
  // Use context clusters if not provided via props
  const { clusters: contextClusters, thoughts, isAiProcessing } = useThoughts();
  const displayClusters = clusters || contextClusters;
  
  // Auto-expand first cluster if only one exists
  useEffect(() => {
    if (displayClusters.length === 1 && !expandedClusterId) {
      setExpandedClusterId(displayClusters[0].id);
    }
  }, [displayClusters.length, expandedClusterId]);
  
  const toggleCluster = (clusterId: string) => {
    setExpandedClusterId(expandedClusterId === clusterId ? null : clusterId);
  };

  const toggleShowAllThoughts = (clusterId: string) => {
    setShowAllThoughts(prev => ({
      ...prev,
      [clusterId]: !prev[clusterId]
    }));
  };

  const getClusterIcon = (index: number) => {
    const icons = [Brain, Lightbulb, Heart, Clock, Sparkles, BookOpen];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-5 w-5" />;
  };

  const getClusterColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500', 
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-green-500 to-emerald-500',
    ];
    return colors[index % colors.length];
  };

  if (!displayClusters || displayClusters.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-16 px-8">
          <div className="mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full inline-block mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isAiProcessing ? '🧠 AI is analyzing your thoughts...' : 'No topics discovered yet'}
          </h3>
          
          <div className="space-y-3 text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            {isAiProcessing ? (
              <div className="space-y-2">
                <p className="text-lg">
                  Analyzing your {thoughts.length} thoughts to create meaningful topics...
                </p>
                <div className="flex justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              </div>
            ) : thoughts.length >= 2 ? (
              <div className="space-y-4">
                <p className="text-lg">
                  You have {thoughts.length} thoughts, but no topics were created yet.
                </p>
                <button
                  onClick={refreshClusters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Clustering Again
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg">
                  Once you have a few thoughts, they'll automatically be grouped into topics here.
                </p>
                <p className="text-sm mt-2">
                  You need at least 2 thoughts to start seeing topics. Keep writing!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Thought Topics
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {displayClusters.length} topic{displayClusters.length !== 1 ? 's' : ''} discovered from {thoughts.length} thoughts
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={refreshClusters}
            disabled={isAiProcessing}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAiProcessing ? 'animate-spin' : ''}`} />
            {isAiProcessing ? 'Analyzing...' : 'Refresh Topics'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Smart Topic Detection</h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              Topics are created using advanced content analysis, emotional patterns, and time clustering. 
              Click any topic to explore or use the large click areas for easy interaction.
            </p>
          </div>
        </div>
      </div>
      
      {/* Clusters Grid */}
      <div className="grid gap-6">
        {displayClusters.map((cluster, index) => {
          const isExpanded = expandedClusterId === cluster.id;
          const isHovered = hoveredClusterId === cluster.id;
          const clusterThoughts = getThoughtsByCluster(cluster.id);
          const showAll = showAllThoughts[cluster.id] || false;
          const visibleThoughts = showAll ? clusterThoughts : clusterThoughts.slice(0, 3);
          
          return (
            <div 
              key={cluster.id} 
              className={`bg-white dark:bg-gray-800 rounded-3xl shadow-sm border-2 transition-all duration-300 ${
                isExpanded 
                  ? 'border-blue-300 dark:border-blue-600 shadow-lg' 
                  : isHovered 
                    ? 'border-gray-300 dark:border-gray-600 shadow-md' 
                    : 'border-gray-100 dark:border-gray-700 hover:shadow-md'
              }`}
              onMouseEnter={() => setHoveredClusterId(cluster.id)}
              onMouseLeave={() => setHoveredClusterId(null)}
            >
              {/* Cluster Header - Large Click Area */}
              <div 
                className="p-8 cursor-pointer select-none"
                onClick={() => toggleCluster(cluster.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      {/* Gradient Icon */}
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${getClusterColor(index)} text-white`}>
                        {getClusterIcon(index)}
                      </div>
                      
                      {/* Cluster Name */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {cluster.name}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {clusterThoughts.length} thought{clusterThoughts.length !== 1 ? 's' : ''}
                          </span>
                          {cluster.isUserModified && (
                            <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                              ✨ Customized
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {cluster.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        {cluster.description}
                      </p>
                    )}
                    
                    {/* Keywords */}
                    {cluster.keywords && cluster.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cluster.keywords.slice(0, 6).map(keyword => (
                          <span 
                            key={keyword} 
                            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                          >
                            <Tag className="h-3 w-3 mr-1.5" />
                            {keyword}
                          </span>
                        ))}
                        {cluster.keywords.length > 6 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1.5">
                            +{cluster.keywords.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Expand Button */}
                  <div className="flex flex-col items-center space-y-2 ml-6">
                    <button className={`p-3 rounded-full transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>
                      {isExpanded ? (
                        <ChevronDown className="h-6 w-6" />
                      ) : (
                        <ChevronRight className="h-6 w-6" />
                      )}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
                      {isExpanded ? 'Hide' : 'Show'}<br />thoughts
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <div className="p-8 pt-6">
                    {/* Thoughts Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Thoughts in this topic
                      </h4>
                      {clusterThoughts.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowAllThoughts(cluster.id);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showAll ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1.5" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1.5" />
                              Show All ({clusterThoughts.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Thoughts List */}
                    <div className="space-y-4">
                      {visibleThoughts.map((thought, thoughtIndex) => (
                        <div 
                          key={thought.id}
                          className="transform transition-all duration-300 hover:scale-[1.02]"
                          style={{
                            animationDelay: `${thoughtIndex * 0.1}s`
                          }}
                        >
                          <ThoughtCard 
                            thought={thought} 
                            onDelete={deleteThought}
                            isExpanded={false}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Show More Indicator */}
                    {!showAll && clusterThoughts.length > 3 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {clusterThoughts.length - 3} more thought{clusterThoughts.length - 3 !== 1 ? 's' : ''} in this topic
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImprovedClusterView; 