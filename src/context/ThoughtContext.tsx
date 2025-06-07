import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Thought, ThoughtCategory, Cluster, WeeklyRecap, ClusterHierarchy, ThoughtRelevance, ClusterAdjustment, ClusterAdjustmentType } from '../types';
import { 
  categorizeThoughtAdvanced, 
  generateAdvancedClusters, 
  generateAdvancedWeeklyRecap,
  advancedFuzzySearch,
  findRelatedThoughts
} from '../utils/enhancedNLP';
import { aiCategorizeThought, aiGenerateThemes, aiFindThoughtToRevisit, aiGenerateRelevanceScores, aiGenerateHierarchicalClusters } from '../utils/openAIUtils';
import { useOpenAI } from './OpenAIContext';
import { robustStorage } from '../utils/robustStorage';
import debounce from 'lodash.debounce';

// Define the context type
interface ThoughtContextType {
  thoughts: Thought[];
  clusters: Cluster[];
  clusterHierarchy: ClusterHierarchy | null;
  weeklyRecap: WeeklyRecap | null;
  relevanceScores: ThoughtRelevance[];
  clusterAdjustments: ClusterAdjustment[];
  isLoading: boolean;
  isAiProcessing: boolean;
  error: string | null;
  
  addThought: (content: string) => Promise<void>;
  updateThought: (id: string, content: string) => void;
  deleteThought: (id: string) => void;
  searchThoughts: (query: string) => Thought[];
  getThoughtsByCluster: (clusterId: string) => Thought[];
  getClusterById: (clusterId: string) => Cluster | null;
  getChildClusters: (parentId: string) => Cluster[];
  refreshClusters: () => Promise<void>;
  refreshWeeklyRecap: () => Promise<void>;
  adjustCluster: (adjustment: Omit<ClusterAdjustment, "id" | "timestamp">) => void;
  getThoughtRelevance: (thoughtId1: string, thoughtId2: string) => number;
  exportData: () => Promise<void>;
  importData: (data: any) => Promise<void>;
  clearError: () => void;
  hardReset: () => Promise<void>;
}

// Create context with initial values
const ThoughtContext = createContext<ThoughtContextType>({
  thoughts: [],
  clusters: [],
  clusterHierarchy: null,
  weeklyRecap: null,
  relevanceScores: [],
  clusterAdjustments: [],
  isLoading: false,
  isAiProcessing: false,
  error: null,
  
  addThought: async () => {},
  updateThought: () => {},
  deleteThought: () => {},
  searchThoughts: () => [],
  getThoughtsByCluster: () => [],
  getClusterById: () => null,
  getChildClusters: () => [],
  refreshClusters: async () => {},
  refreshWeeklyRecap: async () => {},
  adjustCluster: () => {},
  getThoughtRelevance: () => 0,
  exportData: async () => {},
  importData: async () => {},
  clearError: () => {},
  hardReset: async () => {},
});

