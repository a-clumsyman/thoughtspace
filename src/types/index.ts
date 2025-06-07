// Define the thought categories
export type ThoughtCategory = 
  | 'idea' 
  | 'feeling' 
  | 'memory' 
  | 'task' 
  | 'question' 
  | 'observation' 
  | 'reflection';

// Define the thought interface
export interface Thought {
  id: string;
  content: string;
  category: ThoughtCategory;
  createdAt: Date;
  updatedAt: Date;
}

// Define the relevance score between thoughts
export interface ThoughtRelevance {
  thoughtId1: string;
  thoughtId2: string;
  score: number;  // 0-1 score representing relevance between thoughts
  reason?: string; // Optional explanation of why these thoughts are related
}

// Define the cluster interface with hierarchical support
export interface Cluster {
  id: string;
  name: string;
  thoughtIds: string[];
  createdAt: Date;
  parentId?: string;  // Optional parent cluster id for hierarchical organization
  childrenIds?: string[];  // Optional child cluster ids
  isUserModified?: boolean; // Flag to indicate if this cluster was manually adjusted
  relevanceScores?: {[thoughtId: string]: number}; // Maps thought IDs to their relevance scores in this cluster
  keywords?: string[]; // Key terms that define this cluster
  description?: string; // AI-generated description of the cluster
}

// Define category details including emoji, color, and description
export interface CategoryDetail {
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

// Define weekly recap interface
export interface WeeklyRecap {
  weekStarting: Date;
  topThemes: string[];
  thoughtCount: number;
  categoryBreakdown: Record<ThoughtCategory, number>;
  suggestedRevisit: Thought | null;
  // Enhanced analytics fields
  averageSentiment?: number;
  sentimentTrend?: 'improving' | 'declining' | 'stable';
  emotionalInsights?: string[];
  cognitivePatterns?: string[];
}

// Define cluster adjustment operations
export enum ClusterAdjustmentType {
  ADD_THOUGHT = 'add_thought',
  REMOVE_THOUGHT = 'remove_thought',
  RENAME_CLUSTER = 'rename_cluster',
  MERGE_CLUSTERS = 'merge_clusters',
  SPLIT_CLUSTER = 'split_cluster',
  CREATE_CHILD_CLUSTER = 'create_child_cluster',
  MOVE_TO_PARENT = 'move_to_parent'
}

// Define cluster adjustment interface for tracking user modifications
export interface ClusterAdjustment {
  id: string;
  clusterId: string;
  type: ClusterAdjustmentType;
  timestamp: Date;
  data: any; // Additional data specific to the adjustment type
}

// Interface to represent the entire cluster hierarchy
export interface ClusterHierarchy {
  rootClusters: Cluster[];
  allClusters: {[id: string]: Cluster};
  relevanceMap: {[thoughtIdPair: string]: number}; // Maps "thoughtId1:thoughtId2" to relevance score
}