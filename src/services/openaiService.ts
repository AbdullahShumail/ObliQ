import { Idea, AISuggestion, RemixVariant, MaturityAnalysis, IdeaCategory } from '../types';

export class OpenAIService {
  private static readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'demo-key';
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';

  static async processIdeaWithAI(rawInput: string): Promise<{
    structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions: AISuggestion[];
  }> {
    try {
      const prompt = `
        Analyze this idea and provide structured feedback: "${rawInput}"
        
        Please respond with a JSON object containing:
        1. title: A catchy, concise title (max 60 chars)
        2. description: Enhanced description with more detail
        3. category: One of [tech, business, social, education, health, entertainment, other]
        4. tags: Array of 3-5 relevant tags
        5. painPoints: Array of 2-4 problems this solves
        6. features: Array of 3-5 key features
        7. userPersonas: Array of 2-3 target user types
        8. suggestions: Array of 3-4 improvement suggestions
        
        Focus on making the idea more actionable and well-defined.
      `;

      // In a real implementation, you would call OpenAI API here
      // For demo purposes, we'll use intelligent parsing
      const structuredIdea = this.parseIdeaIntelligently(rawInput);
      const suggestions = this.generateImprovementSuggestions(structuredIdea);

      return { structuredIdea, suggestions };
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to local processing
      return this.fallbackProcessing(rawInput);
    }
  }

