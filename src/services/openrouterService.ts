/// <reference types="vite/client" />
import { Idea, AISuggestion, RemixVariant, MaturityAnalysis, IdeaCategory, MarketPotential, FeasibilityScore, ActionableRecommendations, RecommendationItem, Milestone } from '../types';

interface ExpandedIdea {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  marketAngle: string;
  tags: string[];
}

export class OpenRouterService {
  private static readonly API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b:free';
  private static readonly SITE_URL = import.meta.env.VITE_SITE_URL || 'https://splendorous-marzipan-f11cb4.netlify.app';
  private static readonly SITE_NAME = import.meta.env.VITE_SITE_NAME || 'AI Idea Board';

  // BALANCED validation - harsh on nonsense, fair to legitimate ideas
  private static validateIdeaQuality(input: string): {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
    isNonsensical: boolean;
    isLegitimate: boolean;
  } {
    const issues: string[] = [];
    let qualityScore = 50; // Start at neutral
    let isNonsensical = false;
    let isLegitimate = false;
    
    const text = input.toLowerCase().trim();
    
    // STEP 1: Check for OBVIOUSLY nonsensical business models (these get 3-15%)
    const nonsensicalPatterns = [
      // Financial suicide patterns
      /buy.*high.*sell.*low/,
      /purchase.*expensive.*sell.*cheap/,
      /lose.*money.*intentionally/,
      /guaranteed.*loss/,
      /negative.*profit.*always/,
      /burn.*money.*purpose/,
      
      // Logical impossibilities
      /free.*everything.*forever/,
      /infinite.*money.*no.*work/,
      /time.*travel.*business/,
      /perpetual.*motion.*machine/,
      
      // Pure gibberish
      /(.)\1{6,}/, // 6+ repeated characters
      /qwerty.*asdf.*zxcv/,
      /123456789.*abcdefgh/,
      /random.*gibberish.*test.*test/
    ];
    
    // Check for nonsensical patterns
    if (nonsensicalPatterns.some(pattern => pattern.test(text))) {
      isNonsensical = true;
      issues.push('This appears to be a fundamentally flawed or nonsensical business concept');
      qualityScore = Math.floor(Math.random() * 13) + 3; // 3-15%
      return { isValid: false, issues, qualityScore, isNonsensical, isLegitimate };
    }
    
    // STEP 2: Check for LEGITIMATE business ideas (these should score well)
    const legitimateBusinessPatterns = [
      // Traditional businesses
      /start.*(?:restaurant|bakery|cafe|shop|store|salon|gym|clinic)/,
      /open.*(?:restaurant|bakery|cafe|shop|store|salon|gym|clinic)/,
      /(?:restaurant|bakery|cafe|shop|store|salon|gym|clinic).*business/,
      
      // Service businesses
      /consulting.*service/,
      /cleaning.*service/,
      /delivery.*service/,
      /tutoring.*service/,
      /repair.*service/,
      
      // Tech businesses with clear purpose
      /app.*(?:help|solve|manage|organize|connect)/,
      /platform.*(?:help|solve|manage|organize|connect)/,
      /website.*(?:help|solve|manage|organize|connect)/,
      /software.*(?:help|solve|manage|organize|connect)/,
      
      // E-commerce
      /online.*(?:store|shop|marketplace)/,
      /sell.*(?:products|services).*online/,
      /e-commerce.*(?:platform|store)/,
      
      // Educational
      /online.*(?:course|training|education)/,
      /teach.*(?:people|students|professionals)/,
      /learning.*platform/
    ];
    
    // Check for legitimate business patterns
    if (legitimateBusinessPatterns.some(pattern => pattern.test(text))) {
      isLegitimate = true;
      qualityScore += 20; // Boost legitimate businesses
    }
    
    // STEP 3: Check for specific location mentions (adds legitimacy)
    const locationPatterns = [
      /in\s+(?:islamabad|karachi|lahore|delhi|mumbai|bangalore|london|new york|dubai|singapore|toronto|sydney)/,
      /(?:islamabad|karachi|lahore|delhi|mumbai|bangalore|london|new york|dubai|singapore|toronto|sydney).*(?:area|city|market)/
    ];
    
    if (locationPatterns.some(pattern => pattern.test(text))) {
      qualityScore += 15; // Location specificity is good
      isLegitimate = true;
    }
    
    // STEP 4: Basic quality checks
    if (text.length < 10) {
      issues.push('Idea is too short and lacks detail');
      qualityScore -= 25;
    } else if (text.length > 30) {
      qualityScore += 10; // Reward detail
    }
    
    // Check for coherent sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 1 && sentences[0].split(' ').length >= 4) {
      qualityScore += 10; // Coherent structure
    }
    
    // STEP 5: Check for business fundamentals
    const businessIndicators = [
      'customer', 'market', 'sell', 'buy', 'service', 'product', 
      'revenue', 'profit', 'business', 'startup', 'company',
      'people', 'help', 'solve', 'need', 'want', 'provide'
    ];
    
    const hasBusinessContext = businessIndicators.some(word => text.includes(word));
    if (hasBusinessContext) {
      qualityScore += 10;
    }
    
    // STEP 6: Problem/solution coherence
    const problemWords = ['problem', 'issue', 'difficult', 'hard', 'frustrating', 'need', 'want', 'lack'];
    const solutionWords = ['solve', 'help', 'provide', 'offer', 'create', 'build', 'make'];
    
    const hasProblem = problemWords.some(word => text.includes(word));
    const hasSolution = solutionWords.some(word => text.includes(word));
    
    if (hasProblem && hasSolution) {
      qualityScore += 15; // Problem-solution fit
    }
    
    // STEP 7: Check for gibberish (but be less aggressive)
    const words = text.split(/\s+/);
    const avgWordLength = text.replace(/\s/g, '').length / words.length;
    const hasExcessiveRepeats = /(.)\1{5,}/.test(text); // 5+ repeats (less strict)
    
