import { Thought, ThoughtCategory, Cluster, WeeklyRecap } from '../types';

// Advanced text preprocessing class
class TextProcessor {
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'but', 'or', 'not', 'this',
    'they', 'have', 'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if', 'up', 'out',
    'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him',
    'has', 'two', 'more', 'very', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been',
    'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made',
    'may', 'part', 'i', 'me', 'im', 'you', 'your', 'we', 'us', 'our', 'am', 'can', 'just'
  ]);

  private stemWord(word: string): string {
    // Enhanced stemming algorithm
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ies', 'ied', 'ying', 'tion', 'sion', 'ness', 'ment', 'able', 'ful'];
    let stemmed = word.toLowerCase();
    
    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
        stemmed = stemmed.slice(0, -suffix.length);
        break;
      }
    }
    
    return stemmed;
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .map(word => this.stemWord(word));
  }

  extractPhrases(text: string, minLength: number = 2, maxLength: number = 4): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];
    
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (!phrase.split(' ').some(word => this.stopWords.has(word))) {
          phrases.push(phrase);
        }
      }
    }
    
    return phrases;
  }
}

// TF-IDF Calculator for semantic similarity
class TFIDFCalculator {
  private documents: string[][] = [];
  private vocabulary: Set<string> = new Set();
  private idfCache: Map<string, number> = new Map();

  addDocuments(docs: string[][]) {
    this.documents = docs;
    this.vocabulary.clear();
    this.idfCache.clear();
    
    docs.forEach(doc => {
      doc.forEach(term => this.vocabulary.add(term));
    });
    
    this.calculateIDF();
  }

  private calculateIDF() {
    const N = this.documents.length;
    
    for (const term of this.vocabulary) {
      const docsContaining = this.documents.filter(doc => doc.includes(term)).length;
      const idf = Math.log(N / (docsContaining + 1));
      this.idfCache.set(term, idf);
    }
  }

  private calculateTF(term: string, document: string[]): number {
    const termCount = document.filter(t => t === term).length;
    return termCount / document.length;
  }

  getVector(document: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    
    for (const term of this.vocabulary) {
      const tf = this.calculateTF(term, document);
      const idf = this.idfCache.get(term) || 0;
      const tfidf = tf * idf;
      
      if (tfidf > 0) {
        vector.set(term, tfidf);
      }
    }
    
    return vector;
  }

  cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);
    
    for (const term of allTerms) {
      const val1 = vec1.get(term) || 0;
      const val2 = vec2.get(term) || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

// Advanced semantic analyzer
class SemanticAnalyzer {
  private processor = new TextProcessor();
  private tfidf = new TFIDFCalculator();
  
  // Enhanced emotional patterns with context
  private emotionalPatterns = {
    anxiety: {
      patterns: ['worry', 'anxious', 'stress', 'overwhelm', 'panic', 'nervous', 'fear', 'scared', 'tension', 'restless'],
      weight: 0.9,
      context: ['cant sleep', 'racing thoughts', 'what if', 'worst case']
    },
    depression: {
      patterns: ['sad', 'depress', 'empty', 'hopeless', 'worthless', 'numb', 'tire', 'exhaust', 'alone', 'dark'],
      weight: 0.9,
      context: ['no energy', 'dont care', 'whats the point', 'feel like']
    },
    excitement: {
      patterns: ['excite', 'thrill', 'amaz', 'awesome', 'fantastic', 'incredible', 'wonderful', 'energized'],
      weight: 0.8,
      context: ['cant wait', 'so pumped', 'this is great', 'feeling alive']
    },
    gratitude: {
      patterns: ['grateful', 'thankful', 'blessed', 'appreciate', 'fortune', 'lucky', 'privilege'],
      weight: 0.7,
      context: ['so grateful for', 'blessed to have', 'appreciate that']
    },
    confusion: {
      patterns: ['confus', 'unclear', 'lost', 'perplex', 'puzzle', 'unsure', 'doubt', 'uncertain'],
      weight: 0.6,
      context: ['dont understand', 'not sure', 'confused about', 'lost in']
    },
    motivation: {
      patterns: ['motivate', 'inspire', 'determin', 'goal', 'achieve', 'success', 'progress', 'driven'],
      weight: 0.7,
      context: ['ready to', 'going to', 'determined to', 'focused on']
    },
    love: {
      patterns: ['love', 'adore', 'cherish', 'care', 'affection', 'devoted', 'heart', 'soul'],
      weight: 0.8,
      context: ['love you', 'care about', 'mean everything', 'special to me']
    }
  };

  // Enhanced categorization with sophisticated pattern matching
  categorizeThoughtAdvanced(content: string): { 
    category: ThoughtCategory; 
    confidence: number; 
    subcategories: string[];
    reasoning: string;
  } {
    const tokens = this.processor.tokenize(content);
    const phrases = this.processor.extractPhrases(content);
    const lower = content.toLowerCase();
    
    const scores: Record<ThoughtCategory, number> = {
      idea: 0, feeling: 0, memory: 0, task: 0, question: 0, observation: 0, reflection: 0
    };

    // Sophisticated pattern matching with contextual understanding
    const patterns = {
      question: {
        direct: [/\?/, /\b(who|what|where|when|why|how|should|could|would|will|can|may|might)\b/],
        context: ['uncertain', 'wonder', 'curious', 'ask', 'inquire', 'question', 'dont know'],
        phrases: ['i wonder', 'what do you think', 'any ideas', 'help me understand']
      },
      feeling: {
        direct: [/\b(feel|feeling|emotion|mood|heart|soul)\b/],
        context: ['happy', 'sad', 'angry', 'excited', 'frustrated', 'anxious', 'love', 'hate', 'emotional'],
        phrases: ['feeling like', 'makes me feel', 'emotional about', 'in my heart']
      },
      memory: {
        direct: [/\b(remember|recall|memory|past|childhood|yesterday|ago|used to|back when|nostalgia)\b/],
        context: ['nostalgic', 'reminisce', 'flashback', 'remind', 'think back', 'brings back'],
        phrases: ['i remember', 'back in', 'used to be', 'reminds me of']
      },
      task: {
        direct: [/\b(need to|should|must|have to|todo|task|deadline|remind|important|urgent|priority)\b/],
        context: ['complete', 'finish', 'accomplish', 'work on', 'schedule', 'organize', 'plan'],
        phrases: ['need to do', 'have to', 'should probably', 'dont forget']
      },
      observation: {
        direct: [/\b(noticed|observed|saw|seems|appears|pattern|realize|interesting|weird|strange|unusual)\b/],
        context: ['notice', 'trend', 'remarkable', 'striking', 'obvious', 'clear', 'evident'],
        phrases: ['i noticed', 'seems like', 'interesting that', 'pattern of']
      },
      reflection: {
        direct: [/\b(think|thought|understand|consider|believe|wonder|maybe|perhaps|probably|philosophy)\b/],
        context: ['ponder', 'contemplate', 'meditate', 'insight', 'wisdom', 'perspective', 'meaning'],
        phrases: ['i think', 'been thinking', 'my thoughts on', 'i believe']
      },
      idea: {
        direct: [/\b(idea|concept|plan|project|want to|wish|dream|goal|vision|imagine|create)\b/],
        context: ['invent', 'design', 'brainstorm', 'innovate', 'solution', 'possibility', 'potential'],
        phrases: ['i want to', 'what if we', 'maybe we could', 'good idea']
      }
    };

    // Calculate weighted scores
    Object.entries(patterns).forEach(([category, { direct, context, phrases }]) => {
      let score = 0;
      
      // Direct pattern matches (highest weight)
      direct.forEach(regex => {
        const matches = lower.match(regex);
        if (matches) score += matches.length * 3;
      });
      
      // Context matches (medium weight)
      context.forEach(contextWord => {
        if (tokens.includes(contextWord) || lower.includes(contextWord)) {
          score += 2;
        }
      });
      
      // Phrase matches (high weight for specificity)
      phrases.forEach(phrase => {
        if (lower.includes(phrase)) {
          score += 4;
        }
      });
      
      scores[category as ThoughtCategory] = score;
    });

    // Apply emotional context modifiers
    Object.entries(this.emotionalPatterns).forEach(([emotion, { patterns, weight, context }]) => {
      let emotionScore = 0;
      
      patterns.forEach(pattern => {
        if (tokens.some(token => token.includes(pattern)) || lower.includes(pattern)) {
          emotionScore += 1;
        }
      });
      
      context.forEach(contextPhrase => {
        if (lower.includes(contextPhrase)) {
          emotionScore += 2;
        }
      });
      
      if (emotionScore > 0) {
        scores.feeling += emotionScore * weight;
      }
    });

    // Find highest scoring category
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);

    if (sortedScores.length === 0) {
      return { 
        category: 'idea', 
        confidence: 0.1, 
        subcategories: [],
        reasoning: 'No strong patterns detected, defaulting to idea category'
      };
    }

    const topCategory = sortedScores[0][0] as ThoughtCategory;
    const topScore = sortedScores[0][1];
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    const confidence = Math.min(topScore / Math.max(totalScore, 1), 1);
    const subcategories = sortedScores
      .slice(1, 3)
      .filter(([, score]) => score >= topScore * 0.3)
      .map(([cat]) => cat);

    const reasoning = this.generateCategoryReasoning(topCategory, topScore, content);

    return {
      category: topCategory,
      confidence,
      subcategories,
      reasoning
    };
  }

  private generateCategoryReasoning(category: ThoughtCategory, score: number, content: string): string {
    const reasons: Record<ThoughtCategory, string[]> = {
      question: ['Contains question words or uncertainty', 'Seeks information or clarification'],
      feeling: ['Expresses emotions or emotional state', 'Contains feeling-related vocabulary'],
      memory: ['References past experiences or memories', 'Uses nostalgic or retrospective language'],
      task: ['Indicates something to be done', 'Contains action items or deadlines'],
      observation: ['Makes note of patterns or phenomena', 'Describes noticed behaviors or events'],
      reflection: ['Shows contemplative thinking', 'Explores meaning or understanding'],
      idea: ['Presents creative concepts or plans', 'Expresses desires or visions']
    };

    const categoryReasons = reasons[category] || ['General categorization'];
    return categoryReasons[Math.floor(Math.random() * categoryReasons.length)];
  }

  // Advanced sentiment analysis with nuanced emotional understanding
  analyzeSentimentAdvanced(content: string): {
    score: number;
    polarity: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: Array<{ emotion: string; intensity: number; context: string[] }>;
    nuance: string;
    magnitude: number;
  } {
    const tokens = this.processor.tokenize(content);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let sentimentScore = 0;
    let sentimentCount = 0;
    const detectedEmotions: Array<{ emotion: string; intensity: number; context: string[] }> = [];

         // Enhanced sentiment indicators with intensity weights
     const sentimentLexicon = {
       positive: {
         'amazing': 0.9, 'awesome': 0.8, 'brilliant': 0.8, 'excellent': 0.8, 'fantastic': 0.9,
         'good': 0.5, 'great': 0.7, 'happy': 0.6, 'love': 0.8, 'perfect': 0.9, 'wonderful': 0.8,
         'excited': 0.7, 'thrilled': 0.8, 'grateful': 0.7, 'blessed': 0.7, 'joy': 0.8
       } as Record<string, number>,
       negative: {
         'awful': -0.8, 'terrible': -0.8, 'horrible': -0.8, 'hate': -0.7, 'bad': -0.5,
         'sad': -0.6, 'angry': -0.7, 'frustrated': -0.6, 'disappointed': -0.6, 'worst': -0.9,
         'annoying': -0.5, 'stressed': -0.6, 'overwhelmed': -0.7, 'anxious': -0.6
       } as Record<string, number>
     };

    // Analyze sentiment by sentence for context
    sentences.forEach(sentence => {
      const sentenceTokens = this.processor.tokenize(sentence);
      let sentenceScore = 0;
      let foundSentimentWords = 0;
      
      sentenceTokens.forEach(token => {
        if (sentimentLexicon.positive[token]) {
          sentenceScore += sentimentLexicon.positive[token];
          foundSentimentWords++;
        }
        if (sentimentLexicon.negative[token]) {
          sentenceScore += sentimentLexicon.negative[token];
          foundSentimentWords++;
        }
      });
      
      if (foundSentimentWords > 0) {
        sentimentScore += sentenceScore / foundSentimentWords;
        sentimentCount++;
      }
    });

    // Analyze emotional patterns with context
    Object.entries(this.emotionalPatterns).forEach(([emotion, { patterns, weight, context }]) => {
      const matches: string[] = [];
      let intensity = 0;
      
      patterns.forEach(pattern => {
        if (tokens.some(token => token.includes(pattern)) || content.toLowerCase().includes(pattern)) {
          matches.push(pattern);
          intensity += 0.3;
        }
      });
      
      context.forEach(contextPhrase => {
        if (content.toLowerCase().includes(contextPhrase)) {
          matches.push(contextPhrase);
          intensity += 0.5;
        }
      });
      
      if (matches.length > 0) {
        const finalIntensity = Math.min(intensity * weight, 1);
        detectedEmotions.push({
          emotion,
          intensity: finalIntensity,
          context: matches
        });
      }
    });

    // Calculate final sentiment metrics
    const normalizedScore = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;
    const finalScore = Math.max(-1, Math.min(1, normalizedScore));
    const magnitude = Math.abs(finalScore);
    
    let polarity: 'positive' | 'negative' | 'neutral';
    if (finalScore > 0.15) polarity = 'positive';
    else if (finalScore < -0.15) polarity = 'negative';
    else polarity = 'neutral';
    
    const confidence = Math.min(magnitude + (sentimentCount / sentences.length) * 0.5, 1);
    
    // Determine sentiment nuance based on dominant emotions
    let nuance = 'balanced';
    if (detectedEmotions.length > 0) {
      const strongestEmotion = detectedEmotions.reduce((a, b) => a.intensity > b.intensity ? a : b);
      if (strongestEmotion.intensity > 0.6) {
        nuance = strongestEmotion.emotion;
      } else if (detectedEmotions.length > 2) {
        nuance = 'complex';
      }
    }

    return {
      score: finalScore,
      polarity,
      confidence,
      emotions: detectedEmotions.sort((a, b) => b.intensity - a.intensity),
      nuance,
      magnitude
    };
  }

  // Generate semantic similarity matrix using TF-IDF
  generateSimilarityMatrix(thoughts: Thought[]): number[][] {
  
    const documents = thoughts.map(thought => this.processor.tokenize(thought.content));
    this.tfidf.addDocuments(documents);
    
    const vectors = documents.map(doc => this.tfidf.getVector(doc));
    const matrix: number[][] = [];
    let maxSimilarity = 0;
    let avgSimilarity = 0;
    let totalComparisons = 0;
    
    for (let i = 0; i < thoughts.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < thoughts.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const similarity = this.tfidf.cosineSimilarity(vectors[i], vectors[j]);
          matrix[i][j] = similarity;
          
          if (similarity > maxSimilarity) maxSimilarity = similarity;
          avgSimilarity += similarity;
          totalComparisons++;
        }
      }
    }
    
    avgSimilarity = avgSimilarity / totalComparisons;

    
    return matrix;
  }
}

