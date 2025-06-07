import React, { useState } from 'react';
import { Cluster, Thought } from '../types';
import ThoughtCard from './ThoughtCard';
import { useThoughts } from '../context/ThoughtContext';
import { ChevronDown, ChevronRight, Lightbulb, Tag, BookOpen } from 'lucide-react';

interface ClusterViewProps {
  clusters?: Cluster[];
}

const ClusterView: React.FC<ClusterViewProps> = ({ clusters }) => {
  const { getThoughtsByCluster, deleteThought } = useThoughts();
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  
  // Use context clusters if not provided via props
  const { clusters: contextClusters, thoughts, isAiProcessing } = useThoughts();
  const displayClusters = clusters || contextClusters;
  
  if (!displayClusters || displayClusters.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center py-16 px-8">
          <div className="mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full inline-block mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isAiProcessing ? 'Creating topics...' : 'No topics yet'}
          </h3>
          
          <div className="space-y-3 text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            {isAiProcessing ? (
              <p className="text-lg">
                Analyzing your {thoughts.length} thoughts to create meaningful topics...
              </p>
            ) : thoughts.length >= 2 ? (
              <div>
                <p className="text-lg">
                  You have {thoughts.length} thoughts, but no topics were created yet.
                </p>
                <p className="text-sm mt-2">
                  Try adding more thoughts with similar themes to see automatic grouping!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg">
                  Once you have a few thoughts, they'll automatically be grouped into topics here.
                </p>
                <p className="text-sm">
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Thought Topics
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Similar thoughts have been automatically grouped together. Click on any topic to explore.
        </p>
      </div>

      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">How topics work</h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              The app reads your thoughts and groups similar ones together. No need to organize manually - 
              it happens automatically as you write!
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {displayClusters.map((cluster, index) => {
          const isExpanded = expandedClusterId === cluster.id;
          const clusterThoughts = getThoughtsByCluster(cluster.id);
          
          return (
            <div 
              key={cluster.id} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
            >
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                      index % 6 === 0 ? 'from-blue-400 to-blue-600' :
                      index % 6 === 1 ? 'from-green-400 to-green-600' :
                      index % 6 === 2 ? 'from-purple-400 to-purple-600' :
                      index % 6 === 3 ? 'from-yellow-400 to-yellow-600' :
                      index % 6 === 4 ? 'from-pink-400 to-pink-600' :
                      'from-indigo-400 to-indigo-600'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cluster.name}
                    </h3>
                    {cluster.isUserModified && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                        Customized
                      </span>
                    )}
                  </div>
                  
                  {cluster.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                      {cluster.description}
                    </p>
                  )}
                  
                  {cluster.keywords && cluster.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords.slice(0, 5).map(keyword => (
                        <span 
                          key={keyword} 
                          className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {keyword}
                        </span>
                      ))}
                      {cluster.keywords.length > 5 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          +{cluster.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {clusterThoughts.length} thoughts
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Click to {isExpanded ? 'collapse' : 'expand'}
                    </div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="pt-4 space-y-4">
                    {clusterThoughts.map(thought => (
                      <ThoughtCard 
                        key={thought.id} 
                        thought={thought} 
                        onDelete={deleteThought}
                        isExpanded={false}
                      />
                    ))}
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

export default ClusterView;