    if (hasExcessiveRepeats || avgWordLength < 2) {
      issues.push('Input appears to contain gibberish');
      qualityScore -= 30;
      if (avgWordLength < 1.5) {
        isNonsensical = true;
        qualityScore = 8;
      }
    }
    
    // STEP 8: Final scoring adjustments
    
    // Boost legitimate businesses significantly
    if (isLegitimate && !isNonsensical) {
      qualityScore = Math.max(qualityScore, 55); // Minimum 55% for legitimate businesses
      if (text.includes('bakery') || text.includes('restaurant') || text.includes('cafe')) {
        qualityScore = Math.max(qualityScore, 65); // Food businesses are proven models
      }
    }
    
    // Apply bounds
    if (isNonsensical) {
      qualityScore = Math.min(qualityScore, 15);
    } else if (isLegitimate) {
      qualityScore = Math.max(55, Math.min(85, qualityScore)); // 55-85% for legitimate ideas
    } else {
      qualityScore = Math.max(15, Math.min(75, qualityScore)); // 15-75% for other ideas
    }
    
    const isValid = qualityScore >= 25 && !isNonsensical;
    
    return {
      isValid,
      issues,
      qualityScore,
      isNonsensical,
      isLegitimate
    };
  }

  private static async makeAPICall(messages: Array<{role: string, content: string}>): Promise<string> {
    try {
      if (!this.API_KEY) {
        throw new Error('OpenRouter API key is not configured. Please check your .env file.');
      }

      if (!this.API_KEY.startsWith('sk-or-v1-')) {
        throw new Error('Invalid OpenRouter API key format. It should start with "sk-or-v1-"');
      }
      
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.API_KEY}`,
          "HTTP-Referer": this.SITE_URL,
          "X-Title": this.SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": this.MODEL,
          "messages": messages,
          "temperature": 0.3, // Balanced temperature
          "max_tokens": 3000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          throw new Error(`Authentication failed (401). Please check your OpenRouter API key.`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded (429). Please wait a moment before trying again.`);
        } else {
          throw new Error(`API request failed (${response.status}): ${response.statusText}`);
        }
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      return aiResponse;
    } catch (error) {
      console.error('❌ OpenRouter API error:', error);
      throw error;
    }
  }

  static async processIdeaWithAI(rawInput: string): Promise<{
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions?: AISuggestion[];
    expandedIdeas?: ExpandedIdea[];
    isExpansion: boolean;
  }> {
    try {
      console.log('🚀 Processing idea with AI:', rawInput);
      
      // BALANCED validation
      const validation = this.validateIdeaQuality(rawInput);
      console.log('🔍 Balanced validation result:', validation);
      
      // Check if this is an expansion request
      const isExpansionRequest = rawInput.toLowerCase().includes('expand this rough idea');
      
      if (isExpansionRequest) {
        const roughIdea = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
        const roughValidation = this.validateIdeaQuality(roughIdea);
        
        if (roughValidation.isNonsensical) {
          console.warn('⚠️ Rough idea is nonsensical, using critical fallback');
          return this.fallbackProcessing(rawInput, true, roughValidation);
        }
        
        const expandedIdeas = await this.generateExpandedIdeas(roughIdea);
        return { expandedIdeas, isExpansion: true };
      } else {
        // For nonsensical ideas, skip AI and go straight to critical fallback
        if (validation.isNonsensical) {
          console.warn('🚫 Nonsensical idea detected, using critical fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }
        
        // Create balanced prompt based on idea legitimacy
        const promptTone = validation.isLegitimate 
          ? "You are a balanced business analyst. This appears to be a legitimate business idea."
          : "You are a critical but fair business analyst.";
        
        const scoringGuidance = validation.isLegitimate
          ? `
          SCORING GUIDANCE for legitimate businesses:
          - Traditional businesses (bakery, restaurant, etc.) should score 60-80%
          - Service businesses with clear market should score 55-75%
          - Well-defined tech solutions should score 50-70%
          - Only score below 40% if there are serious fundamental flaws
          `
          : `
          SCORING GUIDANCE:
          - If fundamentally flawed (like buying high/selling low), score 5-15%
          - If nonsensical or gibberish, score 5-10%
          - If mediocre with issues, score 25-45%
          - If decent with potential, score 45-65%
          - Only good, viable ideas should score 65+%
          `;
        
        const prompt = `
          ${promptTone} Analyze this idea: "${rawInput}"
          
          ${scoringGuidance}
          
          Consider these factors:
          - Is this a legitimate business concept?
          - Does it make basic business sense?
          - Is there likely market demand?
          - What are the realistic challenges?
          - Is implementation feasible?
          
          For legitimate businesses like "bakery in Islamabad" - these are proven business models and should score well (60-80%).
          For nonsensical ideas like "buy high sell low" - these should score very low (5-15%).
          
          Respond with JSON:
          {
            "title": "Professional title reflecting the business",
            "description": "Balanced description highlighting both potential and challenges",
            "category": "tech/business/social/education/health/entertainment/other",
            "tags": ["relevant", "tags"],
            "painPoints": ["real", "problems", "this", "addresses"],
            "features": ["key", "features", "or", "offerings"],
            "userPersonas": ["target", "customers"],
            "businessAssessment": {
              "legitimacy": "legitimate/questionable/nonsensical",
              "marketDemand": "high/medium/low/nonexistent",
              "competitionLevel": "low/medium/high/saturated",
              "implementationDifficulty": "low/medium/high/extreme",
              "profitabilityPotential": "high/medium/low/impossible",
              "overallViability": "excellent/good/fair/poor/terrible"
            },
            "suggestions": [
              {
                "type": "improvement",
                "content": "balanced suggestion for improvement"
              }
            ]
          }
          
          Be fair to legitimate business ideas. Be harsh only on truly nonsensical concepts.
        `;

        const response = await this.makeAPICall([
          { role: "user", content: prompt }
        ]);

        let parsedResponse;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : response;
          parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
          console.warn('⚠️ Failed to parse AI response, using balanced fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }

        // BALANCED scoring with validation layers
        const finalScore = this.calculateBalancedScore(parsedResponse, validation, rawInput);

        const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
          title: parsedResponse.title || this.extractTitle(rawInput),
          description: parsedResponse.description || rawInput,
          category: this.validateCategory(parsedResponse.category) || this.categorizeIdea(rawInput),
          tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags.slice(0, 5) : this.generateSmartTags(rawInput),
          painPoints: Array.isArray(parsedResponse.painPoints) ? parsedResponse.painPoints.slice(0, 4) : this.extractPainPoints(rawInput),
          features: Array.isArray(parsedResponse.features) ? parsedResponse.features.slice(0, 5) : this.extractFeatures(rawInput),
          userPersonas: Array.isArray(parsedResponse.userPersonas) ? parsedResponse.userPersonas.slice(0, 3) : this.extractUserPersonas(rawInput),
          maturityScore: finalScore,
          existingProducts: [],
          developmentStage: 'raw',
          isStarred: false,
          marketAnalysis: this.processMarketAnalysisFromResponse(parsedResponse.marketAnalysis),
          feasibilityAnalysis: this.processFeasibilityAnalysisFromResponse(parsedResponse.feasibilityAnalysis)
        };

        // Generate balanced suggestions
        const suggestions: AISuggestion[] = this.generateBalancedSuggestions(parsedResponse, validation, finalScore);

        console.log('🎯 Final structured idea with balanced scoring:', structuredIdea);

        return { structuredIdea, suggestions, isExpansion: false };
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      return this.fallbackProcessing(rawInput, rawInput.toLowerCase().includes('expand this rough idea'));
    }
  }

  private static calculateBalancedScore(aiResponse: any, validation: any, originalInput: string): number {
    const text = originalInput.toLowerCase();
    
    // IMMEDIATE DISQUALIFIERS - These get 3-15% maximum
    if (validation.isNonsensical) {
      console.log('🚫 Nonsensical idea detected - maximum 15%');
      return Math.min(15, validation.qualityScore);
    }
    
    // Start with validation score as base
    let score = validation.qualityScore;
    
    // BOOST for legitimate businesses
    if (validation.isLegitimate) {
      console.log('✅ Legitimate business detected - applying boost');
      score = Math.max(score, 55); // Minimum 55% for legitimate businesses
      
      // Extra boost for proven business models
      if (text.includes('bakery') || text.includes('restaurant') || text.includes('cafe') || text.includes('shop')) {
        score = Math.max(score, 65); // Proven food/retail businesses
        console.log('🍞 Traditional business model - boosted to minimum 65%');
      }
    }
    
    // Apply AI business assessment
    const assessment = aiResponse.businessAssessment;
    if (assessment) {
      // Legitimacy check
      if (assessment.legitimacy === 'legitimate') {
        score = Math.max(score, 55);
      } else if (assessment.legitimacy === 'nonsensical') {
        score = Math.min(score, 15);
      }
      
      // Market demand adjustments
      if (assessment.marketDemand === 'high') {
        score += 10;
      } else if (assessment.marketDemand === 'nonexistent') {
        score -= 20;
      }
      
      // Profitability adjustments
      if (assessment.profitabilityPotential === 'high') {
        score += 8;
      } else if (assessment.profitabilityPotential === 'impossible') {
        score = Math.min(score, 10);
      }
      
      // Overall viability
      if (assessment.overallViability === 'excellent') {
        score += 10;
      } else if (assessment.overallViability === 'terrible') {
        score = Math.min(score, 15);
      }
    }
    
    // Minor penalties for quality issues (but not harsh)
    if (validation.issues.length > 0 && !validation.isLegitimate) {
      score -= validation.issues.length * 5; // Reduced penalty
    }
    
    // FINAL BOUNDS based on legitimacy
    if (validation.isNonsensical) {
      score = Math.max(3, Math.min(15, score)); // 3-15% for nonsense
    } else if (validation.isLegitimate) {
      score = Math.max(55, Math.min(85, score)); // 55-85% for legitimate businesses
    } else {
      score = Math.max(20, Math.min(75, score)); // 20-75% for other ideas
    }
    
    console.log(`📊 Balanced scoring: ${score}% (legitimate: ${validation.isLegitimate}, nonsensical: ${validation.isNonsensical})`);
    
    return score;
  }

  private static generateBalancedSuggestions(aiResponse: any, validation: any, finalScore: number): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // For nonsensical ideas (< 20%), be harsh
    if (validation.isNonsensical || finalScore < 20) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '🚫 This concept has fundamental flaws that make it unviable. Consider completely rethinking the approach.',
        applied: false,
        createdAt: new Date()
      });
    }
    // For legitimate businesses (55%+), be constructive
    else if (validation.isLegitimate && finalScore >= 55) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'improvement',
        content: '✅ This is a legitimate business concept. Focus on market research, location analysis, and competitive differentiation.',
        applied: false,
        createdAt: new Date()
      });
      
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'expansion',
        content: '📊 Consider conducting a feasibility study including target market analysis, startup costs, and revenue projections.',
        applied: false,
        createdAt: new Date()
      });
    }
    // For medium ideas, be balanced
    else {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: '⚠️ This idea has potential but needs development. Focus on defining the problem, target market, and unique value proposition.',
        applied: false,
        createdAt: new Date()
      });
    }
    
    // Add AI suggestions if they exist
    if (Array.isArray(aiResponse.suggestions)) {
      aiResponse.suggestions.forEach((s: any) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: s.type || 'improvement',
          content: s.content || 'Consider further development of this concept.',
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    // Add validation-specific feedback (but be gentler for legitimate businesses)
    if (validation.issues.length > 0 && !validation.isLegitimate) {
      validation.issues.forEach((issue: string) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'structure',
          content: `💡 Improvement area: ${issue}`,
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  static async analyzeIdeaMaturity(idea: Idea): Promise<MaturityAnalysis> {
    try {
      console.log('📈 Balanced maturity analysis for:', idea.title);
      
      // Pre-validate the idea structure
      const structureScore = this.calculateStructureScore(idea);
      const validation = this.validateIdeaQuality(idea.description);
      
      // For nonsensical ideas, return critical analysis
      if (validation.isNonsensical) {
        return this.generateCriticalMaturityAnalysis(idea, 10);
      }
      
      // For legitimate businesses, use balanced analysis
      const promptTone = validation.isLegitimate
        ? "You are analyzing a legitimate business concept. Be balanced and constructive."
        : "You are analyzing a business concept. Be fair but critical where needed.";
      
      const prompt = `
        ${promptTone} Provide maturity analysis for this idea:
        
        Title: ${idea.title}
        Description: ${idea.description}
        Pain Points: ${idea.painPoints.join(', ')}
        Features: ${idea.features.join(', ')}
        User Personas: ${idea.userPersonas.join(', ')}
        Category: ${idea.category}
        
        SCORING GUIDANCE:
        - Legitimate businesses (bakery, restaurant, etc.) should score 50-80%
        - Well-structured ideas with clear market should score 45-70%
        - Only score below 30% if fundamentally flawed
        - Nonsensical ideas should score 5-15%
        
        Consider:
        - Is this a proven business model?
        - Is there clear market demand?
        - What are realistic implementation challenges?
        - What would success look like?
        
        Respond with JSON:
        {
          "score": 65,
          "strengths": ["realistic", "strengths"],
          "gaps": ["areas", "for", "improvement"],
          "nextSteps": ["actionable", "next", "steps"],
          "marketPotential": {
            "score": 70,
            "marketSize": "small/medium/large",
            "competitionLevel": "low/medium/high",
            "demandIndicators": ["demand", "indicators"],
            "marketTrends": ["relevant", "trends"],
            "targetMarketSize": "realistic market size",
            "revenueProjection": "realistic revenue potential",
            "barriers": ["realistic", "barriers"],
            "opportunities": ["genuine", "opportunities"]
          },
          "feasibilityScore": {
            "overall": 65,
            "technical": 70,
            "financial": 60,
            "operational": 65,
            "legal": 80,
            "timeToMarket": "realistic timeline",
            "resourceRequirements": ["realistic", "requirements"],
            "riskFactors": ["realistic", "risks"],
            "successFactors": ["key", "success", "factors"]
          }
        }
        
        Be balanced. Good ideas deserve good scores. Bad ideas deserve low scores.
      `;

      const response = await this.makeAPICall([
        { role: "user", content: prompt }
      ]);

      let analysis;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        analysis = JSON.parse(jsonString);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse maturity analysis, using balanced fallback');
        return this.generateBalancedMaturityAnalysis(idea, structureScore, validation.isLegitimate);
      }

      // Apply balanced scoring
      const finalScore = this.calculateBalancedMaturityScore(analysis, validation, structureScore, idea);

      const result = {
        score: finalScore,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : (finalScore > 50 ? ['Viable business concept'] : ['Basic concept exists']),
        gaps: Array.isArray(analysis.gaps) ? analysis.gaps : ['Further development needed'],
        nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : ['Validate assumptions with market research'],
        marketPotential: this.processBalancedMarketPotential(analysis.marketPotential, finalScore, validation.isLegitimate),
        feasibilityScore: this.processBalancedFeasibilityScore(analysis.feasibilityScore, finalScore, validation.isLegitimate),
        recommendations: this.processBalancedRecommendations(analysis.recommendations, finalScore, validation.isLegitimate),
        missingElements: {
          painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
          features: Math.max(0, 4 - (idea.features?.length || 0)),
          userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
          branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
        }
      };

      console.log('✅ Balanced maturity analysis:', result);
      return result;
    } catch (error) {
      console.error('❌ Maturity analysis error:', error);
      return this.generateBalancedMaturityAnalysis(idea, 40, false);
    }
  }

  private static calculateBalancedMaturityScore(analysis: any, validation: any, structureScore: number, idea: Idea): number {
    // Check for nonsensical ideas first
    if (validation.isNonsensical) {
      return Math.min(15, validation.qualityScore);
    }
    
    // Start with AI score but apply balanced adjustments
    let score = Math.min(analysis.score || 40, 85); // Cap at 85%
    
    // Boost for legitimate businesses
    if (validation.isLegitimate) {
      score = Math.max(score, 50); // Minimum 50% for legitimate businesses
    }
    
    // Structure-based adjustments
    if (structureScore > 60) {
      score += 5;
    } else if (structureScore < 30) {
      score -= 10;
    }
    
    // Market potential adjustments
    const marketPotential = analysis.marketPotential;
    if (marketPotential) {
      if (marketPotential.score > 70) score += 5;
      if (marketPotential.marketSize === 'large') score += 5;
    }
    
    // Apply final bounds based on legitimacy
    if (validation.isNonsensical) {
      score = Math.max(5, Math.min(15, score));
    } else if (validation.isLegitimate) {
      score = Math.max(50, Math.min(85, score)); // 50-85% for legitimate businesses
    } else {
      score = Math.max(25, Math.min(80, score)); // 25-80% for other ideas
    }
    
    return score;
  }

  private static calculateStructureScore(idea: Idea): number {
    let score = 10; // Start higher
    
    if (idea.title && idea.title.length > 5 && !idea.title.includes('New Idea')) score += 15;
    if (idea.description && idea.description.length > 50) score += 15;
    if (idea.painPoints && idea.painPoints.length >= 2) score += 20;
    if (idea.features && idea.features.length >= 3) score += 20;
    if (idea.userPersonas && idea.userPersonas.length >= 2) score += 15;
    if (idea.tags && idea.tags.length >= 3) score += 5;
    
    return Math.min(score, 70); // Cap structure score at 70
  }

  private static processBalancedMarketPotential(data: any, ideaScore: number, isLegitimate: boolean): MarketPotential {
    // Set realistic bounds based on idea quality and legitimacy
    const minScore = isLegitimate ? 40 : (ideaScore < 30 ? 15 : 25);
    const maxScore = isLegitimate ? 80 : (ideaScore > 60 ? 75 : 60);
    
    return {
      score: Math.min(Math.max(data?.score || 45, minScore), maxScore),
      marketSize: isLegitimate ? (data?.marketSize || 'medium') : (data?.marketSize || 'small'),
      competitionLevel: ['low', 'medium', 'high', 'saturated'].includes(data?.competitionLevel) ? data.competitionLevel : 'medium',
      demandIndicators: Array.isArray(data?.demandIndicators) ? data.demandIndicators : (isLegitimate ? ['Established market demand'] : ['Demand validation needed']),
      marketTrends: Array.isArray(data?.marketTrends) ? data.marketTrends : ['Market research required'],
      targetMarketSize: data?.targetMarketSize || (isLegitimate ? 'Established market segment' : 'Market size needs validation'),
      revenueProjection: data?.revenueProjection || (isLegitimate ? 'Proven revenue model' : 'Revenue model needs validation'),
      barriers: Array.isArray(data?.barriers) ? data.barriers : (isLegitimate ? ['Competition', 'Initial investment'] : ['Market validation', 'Competition']),
      opportunities: Array.isArray(data?.opportunities) ? data.opportunities : (isLegitimate ? ['Market growth potential'] : ['Opportunity validation needed'])
    };
  }

  private static processBalancedFeasibilityScore(data: any, ideaScore: number, isLegitimate: boolean): FeasibilityScore {
    // Set realistic bounds
    const minOverall = isLegitimate ? 45 : (ideaScore < 30 ? 20 : 30);
    const maxOverall = isLegitimate ? 80 : (ideaScore > 60 ? 75 : 65);
    
    return {
      overall: Math.min(Math.max(data?.overall || 50, minOverall), maxOverall),
      technical: Math.min(Math.max(data?.technical || 60, 30), isLegitimate ? 80 : 70),
      financial: Math.min(Math.max(data?.financial || 50, isLegitimate ? 40 : 25), isLegitimate ? 75 : 65),
      operational: Math.min(Math.max(data?.operational || 55, 35), isLegitimate ? 80 : 70),
      legal: Math.min(Math.max(data?.legal || 70, 50), 90),
      timeToMarket: data?.timeToMarket || (isLegitimate ? '6-12 months' : '12-18 months'),
      resourceRequirements: Array.isArray(data?.resourceRequirements) ? data.resourceRequirements : (isLegitimate ? ['Initial capital', 'Location', 'Staff'] : ['Development resources', 'Market validation']),
      riskFactors: Array.isArray(data?.riskFactors) ? data.riskFactors : (isLegitimate ? ['Market competition', 'Economic conditions'] : ['Market acceptance', 'Technical challenges']),
      successFactors: Array.isArray(data?.successFactors) ? data.successFactors : (isLegitimate ? ['Good location', 'Quality service', 'Marketing'] : ['Product-market fit', 'Strong execution'])
    };
  }

  private static processBalancedRecommendations(data: any, ideaScore: number, isLegitimate: boolean): ActionableRecommendations {
    if (ideaScore < 25) {
      return {
        immediate: [
          {
            id: crypto.randomUUID(),
            action: 'Reconsider approach',
            description: 'This concept needs fundamental revision. Consider alternative approaches.',
            priority: 'high',
            effort: 'medium',
            impact: 'high',
            resources: ['strategic thinking'],
            estimatedTime: '1-2 weeks'
          }
        ],
        shortTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Explore alternatives',
            description: 'Research alternative approaches to the problem space.',
            priority: 'medium',
            effort: 'medium',
            impact: 'medium',
            resources: ['research time'],
            estimatedTime: '2-4 weeks'
          }
        ],
        longTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Develop new concept',
            description: 'Based on learnings, develop a more viable concept.',
            priority: 'low',
            effort: 'high',
            impact: 'medium',
            resources: ['time', 'creativity'],
            estimatedTime: '2-3 months'
          }
        ],
        criticalPath: ['reconsider', 'research', 'develop'],
        keyMilestones: [
          {
            id: crypto.randomUUID(),
            title: 'Concept Revision',
            description: 'Complete revision of core concept',
            targetDate: '2 weeks',
            successCriteria: ['Revised approach identified'],
            deliverables: ['new concept outline']
          }
        ]
      };
    }
    
    // For legitimate businesses, provide constructive recommendations
    if (isLegitimate) {
      return {
        immediate: [
          {
            id: crypto.randomUUID(),
            action: 'Market research',
            description: 'Conduct local market research to validate demand and analyze competition.',
            priority: 'high',
            effort: 'medium',
            impact: 'high',
            resources: ['research time', 'local market data'],
            estimatedTime: '2-3 weeks'
          },
          {
            id: crypto.randomUUID(),
            action: 'Financial planning',
            description: 'Develop detailed financial projections including startup costs and revenue forecasts.',
            priority: 'high',
            effort: 'medium',
            impact: 'high',
            resources: ['financial planning tools', 'industry data'],
            estimatedTime: '1-2 weeks'
          }
        ],
        shortTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Location analysis',
            description: 'Identify and evaluate potential locations based on foot traffic, competition, and costs.',
            priority: 'high',
            effort: 'medium',
            impact: 'high',
            resources: ['location scouting', 'real estate research'],
            estimatedTime: '3-4 weeks'
          },
          {
            id: crypto.randomUUID(),
            action: 'Business plan development',
            description: 'Create comprehensive business plan including operations, marketing, and growth strategy.',
            priority: 'high',
            effort: 'high',
            impact: 'high',
            resources: ['business planning tools', 'industry expertise'],
            estimatedTime: '4-6 weeks'
          }
        ],
        longTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Launch preparation',
            description: 'Secure funding, finalize location, hire staff, and prepare for launch.',
            priority: 'high',
            effort: 'high',
            impact: 'high',
            resources: ['capital', 'legal support', 'operational setup'],
            estimatedTime: '3-6 months'
          }
        ],
        criticalPath: ['research', 'planning', 'location', 'funding', 'launch'],
        keyMilestones: [
          {
            id: crypto.randomUUID(),
            title: 'Market Validation',
            description: 'Confirm market demand and competitive positioning',
            targetDate: '3 weeks',
            successCriteria: ['Market research completed', 'Demand validated', 'Competition analyzed'],
            deliverables: ['market research report', 'competitive analysis']
          },
          {
            id: crypto.randomUUID(),
            title: 'Business Plan Complete',
            description: 'Comprehensive business plan ready for funding',
            targetDate: '8 weeks',
            successCriteria: ['Financial projections complete', 'Operations plan defined', 'Marketing strategy outlined'],
            deliverables: ['complete business plan', 'financial model']
          }
        ]
      };
    }
    
    // Standard recommendations for other ideas
    return this.processRecommendations(data);
  }

  private static generateBalancedMaturityAnalysis(idea: Idea, structureScore: number, isLegitimate: boolean): MaturityAnalysis {
    const baseScore = isLegitimate ? Math.max(structureScore, 55) : Math.max(structureScore, 30);
    
    return {
      score: Math.min(baseScore, 80),
      strengths: isLegitimate ? [
        'Proven business model',
        'Clear market demand',
        'Established industry'
      ] : [
        'Basic concept defined',
        'Some structure present'
      ],
      gaps: isLegitimate ? [
        'Market research needed',
        'Financial planning required',
        'Location analysis needed'
      ] : [
        'Market validation needed',
        'Business model unclear',
        'Implementation challenges'
      ],
      nextSteps: isLegitimate ? [
        'Conduct local market research',
        'Develop financial projections',
        'Analyze potential locations',
        'Create detailed business plan'
      ] : [
        'Validate core assumptions',
        'Define target market',
        'Research competition',
        'Develop business model'
      ],
      marketPotential: this.processBalancedMarketPotential(null, baseScore, isLegitimate),
      feasibilityScore: this.processBalancedFeasibilityScore(null, baseScore, isLegitimate),
      recommendations: this.processBalancedRecommendations(null, baseScore, isLegitimate),
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
      }
    };
  }

  private static generateCriticalMaturityAnalysis(idea: Idea, score: number): MaturityAnalysis {
    return {
      score: Math.min(score, 15),
      strengths: ['No significant strengths identified'],
      gaps: [
        'Fundamental business logic flaws',
        'No viable path to profitability',
        'Lacks coherent structure'
      ],
      nextSteps: [
        'Consider abandoning this approach',
        'Explore completely different concepts'
      ],
      marketPotential: {
        score: 10,
        marketSize: 'nonexistent',
        competitionLevel: 'irrelevant',
        demandIndicators: ['No demand identified'],
        marketTrends: ['Not applicable'],
        targetMarketSize: 'Nonexistent',
        revenueProjection: 'No viable revenue model',
        barriers: ['Fundamental concept flaws'],
        opportunities: ['No opportunities identified']
      },
      feasibilityScore: {
        overall: 10,
        technical: 15,
        financial: 5,
        operational: 10,
        legal: 50,
        timeToMarket: 'Not viable',
        resourceRequirements: ['Complete concept revision'],
        riskFactors: ['Guaranteed failure'],
        successFactors: ['Complete overhaul required']
      },
      recommendations: {
        immediate: [
          {
            id: crypto.randomUUID(),
            action: 'Abandon concept',
            description: 'This concept is not viable. Consider completely different approaches.',
            priority: 'high',
            effort: 'low',
            impact: 'high',
            resources: ['decision making'],
            estimatedTime: '1 day'
          }
        ],
        shortTerm: [],
        longTerm: [],
        criticalPath: ['abandon'],
        keyMilestones: []
      },
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: true
      }
    };
  }

  // Keep existing helper methods...
  private static validateCategory(category: string): IdeaCategory | null {
    const validCategories: IdeaCategory[] = ['tech', 'business', 'social', 'education', 'health', 'entertainment', 'other'];
    return validCategories.includes(category as IdeaCategory) ? category as IdeaCategory : null;
  }

  private static categorizeIdea(input: string): IdeaCategory {
    const text = input.toLowerCase();
    
    if (text.includes('app') || text.includes('software') || text.includes('ai') || text.includes('tech')) {
      return 'tech';
    }
    if (text.includes('business') || text.includes('startup') || text.includes('money') || text.includes('revenue') || 
        text.includes('bakery') || text.includes('restaurant') || text.includes('shop') || text.includes('store')) {
      return 'business';
    }
    if (text.includes('social') || text.includes('community') || text.includes('people') || text.includes('connect')) {
      return 'social';
    }
    if (text.includes('learn') || text.includes('teach') || text.includes('education') || text.includes('school')) {
      return 'education';
    }
    if (text.includes('health') || text.includes('fitness') || text.includes('medical') || text.includes('wellness')) {
      return 'health';
    }
    if (text.includes('game') || text.includes('fun') || text.includes('entertainment') || text.includes('music')) {
      return 'entertainment';
    }
    
    return 'other';
  }

  private static extractTitle(input: string): string {
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences[0]?.trim().slice(0, 60) || 'Business Concept';
  }

  private static generateSmartTags(input: string): string[] {
    const text = input.toLowerCase();
    const tags: string[] = [];
    
    const tagMap = {
      'food-service': ['bakery', 'restaurant', 'cafe', 'food'],
      'retail': ['shop', 'store', 'sell', 'products'],
      'local-business': ['islamabad', 'karachi', 'lahore', 'local'],
      'mobile': ['mobile', 'app', 'phone'],
      'web': ['website', 'web', 'browser'],
      'ai': ['ai', 'artificial intelligence', 'machine learning'],
      'social': ['social', 'community', 'network'],
      'service': ['service', 'help', 'provide']
    };
    
    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5);
  }

  private static extractPainPoints(input: string): string[] {
    const text = input.toLowerCase();
    
    // For legitimate businesses, identify real pain points they solve
    if (text.includes('bakery') || text.includes('restaurant') || text.includes('cafe')) {
      return [
        'People need fresh, quality baked goods',
        'Limited options for local bakery products',
        'Demand for convenient food options'
      ];
    }
    
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const painIndicators = ['problem', 'issue', 'difficult', 'hard', 'frustrating', 'need', 'lack'];
    
    const painPoints = sentences.filter(sentence => 
      painIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );
    
    return painPoints.length > 0 ? painPoints.slice(0, 4) : [
      'Customer needs identification required',
      'Market pain points need research'
    ];
  }

  private static extractFeatures(input: string): string[] {
    const text = input.toLowerCase();
    
    // For legitimate businesses, provide realistic features
    if (text.includes('bakery')) {
      return [
        'Fresh daily baked goods',
        'Custom cake orders',
        'Local delivery service',
        'Quality ingredients',
        'Competitive pricing'
      ];
    }
    
    if (text.includes('restaurant') || text.includes('cafe')) {
      return [
        'Quality food preparation',
        'Comfortable dining environment',
        'Efficient service',
        'Menu variety',
        'Customer loyalty program'
      ];
    }
    
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const featureIndicators = ['feature', 'function', 'allow', 'enable', 'provide', 'offer'];
    
    const features = sentences.filter(sentence => 
      featureIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );
    
    return features.length > 0 ? features.slice(0, 5) : [
      'Core functionality needs definition',
      'Key features require specification'
    ];
  }

  private static extractUserPersonas(input: string): string[] {
    const text = input.toLowerCase();
    
    // For legitimate businesses, provide realistic user personas
    if (text.includes('bakery')) {
      return [
        'Local residents seeking fresh baked goods',
        'Families needing celebration cakes',
        'Office workers wanting quick breakfast items'
      ];
    }
    
    if (text.includes('restaurant') || text.includes('cafe')) {
      return [
        'Local diners seeking quality meals',
        'Business professionals for lunch meetings',
        'Families for casual dining'
      ];
    }
    
    const personas: string[] = [];

    if (text.includes('student') || text.includes('learn')) {
      personas.push('Students and learners');
    }
    if (text.includes('business') || text.includes('professional')) {
      personas.push('Business professionals');
    }
    if (text.includes('local') || text.includes('community')) {
      personas.push('Local community members');
    }

    return personas.length > 0 ? personas.slice(0, 3) : ['Target customers need identification'];
  }

  // Update fallback processing to be balanced
  private static fallbackProcessing(rawInput: string, isExpansion: boolean = false, validation?: any): {
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions?: AISuggestion[];
    expandedIdeas?: any[];
    isExpansion: boolean;
  } {
    console.log('🔄 Using balanced fallback processing for:', rawInput);
    
    if (isExpansion) {
      const actualInput = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
      const expandedIdeas = this.generateFallbackExpandedIdeas(actualInput);
      return { expandedIdeas, isExpansion: true };
    }

    // Use validation score if available
    const baseScore = validation?.qualityScore || this.calculateBasicQualityScore(rawInput);
    
    const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
      title: this.extractTitle(rawInput),
      description: rawInput,
      category: this.categorizeIdea(rawInput),
      tags: this.generateSmartTags(rawInput),
      painPoints: this.extractPainPoints(rawInput),
      features: this.extractFeatures(rawInput),
      userPersonas: this.extractUserPersonas(rawInput),
      maturityScore: baseScore,
      existingProducts: [],
      developmentStage: 'raw',
      isStarred: false,
      marketAnalysis: this.generateFallbackMarketAnalysis(),
      feasibilityAnalysis: this.generateFallbackFeasibilityAnalysis()
    };

    const suggestions = this.generateBalancedFallbackSuggestions(validation, baseScore);
    
    return { structuredIdea, suggestions, isExpansion: false };
  }

  private static calculateBasicQualityScore(input: string): number {
    const validation = this.validateIdeaQuality(input);
    return validation.qualityScore;
  }

  private static generateBalancedFallbackSuggestions(validation?: any, score?: number): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    if (validation?.isNonsensical) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '❌ This appears to be nonsensical or contradictory. Please provide a coherent business concept.',
        applied: false,
        createdAt: new Date()
      });
    } else if (validation?.isLegitimate) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'improvement',
        content: '✅ This is a legitimate business concept. Focus on market research and business planning.',
        applied: false,
        createdAt: new Date()
      });
    } else {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: '💡 This idea has potential but needs development. Focus on defining the problem and target market.',
        applied: false,
        createdAt: new Date()
      });
    }

    return suggestions.slice(0, 3);
  }

  // Keep existing methods for expansion and other features...
  static async generateExpandedIdeas(roughIdea: string): Promise<ExpandedIdea[]> {
    try {
      const validation = this.validateIdeaQuality(roughIdea);
      if (validation.isNonsensical) {
        return this.generateFallbackExpandedIdeas(roughIdea);
      }

      const prompt = `
        Expand this rough idea into 4 different business concepts: "${roughIdea}"
        
        Be realistic about market potential and implementation. For legitimate business ideas, be constructive.
        
        Respond with JSON array of 4 objects:
        {
          "title": "Professional, realistic title",
          "description": "Balanced 2-3 sentence description",
          "targetAudience": "Specific, realistic target audience",
          "keyFeatures": ["4-5", "realistic", "features"],
          "marketAngle": "Realistic market positioning",
          "tags": ["3-5", "relevant", "tags"]
        }
        
        Make each version different but realistic.
      `;

      const response = await this.makeAPICall([
        { role: "user", content: prompt }
      ]);

      let expandedIdeas;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        expandedIdeas = JSON.parse(jsonString);
      } catch (parseError) {
        return this.generateFallbackExpandedIdeas(roughIdea);
      }

      return expandedIdeas.map((idea: any, index: number) => ({
        id: crypto.randomUUID(),
        title: idea.title || `${roughIdea} - Concept ${index + 1}`,
        description: idea.description || 'A comprehensive expansion of your original concept.',
        targetAudience: idea.targetAudience || 'Target audience needs definition',
        keyFeatures: Array.isArray(idea.keyFeatures) ? idea.keyFeatures : ['Features need definition'],
        marketAngle: idea.marketAngle || 'Market positioning needs development',
        tags: Array.isArray(idea.tags) ? idea.tags : ['concept', 'development']
      }));
    } catch (error) {
      console.error('❌ Expansion generation error:', error);
      return this.generateFallbackExpandedIdeas(roughIdea);
    }
  }

  private static generateFallbackExpandedIdeas(roughIdea: string): ExpandedIdea[] {
    const validation = this.validateIdeaQuality(roughIdea);
    
    if (validation.isLegitimate) {
      return [
        {
          id: crypto.randomUUID(),
          title: `${roughIdea} - Local Focus`,
          description: `A locally-focused implementation of ${roughIdea.toLowerCase()} targeting the immediate community with personalized service and local market understanding.`,
          targetAudience: 'Local community members and nearby residents',
          keyFeatures: ['Local market focus', 'Community engagement', 'Personalized service', 'Local partnerships'],
          marketAngle: 'Community-centered approach with local market expertise',
          tags: ['local', 'community', 'personalized', 'established']
        },
        {
          id: crypto.randomUUID(),
          title: `${roughIdea} - Premium Service`,
          description: `A premium version of ${roughIdea.toLowerCase()} offering high-quality products/services with superior customer experience and premium positioning.`,
          targetAudience: 'Quality-conscious customers willing to pay premium prices',
          keyFeatures: ['Premium quality', 'Superior service', 'Exclusive offerings', 'High-end experience'],
          marketAngle: 'Premium market positioning with focus on quality and service excellence',
          tags: ['premium', 'quality', 'service', 'established']
        }
      ];
    }
    
    return [
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Basic Concept`,
        description: `A basic implementation of ${roughIdea.toLowerCase()} that would require significant development, market validation, and competitive analysis.`,
        targetAudience: 'Target audience needs extensive research and validation',
        keyFeatures: ['Core functionality needs definition', 'Market validation required', 'Competitive analysis needed'],
        marketAngle: 'Market position unclear - requires research and validation',
        tags: ['concept', 'validation-required', 'development-needed']
      }
    ];
  }

  // Keep other existing methods...
  static async generateRemixVariants(idea: Idea): Promise<RemixVariant[]> {
    return [];
  }

  private static processMarketAnalysisFromResponse(data: any) {
    return {
      size: 'Market analysis needed',
      growth: 'Growth potential to be determined',
      trends: ['Market research required'],
      competitors: ['Competitive analysis needed'],
      opportunities: ['Opportunities assessment needed'],
      threats: ['Risk analysis needed']
    };
  }

  private static processFeasibilityAnalysisFromResponse(data: any) {
    return {
      technical: {
        score: 50,
        challenges: ['Technical assessment needed'],
        requirements: ['Requirements analysis needed']
      },
      financial: {
        score: 45,
        estimatedCost: 'Cost analysis needed',
        revenueModel: ['Revenue model needs development'],
        fundingNeeds: 'Funding requirements to be determined'
      },
      market: {
        score: 50,
        demand: 'Market demand needs validation',
        competition: 'Competitive landscape analysis needed',
        barriers: ['Market barriers assessment needed']
      }
    };
  }

  private static processRecommendations(data: any): ActionableRecommendations {
    return {
      immediate: [
        {
          id: crypto.randomUUID(),
          action: 'Validate core assumptions',
          description: 'Test fundamental assumptions with potential customers',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          resources: ['time', 'user research'],
          estimatedTime: '1-2 weeks'
        }
      ],
      shortTerm: [
        {
          id: crypto.randomUUID(),
          action: 'Market research',
          description: 'Conduct comprehensive market and competitive analysis',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          resources: ['research time', 'market data'],
          estimatedTime: '2-4 weeks'
        }
      ],
      longTerm: [
        {
          id: crypto.randomUUID(),
          action: 'Business development',
          description: 'Develop comprehensive business plan and strategy',
          priority: 'medium',
          effort: 'high',
          impact: 'high',
          resources: ['business planning', 'strategic thinking'],
          estimatedTime: '2-3 months'
        }
      ],
      criticalPath: ['validate', 'research', 'plan', 'execute'],
      keyMilestones: [
        {
          id: crypto.randomUUID(),
          title: 'Concept Validation',
          description: 'Validate core concept with target market',
          targetDate: '2 weeks',
          successCriteria: ['User feedback collected', 'Market demand confirmed'],
          deliverables: ['validation report']
        }
      ]
    };
  }

  private static generateFallbackMarketAnalysis() {
    return {
      size: 'Market size needs assessment',
      growth: 'Growth potential requires analysis',
      trends: ['Market trends research needed'],
      competitors: ['Competitive landscape analysis required'],
      opportunities: ['Market opportunities need identification'],
      threats: ['Risk factors need evaluation']
    };
  }

  private static generateFallbackFeasibilityAnalysis() {
    return {
      technical: {
        score: 50,
        challenges: ['Technical requirements need assessment'],
        requirements: ['Technical specifications need definition']
      },
      financial: {
        score: 45,
        estimatedCost: 'Financial requirements need analysis',
        revenueModel: ['Revenue streams need identification'],
        fundingNeeds: 'Capital requirements need assessment'
      },
      market: {
        score: 50,
        demand: 'Market demand needs validation',
        competition: 'Competitive analysis required',
        barriers: ['Market entry barriers need evaluation']
      }
    };
  }
}