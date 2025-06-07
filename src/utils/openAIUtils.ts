import { Thought, ThoughtCategory, Cluster, ClusterHierarchy, ThoughtRelevance } from '../types';

// OpenAI API for thought categorization
export const aiCategorizeThought = async (content: string, apiKey: string): Promise<ThoughtCategory> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that categorizes thoughts into exactly one of these categories: idea, feeling, memory, task, question, observation, reflection. Respond with ONLY the category name, nothing else."
          },
          {
            role: "user",
            content: `Categorize this thought into exactly one category (idea, feeling, memory, task, question, observation, reflection): "${content}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content.toLowerCase().trim();
    
    // Validate that the result is a valid category
    const validCategories: ThoughtCategory[] = ['idea', 'feeling', 'memory', 'task', 'question', 'observation', 'reflection'];
    
    if (validCategories.includes(result as ThoughtCategory)) {
      return result as ThoughtCategory;
    } else {

      // Fallback to 'idea' if the API returns an invalid category
      return 'idea';
    }
  } catch (error) {
    // Fallback to 'idea' on any error
    return 'idea';
  }
};

// Generate relevance scores between thoughts
export const aiGenerateRelevanceScores = async (thoughts: Thought[], apiKey: string): Promise<ThoughtRelevance[]> => {
  if (thoughts.length < 2) return [];
  
  try {
    // Prepare a compact representation of thoughts to avoid token limits
    const thoughtData = thoughts.map(thought => ({
      id: thought.id,
      content: thought.content.length > 300 ? thought.content.substring(0, 300) + '...' : thought.content,
      category: thought.category
    }));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes the semantic relationships between thoughts. Your task is to identify which thoughts are related to each other and assign a relevance score between them."
          },
          {
            role: "user",
            content: `Analyze the following thoughts and determine which thoughts are related to each other. 
            
            Thoughts: ${JSON.stringify(thoughtData)}
            
            For each pair of thoughts that are meaningfully related, assign a relevance score between 0.1 and 1.0, 
            where 0.1 means "slightly related" and 1.0 means "extremely closely related".
            
            Format your response as a valid JSON array of thought relevance objects, with each object having:
            1. "thoughtId1" - ID of the first thought
            2. "thoughtId2" - ID of the second thought
            3. "score" - a number between 0.1 and 1.0 representing the relevance
            4. "reason" - a brief explanation of why these thoughts are related
            
            Example format:
            [
              {
                "thoughtId1": "id1",
                "thoughtId2": "id2",
                "score": 0.8,
                "reason": "Both discuss project planning strategies"
              },
              {
                "thoughtId1": "id1",
                "thoughtId2": "id3",
                "score": 0.4,
                "reason": "Tangentially related through productivity themes"
              }
            ]
            
            Important: Return ONLY the JSON array, including only thought pairs with a relevance score of 0.2 or higher.
            Don't include pairs of thoughts that aren't meaningfully related.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let relevanceScores;
    try {
      // Handle case where the API might return markdown code blocks
      if (resultText.includes('```json')) {
        const jsonContent = resultText.split('```json')[1].split('```')[0].trim();
        relevanceScores = JSON.parse(jsonContent);
      } else if (resultText.includes('```')) {
        const jsonContent = resultText.split('```')[1].trim();
        relevanceScores = JSON.parse(jsonContent);
      } else {
        relevanceScores = JSON.parse(resultText);
      }
    } catch (parseError) {
      throw new Error('Failed to parse relevance data');
    }
    
    return relevanceScores;
  } catch (error) {
    return []; // Return empty array on error
  }
};

