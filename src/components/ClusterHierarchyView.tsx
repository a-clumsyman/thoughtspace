import React, { useState } from 'react';
import { Cluster, ClusterAdjustmentType, Thought } from '../types';
import { useThoughts } from '../context/ThoughtContext';
import { useOpenAI } from '../context/OpenAIContext';
import { ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash, Plus, ArrowRight, Scissors, Sparkles, Zap, Settings } from 'lucide-react';
import ThoughtCard from './ThoughtCard';

const ClusterHierarchyView: React.FC = () => {
  const { 
    clusterHierarchy, 
    getThoughtsByCluster, 
    deleteThought, 
    getChildClusters,
    adjustCluster,
    getThoughtRelevance
  } = useThoughts();
  
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showMoveOptions, setShowMoveOptions] = useState<string | null>(null);
  const [showMergeOptions, setShowMergeOptions] = useState<string | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [isCreatingChild, setIsCreatingChild] = useState<string | null>(null);
  const [isSplittingCluster, setIsSplittingCluster] = useState<string | null>(null);
  const [thoughtsToMove, setThoughtsToMove] = useState<string[]>([]);
  const [newClusterName, setNewClusterName] = useState('');
  
  // Toggle cluster expansion
  const toggleExpanded = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
    }
    setExpandedClusters(newExpanded);
  };
  
  // Toggle cluster selection
  const handleClusterClick = (clusterId: string) => {
    setActiveCluster(activeCluster === clusterId ? null : clusterId);
    setShowMenu(null);
  };
  
  // Handle menu toggle
  const handleMenuToggle = (clusterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(showMenu === clusterId ? null : clusterId);
  };
  
  // Handle rename click
  const handleRenameClick = (clusterId: string, currentName: string) => {
    setIsRenaming(clusterId);
    setNewName(currentName);
    setShowMenu(null);
  };
  
  // Handle rename submit
  const handleRenameSubmit = (clusterId: string) => {
    if (newName.trim()) {
      adjustCluster({
        clusterId,
        type: ClusterAdjustmentType.RENAME_CLUSTER,
        data: { newName: newName.trim() }
      });
    }
    setIsRenaming(null);
    setNewName('');
  };
  
  // Handle showing move options
  const handleMoveToParentClick = (clusterId: string) => {
    setShowMoveOptions(clusterId);
    setShowMenu(null);
  };
  
  // Handle move to parent
  const handleMoveToParent = (clusterId: string, newParentId: string) => {
    const cluster = clusterHierarchy?.allClusters[clusterId];
    
    if (cluster) {
      adjustCluster({
        clusterId,
        type: ClusterAdjustmentType.MOVE_TO_PARENT,
        data: { 
          clusterId,
          newParentId,
          oldParentId: cluster.parentId 
        }
      });
    }
    
    setShowMoveOptions(null);
  };
  
  // Handle showing merge options
  const handleMergeClick = (clusterId: string) => {
    setShowMergeOptions(clusterId);
    setSelectedForMerge([]);
    setShowMenu(null);
  };
  
  // Toggle cluster selection for merge
  const toggleClusterForMerge = (clusterId: string) => {
    if (selectedForMerge.includes(clusterId)) {
      setSelectedForMerge(selectedForMerge.filter(id => id !== clusterId));
    } else {
      setSelectedForMerge([...selectedForMerge, clusterId]);
    }
  };
  
  // Handle merge clusters
  const handleMergeClusters = (targetClusterId: string) => {
    if (selectedForMerge.length > 0) {
      adjustCluster({
        clusterId: targetClusterId,
        type: ClusterAdjustmentType.MERGE_CLUSTERS,
        data: {
          targetClusterId,
          sourceClusterIds: selectedForMerge
        }
      });
    }
    
    setShowMergeOptions(null);
    setSelectedForMerge([]);
  };
  
  // Handle creating child cluster
  const handleCreateChildClick = (clusterId: string) => {
    setIsCreatingChild(clusterId);
    setNewClusterName('');
    setThoughtsToMove([]);
    setShowMenu(null);
  };
  
  // Handle child cluster creation submit
  const handleCreateChildSubmit = (parentClusterId: string) => {
    if (newClusterName.trim() && thoughtsToMove.length > 0) {
      adjustCluster({
        clusterId: parentClusterId,
        type: ClusterAdjustmentType.CREATE_CHILD_CLUSTER,
        data: {
          parentClusterId,
          childClusterData: {
            name: newClusterName.trim(),
            thoughtIds: thoughtsToMove
          }
        }
      });
    }
    
    setIsCreatingChild(null);
    setNewClusterName('');
    setThoughtsToMove([]);
  };
  
  // Handle splitting cluster
  const handleSplitClusterClick = (clusterId: string) => {
    setIsSplittingCluster(clusterId);
    setNewClusterName('');
    setThoughtsToMove([]);
    setShowMenu(null);
  };
  
  // Handle split cluster submit
  const handleSplitClusterSubmit = (originalClusterId: string) => {
    if (newClusterName.trim() && thoughtsToMove.length > 0) {
      adjustCluster({
        clusterId: originalClusterId,
        type: ClusterAdjustmentType.SPLIT_CLUSTER,
        data: {
          originalClusterId,
          newClusterData: {
            name: newClusterName.trim(),
            thoughtIds: thoughtsToMove
          }
        }
      });
    }
    
    setIsSplittingCluster(null);
    setNewClusterName('');
    setThoughtsToMove([]);
  };
  
  // Toggle thought selection for moving
  const toggleThoughtForMove = (thoughtId: string) => {
    if (thoughtsToMove.includes(thoughtId)) {
      setThoughtsToMove(thoughtsToMove.filter(id => id !== thoughtId));
    } else {
      setThoughtsToMove([...thoughtsToMove, thoughtId]);
    }
  };
  
  // Render thought selection UI for creating/splitting clusters
  const renderThoughtSelectionUI = (clusterId: string, mode: 'create' | 'split') => {
    const thoughts = getThoughtsByCluster(clusterId);
    
    return (
      <div className="pl-8 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {mode === 'create' ? 'New Child Cluster Name' : 'New Cluster Name'}
          </label>
          <input
            type="text"
            value={newClusterName}
            onChange={(e) => setNewClusterName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter cluster name"
          />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select thoughts to {mode === 'create' ? 'move to child cluster' : 'split into new cluster'}
            </label>
            <span className="text-xs text-gray-500">
              {thoughtsToMove.length} of {thoughts.length} selected
            </span>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-white">
            {thoughts.map(thought => (
              <div 
                key={thought.id}
                className={`p-2 border-b last:border-b-0 cursor-pointer transition-colors ${
                  thoughtsToMove.includes(thought.id) 
                    ? 'bg-indigo-50 border-indigo-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleThoughtForMove(thought.id)}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 border rounded mr-2 ${
                    thoughtsToMove.includes(thought.id) 
                      ? 'bg-indigo-500 border-indigo-500' 
                      : 'border-gray-300'
                  }`}>
                    {thoughtsToMove.includes(thought.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-sm truncate">
                    {thought.content.length > 60 
                      ? `${thought.content.substring(0, 60)}...` 
                      : thought.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              if (mode === 'create') setIsCreatingChild(null);
              else setIsSplittingCluster(null);
              setNewClusterName('');
              setThoughtsToMove([]);
            }}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (mode === 'create') handleCreateChildSubmit(clusterId);
              else handleSplitClusterSubmit(clusterId);
            }}
            disabled={newClusterName.trim() === '' || thoughtsToMove.length === 0}
            className={`px-3 py-1 text-sm text-white rounded-md ${
              newClusterName.trim() === '' || thoughtsToMove.length === 0
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {mode === 'create' ? 'Create Child Cluster' : 'Split Cluster'}
          </button>
        </div>
      </div>
    );
  };
  
  // Render cluster hierarchy
  const renderCluster = (cluster: Cluster, level: number = 0, parentId: string | null = null) => {
    const isExpanded = expandedClusters.has(cluster.id);
    const isActive = activeCluster === cluster.id;
    const childClusters = getChildClusters(cluster.id);
    const thoughts = getThoughtsByCluster(cluster.id);
    
    return (
      <div key={cluster.id} className="mb-2">
        <div 
          className={`flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors ${
            isActive 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          onClick={() => handleClusterClick(cluster.id)}
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          <div className="flex items-center flex-1">
            {childClusters.length > 0 ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(cluster.id);
                }}
                className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-6"></div>
            )}
            
            <div className="font-medium text-gray-800 dark:text-gray-100">{cluster.name}</div>
            
            {cluster.isUserModified && (
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-full">
                Modified
              </span>
            )}
            
            {cluster.keywords && cluster.keywords.length > 0 && (
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {cluster.keywords.slice(0, 3).join(', ')}
              </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({thoughts.length} thoughts)
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={(e) => handleMenuToggle(cluster.id, e)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showMenu === cluster.id && (
              <div className="absolute right-0 z-10 w-48 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 dark:ring-gray-700">
                <button
                  onClick={() => handleRenameClick(cluster.id, cluster.name)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit size={14} className="mr-2" />
                  Rename Thread
                </button>
                
                {!cluster.parentId && (
                  <button
                    onClick={() => handleMoveToParentClick(cluster.id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowRight size={14} className="mr-2" />
                    Move to Parent
                  </button>
                )}
                
                <button
                  onClick={() => handleCreateChildClick(cluster.id)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus size={14} className="mr-2" />
                  Create Child Thread
                </button>
                
                <button
                  onClick={() => handleMergeClick(cluster.id)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowRight size={14} className="mr-2" />
                  Merge with Other Threads
                </button>
                
                <button
                  onClick={() => handleSplitClusterClick(cluster.id)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Scissors size={14} className="mr-2" />
                  Split Thread
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isRenaming === cluster.id && (
          <div className="flex items-center mt-1 pl-8">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-3 py-1 border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(cluster.id);
                if (e.key === 'Escape') {
                  setIsRenaming(null);
                  setNewName('');
                }
              }}
            />
            <button 
              onClick={() => handleRenameSubmit(cluster.id)}
              className="ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setIsRenaming(null);
                setNewName('');
              }}
              className="ml-2 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
        
        {showMoveOptions === cluster.id && clusterHierarchy && (
          <div className="mt-2 pl-8 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Select parent thread:</h4>
            <div className="max-h-60 overflow-y-auto">
              {clusterHierarchy.rootClusters
                .filter(c => c.id !== cluster.id && 
                             !isDescendantOf(clusterHierarchy.allClusters, cluster.id, c.id))
                .map(c => (
                  <div 
                    key={c.id}
                    className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded text-gray-700 dark:text-gray-300"
                    onClick={() => handleMoveToParent(cluster.id, c.id)}
                  >
                    {c.name}
                  </div>
                ))}
            </div>
            <button 
              onClick={() => setShowMoveOptions(null)}
              className="mt-2 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
        
        {showMergeOptions === cluster.id && clusterHierarchy && (
          <div className="mt-2 pl-8 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Select threads to merge into "{cluster.name}":</h4>
            <div className="max-h-60 overflow-y-auto">
              {Object.values(clusterHierarchy.allClusters)
                .filter(c => c.id !== cluster.id)
                .map(c => (
                  <div 
                    key={c.id}
                    className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded"
                    onClick={() => toggleClusterForMerge(c.id)}
                  >
                    <div className={`w-4 h-4 border rounded mr-2 ${
                      selectedForMerge.includes(c.id) 
                        ? 'bg-indigo-500 border-indigo-500' 
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {selectedForMerge.includes(c.id) && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{c.name}</span>
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({c.thoughtIds.length} thoughts)</span>
                  </div>
                ))}
            </div>
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={() => setShowMergeOptions(null)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleMergeClusters(cluster.id)}
                disabled={selectedForMerge.length === 0}
                className={`px-3 py-1 text-white text-sm rounded-md ${
                  selectedForMerge.length === 0 
                    ? 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Merge Selected
              </button>
            </div>
          </div>
        )}
        
        {isCreatingChild === cluster.id && (
          renderThoughtSelectionUI(cluster.id, 'create')
        )}
        
        {isSplittingCluster === cluster.id && (
          renderThoughtSelectionUI(cluster.id, 'split')
        )}
        
        {isExpanded && childClusters.length > 0 && (
          <div>
            {childClusters.map(child => renderCluster(child, level + 1, cluster.id))}
          </div>
        )}
        
        {isActive && thoughts.length > 0 && (
          <div className="mt-2 pl-8">
            <div className="mt-2 space-y-3">
              {thoughts.map(thought => (
                <ThoughtCard 
                  key={thought.id} 
                  thought={thought}
                  onDelete={deleteThought}
                  isExpanded
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Helper to check if a cluster is a descendant of another
  const isDescendantOf = (
    allClusters: Record<string, Cluster>, 
    potentialChildId: string, 
    potentialParentId: string
  ): boolean => {
    let currentId = potentialChildId;
    
    while (true) {
      const currentCluster = allClusters[currentId];
      if (!currentCluster || !currentCluster.parentId) return false;
      if (currentCluster.parentId === potentialParentId) return true;
      currentId = currentCluster.parentId;
    }
  };
  
  if (!clusterHierarchy || clusterHierarchy.rootClusters.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No threads found. Add more thoughts to start seeing threads.
          </p>
        </div>
      </div>
    );
  }
  
  const { apiKey, isKeyValid } = useOpenAI();

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Better with AI Banner */}
      <div className={`mb-6 rounded-2xl border-2 transition-all duration-300 ${
        apiKey && isKeyValid 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
          : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800'
      }`}>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl ${
              apiKey && isKeyValid 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}>
              {apiKey && isKeyValid ? (
                <Sparkles className="h-6 w-6" />
              ) : (
                <Zap className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                apiKey && isKeyValid 
                  ? 'text-green-900 dark:text-green-200' 
                  : 'text-purple-900 dark:text-purple-200'
              }`}>
                {apiKey && isKeyValid ? '✨ AI-Powered Mind Mapping' : '🚀 Better with AI'}
              </h3>
              <p className={`mb-4 leading-relaxed ${
                apiKey && isKeyValid 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-purple-800 dark:text-purple-300'
              }`}>
                {apiKey && isKeyValid 
                  ? 'AI is enhancing your mind map with intelligent connections, semantic relationships, and smart grouping. Your thoughts are being organized with advanced understanding of context and meaning.'
                  : 'Connect your OpenAI API key to unlock AI-powered mind mapping! Get intelligent thought connections, semantic clustering, and advanced relationship mapping between your ideas.'
                }
              </p>
              {(!apiKey || !isKeyValid) && (
                <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Settings className="h-4 w-4 mr-2" />
                  Add API Key in Settings
                </button>
              )}
              {apiKey && isKeyValid && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    AI Enhanced
                  </div>
                  <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Smart Connections Active
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
        <h3 className="font-medium mb-1">Advanced Mind Mapping</h3>
        <p>
          Your thoughts are organized as an interconnected mind map with hierarchical relationships. 
          Click on any node to explore its thoughts, and use the menu (⋯) to modify connections and structure.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        {clusterHierarchy.rootClusters.map(cluster => renderCluster(cluster))}
      </div>
    </div>
  );
};

export default ClusterHierarchyView; 