// Context provider component
export const ThoughtProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [clusterHierarchy, setClusterHierarchy] = useState<ClusterHierarchy | null>(null);
  const [weeklyRecap, setWeeklyRecap] = useState<WeeklyRecap | null>(null);
  const [relevanceScores, setRelevanceScores] = useState<ThoughtRelevance[]>([]);
  const [clusterAdjustments, setClusterAdjustments] = useState<ClusterAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get OpenAI context
  const { apiKey, isKeyValid } = useOpenAI();
  
  // Initialize IndexedDB and load data on initial render
  useEffect(() => {
    const initAndLoadData = async () => {
      try {
        setIsLoading(true);
        
        // Initialize IndexedDB
        await robustStorage.init();
        
        // Request persistent storage
        await robustStorage.requestPersistentStorage();
        
        // Load all data from IndexedDB
        const savedThoughts = await robustStorage.getAllThoughts();
        if (savedThoughts.length > 0) {
          setThoughts(savedThoughts);
        }
        
        // Load other data from localStorage (keeping existing approach for now)
        try {
          const savedHierarchy = localStorage.getItem('clusterHierarchy');
          if (savedHierarchy) {
            const hierarchy = JSON.parse(savedHierarchy);
            // Convert date strings back to Date objects
            for (const id in hierarchy.allClusters) {
              hierarchy.allClusters[id].createdAt = new Date(hierarchy.allClusters[id].createdAt);
            }
            setClusterHierarchy(hierarchy);
            setClusters(Object.values(hierarchy.allClusters));
          }
          
          const savedRelevanceScores = localStorage.getItem('relevanceScores');
          if (savedRelevanceScores) {
            setRelevanceScores(JSON.parse(savedRelevanceScores));
          }
          
          const savedAdjustments = localStorage.getItem('clusterAdjustments');
          if (savedAdjustments) {
            const adjustments = JSON.parse(savedAdjustments);
            adjustments.forEach((adj: any) => {
              adj.timestamp = new Date(adj.timestamp);
            });
            setClusterAdjustments(adjustments);
          }
        } catch (error) {
          // Error loading additional data
        }
        
      } catch (error) {
        // Error initializing app
        setError('Failed to initialize storage');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAndLoadData();
  }, []);

  // Debounced error clearing
  const debouncedClearError = useCallback(
    debounce(() => setError(null), 5000),
    []
  );

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      debouncedClearError();
    }
  }, [error, debouncedClearError]);
  
  // Generate clusters whenever thoughts change
  useEffect(() => {
    const updateClusters = async () => {
      // Only refresh clusters if we have enough thoughts
      if (thoughts.length >= 2) {
        await refreshClusters();
      } else {
        // Reset clusters if we don't have enough thoughts
        setClusters([]);
        setClusterHierarchy(null);
        setRelevanceScores([]);
        localStorage.removeItem('clusterHierarchy');
        localStorage.removeItem('relevanceScores');
      }
      
      await refreshWeeklyRecap();
    };
    
    if (thoughts.length > 0) {
      updateClusters();
    }
  }, [thoughts.length]); // Only trigger on length change to avoid infinite loops
  
  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    if (clusterHierarchy) {
      localStorage.setItem('clusterHierarchy', JSON.stringify(clusterHierarchy));
    }
  }, [clusterHierarchy]);
  
  useEffect(() => {
    if (relevanceScores.length > 0) {
      localStorage.setItem('relevanceScores', JSON.stringify(relevanceScores));
    }
  }, [relevanceScores]);
  
  useEffect(() => {
    if (clusterAdjustments.length > 0) {
      localStorage.setItem('clusterAdjustments', JSON.stringify(clusterAdjustments));
    }
  }, [clusterAdjustments]);

  // Add a new thought
  const addThought = async (content: string) => {
    if (!content.trim()) return;
    
    setIsAiProcessing(true);
    
    try {
      // Use OpenAI for categorization if API key is available and valid
      let category: ThoughtCategory;
      if (apiKey && isKeyValid) {
        try {
          category = await aiCategorizeThought(content, apiKey);
        } catch (error) {
          // AI categorization failed, using fallback
          category = categorizeThoughtAdvanced(content);
        }
      } else {
        category = categorizeThoughtAdvanced(content);
      }
      
      const newThought: Thought = {
        id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to IndexedDB
      await robustStorage.saveThought(newThought);
      
      // Update state
      setThoughts(prev => [newThought, ...prev]);
      
    } catch (error) {
      setError('Failed to add thought');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Delete a thought
  const deleteThought = (id: string) => {
    try {
      // Remove from IndexedDB
      robustStorage.deleteThought(id);
      
      // Update state
      setThoughts(prev => prev.filter(thought => thought.id !== id));
      
      // Remove from relevance scores
      setRelevanceScores(prev => 
        prev.filter(rel => rel.thoughtId1 !== id && rel.thoughtId2 !== id)
      );
      
    } catch (error) {
      setError('Failed to delete thought');
    }
  };

  // Update a thought
  const updateThought = (id: string, content: string) => {
    try {
      const updatedThoughts = thoughts.map(thought => 
        thought.id === id 
          ? { ...thought, content, updatedAt: new Date() }
          : thought
      );
      
      const updatedThought = updatedThoughts.find(t => t.id === id);
      if (updatedThought) {
        // Save to IndexedDB
        robustStorage.saveThought(updatedThought);
        
        // Update state
        setThoughts(updatedThoughts);
      }
    } catch (error) {
      setError('Failed to update thought');
    }
  };

  // Search thoughts
  const searchThoughts = (query: string): Thought[] => {
    if (!query.trim()) return [];
    return advancedFuzzySearch(query, thoughts);
  };

  // Get thoughts that belong to a specific cluster
  const getThoughtsByCluster = (clusterId: string): Thought[] => {
    const cluster = getClusterById(clusterId);
    if (!cluster) return [];
    
    return thoughts.filter(thought => cluster.thoughtIds.includes(thought.id));
  };

  // Get a cluster by ID
  const getClusterById = (clusterId: string): Cluster | null => {
    if (!clusterHierarchy) return null;
    return clusterHierarchy.allClusters[clusterId] || null;
  };

  // Get child clusters for a parent
  const getChildClusters = (parentId: string): Cluster[] => {
    if (!clusterHierarchy) return [];
    
    return Object.values(clusterHierarchy.allClusters)
      .filter(cluster => cluster.parentId === parentId);
  };

  // Get relevance score between two thoughts
  const getThoughtRelevance = (thoughtId1: string, thoughtId2: string): number => {
    const relevance = relevanceScores.find(rel => 
      (rel.thoughtId1 === thoughtId1 && rel.thoughtId2 === thoughtId2) ||
      (rel.thoughtId1 === thoughtId2 && rel.thoughtId2 === thoughtId1)
    );
    return relevance?.score || 0;
  };

  // Adjust cluster (user manual adjustments)
  const adjustCluster = (adjustmentData: Omit<ClusterAdjustment, "id" | "timestamp">) => {
    const adjustment: ClusterAdjustment = {
      ...adjustmentData,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date()
    };
    
    setClusterAdjustments(prev => [...prev, adjustment]);
    
    if (!clusterHierarchy) return;
    
    const newHierarchy = { ...clusterHierarchy };
    
    switch (adjustment.type) {
      case ClusterAdjustmentType.RENAME_CLUSTER:
        if (newHierarchy.allClusters[adjustment.clusterId]) {
          newHierarchy.allClusters[adjustment.clusterId] = {
            ...newHierarchy.allClusters[adjustment.clusterId],
            name: adjustment.data.newName,
            isUserModified: true
          };
        }
        break;
        
      case ClusterAdjustmentType.MERGE_CLUSTERS:
        const targetCluster = newHierarchy.allClusters[adjustment.data.targetClusterId];
        if (targetCluster) {
          // Merge thought IDs from source clusters
          adjustment.data.sourceClusterIds.forEach((sourceId: string) => {
            const sourceCluster = newHierarchy.allClusters[sourceId];
            if (sourceCluster) {
              targetCluster.thoughtIds = [...targetCluster.thoughtIds, ...sourceCluster.thoughtIds];
              delete newHierarchy.allClusters[sourceId];
              
              // Remove from root clusters if it's there
              newHierarchy.rootClusters = newHierarchy.rootClusters.filter(c => c.id !== sourceId);
            }
          });
          
          targetCluster.isUserModified = true;
        }
        break;
        
      case ClusterAdjustmentType.SPLIT_CLUSTER:
        const originalCluster = newHierarchy.allClusters[adjustment.data.originalClusterId];
        if (originalCluster) {
          // Create new cluster
          const newCluster: Cluster = {
            id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: adjustment.data.newClusterData.name,
            thoughtIds: adjustment.data.newClusterData.thoughtIds,
            createdAt: new Date(),
            isUserModified: true
          };
          
          // Remove thoughts from original cluster
          originalCluster.thoughtIds = originalCluster.thoughtIds.filter(
            (id: string) => !adjustment.data.newClusterData.thoughtIds.includes(id)
          );
          originalCluster.isUserModified = true;
          
          // Add new cluster
          newHierarchy.allClusters[newCluster.id] = newCluster;
          newHierarchy.rootClusters.push(newCluster);
        }
        break;
    }
    
    setClusterHierarchy(newHierarchy);
    setClusters(Object.values(newHierarchy.allClusters));
  };

  // Refresh clusters
  const refreshClusters = async () => {
    if (thoughts.length < 2) return;
    
    setIsAiProcessing(true);
    
    try {
      if (apiKey && isKeyValid) {
        // Use AI clustering
        const newRelevanceScores = await aiGenerateRelevanceScores(thoughts, apiKey);
        setRelevanceScores(newRelevanceScores);
        
        const hierarchy = await aiGenerateHierarchicalClusters(thoughts, newRelevanceScores, apiKey);
        setClusterHierarchy(hierarchy);
        setClusters(Object.values(hierarchy.allClusters));
      } else {
        // Use local clustering
        const localClusters = generateAdvancedClusters(thoughts);
        setClusters(localClusters);
        
        // Create simple hierarchy
        const allClusters: {[id: string]: Cluster} = {};
        localClusters.forEach(cluster => {
          allClusters[cluster.id] = cluster;
        });
        
        const hierarchy = {
          rootClusters: localClusters,
          allClusters,
          relevanceMap: {}
        };
        setClusterHierarchy(hierarchy);
      }
    } catch (error) {
      // Fallback to local clustering
      const localClusters = generateAdvancedClusters(thoughts);
      setClusters(localClusters);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Refresh weekly recap
  const refreshWeeklyRecap = async () => {
    if (thoughts.length === 0) {
      setWeeklyRecap(null);
      return;
    }

    try {
      setIsAiProcessing(true);

      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyThoughts = thoughts.filter(thought => 
        thought.createdAt >= weekAgo && thought.createdAt <= now
      );

      if (weeklyThoughts.length === 0) {
        setWeeklyRecap(null);
        return;
      }

      const categoryBreakdown = weeklyThoughts.reduce((acc, thought) => {
        acc[thought.category] = (acc[thought.category] || 0) + 1;
        return acc;
      }, {} as Record<ThoughtCategory, number>);

      if (apiKey && isKeyValid) {
        // Use AI for themes and suggestions
        const themes = await aiGenerateThemes(weeklyThoughts, apiKey);
        const thoughtToRevisit = await aiFindThoughtToRevisit(weeklyThoughts, apiKey);

        setWeeklyRecap({
          weekStarting: weekAgo,
          topThemes: themes,
          thoughtCount: weeklyThoughts.length,
          categoryBreakdown,
          suggestedRevisit: thoughtToRevisit
        });
      } else {
        // Use local implementation
        const recap = generateAdvancedWeeklyRecap(thoughts);
        setWeeklyRecap(recap);
      }
    } catch (error) {
      // Fallback to local implementation
      const recap = generateAdvancedWeeklyRecap(thoughts);
      setWeeklyRecap(recap);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Export data
  const exportData = async () => {
    try {
      await robustStorage.exportData();
    } catch (error) {
      setError('Failed to export data');
    }
  };

  // Import data
  const importData = async (data: any) => {
    try {
      setIsLoading(true);
      await robustStorage.importData(data);
      
      // Reload thoughts
      const savedThoughts = await robustStorage.getAllThoughts();
      setThoughts(savedThoughts);
      
    } catch (error) {
      setError('Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Hard reset function to clear ALL data
  const hardReset = async () => {
    try {
      setIsLoading(true);
      
      // Clear all state
      setThoughts([]);
      setClusters([]);
      setClusterHierarchy(null);
      setWeeklyRecap(null);
      setRelevanceScores([]);
      setClusterAdjustments([]);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('clusterHierarchy');
      localStorage.removeItem('relevanceScores');
      localStorage.removeItem('clusterAdjustments');
      localStorage.removeItem('weeklyRecap');
      localStorage.removeItem('hasSeenOnboarding');
      
      // Clear IndexedDB
      await robustStorage.clearAllData();
      
    } catch (error) {
      setError('Failed to reset data');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: ThoughtContextType = {
    thoughts,
    clusters,
    clusterHierarchy,
    weeklyRecap,
    relevanceScores,
    clusterAdjustments,
    isLoading,
    isAiProcessing,
    error,
    
    addThought,
    updateThought,
    deleteThought,
    searchThoughts,
    getThoughtsByCluster,
    getClusterById,
    getChildClusters,
    refreshClusters,
    refreshWeeklyRecap,
    adjustCluster,
    getThoughtRelevance,
    exportData,
    importData,
    clearError,
    hardReset,
  };

  return (
    <ThoughtContext.Provider value={contextValue}>
      {children}
    </ThoughtContext.Provider>
  );
};

// Custom hook to use the thought context
export const useThoughts = () => {
  const context = useContext(ThoughtContext);
  if (!context) {
    throw new Error('useThoughts must be used within a ThoughtProvider');
  }
  return context;
};