// OpenAI API for generating hierarchical clusters
export const aiGenerateHierarchicalClusters = async (
  thoughts: Thought[], 
  relevanceScores: ThoughtRelevance[], 
  apiKey: string
): Promise<ClusterHierarchy> => {
  if (thoughts.length < 2) {
    // Return an empty hierarchy when there are too few thoughts
    return {
      rootClusters: [],
      allClusters: {},
      relevanceMap: {}
    };
  }
  
  try {
    // Prepare data for the API call
    const thoughtData = thoughts.map(thought => ({
      id: thought.id,
      content: thought.content.length > 300 ? thought.content.substring(0, 300) + '...' : thought.content,
      category: thought.category
    }));
    
    // Create a relevance map for easier lookup
    const relevanceMap: {[key: string]: number} = {};
    relevanceScores.forEach(rel => {
      // Use a deterministic ordering of IDs for the key
      const key = [rel.thoughtId1, rel.thoughtId2].sort().join(':');
      relevanceMap[key] = rel.score;
    });
    
    // Prepare the prompt with context about hierarchical clustering
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that organizes thoughts into a hierarchical cluster structure.
            You should identify main themes (parent clusters) and sub-themes (child clusters).
            Use the relevance scores between thoughts to inform your clustering decisions.`
          },
          {
            role: "user",
            content: `Organize these thoughts into a hierarchical cluster structure.
            
            Thoughts: ${JSON.stringify(thoughtData)}
            
            Relevance Scores: ${JSON.stringify(relevanceScores)}
            
            Create a hierarchical structure with:
            1. Top-level clusters for major themes
            2. Child clusters for sub-themes where appropriate
            3. Descriptive names for each cluster
            4. Relevant keywords for each cluster
            5. A brief description for each cluster
            
            Format your response as a valid JSON object with the following structure:
            {
              "rootClusters": [
                {
                  "id": "cluster1", // Generated unique ID
                  "name": "Work Projects",
                  "thoughtIds": ["id1", "id3", "id8"],
                  "childrenIds": ["cluster1-1", "cluster1-2"],
                  "keywords": ["work", "project", "deadline"],
                  "description": "Thoughts related to professional work projects and tasks"
                }
              ],
              "allClusters": {
                "cluster1": {
                  // Same as above
                },
                "cluster1-1": {
                  "id": "cluster1-1", 
                  "name": "Project Deadlines",
                  "thoughtIds": ["id1", "id8"],
                  "parentId": "cluster1",
                  "keywords": ["deadline", "schedule"],
                  "description": "Thoughts specifically about project timelines and deadlines"
                }
              }
            }
            
            Rules:
            - Each cluster should have at least 2 thoughts, except in rare cases where a thought is truly unique
            - Create child clusters only when there's a clear sub-theme within a larger theme
            - Limit hierarchy to 2 levels (parent and children) for simplicity
            - Don't force thoughts into clusters if they're not related
            - Use relevance scores to guide your clustering decisions
            
            Important: Return ONLY the JSON object, no other text.`
          }
        ],
        temperature: 0.4,
        max_tokens: 3500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let clusterHierarchy;
    try {
      // Handle case where the API might return markdown code blocks
      if (resultText.includes('```json')) {
        const jsonContent = resultText.split('```json')[1].split('```')[0].trim();
        clusterHierarchy = JSON.parse(jsonContent);
      } else if (resultText.includes('```')) {
        const jsonContent = resultText.split('```')[1].trim();
        clusterHierarchy = JSON.parse(jsonContent);
      } else {
        clusterHierarchy = JSON.parse(resultText);
      }
    } catch (parseError) {
      throw new Error('Failed to parse cluster data');
    }
    
    // Add creation date to all clusters
    const now = new Date();
    for (const clusterId in clusterHierarchy.allClusters) {
      clusterHierarchy.allClusters[clusterId].createdAt = now;
    }
    
    return {
      rootClusters: clusterHierarchy.rootClusters,
      allClusters: clusterHierarchy.allClusters,
      relevanceMap
    };
  } catch (error) {
    // Return empty hierarchy on error
    return {
      rootClusters: [],
      allClusters: {},
      relevanceMap: {}
    };
  }
};

// Original function for backward compatibility
export const aiGenerateClusters = async (thoughts: Thought[], apiKey: string): Promise<Cluster[]> => {
  // Generate relevance scores first
  const relevanceScores = await aiGenerateRelevanceScores(thoughts, apiKey);
  
  // Generate hierarchical clusters
  const hierarchy = await aiGenerateHierarchicalClusters(thoughts, relevanceScores, apiKey);
  
  // For backward compatibility, convert to flat list of clusters
  return Object.values(hierarchy.allClusters);
};

// Generate topics/themes from a collection of thoughts
export const aiGenerateThemes = async (thoughts: Thought[], apiKey: string): Promise<string[]> => {
  if (thoughts.length === 0) return [];
  
  try {
    // Extract just the content of the thoughts
    const thoughtContents = thoughts.map(thought => thought.content);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that identifies common themes or topics in a set of thoughts."
          },
          {
            role: "user",
            content: `Identify 3-5 key themes or topics in these thoughts:
            ${JSON.stringify(thoughtContents)}
            
            Format your response as a valid JSON array of strings, with each string being a key theme.
            Example: ["Personal Growth", "Software Development", "Health"]
            
            Return ONLY the JSON array, no other text.`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let themes;
    try {
      // Handle case where the API might return markdown code blocks
      if (resultText.includes('```json')) {
        const jsonContent = resultText.split('```json')[1].split('```')[0].trim();
        themes = JSON.parse(jsonContent);
      } else if (resultText.includes('```')) {
        const jsonContent = resultText.split('```')[1].trim();
        themes = JSON.parse(jsonContent);
      } else {
        themes = JSON.parse(resultText);
      }
    } catch (parseError) {
      return []; // Return empty array on parsing error
    }
    
    return themes;
  } catch (error) {
    return []; // Return empty array on any error
  }
};

// Find the most insightful thought to revisit
export const aiFindThoughtToRevisit = async (thoughts: Thought[], apiKey: string): Promise<Thought | null> => {
  if (thoughts.length === 0) return null;
  
  try {
    // Prepare thought data to send to API
    const thoughtData = thoughts.map(thought => ({
      id: thought.id,
      content: thought.content,
      category: thought.category,
      createdAt: thought.createdAt.toISOString()
    }));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that identifies the most insightful or important thought that would be worth revisiting from a collection of thoughts."
          },
          {
            role: "user",
            content: `From these thoughts, identify the ONE thought that seems most worth revisiting or reflecting on further.
            Consider thoughts that:
            - Contain meaningful questions
            - Represent important ideas
            - Suggest actions or tasks that may need follow-up
            - Contain deeper insights or reflections
            
            Thoughts: ${JSON.stringify(thoughtData)}
            
            Return ONLY the ID of the thought you selected, nothing else.`
          }
        ],
        temperature: 0.3,
        max_tokens: 20
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const thoughtId = data.choices[0].message.content.trim();
    
    // Find the thought with the matching ID
    const selectedThought = thoughts.find(thought => thought.id === thoughtId);
    
    return selectedThought || thoughts[0]; // Fallback to first thought if not found
  } catch (error) {
    // Fallback to returning the first thought on error
    return thoughts[0];
  }
}; 