// Advanced clustering with hierarchical approach
class AdvancedClusterer {
  private semanticAnalyzer = new SemanticAnalyzer();
  
  clusterThoughts(thoughts: Thought[], minClusterSize: number = 2, maxClusters: number = 8): Cluster[] {
    if (thoughts.length < minClusterSize) return [];
    
  
    
    // Try multiple clustering strategies and pick the best one
    const strategies = [
      { name: 'content-based', clusters: this.clusterByContent(thoughts, minClusterSize) },
      { name: 'time-based', clusters: this.clusterByTime(thoughts, minClusterSize) },
      { name: 'emotion-based', clusters: this.clusterByEmotion(thoughts, minClusterSize) },
      { name: 'hybrid', clusters: this.clusterHybrid(thoughts, minClusterSize) }
    ];
    
    // Score each strategy and pick the best
    const bestStrategy = strategies.reduce((best: {name: string, clusters: number[][], score: number}, current) => {
      const score = this.scoreClusteringQuality(current.clusters, thoughts);
      return score > best.score ? { ...current, score } : best;
    }, { name: '', clusters: [] as number[][], score: 0 });
    
    const enrichedClusters = bestStrategy.clusters
      .slice(0, maxClusters)
      .map(cluster => this.enrichCluster(cluster, thoughts));
    
    return enrichedClusters;
  }