  static async generateImprovementSuggestions(idea: Partial<Idea>): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze what's missing and suggest improvements
    if (!idea.painPoints || idea.painPoints.length < 2) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: 'Define specific pain points: What exact problems does your idea solve? Who experiences these problems daily?',
        applied: false,
        createdAt: new Date()
      });
    }

    if (!idea.userPersonas || idea.userPersonas.length < 2) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: 'Create detailed user personas: Age, occupation, goals, frustrations, and how they currently solve this problem.',
        applied: false,
        createdAt: new Date()
      });
    }

    if (!idea.features || idea.features.length < 3) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'expansion',
        content: 'Expand on core features: What are the 3-5 essential features that make your solution unique?',
        applied: false,
        createdAt: new Date()
      });
    }

    // Add strategic suggestions
    suggestions.push({
      id: crypto.randomUUID(),
      type: 'maturity',
      content: 'Consider your MVP: What\'s the simplest version that still solves the core problem?',
      applied: false,
      createdAt: new Date()
    });

    suggestions.push({
      id: crypto.randomUUID(),
      type: 'expansion',
      content: 'Think about monetization: How will this idea generate revenue or create value?',
      applied: false,
      createdAt: new Date()
    });

    return suggestions;
  }

  static async generateRemixVariants(idea: Idea): Promise<RemixVariant[]> {
    const variants: RemixVariant[] = [];

    // Generate different market approaches
    variants.push({
      id: crypto.randomUUID(),
      title: `${idea.title} for Enterprise`,
      description: `B2B version with advanced analytics, team collaboration, compliance features, and enterprise integrations.`,
      targetAudience: 'Enterprise teams and organizations',
      twist: 'Professional-grade with enterprise security',
      category: 'business'
    });

    variants.push({
      id: crypto.randomUUID(),
      title: `Mobile-First ${idea.title}`,
      description: `Reimagined as a mobile-native experience with offline capabilities, push notifications, and location-based features.`,
      targetAudience: 'Mobile-first users',
      twist: 'Mobile-native with offline functionality',
      category: idea.category
    });

    variants.push({
      id: crypto.randomUUID(),
      title: `AI-Powered ${idea.title}`,
      description: `Enhanced with machine learning for personalization, predictive analytics, and automated recommendations.`,
      targetAudience: 'Tech-savvy users seeking automation',
      twist: 'AI-driven personalization and automation',
      category: 'tech'
    });

    variants.push({
      id: crypto.randomUUID(),
      title: `Community-Driven ${idea.title}`,
      description: `Social version with user-generated content, peer reviews, community challenges, and collaborative features.`,
      targetAudience: 'Community-oriented users',
      twist: 'Social features and community engagement',
      category: 'social'
    });

    return variants;
  }

  static async analyzeIdeaMaturity(idea: Idea): Promise<MaturityAnalysis> {
    let score = 0;
    const strengths: string[] = [];
    const gaps: string[] = [];

    // Analyze completeness
    if (idea.title && idea.title.length > 5) {
      score += 10;
      strengths.push('Clear and descriptive title');
    } else {
      gaps.push('Needs a more descriptive title');
    }

    if (idea.description && idea.description.length > 50) {
      score += 15;
      strengths.push('Detailed description provided');
    } else {
      gaps.push('Description needs more detail');
    }

    if (idea.painPoints && idea.painPoints.length >= 2) {
      score += 20;
      strengths.push('Problem identification is clear');
    } else {
      gaps.push('Need to identify more specific pain points');
    }

    if (idea.features && idea.features.length >= 3) {
      score += 20;
      strengths.push('Core features are defined');
    } else {
      gaps.push('Need to define more key features');
    }

    if (idea.userPersonas && idea.userPersonas.length >= 2) {
      score += 20;
      strengths.push('Target users are identified');
    } else {
      gaps.push('Need to define target user personas');
    }

    if (idea.tags && idea.tags.length >= 3) {
      score += 10;
      strengths.push('Well-categorized with relevant tags');
    } else {
      gaps.push('Add more descriptive tags');
    }

    // Bonus points for advanced thinking
    if (idea.existingProducts && idea.existingProducts.length > 0) {
      score += 5;
      strengths.push('Market research conducted');
    }

    const nextSteps = [
      'Validate assumptions with potential users',
      'Create wireframes or mockups',
      'Research competitive landscape thoroughly',
      'Define success metrics and KPIs',
      'Estimate development timeline and costs',
      'Consider technical feasibility',
      'Plan go-to-market strategy'
    ];

    return {
      score: Math.min(score, 100),
      strengths,
      gaps,
      nextSteps: nextSteps.slice(0, 5),
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
      }
    };
  }

  private static parseIdeaIntelligently(input: string): Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> {
    const text = input.toLowerCase();
    
    // Smart categorization
    const category = this.categorizeIdea(text);
    
    // Extract title (first meaningful phrase or sentence)
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const title = sentences[0]?.trim().slice(0, 60) || 'Innovative Idea';
    
    // Enhanced description
    const description = input.length > 100 ? input : this.expandDescription(input, category);
    
    // Generate intelligent tags
    const tags = this.generateSmartTags(text, category);
    
    // Extract pain points
    const painPoints = this.extractPainPoints(input);
    
    // Extract features
    const features = this.extractFeatures(input);
    
    // Extract user personas
    const userPersonas = this.extractUserPersonas(input);
    
    return {
      title,
      description,
      category,
      tags,
      painPoints,
      features,
      userPersonas,
      maturityScore: this.calculateInitialMaturity(input),
      existingProducts: [],
      developmentStage: 'raw',
      isStarred: false
    };
  }

  private static categorizeIdea(text: string): IdeaCategory {
    const categoryKeywords = {
      tech: ['app', 'software', 'ai', 'algorithm', 'code', 'platform', 'api', 'database', 'cloud', 'automation'],
      business: ['startup', 'revenue', 'profit', 'market', 'customer', 'sales', 'business model', 'monetize'],
      social: ['community', 'social', 'connect', 'share', 'network', 'friends', 'collaboration', 'communication'],
      education: ['learn', 'teach', 'education', 'course', 'training', 'skill', 'knowledge', 'study'],
      health: ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition', 'mental health', 'therapy'],
      entertainment: ['game', 'fun', 'entertainment', 'music', 'video', 'streaming', 'content', 'media']
    };

    let maxScore = 0;
    let bestCategory: IdeaCategory = 'other';

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category as IdeaCategory;
      }
    });

    return bestCategory;
  }

  private static expandDescription(input: string, category: IdeaCategory): string {
    const expansions = {
      tech: 'This technology solution aims to leverage modern tools and platforms to create an innovative user experience.',
      business: 'This business concept focuses on creating value for customers while establishing a sustainable revenue model.',
      social: 'This social initiative seeks to bring people together and foster meaningful connections within communities.',
      education: 'This educational approach aims to enhance learning outcomes through innovative teaching methods and tools.',
      health: 'This health-focused solution prioritizes user wellbeing and aims to improve quality of life.',
      entertainment: 'This entertainment concept focuses on engaging users through creative and enjoyable experiences.',
      other: 'This innovative concept addresses important needs and has the potential to create significant impact.'
    };

    return input.length < 50 ? `${input}. ${expansions[category]}` : input;
  }

  private static generateSmartTags(text: string, category: IdeaCategory): string[] {
    const baseTags = [category];
    
    const tagMappings = {
      'mobile': ['mobile', 'app', 'smartphone'],
      'web': ['website', 'web', 'browser', 'online'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'smart'],
      'automation': ['automate', 'automatic', 'streamline'],
      'social': ['social', 'community', 'sharing'],
      'productivity': ['productivity', 'efficient', 'organize', 'workflow'],
      'analytics': ['data', 'analytics', 'insights', 'metrics'],
      'marketplace': ['marketplace', 'platform', 'connect buyers'],
      'subscription': ['subscription', 'recurring', 'monthly'],
      'freemium': ['free', 'premium', 'upgrade']
    };

    Object.entries(tagMappings).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword)) && !baseTags.includes(tag)) {
        baseTags.push(tag);
      }
    });

    return baseTags.slice(0, 5);
  }

  private static extractPainPoints(input: string): string[] {
    const painIndicators = [
      'problem', 'issue', 'difficult', 'hard', 'frustrating', 'annoying', 
      'time-consuming', 'expensive', 'inefficient', 'lacking', 'missing'
    ];

    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const painPoints = sentences.filter(sentence => 
      painIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );

    // Add generic pain points if none found
    if (painPoints.length === 0) {
      return [
        'Current solutions are inadequate or non-existent',
        'Users waste time with inefficient processes',
        'There\'s a gap in the market for this solution'
      ];
    }

    return painPoints.slice(0, 4);
  }

  private static extractFeatures(input: string): string[] {
    const featureIndicators = [
      'feature', 'function', 'capability', 'allow', 'enable', 'provide',
      'include', 'offer', 'support', 'integrate', 'automate'
    ];

    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const features = sentences.filter(sentence => 
      featureIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );

    // Add generic features if none found
    if (features.length === 0) {
      return [
        'User-friendly interface',
        'Core functionality for main use case',
        'Integration with existing tools',
        'Mobile and web accessibility'
      ];
    }

    return features.slice(0, 5);
  }

  private static extractUserPersonas(input: string): string[] {
    const userIndicators = [
      'user', 'customer', 'people', 'individual', 'person', 'student',
      'professional', 'business', 'company', 'organization', 'team'
    ];

    const text = input.toLowerCase();
    const personas: string[] = [];

    if (text.includes('student') || text.includes('learn')) {
      personas.push('Students and learners');
    }
    if (text.includes('business') || text.includes('professional')) {
      personas.push('Business professionals');
    }
    if (text.includes('team') || text.includes('organization')) {
      personas.push('Teams and organizations');
    }
    if (text.includes('individual') || text.includes('personal')) {
      personas.push('Individual users');
    }

    // Default personas if none found
    if (personas.length === 0) {
      return ['Primary target users', 'Secondary market segment'];
    }

    return personas.slice(0, 3);
  }

  private static calculateInitialMaturity(input: string): number {
    let score = 20; // Base score

    if (input.length > 100) score += 15;
    if (input.includes('problem') || input.includes('solve')) score += 20;
    if (input.includes('user') || input.includes('customer')) score += 15;
    if (input.includes('feature') || input.includes('function')) score += 15;
    if (input.split(' ').length > 50) score += 15;

    return Math.min(score, 100);
  }

  private static fallbackProcessing(rawInput: string): {
    structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions: AISuggestion[];
  } {
    const structuredIdea = this.parseIdeaIntelligently(rawInput);
    const suggestions = [
      {
        id: crypto.randomUUID(),
        type: 'structure' as const,
        content: 'Consider defining specific user personas who would benefit from this idea.',
        applied: false,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        type: 'expansion' as const,
        content: 'What would be the minimum viable product (MVP) for this idea?',
        applied: false,
        createdAt: new Date()
      }
    ];

    return { structuredIdea, suggestions };
  }
}