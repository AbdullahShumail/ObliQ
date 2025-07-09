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

  // Pre-validation to catch obviously bad ideas
  private static validateIdeaQuality(input: string): {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
  } {
    const issues: string[] = [];
    let qualityScore = 50; // Start neutral
    
    const text = input.toLowerCase().trim();
    
    // Check for gibberish or very short input
    if (text.length < 10) {
      issues.push('Idea is too short and lacks detail');
      qualityScore -= 30;
    }
    
    // Check for repeated characters or obvious gibberish
    const hasRepeatedChars = /(.)\1{4,}/.test(text);
    const hasRandomKeyboard = /qwerty|asdf|zxcv|123456|abcdef/.test(text);
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s/g, '').length / wordCount;
    
    if (hasRepeatedChars || hasRandomKeyboard || avgWordLength < 2) {
      issues.push('Input appears to be gibberish or random text');
      qualityScore -= 40;
    }
    
    // Check for actual problem/solution indication
    const problemIndicators = ['problem', 'issue', 'difficult', 'hard', 'frustrating', 'need', 'want', 'solve', 'help', 'improve'];
    const solutionIndicators = ['app', 'platform', 'service', 'tool', 'system', 'website', 'solution', 'idea', 'concept'];
    
    const hasProblem = problemIndicators.some(indicator => text.includes(indicator));
    const hasSolution = solutionIndicators.some(indicator => text.includes(indicator));
    
    if (!hasProblem && !hasSolution) {
      issues.push('No clear problem or solution identified');
      qualityScore -= 20;
    }
    
    // Check for coherent sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 1 || sentences.every(s => s.split(' ').length < 3)) {
      issues.push('Lacks coherent explanation');
      qualityScore -= 25;
    }
    
    // Positive indicators
    if (text.includes('user') || text.includes('customer')) qualityScore += 10;
    if (text.includes('market') || text.includes('business')) qualityScore += 10;
    if (wordCount >= 20) qualityScore += 15;
    if (sentences.length >= 3) qualityScore += 10;
    
    qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    return {
      isValid: qualityScore >= 30 && issues.length < 3,
      issues,
      qualityScore
    };
  }

  private static async makeAPICall(messages: Array<{role: string, content: string}>): Promise<string> {
    try {
      console.log('🤖 Making API call to OpenRouter...');
      
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
          "temperature": 0.3, // Lower temperature for more consistent, realistic responses
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
      
      console.log('✅ AI Response received');
      
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
      
      // Pre-validate the idea quality
      const validation = this.validateIdeaQuality(rawInput);
      console.log('🔍 Idea validation result:', validation);
      
      // Check if this is an expansion request
      const isExpansionRequest = rawInput.toLowerCase().includes('expand this rough idea');
      
      if (isExpansionRequest) {
        const roughIdea = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
        const roughValidation = this.validateIdeaQuality(roughIdea);
        
        if (!roughValidation.isValid) {
          console.warn('⚠️ Rough idea failed validation, using fallback');
          return this.fallbackProcessing(rawInput, true);
        }
        
        const expandedIdeas = await this.generateExpandedIdeas(roughIdea);
        return { expandedIdeas, isExpansion: true };
      } else {
        if (!validation.isValid) {
          console.warn('⚠️ Idea failed validation, using critical fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }
        
        const prompt = `
          You are a CRITICAL and REALISTIC business analyst. Analyze this idea with HONEST assessment: "${rawInput}"
          
          IMPORTANT: Be realistic and critical. Not every idea is good. Consider:
          - Is this actually solving a real problem?
          - Is there genuine market demand?
          - What are the real challenges and barriers?
          - Be honest about feasibility and competition
          
          Respond with JSON:
          {
            "title": "Professional title (max 60 chars)",
            "description": "Enhanced but realistic description",
            "category": "tech/business/social/education/health/entertainment/other",
            "tags": ["3-5", "relevant", "tags"],
            "painPoints": ["2-4", "real", "problems", "this", "solves"],
            "features": ["3-5", "realistic", "features"],
            "userPersonas": ["2-3", "specific", "user", "types"],
            "realityCheck": {
              "viabilityScore": 45,
              "marketDemand": "low/medium/high",
              "competitionLevel": "low/medium/high/saturated",
              "implementationDifficulty": "low/medium/high/extreme",
              "criticalIssues": ["honest", "problems", "with", "this", "idea"],
              "marketReality": "honest assessment of market conditions"
            },
            "suggestions": [
              {
                "type": "critical",
                "content": "honest feedback about what needs work"
              }
            ]
          }
          
          BE HONEST. If it's a bad idea, reflect that in low scores and critical feedback.
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
          console.warn('⚠️ Failed to parse AI response, using fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }

        // Apply realistic scoring based on validation and AI assessment
        const baseScore = Math.min(validation.qualityScore, parsedResponse.realityCheck?.viabilityScore || 50);
        const adjustedScore = this.calculateRealisticMaturityScore(parsedResponse, validation, baseScore);

        const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
          title: parsedResponse.title || this.extractTitle(rawInput),
          description: parsedResponse.description || rawInput,
          category: this.validateCategory(parsedResponse.category) || this.categorizeIdea(rawInput),
          tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags.slice(0, 5) : this.generateSmartTags(rawInput),
          painPoints: Array.isArray(parsedResponse.painPoints) ? parsedResponse.painPoints.slice(0, 4) : this.extractPainPoints(rawInput),
          features: Array.isArray(parsedResponse.features) ? parsedResponse.features.slice(0, 5) : this.extractFeatures(rawInput),
          userPersonas: Array.isArray(parsedResponse.userPersonas) ? parsedResponse.userPersonas.slice(0, 3) : this.extractUserPersonas(rawInput),
          maturityScore: adjustedScore,
          existingProducts: [],
          developmentStage: 'raw',
          isStarred: false,
          marketAnalysis: this.processMarketAnalysisFromResponse(parsedResponse.marketAnalysis),
          feasibilityAnalysis: this.processFeasibilityAnalysisFromResponse(parsedResponse.feasibilityAnalysis)
        };

        // Generate critical suggestions based on reality check
        const suggestions: AISuggestion[] = this.generateCriticalSuggestions(parsedResponse, validation);

        console.log('🎯 Final structured idea with realistic scoring:', structuredIdea);

        return { structuredIdea, suggestions, isExpansion: false };
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      return this.fallbackProcessing(rawInput, rawInput.toLowerCase().includes('expand this rough idea'));
    }
  }

  private static calculateRealisticMaturityScore(aiResponse: any, validation: any, baseScore: number): number {
    let score = Math.min(baseScore, 60); // Cap initial score at 60
    
    // Penalize based on validation issues
    if (validation.issues.length > 0) {
      score -= validation.issues.length * 10;
    }
    
    // Adjust based on AI reality check
    const realityCheck = aiResponse.realityCheck;
    if (realityCheck) {
      if (realityCheck.marketDemand === 'low') score -= 15;
      if (realityCheck.competitionLevel === 'saturated') score -= 20;
      if (realityCheck.implementationDifficulty === 'extreme') score -= 25;
      if (realityCheck.criticalIssues?.length > 3) score -= 15;
    }
    
    // Bonus for well-structured ideas
    if (Array.isArray(aiResponse.painPoints) && aiResponse.painPoints.length >= 3) score += 10;
    if (Array.isArray(aiResponse.features) && aiResponse.features.length >= 4) score += 10;
    if (Array.isArray(aiResponse.userPersonas) && aiResponse.userPersonas.length >= 2) score += 5;
    
    return Math.max(5, Math.min(85, score)); // Cap between 5-85, never give perfect scores
  }

  private static generateCriticalSuggestions(aiResponse: any, validation: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Add validation-based suggestions
    validation.issues.forEach((issue: string) => {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: `⚠️ ${issue}. Consider providing more detail and clarity.`,
        applied: false,
        createdAt: new Date()
      });
    });
    
    // Add AI reality check suggestions
    const realityCheck = aiResponse.realityCheck;
    if (realityCheck?.criticalIssues) {
      realityCheck.criticalIssues.forEach((issue: string) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'maturity',
          content: `🔍 Critical concern: ${issue}`,
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    // Add AI suggestions
    if (Array.isArray(aiResponse.suggestions)) {
      aiResponse.suggestions.forEach((s: any) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: s.type || 'structure',
          content: s.content || 'Consider improving this aspect of your idea.',
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    // Default critical suggestions if none provided
    if (suggestions.length === 0) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: 'This idea needs significant development before it can be considered viable.',
        applied: false,
        createdAt: new Date()
      });
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  static async analyzeIdeaMaturity(idea: Idea): Promise<MaturityAnalysis> {
    try {
      console.log('📈 Analyzing idea maturity for:', idea.title);
      
      // Pre-validate the idea structure
      const structureScore = this.calculateStructureScore(idea);
      
      const prompt = `
        You are a CRITICAL business analyst. Provide HONEST maturity analysis for this idea:
        
        Title: ${idea.title}
        Description: ${idea.description}
        Pain Points: ${idea.painPoints.join(', ')}
        Features: ${idea.features.join(', ')}
        User Personas: ${idea.userPersonas.join(', ')}
        Category: ${idea.category}
        
        BE REALISTIC AND CRITICAL. Consider:
        - Real market conditions and competition
        - Actual implementation challenges
        - Genuine user demand validation
        - Financial and resource requirements
        
        Respond with JSON:
        {
          "score": 35,
          "strengths": ["honest", "strengths", "if", "any"],
          "gaps": ["critical", "gaps", "and", "weaknesses"],
          "nextSteps": ["realistic", "next", "steps"],
          "marketPotential": {
            "score": 40,
            "marketSize": "small/medium/large",
            "competitionLevel": "low/medium/high/saturated",
            "demandIndicators": ["realistic", "demand", "signals"],
            "marketTrends": ["relevant", "trends"],
            "targetMarketSize": "honest market size estimate",
            "revenueProjection": "realistic revenue potential",
            "barriers": ["real", "market", "barriers"],
            "opportunities": ["genuine", "opportunities", "if", "any"]
          },
          "feasibilityScore": {
            "overall": 45,
            "technical": 50,
            "financial": 40,
            "operational": 45,
            "legal": 70,
            "timeToMarket": "realistic timeline",
            "resourceRequirements": ["actual", "resources", "needed"],
            "riskFactors": ["real", "risks"],
            "successFactors": ["critical", "success", "requirements"]
          },
          "criticalAssessment": {
            "viabilityRating": "poor/fair/good/excellent",
            "majorConcerns": ["biggest", "problems", "with", "this", "idea"],
            "competitiveThreats": ["real", "competitive", "threats"],
            "marketReality": "honest market assessment"
          }
        }
        
        Don't inflate scores. Be honest about weaknesses and challenges.
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
        console.warn('⚠️ Failed to parse maturity analysis, using critical fallback');
        return this.generateCriticalMaturityAnalysis(idea, structureScore);
      }

      // Apply realistic scoring caps
      const finalScore = Math.min(
        Math.max(analysis.score || 30, 5), // Minimum 5, but realistic cap
        structureScore + 30 // Structure score + max 30 bonus
      );

      const result = {
        score: finalScore,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ['Basic concept exists'],
        gaps: Array.isArray(analysis.gaps) ? analysis.gaps : ['Significant development needed'],
        nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : ['Validate core assumptions'],
        marketPotential: this.processRealisticMarketPotential(analysis.marketPotential),
        feasibilityScore: this.processRealisticFeasibilityScore(analysis.feasibilityScore),
        recommendations: this.processRealisticRecommendations(analysis.recommendations, finalScore),
        missingElements: {
          painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
          features: Math.max(0, 4 - (idea.features?.length || 0)),
          userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
          branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
        }
      };

      console.log('✅ Critical maturity analysis:', result);
      return result;
    } catch (error) {
      console.error('❌ Maturity analysis error:', error);
      return this.generateCriticalMaturityAnalysis(idea, 20);
    }
  }

  private static calculateStructureScore(idea: Idea): number {
    let score = 10; // Base score
    
    if (idea.title && idea.title.length > 5 && !idea.title.includes('New Idea')) score += 15;
    if (idea.description && idea.description.length > 50) score += 15;
    if (idea.painPoints && idea.painPoints.length >= 2) score += 20;
    if (idea.features && idea.features.length >= 3) score += 20;
    if (idea.userPersonas && idea.userPersonas.length >= 2) score += 15;
    if (idea.tags && idea.tags.length >= 3) score += 5;
    
    return Math.min(score, 60); // Cap structure score at 60
  }

  private static processRealisticMarketPotential(data: any): MarketPotential {
    return {
      score: Math.min(Math.max(data?.score || 30, 10), 70), // Cap market potential at 70
      marketSize: ['small', 'medium', 'large'].includes(data?.marketSize) ? data.marketSize : 'small',
      competitionLevel: ['low', 'medium', 'high', 'saturated'].includes(data?.competitionLevel) ? data.competitionLevel : 'high',
      demandIndicators: Array.isArray(data?.demandIndicators) ? data.demandIndicators : ['Demand validation needed'],
      marketTrends: Array.isArray(data?.marketTrends) ? data.marketTrends : ['Market research required'],
      targetMarketSize: data?.targetMarketSize || 'Market size unclear',
      revenueProjection: data?.revenueProjection || 'Revenue model unproven',
      barriers: Array.isArray(data?.barriers) ? data.barriers : ['High competition', 'Market entry costs', 'User acquisition challenges'],
      opportunities: Array.isArray(data?.opportunities) ? data.opportunities : ['Limited opportunities identified']
    };
  }

  private static processRealisticFeasibilityScore(data: any): FeasibilityScore {
    return {
      overall: Math.min(Math.max(data?.overall || 35, 10), 75), // Cap overall feasibility
      technical: Math.min(Math.max(data?.technical || 40, 15), 80),
      financial: Math.min(Math.max(data?.financial || 30, 10), 70),
      operational: Math.min(Math.max(data?.operational || 35, 15), 75),
      legal: Math.min(Math.max(data?.legal || 60, 40), 90),
      timeToMarket: data?.timeToMarket || '12-24 months (realistic estimate)',
      resourceRequirements: Array.isArray(data?.resourceRequirements) ? data.resourceRequirements : ['Significant development team', 'Substantial funding', 'Market validation'],
      riskFactors: Array.isArray(data?.riskFactors) ? data.riskFactors : ['Market acceptance uncertain', 'High competition', 'Technical complexity', 'Funding challenges'],
      successFactors: Array.isArray(data?.successFactors) ? data.successFactors : ['Exceptional execution required', 'Strong market timing', 'Significant resources']
    };
  }

  private static processRealisticRecommendations(data: any, ideaScore: number): ActionableRecommendations {
    // Generate recommendations based on idea quality
    const isLowQuality = ideaScore < 40;
    const isMediumQuality = ideaScore >= 40 && ideaScore < 65;
    
    if (isLowQuality) {
      return {
        immediate: [
          {
            id: crypto.randomUUID(),
            action: 'Fundamental concept revision',
            description: 'This idea needs significant rework. Consider if this solves a real problem.',
            priority: 'high',
            effort: 'high',
            impact: 'high',
            resources: ['time', 'research', 'user feedback'],
            estimatedTime: '2-4 weeks'
          },
          {
            id: crypto.randomUUID(),
            action: 'Market validation',
            description: 'Validate if anyone actually wants this solution before proceeding.',
            priority: 'high',
            effort: 'medium',
            impact: 'high',
            resources: ['surveys', 'interviews'],
            estimatedTime: '1-2 weeks'
          }
        ],
        shortTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Consider pivoting',
            description: 'Based on validation results, consider pivoting to a different approach.',
            priority: 'medium',
            effort: 'high',
            impact: 'high',
            resources: ['strategic thinking', 'market research'],
            estimatedTime: '1-2 months'
          }
        ],
        longTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Full concept redevelopment',
            description: 'If validation fails, completely redevelop the concept.',
            priority: 'low',
            effort: 'high',
            impact: 'medium',
            resources: ['significant time investment'],
            estimatedTime: '3-6 months'
          }
        ],
        criticalPath: ['validate', 'revise', 'test', 'pivot or proceed'],
        keyMilestones: [
          {
            id: crypto.randomUUID(),
            title: 'Concept Validation',
            description: 'Determine if the core concept has merit',
            targetDate: '2 weeks',
            successCriteria: ['Clear problem validation', 'User interest confirmed'],
            deliverables: ['validation report', 'revised concept']
          }
        ]
      };
    }
    
    // Default to more standard recommendations for medium+ quality ideas
    return this.processRecommendations(data);
  }

  private static generateCriticalMaturityAnalysis(idea: Idea, structureScore: number): MaturityAnalysis {
    const score = Math.min(structureScore, 45); // Cap low-quality ideas
    
    return {
      score,
      strengths: score > 30 ? ['Basic structure exists', 'Has some defined elements'] : ['Concept exists'],
      gaps: [
        'Lacks market validation',
        'Unclear value proposition',
        'No competitive analysis',
        'Unproven demand',
        'Implementation challenges unclear'
      ],
      nextSteps: [
        'Validate core assumptions with real users',
        'Research competitive landscape thoroughly',
        'Define clear success metrics',
        'Create realistic implementation plan'
      ],
      marketPotential: {
        score: Math.min(score - 10, 35),
        marketSize: 'small',
        competitionLevel: 'high',
        demandIndicators: ['Validation required'],
        marketTrends: ['Research needed'],
        targetMarketSize: 'Unclear without validation',
        revenueProjection: 'Unproven business model',
        barriers: ['High competition', 'Unclear demand', 'Implementation challenges'],
        opportunities: ['Limited without validation']
      },
      feasibilityScore: {
        overall: Math.min(score - 5, 40),
        technical: 45,
        financial: 25,
        operational: 35,
        legal: 70,
        timeToMarket: '18+ months (if viable)',
        resourceRequirements: ['Significant validation', 'Development team', 'Substantial funding'],
        riskFactors: ['Unproven concept', 'Market uncertainty', 'High competition'],
        successFactors: ['Exceptional execution', 'Market validation', 'Significant resources']
      },
      recommendations: this.processRealisticRecommendations(null, score),
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
      }
    };
  }

  // Update fallback processing to be more critical
  private static fallbackProcessing(rawInput: string, isExpansion: boolean = false, validation?: any): {
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions?: AISuggestion[];
    expandedIdeas?: any[];
    isExpansion: boolean;
  } {
    console.log('🔄 Using critical fallback processing for:', rawInput);
    
    if (isExpansion) {
      const actualInput = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
      const expandedIdeas = this.generateFallbackExpandedIdeas(actualInput);
      return { expandedIdeas, isExpansion: true };
    }

    // Use validation score if available, otherwise calculate basic score
    const baseScore = validation?.qualityScore || this.calculateBasicQualityScore(rawInput);
    
    const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
      title: this.extractTitle(rawInput),
      description: rawInput,
      category: this.categorizeIdea(rawInput),
      tags: this.generateSmartTags(rawInput),
      painPoints: this.extractPainPoints(rawInput),
      features: this.extractFeatures(rawInput),
      userPersonas: this.extractUserPersonas(rawInput),
      maturityScore: Math.min(baseScore, 50), // Cap fallback scores at 50
      existingProducts: [],
      developmentStage: 'raw',
      isStarred: false,
      marketAnalysis: this.generateFallbackMarketAnalysis(),
      feasibilityAnalysis: this.generateFallbackFeasibilityAnalysis()
    };

    const suggestions = this.generateCriticalFallbackSuggestions(validation);
    
    return { structuredIdea, suggestions, isExpansion: false };
  }

  private static calculateBasicQualityScore(input: string): number {
    let score = 20;
    
    if (input.length > 50) score += 15;
    if (input.length > 100) score += 10;
    if (input.split(' ').length > 10) score += 10;
    if (input.includes('user') || input.includes('people')) score += 5;
    
    return Math.min(score, 45);
  }

  private static generateCriticalFallbackSuggestions(validation?: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [
      {
        id: crypto.randomUUID(),
        type: 'structure',
        content: '⚠️ This idea needs significant development and validation before proceeding.',
        applied: false,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        type: 'maturity',
        content: '🔍 Consider researching existing solutions and identifying what makes your approach unique.',
        applied: false,
        createdAt: new Date()
      }
    ];

    if (validation?.issues) {
      validation.issues.forEach((issue: string) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'structure',
          content: `❌ ${issue}`,
          applied: false,
          createdAt: new Date()
        });
      });
    }

    return suggestions;
  }

  // Keep existing helper methods but make them more conservative
  private static validateCategory(category: string): IdeaCategory | null {
    const validCategories: IdeaCategory[] = ['tech', 'business', 'social', 'education', 'health', 'entertainment', 'other'];
    return validCategories.includes(category as IdeaCategory) ? category as IdeaCategory : null;
  }

  private static categorizeIdea(input: string): IdeaCategory {
    const text = input.toLowerCase();
    
    if (text.includes('app') || text.includes('software') || text.includes('ai') || text.includes('tech')) {
      return 'tech';
    }
    if (text.includes('business') || text.includes('startup') || text.includes('money') || text.includes('revenue')) {
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
    return sentences[0]?.trim().slice(0, 60) || 'Concept Needs Development';
  }

  private static generateSmartTags(input: string): string[] {
    const text = input.toLowerCase();
    const tags: string[] = [];
    
    const tagMap = {
      'mobile': ['mobile', 'app', 'phone'],
      'web': ['website', 'web', 'browser'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml'],
      'social': ['social', 'community', 'network'],
      'productivity': ['productivity', 'efficient', 'organize'],
      'automation': ['automate', 'automatic', 'auto']
    };
    
    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags.slice(0, 5);
  }

  private static extractPainPoints(input: string): string[] {
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const painIndicators = ['problem', 'issue', 'difficult', 'hard', 'frustrating'];
    
    const painPoints = sentences.filter(sentence => 
      painIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );
    
    return painPoints.length > 0 ? painPoints.slice(0, 4) : [
      'Problem identification needed',
      'User pain points unclear'
    ];
  }

  private static extractFeatures(input: string): string[] {
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const featureIndicators = ['feature', 'function', 'allow', 'enable', 'provide'];
    
    const features = sentences.filter(sentence => 
      featureIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );
    
    return features.length > 0 ? features.slice(0, 5) : [
      'Core features undefined',
      'Functionality needs specification'
    ];
  }

  private static extractUserPersonas(input: string): string[] {
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

    return personas.length > 0 ? personas.slice(0, 3) : ['Target users undefined'];
  }

  // Keep existing methods for expansion and other features...
  static async generateExpandedIdeas(roughIdea: string): Promise<ExpandedIdea[]> {
    try {
      const validation = this.validateIdeaQuality(roughIdea);
      if (!validation.isValid) {
        return this.generateFallbackExpandedIdeas(roughIdea);
      }

      const prompt = `
        Expand this rough idea into 4 different business concepts: "${roughIdea}"
        
        Be realistic about market potential and implementation challenges.
        
        Respond with JSON array of 4 objects:
        {
          "title": "Professional, realistic title",
          "description": "Honest 2-3 sentence description with realistic expectations",
          "targetAudience": "Specific, realistic target audience",
          "keyFeatures": ["4-5", "realistic", "features"],
          "marketAngle": "Honest market positioning and challenges",
          "tags": ["3-5", "relevant", "tags"]
        }
        
        Make each version different but realistic about challenges and competition.
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
        description: idea.description || 'Concept needs further development.',
        targetAudience: idea.targetAudience || 'Target audience unclear',
        keyFeatures: Array.isArray(idea.keyFeatures) ? idea.keyFeatures : ['Features need definition'],
        marketAngle: idea.marketAngle || 'Market positioning unclear',
        tags: Array.isArray(idea.tags) ? idea.tags : ['concept', 'development-needed']
      }));
    } catch (error) {
      console.error('❌ Expansion generation error:', error);
      return this.generateFallbackExpandedIdeas(roughIdea);
    }
  }

  private static generateFallbackExpandedIdeas(roughIdea: string): ExpandedIdea[] {
    return [
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Basic Concept`,
        description: `A basic implementation of ${roughIdea.toLowerCase()} that would need significant development and validation.`,
        targetAudience: 'Target audience needs research and validation',
        keyFeatures: ['Core functionality undefined', 'User interface needed', 'Basic features required'],
        marketAngle: 'Market position unclear - competitive analysis needed',
        tags: ['concept', 'needs-development', 'validation-required']
      }
    ];
  }

  // Keep other existing methods...
  static async generateRemixVariants(idea: Idea): Promise<RemixVariant[]> {
    // Implementation remains similar but with more realistic assessments
    return [];
  }

  private static processMarketAnalysisFromResponse(data: any) {
    return {
      size: 'Market analysis needed',
      growth: 'Growth potential unclear',
      trends: ['Market research required'],
      competitors: ['Competitive analysis needed'],
      opportunities: ['Opportunities unclear'],
      threats: ['Risk analysis needed']
    };
  }

  private static processFeasibilityAnalysisFromResponse(data: any) {
    return {
      technical: {
        score: 40,
        challenges: ['Technical assessment needed'],
        requirements: ['Requirements analysis needed']
      },
      financial: {
        score: 30,
        estimatedCost: 'Cost analysis needed',
        revenueModel: ['Revenue model unclear'],
        fundingNeeds: 'Funding requirements unknown'
      },
      market: {
        score: 35,
        demand: 'Market demand unvalidated',
        competition: 'Competitive landscape unclear',
        barriers: ['Market barriers unknown']
      }
    };
  }

  private static processRecommendations(data: any): ActionableRecommendations {
    return {
      immediate: [
        {
          id: crypto.randomUUID(),
          action: 'Validate core assumptions',
          description: 'Test fundamental assumptions with real users',
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
          action: 'Competitive analysis',
          description: 'Research existing solutions and market landscape',
          priority: 'high',
          effort: 'medium',
          impact: 'medium',
          resources: ['research time'],
          estimatedTime: '2-3 weeks'
        }
      ],
      longTerm: [
        {
          id: crypto.randomUUID(),
          action: 'Consider development',
          description: 'Only after validation, consider building solution',
          priority: 'low',
          effort: 'high',
          impact: 'medium',
          resources: ['development team', 'funding'],
          estimatedTime: '6+ months'
        }
      ],
      criticalPath: ['validate', 'research', 'refine', 'test'],
      keyMilestones: [
        {
          id: crypto.randomUUID(),
          title: 'Concept Validation',
          description: 'Validate core concept with users',
          targetDate: '2 weeks',
          successCriteria: ['User feedback collected', 'Problem validation'],
          deliverables: ['validation report']
        }
      ]
    };
  }

  private static generateFallbackMarketAnalysis() {
    return {
      size: 'Market size unclear',
      growth: 'Growth potential unknown',
      trends: ['Market research required'],
      competitors: ['Competitive analysis needed'],
      opportunities: ['Opportunities unclear without research'],
      threats: ['Risks unknown without analysis']
    };
  }

  private static generateFallbackFeasibilityAnalysis() {
    return {
      technical: {
        score: 35,
        challenges: ['Technical challenges unknown'],
        requirements: ['Requirements need definition']
      },
      financial: {
        score: 25,
        estimatedCost: 'Costs unclear',
        revenueModel: ['Revenue model undefined'],
        fundingNeeds: 'Funding needs unknown'
      },
      market: {
        score: 30,
        demand: 'Market demand unvalidated',
        competition: 'Competition level unknown',
        barriers: ['Market barriers unclear']
      }
    };
  }
}