  private performHierarchicalClustering(
    thoughts: Thought[], 
    similarityMatrix: number[][], 
    minClusterSize: number
  ): number[][] {
    const clusters: number[][] = thoughts.map((_, i) => [i]);
    let threshold = 0.25; // Very lenient threshold for content-based clustering
    
    while (clusters.length > 1) {
      let maxSimilarity = -1;
      let mergeIndices: [number, number] = [0, 1];
      
      // Find most similar clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const similarity = this.calculateClusterSimilarity(
            clusters[i], 
            clusters[j], 
            similarityMatrix
          );
          
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mergeIndices = [i, j];
          }
        }
      }
      
      // Stop if similarity is too low
      if (maxSimilarity < threshold) {
        break;
      }
      
      // Merge clusters
      const [i, j] = mergeIndices;
      const mergedCluster = [...clusters[i], ...clusters[j]];
      clusters.splice(j, 1);
      clusters.splice(i, 1);
      clusters.push(mergedCluster);
    }
    
    const finalClusters = clusters.filter(cluster => cluster.length >= minClusterSize);
    
    // If no clusters meet the size requirement, create category-based clusters as fallback
    if (finalClusters.length === 0) {
      return this.createCategoryBasedClusters(thoughts, minClusterSize);
    }
    
    return finalClusters;
  }

  private calculateClusterSimilarity(
    cluster1: number[], 
    cluster2: number[], 
    similarityMatrix: number[][]
  ): number {
    let totalSimilarity = 0;
    let count = 0;
    
    cluster1.forEach(i => {
      cluster2.forEach(j => {
        totalSimilarity += similarityMatrix[i][j];
        count++;
      });
    });
    
    return count > 0 ? totalSimilarity / count : 0;
  }

  private generateContentBasedSimilarityMatrix(thoughts: Thought[]): number[][] {
    const matrix: number[][] = [];
    
    // Extract key concepts from each thought
    const thoughtConcepts = thoughts.map(thought => this.extractThoughtConcepts(thought.content));

    let maxSimilarity = 0;
    let avgSimilarity = 0;
    let totalComparisons = 0;
    
    for (let i = 0; i < thoughts.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < thoughts.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const similarity = this.calculateContentSimilarity(
            thoughts[i].content, 
            thoughts[j].content,
            thoughtConcepts[i],
            thoughtConcepts[j]
          );
          matrix[i][j] = similarity;
          
          if (similarity > maxSimilarity) maxSimilarity = similarity;
          avgSimilarity += similarity;
          totalComparisons++;
        }
      }
    }

    avgSimilarity = avgSimilarity / totalComparisons;
    
    return matrix;
  }

  private extractThoughtConcepts(content: string): string[] {
    const text = content.toLowerCase();
    
    // Key concept patterns for thoughts
    const conceptPatterns = [
      // Tech/Development
      /\b(app|application|extension|browser|chrome|website|software|code|api|platform|tool)\b/g,
      // Emotions/Feelings
      /\b(anxious|worried|overwhelm|stress|fear|excited|happy|sad|nervous|confident)\b/g,
      // Actions/Activities
      /\b(build|create|develop|design|implement|record|transcribe|meeting|presentation)\b/g,
      // Work/Projects
      /\b(project|work|task|job|deadline|client|team|business)\b/g,
      // Personal/Life
      /\b(life|personal|home|family|friend|relationship|health|habit)\b/g,
      // Learning/Growth
      /\b(learn|study|read|research|understand|improve|practice|skill)\b/g,
      // Food/Lifestyle
      /\b(coffee|food|eat|drink|taste|recipe|cooking|meal)\b/g,
    ];

    const concepts: string[] = [];
    
    // Extract pattern-based concepts
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    });

    // Extract important keywords (nouns, verbs, adjectives)
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const importantWords = words.filter(word => 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );

    concepts.push(...importantWords);
    
    // Remove duplicates and return unique concepts
    return [...new Set(concepts)];
  }

  private calculateContentSimilarity(
    content1: string, 
    content2: string, 
    concepts1: string[], 
    concepts2: string[]
  ): number {
    let similarity = 0;
    
    // 1. Concept overlap (strongest signal)
    const commonConcepts = concepts1.filter(c => concepts2.includes(c));
    const conceptScore = commonConcepts.length / Math.max(concepts1.length, concepts2.length, 1);
    similarity += conceptScore * 0.6;
    
    // 2. Word overlap
    const words1 = new Set(content1.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const words2 = new Set(content2.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const commonWords = [...words1].filter(w => words2.has(w));
    const wordScore = commonWords.length / Math.max(words1.size, words2.size, 1);
    similarity += wordScore * 0.3;
    
    // 3. Semantic theme detection
    const themeScore = this.calculateThemesSimilarity(content1, content2);
    similarity += themeScore * 0.1;
    
    return Math.min(similarity, 1.0);
  }

  private calculateThemesSimilarity(content1: string, content2: string): number {
    const themes = {
      technology: /\b(app|tech|software|code|digital|online|web|api|platform|extension|browser)\b/gi,
      anxiety: /\b(worry|anxious|stress|overwhelm|nervous|fear|panic|concern)\b/gi,
      creativity: /\b(idea|create|design|build|concept|innovative|think|imagine)\b/gi,
      work: /\b(project|work|job|business|meeting|deadline|client|professional)\b/gi,
      personal: /\b(feel|emotion|life|personal|experience|myself|thinking|believe)\b/gi,
      learning: /\b(learn|understand|study|research|knowledge|skill|improve)\b/gi,
      lifestyle: /\b(daily|habit|routine|food|coffee|taste|home|life)\b/gi
    };

    let commonThemes = 0;
    let totalThemes = 0;

    Object.values(themes).forEach(pattern => {
      const in1 = pattern.test(content1);
      const in2 = pattern.test(content2);
      
      if (in1 || in2) totalThemes++;
      if (in1 && in2) commonThemes++;
    });

    return totalThemes > 0 ? commonThemes / totalThemes : 0;
  }

  // Multiple clustering strategies
  private clusterByContent(thoughts: Thought[], minClusterSize: number): number[][] {
    const similarityMatrix = this.generateContentBasedSimilarityMatrix(thoughts);
    return this.performHierarchicalClustering(thoughts, similarityMatrix, minClusterSize);
  }

  private clusterByTime(thoughts: Thought[], minClusterSize: number): number[][] {
    const clusters: number[][] = [];
    const timeGroups = new Map<string, number[]>();
    
    thoughts.forEach((thought, index) => {
      const date = new Date(thought.createdAt);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!timeGroups.has(dayKey)) {
        timeGroups.set(dayKey, []);
      }
      timeGroups.get(dayKey)!.push(index);
    });
    
    return Array.from(timeGroups.values())
      .filter(group => group.length >= minClusterSize);
  }

  private clusterByEmotion(thoughts: Thought[], minClusterSize: number): number[][] {
    const clusters: number[][] = [];
    const emotionGroups = new Map<string, number[]>();
    
    thoughts.forEach((thought, index) => {
      const sentiment = this.semanticAnalyzer.analyzeSentimentAdvanced(thought.content);
      let emotionKey = 'neutral';
      
      if (sentiment.score > 0.3) emotionKey = 'positive';
      else if (sentiment.score < -0.3) emotionKey = 'negative';
      else if (sentiment.magnitude > 0.6) emotionKey = 'intense';
      
      // Also group by dominant emotion
      if (sentiment.emotions.length > 0) {
        const dominantEmotion = sentiment.emotions[0].emotion;
        emotionKey = `${emotionKey}-${dominantEmotion}`;
      }
      
      if (!emotionGroups.has(emotionKey)) {
        emotionGroups.set(emotionKey, []);
      }
      emotionGroups.get(emotionKey)!.push(index);
    });
    
    return Array.from(emotionGroups.values())
      .filter(group => group.length >= minClusterSize);
  }

  private clusterHybrid(thoughts: Thought[], minClusterSize: number): number[][] {
    // Combine multiple strategies
    
    // Start with content-based clustering
    const contentClusters = this.clusterByContent(thoughts, Math.max(2, minClusterSize - 1));
    
    // If we don't get enough clusters, try emotion-based
    if (contentClusters.length < 2) {
      const emotionClusters = this.clusterByEmotion(thoughts, Math.max(2, minClusterSize - 1));
      if (emotionClusters.length > 0) return emotionClusters;
    }
    
    // If we still don't have enough, try time-based
    if (contentClusters.length < 2) {
      return this.clusterByTime(thoughts, Math.max(2, minClusterSize - 1));
    }
    
    return contentClusters;
  }

  private scoreClusteringQuality(clusters: number[][], thoughts: Thought[]): number {
    if (clusters.length === 0) return 0;
    
    let score = 0;
    
    // Factor 1: Number of clusters (prefer 2-6 clusters)
    const clusterCountScore = clusters.length >= 2 && clusters.length <= 6 ? 1 : 
                             clusters.length > 6 ? 0.5 : 0.3;
    score += clusterCountScore * 0.3;
    
    // Factor 2: Cluster size distribution (prefer balanced clusters)
    const sizes = clusters.map(c => c.length);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const sizeVariance = sizes.reduce((acc, size) => acc + Math.pow(size - avgSize, 2), 0) / sizes.length;
    const balanceScore = Math.max(0, 1 - sizeVariance / (avgSize * avgSize));
    score += balanceScore * 0.3;
    
    // Factor 3: Coverage (how many thoughts are clustered)
    const clusteredThoughts = clusters.reduce((acc, cluster) => acc + cluster.length, 0);
    const coverageScore = clusteredThoughts / thoughts.length;
    score += coverageScore * 0.4;
    
    return score;
  }

  private createCategoryBasedClusters(thoughts: Thought[], minClusterSize: number): number[][] {
    const categoryGroups = new Map<ThoughtCategory, number[]>();
    
    thoughts.forEach((thought, index) => {
      if (!categoryGroups.has(thought.category)) {
        categoryGroups.set(thought.category, []);
      }
      categoryGroups.get(thought.category)!.push(index);
    });
    
    const validClusters = Array.from(categoryGroups.values())
      .filter(cluster => cluster.length >= minClusterSize);

    return validClusters;
  }

  private enrichCluster(thoughtIndices: number[], allThoughts: Thought[]): Cluster {
    const clusterThoughts = thoughtIndices.map(i => allThoughts[i]);
    const name = this.generateIntelligentClusterName(clusterThoughts);
    const keywords = this.extractKeywords(clusterThoughts);
    const description = this.generateDescription(clusterThoughts);
    
    return {
      id: `advanced_cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      thoughtIds: clusterThoughts.map(t => t.id),
      createdAt: new Date(),
      keywords,
      description
    };
  }

  private generateIntelligentClusterName(thoughts: Thought[]): string {
    const processor = new TextProcessor();
    const allText = thoughts.map(t => t.content).join(' ');
    const tokens = processor.tokenize(allText);
    const phrases = processor.extractPhrases(allText);
    
    // Advanced term scoring with TF-IDF-like approach
    const termScores: Map<string, number> = new Map();
    
    // Score tokens by frequency and significance
    const tokenCounts: Map<string, number> = new Map();
    tokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
    
    tokenCounts.forEach((count, token) => {
      if (count >= 2 && token.length > 3) {
        // Score based on frequency, length, and rarity
        const rarity = Math.log(tokens.length / count);
        termScores.set(token, count * token.length * rarity * 0.8);
      }
    });
    
    // Score phrases (higher weight for multi-word concepts)
    const phraseCounts: Map<string, number> = new Map();
    phrases.forEach(phrase => {
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    });
    
    phraseCounts.forEach((count, phrase) => {
      if (count >= 2) {
        const words = phrase.split(' ');
        termScores.set(phrase, count * words.length * 3);
      }
    });
    
    // Get the best terms
    const sortedTerms = Array.from(termScores.entries())
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([term]) => term);
    
    if (sortedTerms.length > 0) {
      return sortedTerms
        .map(term => term.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
        .join(' & ');
    }
    
    // Fallback to emotion-based naming
    const analyzer = new SemanticAnalyzer();
    const sentiments = thoughts.map(t => analyzer.analyzeSentimentAdvanced(t.content));
    
    const dominantEmotion = sentiments
      .flatMap(s => s.emotions)
      .reduce((acc, emotion) => {
        acc[emotion.emotion] = (acc[emotion.emotion] || 0) + emotion.intensity;
        return acc;
      }, {} as Record<string, number>);
    
    const topEmotion = Object.entries(dominantEmotion)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];
    
    if (topEmotion && topEmotion[1] > 1) {
      return `${topEmotion[0].charAt(0).toUpperCase() + topEmotion[0].slice(1)} Thoughts`;
    }
    
    // Category-based fallback
    const categories = thoughts.map(t => t.category);
    const mostCommonCategory = categories.reduce((a, b, _, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );
    
    return `${mostCommonCategory.charAt(0).toUpperCase() + mostCommonCategory.slice(1)} Collection`;
  }

  private extractKeywords(thoughts: Thought[]): string[] {
    const processor = new TextProcessor();
    const allTokens = thoughts.flatMap(t => processor.tokenize(t.content));
    
    const tokenCounts: Map<string, number> = new Map();
    allTokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
    
    return Array.from(tokenCounts.entries())
      .filter(([token, count]) => count >= 2 && token.length > 3)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([token]) => token);
  }

  private generateDescription(thoughts: Thought[]): string {
    const count = thoughts.length;
    const analyzer = new SemanticAnalyzer();
    
    const sentiments = thoughts.map(t => analyzer.analyzeSentimentAdvanced(t.content));
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const avgMagnitude = sentiments.reduce((sum, s) => sum + s.magnitude, 0) / sentiments.length;
    
    let emotionalTone = 'neutral';
    if (avgSentiment > 0.3) emotionalTone = 'positive';
    else if (avgSentiment < -0.3) emotionalTone = 'concerning';
    else if (avgMagnitude > 0.6) emotionalTone = 'emotionally intense';
    
    const categories = thoughts.map(t => t.category);
    const categoryDistribution = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantCategories = Object.entries(categoryDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([cat]) => cat);
    
    return `A group of ${count} thoughts primarily about ${dominantCategories.join(' and ')} with a ${emotionalTone} tone. These thoughts were clustered based on semantic similarity and shared themes.`;
  }
}

// Export enhanced functions
const processor = new TextProcessor();
const semanticAnalyzer = new SemanticAnalyzer();
const clusterer = new AdvancedClusterer();

export const categorizeThoughtAdvanced = (content: string): ThoughtCategory => {
  return semanticAnalyzer.categorizeThoughtAdvanced(content).category;
};

export const analyzeAdvancedSentiment = (content: string) => {
  return semanticAnalyzer.analyzeSentimentAdvanced(content);
};

export const generateAdvancedClusters = (thoughts: Thought[]): Cluster[] => {
  const clusters = clusterer.clusterThoughts(thoughts);
  return clusters;
};

export const advancedFuzzySearch = (query: string, thoughts: Thought[]): Thought[] => {
  if (!query.trim() || thoughts.length === 0) return [];
  
  const queryThought: Thought = {
    id: 'query',
    content: query,
    category: 'idea',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const allForAnalysis = [queryThought, ...thoughts];
  const similarityMatrix = semanticAnalyzer.generateSimilarityMatrix(allForAnalysis);
  
  const results = thoughts.map((thought, index) => ({
    thought,
    similarity: similarityMatrix[0][index + 1]
  }));
  
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .filter(item => item.similarity > 0.1)
    .map(item => item.thought);
};

export const findRelatedThoughts = (targetThought: Thought, allThoughts: Thought[], limit: number = 5): Thought[] => {
  const otherThoughts = allThoughts.filter(t => t.id !== targetThought.id);
  if (otherThoughts.length === 0) return [];
  
  const allForAnalysis = [targetThought, ...otherThoughts];
  const similarityMatrix = semanticAnalyzer.generateSimilarityMatrix(allForAnalysis);
  
  const similarities = otherThoughts.map((thought, index) => ({
    thought,
    similarity: similarityMatrix[0][index + 1]
  }));
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .filter(item => item.similarity > 0.2)
    .map(item => item.thought);
};

export const generateAdvancedWeeklyRecap = (thoughts: Thought[]): WeeklyRecap | null => {
  if (thoughts.length === 0) return null;
  
  const weekThoughts = thoughts.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.createdAt) >= weekAgo;
  });
  
  if (weekThoughts.length === 0) return null;
  
  const clusters = clusterer.clusterThoughts(weekThoughts);
  const sentiments = weekThoughts.map(t => semanticAnalyzer.analyzeSentimentAdvanced(t.content));
  const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  
  const categoryDistribution = weekThoughts.reduce((acc, thought) => {
    acc[thought.category] = (acc[thought.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const themes = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([category]) => category);
  
  const insights = [];
  if (avgSentiment > 0.3) insights.push("Your thoughts this week show a positive outlook");
  if (avgSentiment < -0.3) insights.push("This week's thoughts suggest some challenges");
  if (clusters.length > 3) insights.push("You've been thinking about diverse topics");
  
     return {
     weekStarting: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
     topThemes: themes,
     thoughtCount: weekThoughts.length,
     categoryBreakdown: categoryDistribution as Record<ThoughtCategory, number>,
     suggestedRevisit: weekThoughts.length > 0 ? weekThoughts[0] : null,
     averageSentiment: avgSentiment,
     emotionalInsights: insights
   };
};