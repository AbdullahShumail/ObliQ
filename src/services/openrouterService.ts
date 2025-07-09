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

  // ULTRA-STRICT validation to catch nonsensical business ideas
  private static validateIdeaQuality(input: string): {
    isValid: boolean;
    issues: string[];
    qualityScore: number;
    isNonsensical: boolean;
  } {
    const issues: string[] = [];
    let qualityScore = 30; // Start lower
    let isNonsensical = false;
    
    const text = input.toLowerCase().trim();
    
    // CRITICAL: Check for obviously nonsensical business models
    const nonsensicalPatterns = [
      // Financial nonsense
      /buy.*high.*sell.*low/,
      /purchase.*expensive.*sell.*cheap/,
      /lose.*money.*intentionally/,
      /guaranteed.*loss/,
      /negative.*profit/,
      
      // Logical contradictions
      /free.*expensive/,
      /always.*never/,
      /impossible.*easy/,
      /infinite.*limited/,
      
      // Clearly bad business models
      /give.*away.*everything/,
      /work.*for.*free/,
      /no.*revenue/,
      /burn.*money/,
      
      // Gibberish patterns
      /(.)\1{5,}/, // Repeated characters
      /qwerty|asdf|zxcv|123456789|abcdefgh/,
      /random.*text|test.*test|example.*example/
    ];
    
    // Check for nonsensical patterns
    if (nonsensicalPatterns.some(pattern => pattern.test(text))) {
      isNonsensical = true;
      issues.push('This appears to be a fundamentally flawed or nonsensical business concept');
      qualityScore = 5; // Maximum 5% for nonsensical ideas
    }
    
    // Check for basic quality issues
    if (text.length < 15) {
      issues.push('Idea is too short and lacks detail');
      qualityScore -= 20;
    }
    
    // Check for gibberish
    const words = text.split(/\s+/);
    const avgWordLength = text.replace(/\s/g, '').length / words.length;
    const hasRepeatedChars = /(.)\1{4,}/.test(text);
    
    if (hasRepeatedChars || avgWordLength < 2.5) {
      issues.push('Input appears to be gibberish or random text');
      qualityScore -= 30;
      isNonsensical = true;
    }
    
    // Check for coherent business logic
    const businessWords = ['profit', 'revenue', 'customer', 'market', 'sell', 'buy', 'service', 'product'];
    const hasBusinessContext = businessWords.some(word => text.includes(word));
    
    if (hasBusinessContext) {
      // If it mentions business concepts, check for logical consistency
      if (text.includes('buy') && text.includes('sell')) {
        // Check for buy high/sell low pattern (financial suicide)
        const buyHighSellLow = /buy.*(?:high|expensive|premium).*sell.*(?:low|cheap|discount)/ ||
                              /purchase.*(?:high|expensive).*sell.*(?:low|cheap)/ ||
                              /expensive.*buy.*cheap.*sell/;
        
        if (buyHighSellLow.test(text)) {
          isNonsensical = true;
          issues.push('This business model would guarantee financial losses');
          qualityScore = 3;
        }
      }
    }
    
    // Check for problem/solution coherence
    const problemIndicators = ['problem', 'issue', 'difficult', 'hard', 'frustrating', 'need', 'want', 'solve', 'help', 'improve'];
    const solutionIndicators = ['app', 'platform', 'service', 'tool', 'system', 'website', 'solution'];
    
    const hasProblem = problemIndicators.some(indicator => text.includes(indicator));
    const hasSolution = solutionIndicators.some(indicator => text.includes(indicator));
    
    if (!hasProblem && !hasSolution && !isNonsensical) {
      issues.push('No clear problem or solution identified');
      qualityScore -= 15;
    }
    
    // Check for sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 1 || sentences.every(s => s.split(' ').length < 4)) {
      issues.push('Lacks coherent explanation');
      qualityScore -= 20;
    }
    
    // Positive indicators (only if not nonsensical)
    if (!isNonsensical) {
      if (text.includes('user') || text.includes('customer')) qualityScore += 8;
      if (text.includes('market') && !text.includes('buy high sell low')) qualityScore += 8;
      if (words.length >= 15) qualityScore += 10;
      if (sentences.length >= 2) qualityScore += 8;
    }
    
    // Final score bounds
    qualityScore = Math.max(isNonsensical ? 3 : 5, Math.min(isNonsensical ? 8 : 100, qualityScore));
    
    return {
      isValid: qualityScore >= 25 && !isNonsensical,
      issues,
      qualityScore,
      isNonsensical
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
          "temperature": 0.2, // Even lower temperature for more consistent critical responses
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
      
      // ULTRA-STRICT validation
      const validation = this.validateIdeaQuality(rawInput);
      console.log('🔍 Strict validation result:', validation);
      
      // Check if this is an expansion request
      const isExpansionRequest = rawInput.toLowerCase().includes('expand this rough idea');
      
      if (isExpansionRequest) {
        const roughIdea = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
        const roughValidation = this.validateIdeaQuality(roughIdea);
        
        if (roughValidation.isNonsensical || !roughValidation.isValid) {
          console.warn('⚠️ Rough idea failed strict validation, using critical fallback');
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
        
        if (!validation.isValid) {
          console.warn('⚠️ Idea failed validation, using critical fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }
        
        const prompt = `
          You are an EXTREMELY CRITICAL and BRUTALLY HONEST business analyst. Analyze this idea with ZERO tolerance for bad concepts: "${rawInput}"
          
          CRITICAL INSTRUCTIONS:
          - If this is a fundamentally flawed business model (like buying high and selling low), give it a score of 5-15
          - If it's nonsensical or gibberish, score it 5-10
          - If it's a mediocre idea with issues, score it 20-45
          - Only good, viable ideas should score 50+
          - NEVER give inflated scores to bad ideas
          - Be brutally honest about flaws and impossibilities
          
          Consider these CRITICAL factors:
          - Does this make basic business sense?
          - Would this actually generate profit?
          - Is there real market demand?
          - What are the fatal flaws?
          - Is this even logically possible?
          
          Respond with JSON:
          {
            "title": "Honest title reflecting quality",
            "description": "Brutally honest description",
            "category": "tech/business/social/education/health/entertainment/other",
            "tags": ["honest", "tags"],
            "painPoints": ["real", "problems", "if", "any"],
            "features": ["realistic", "features", "if", "viable"],
            "userPersonas": ["actual", "users", "if", "they", "exist"],
            "realityCheck": {
              "viabilityScore": 15,
              "businessLogic": "fundamentally flawed/questionable/viable",
              "marketDemand": "nonexistent/low/medium/high",
              "profitability": "impossible/unlikely/possible/likely",
              "competitionLevel": "irrelevant/low/medium/high/saturated",
              "implementationDifficulty": "impossible/extreme/high/medium/low",
              "fatalFlaws": ["critical", "problems", "that", "kill", "this", "idea"],
              "marketReality": "brutal honest assessment"
            },
            "suggestions": [
              {
                "type": "critical",
                "content": "honest feedback about fundamental problems"
              }
            ]
          }
          
          BE RUTHLESSLY HONEST. Bad ideas deserve bad scores. Don't sugarcoat failures.
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
          console.warn('⚠️ Failed to parse AI response, using critical fallback');
          return this.fallbackProcessing(rawInput, false, validation);
        }

        // ULTRA-STRICT scoring with multiple validation layers
        const finalScore = this.calculateUltraStrictScore(parsedResponse, validation, rawInput);

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

        // Generate ultra-critical suggestions
        const suggestions: AISuggestion[] = this.generateUltraCriticalSuggestions(parsedResponse, validation, finalScore);

        console.log('🎯 Final structured idea with ultra-strict scoring:', structuredIdea);

        return { structuredIdea, suggestions, isExpansion: false };
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      return this.fallbackProcessing(rawInput, rawInput.toLowerCase().includes('expand this rough idea'));
    }
  }

  private static calculateUltraStrictScore(aiResponse: any, validation: any, originalInput: string): number {
    const text = originalInput.toLowerCase();
    
    // IMMEDIATE DISQUALIFIERS - These get 3-8% maximum
    if (validation.isNonsensical) {
      console.log('🚫 Nonsensical idea detected - maximum 8%');
      return Math.min(8, validation.qualityScore);
    }
    
    // Check for specific business logic failures
    if (text.includes('buy') && text.includes('sell')) {
      const buyHighSellLow = /buy.*(?:high|expensive|premium).*sell.*(?:low|cheap|discount)/ ||
                            /purchase.*(?:high|expensive).*sell.*(?:low|cheap)/ ||
                            /expensive.*buy.*cheap.*sell/;
      
      if (buyHighSellLow.test(text)) {
        console.log('💸 Buy high/sell low detected - guaranteed loss model - 5%');
        return 5;
      }
    }
    
    // Other immediate disqualifiers
    const fatalPatterns = [
      /lose.*money.*intentionally/,
      /guaranteed.*loss/,
      /negative.*profit/,
      /give.*away.*everything/,
      /work.*for.*free.*always/,
      /no.*revenue.*ever/
    ];
    
    if (fatalPatterns.some(pattern => pattern.test(text))) {
      console.log('💀 Fatal business flaw detected - 3-7%');
      return Math.floor(Math.random() * 5) + 3; // 3-7%
    }
    
    // Start with validation score but cap it
    let score = Math.min(validation.qualityScore, 45); // Hard cap at 45 initially
    
    // Apply AI reality check penalties
    const realityCheck = aiResponse.realityCheck;
    if (realityCheck) {
      // Business logic check
      if (realityCheck.businessLogic === 'fundamentally flawed') {
        score = Math.min(score, 15);
        console.log('🔴 Fundamentally flawed business logic - capped at 15%');
      } else if (realityCheck.businessLogic === 'questionable') {
        score = Math.min(score, 35);
      }
      
      // Profitability check
      if (realityCheck.profitability === 'impossible') {
        score = Math.min(score, 10);
        console.log('💰 Impossible profitability - capped at 10%');
      } else if (realityCheck.profitability === 'unlikely') {
        score = Math.min(score, 25);
      }
      
      // Market demand penalties
      if (realityCheck.marketDemand === 'nonexistent') {
        score -= 20;
        console.log('📉 No market demand - penalty applied');
      } else if (realityCheck.marketDemand === 'low') {
        score -= 10;
      }
      
      // Implementation difficulty
      if (realityCheck.implementationDifficulty === 'impossible') {
        score = Math.min(score, 8);
        console.log('⚙️ Impossible to implement - capped at 8%');
      } else if (realityCheck.implementationDifficulty === 'extreme') {
        score -= 15;
      }
      
      // Fatal flaws penalty
      if (realityCheck.fatalFlaws && realityCheck.fatalFlaws.length > 2) {
        score -= realityCheck.fatalFlaws.length * 5;
        console.log(`🚨 ${realityCheck.fatalFlaws.length} fatal flaws detected - major penalty`);
      }
    }
    
    // Validation issue penalties
    if (validation.issues.length > 0) {
      score -= validation.issues.length * 8;
    }
    
    // Positive adjustments (only for non-terrible ideas)
    if (score > 20) {
      if (Array.isArray(aiResponse.painPoints) && aiResponse.painPoints.length >= 2) score += 5;
      if (Array.isArray(aiResponse.features) && aiResponse.features.length >= 3) score += 5;
      if (Array.isArray(aiResponse.userPersonas) && aiResponse.userPersonas.length >= 2) score += 3;
    }
    
    // ABSOLUTE CAPS based on idea quality
    if (validation.qualityScore < 20) {
      score = Math.min(score, 15); // Very low quality ideas max 15%
    } else if (validation.qualityScore < 40) {
      score = Math.min(score, 35); // Low quality ideas max 35%
    } else if (validation.qualityScore < 60) {
      score = Math.min(score, 55); // Medium quality ideas max 55%
    } else {
      score = Math.min(score, 80); // Even good ideas max 80%
    }
    
    const finalScore = Math.max(3, Math.min(80, score)); // Absolute bounds: 3-80%
    
    console.log(`📊 Ultra-strict scoring: ${finalScore}% (validation: ${validation.qualityScore}%, issues: ${validation.issues.length})`);
    
    return finalScore;
  }

  private static generateUltraCriticalSuggestions(aiResponse: any, validation: any, finalScore: number): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // For terrible ideas (< 20%), be brutally honest
    if (finalScore < 20) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '🚫 This concept has fundamental flaws that make it unviable. Consider completely rethinking the approach.',
        applied: false,
        createdAt: new Date()
      });
      
      if (validation.isNonsensical) {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'critical',
          content: '❌ This appears to be nonsensical or contradictory. Please provide a coherent business concept.',
          applied: false,
          createdAt: new Date()
        });
      }
    }
    
    // Add validation-based critical feedback
    validation.issues.forEach((issue: string) => {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: `⚠️ Critical issue: ${issue}`,
        applied: false,
        createdAt: new Date()
      });
    });
    
    // Add AI reality check feedback
    const realityCheck = aiResponse.realityCheck;
    if (realityCheck?.fatalFlaws) {
      realityCheck.fatalFlaws.forEach((flaw: string) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'critical',
          content: `💀 Fatal flaw: ${flaw}`,
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    // Business logic specific feedback
    if (realityCheck?.businessLogic === 'fundamentally flawed') {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '💸 This business model would result in guaranteed losses. Reconsider the fundamental approach.',
        applied: false,
        createdAt: new Date()
      });
    }
    
    // Add AI suggestions if they exist
    if (Array.isArray(aiResponse.suggestions)) {
      aiResponse.suggestions.forEach((s: any) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: s.type || 'critical',
          content: s.content || 'This idea needs significant improvement.',
          applied: false,
          createdAt: new Date()
        });
      });
    }
    
    // Ensure we have at least one suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: 'This concept requires substantial development and validation before it can be considered viable.',
        applied: false,
        createdAt: new Date()
      });
    }
    
    return suggestions.slice(0, 6); // Limit to 6 critical suggestions
  }

  static async analyzeIdeaMaturity(idea: Idea): Promise<MaturityAnalysis> {
    try {
      console.log('📈 Ultra-strict maturity analysis for:', idea.title);
      
      // Pre-validate the idea structure
      const structureScore = this.calculateStructureScore(idea);
      const validation = this.validateIdeaQuality(idea.description);
      
      // For nonsensical ideas, skip AI and return critical analysis
      if (validation.isNonsensical) {
        return this.generateUltraCriticalMaturityAnalysis(idea, 5);
      }
      
      const prompt = `
        You are a RUTHLESSLY CRITICAL business analyst. Provide BRUTALLY HONEST maturity analysis for this idea:
        
        Title: ${idea.title}
        Description: ${idea.description}
        Pain Points: ${idea.painPoints.join(', ')}
        Features: ${idea.features.join(', ')}
        User Personas: ${idea.userPersonas.join(', ')}
        Category: ${idea.category}
        
        CRITICAL INSTRUCTIONS:
        - If this is fundamentally flawed (like buying high/selling low), score it 5-15
        - If it's nonsensical, score it 5-10
        - If it has major business logic problems, score it 15-30
        - Only genuinely viable ideas should score 40+
        - Be BRUTALLY honest about fatal flaws
        - Don't inflate scores for bad ideas
        
        Consider:
        - Does this make basic business sense?
        - Are there fatal logical contradictions?
        - Is profitability actually possible?
        - What would kill this idea in the real world?
        
        Respond with JSON:
        {
          "score": 12,
          "strengths": ["honest", "strengths", "if", "any", "exist"],
          "gaps": ["brutal", "honest", "gaps", "and", "fatal", "flaws"],
          "nextSteps": ["realistic", "steps", "or", "abandon", "advice"],
          "marketPotential": {
            "score": 10,
            "marketSize": "nonexistent/small/medium/large",
            "competitionLevel": "irrelevant/low/medium/high/saturated",
            "demandIndicators": ["honest", "demand", "assessment"],
            "marketTrends": ["relevant", "trends", "if", "any"],
            "targetMarketSize": "brutal honest market size",
            "revenueProjection": "honest revenue potential or lack thereof",
            "barriers": ["real", "insurmountable", "barriers"],
            "opportunities": ["genuine", "opportunities", "if", "any", "exist"]
          },
          "feasibilityScore": {
            "overall": 15,
            "technical": 20,
            "financial": 5,
            "operational": 10,
            "legal": 60,
            "timeToMarket": "impossible/years/realistic timeline",
            "resourceRequirements": ["massive", "unrealistic", "requirements"],
            "riskFactors": ["guaranteed", "failure", "risks"],
            "successFactors": ["impossible", "requirements", "for", "success"]
          },
          "fatalFlaws": ["fundamental", "problems", "that", "kill", "this"],
          "businessLogicCheck": "fundamentally flawed/questionable/viable"
        }
        
        BE RUTHLESS. Bad ideas deserve brutal honesty, not false hope.
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
        console.warn('⚠️ Failed to parse maturity analysis, using ultra-critical fallback');
        return this.generateUltraCriticalMaturityAnalysis(idea, structureScore);
      }

      // Apply ultra-strict scoring with multiple validation layers
      const finalScore = this.calculateUltraStrictMaturityScore(analysis, validation, structureScore, idea);

      const result = {
        score: finalScore,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : (finalScore > 30 ? ['Basic concept exists'] : ['No significant strengths identified']),
        gaps: Array.isArray(analysis.gaps) ? analysis.gaps : ['Fundamental viability issues'],
        nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : (finalScore < 20 ? ['Consider abandoning this approach'] : ['Validate core assumptions']),
        marketPotential: this.processUltraRealisticMarketPotential(analysis.marketPotential, finalScore),
        feasibilityScore: this.processUltraRealisticFeasibilityScore(analysis.feasibilityScore, finalScore),
        recommendations: this.processUltraRealisticRecommendations(analysis.recommendations, finalScore),
        missingElements: {
          painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
          features: Math.max(0, 4 - (idea.features?.length || 0)),
          userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
          branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
        }
      };

      console.log('✅ Ultra-critical maturity analysis:', result);
      return result;
    } catch (error) {
      console.error('❌ Maturity analysis error:', error);
      return this.generateUltraCriticalMaturityAnalysis(idea, 10);
    }
  }

  private static calculateUltraStrictMaturityScore(analysis: any, validation: any, structureScore: number, idea: Idea): number {
    // Check for nonsensical ideas first
    if (validation.isNonsensical) {
      return Math.min(8, validation.qualityScore);
    }
    
    // Check business logic
    if (analysis.businessLogicCheck === 'fundamentally flawed') {
      return Math.min(15, structureScore);
    }
    
    // Start with AI score but apply strict caps
    let score = Math.min(analysis.score || 25, structureScore + 20);
    
    // Apply validation penalties
    if (validation.issues.length > 0) {
      score -= validation.issues.length * 10;
    }
    
    // Market potential penalties
    const marketPotential = analysis.marketPotential;
    if (marketPotential) {
      if (marketPotential.marketSize === 'nonexistent') score -= 25;
      if (marketPotential.score < 20) score -= 15;
    }
    
    // Feasibility penalties
    const feasibility = analysis.feasibilityScore;
    if (feasibility) {
      if (feasibility.financial < 20) score -= 20;
      if (feasibility.overall < 25) score -= 15;
    }
    
    // Fatal flaws check
    if (analysis.fatalFlaws && analysis.fatalFlaws.length > 2) {
      score -= analysis.fatalFlaws.length * 8;
    }
    
    // Structure-based caps
    if (structureScore < 30) {
      score = Math.min(score, 25);
    } else if (structureScore < 50) {
      score = Math.min(score, 45);
    }
    
    return Math.max(3, Math.min(75, score)); // Absolute bounds: 3-75%
  }

  private static calculateStructureScore(idea: Idea): number {
    let score = 5; // Start very low
    
    if (idea.title && idea.title.length > 5 && !idea.title.includes('New Idea')) score += 12;
    if (idea.description && idea.description.length > 50) score += 12;
    if (idea.painPoints && idea.painPoints.length >= 2) score += 15;
    if (idea.features && idea.features.length >= 3) score += 15;
    if (idea.userPersonas && idea.userPersonas.length >= 2) score += 12;
    if (idea.tags && idea.tags.length >= 3) score += 4;
    
    return Math.min(score, 50); // Cap structure score at 50
  }

  private static processUltraRealisticMarketPotential(data: any, ideaScore: number): MarketPotential {
    // For terrible ideas, reflect that in market potential
    const maxScore = ideaScore < 20 ? 15 : (ideaScore < 40 ? 35 : 60);
    
    return {
      score: Math.min(Math.max(data?.score || 20, 5), maxScore),
      marketSize: ideaScore < 20 ? 'small' : (['small', 'medium', 'large'].includes(data?.marketSize) ? data.marketSize : 'small'),
      competitionLevel: ideaScore < 20 ? 'irrelevant' : (['low', 'medium', 'high', 'saturated'].includes(data?.competitionLevel) ? data.competitionLevel : 'high'),
      demandIndicators: Array.isArray(data?.demandIndicators) ? data.demandIndicators : (ideaScore < 20 ? ['No demand identified'] : ['Demand validation needed']),
      marketTrends: Array.isArray(data?.marketTrends) ? data.marketTrends : ['Market research required'],
      targetMarketSize: data?.targetMarketSize || (ideaScore < 20 ? 'Nonexistent market' : 'Market size unclear'),
      revenueProjection: data?.revenueProjection || (ideaScore < 20 ? 'No viable revenue model' : 'Revenue model unproven'),
      barriers: Array.isArray(data?.barriers) ? data.barriers : (ideaScore < 20 ? ['Fundamental business flaws', 'No market demand'] : ['High competition', 'Market entry costs']),
      opportunities: Array.isArray(data?.opportunities) ? data.opportunities : (ideaScore < 20 ? ['No opportunities identified'] : ['Limited opportunities'])
    };
  }

  private static processUltraRealisticFeasibilityScore(data: any, ideaScore: number): FeasibilityScore {
    // For terrible ideas, reflect that in feasibility
    const maxOverall = ideaScore < 20 ? 20 : (ideaScore < 40 ? 40 : 65);
    
    return {
      overall: Math.min(Math.max(data?.overall || 25, 5), maxOverall),
      technical: Math.min(Math.max(data?.technical || 30, 10), ideaScore < 20 ? 25 : 70),
      financial: Math.min(Math.max(data?.financial || 20, 5), ideaScore < 20 ? 15 : 60),
      operational: Math.min(Math.max(data?.operational || 25, 10), ideaScore < 20 ? 20 : 65),
      legal: Math.min(Math.max(data?.legal || 50, 30), 85),
      timeToMarket: data?.timeToMarket || (ideaScore < 20 ? 'Not viable' : '18+ months'),
      resourceRequirements: Array.isArray(data?.resourceRequirements) ? data.resourceRequirements : (ideaScore < 20 ? ['Concept revision required'] : ['Significant resources needed']),
      riskFactors: Array.isArray(data?.riskFactors) ? data.riskFactors : (ideaScore < 20 ? ['Fundamental concept flaws', 'No viable path forward'] : ['High uncertainty', 'Market risks']),
      successFactors: Array.isArray(data?.successFactors) ? data.successFactors : (ideaScore < 20 ? ['Complete concept overhaul required'] : ['Exceptional execution needed'])
    };
  }

  private static processUltraRealisticRecommendations(data: any, ideaScore: number): ActionableRecommendations {
    if (ideaScore < 20) {
      return {
        immediate: [
          {
            id: crypto.randomUUID(),
            action: 'Abandon or completely rethink',
            description: 'This concept has fundamental flaws. Consider abandoning or completely rethinking the approach.',
            priority: 'high',
            effort: 'high',
            impact: 'high',
            resources: ['strategic thinking', 'new concept development'],
            estimatedTime: '2-4 weeks'
          }
        ],
        shortTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Explore alternative approaches',
            description: 'If abandoning, explore completely different approaches to the problem space.',
            priority: 'medium',
            effort: 'high',
            impact: 'medium',
            resources: ['research', 'brainstorming'],
            estimatedTime: '1-2 months'
          }
        ],
        longTerm: [
          {
            id: crypto.randomUUID(),
            action: 'Start fresh',
            description: 'Develop entirely new concepts based on lessons learned.',
            priority: 'low',
            effort: 'high',
            impact: 'medium',
            resources: ['time', 'new perspective'],
            estimatedTime: '3+ months'
          }
        ],
        criticalPath: ['abandon', 'rethink', 'restart'],
        keyMilestones: [
          {
            id: crypto.randomUUID(),
            title: 'Concept Abandonment Decision',
            description: 'Decide whether to abandon or completely rework',
            targetDate: '1 week',
            successCriteria: ['Clear decision made', 'Alternative approaches identified'],
            deliverables: ['decision document']
          }
        ]
      };
    }
    
    // For medium+ quality ideas, use standard recommendations
    return this.processRecommendations(data);
  }

  private static generateUltraCriticalMaturityAnalysis(idea: Idea, structureScore: number): MaturityAnalysis {
    const score = Math.min(structureScore, 20); // Cap terrible ideas at 20%
    
    return {
      score,
      strengths: score > 15 ? ['Basic structure exists'] : ['No significant strengths identified'],
      gaps: [
        'Fundamental business logic flaws',
        'No viable path to profitability',
        'Lacks market validation',
        'Unclear value proposition',
        'Implementation challenges insurmountable'
      ],
      nextSteps: score < 15 ? [
        'Consider abandoning this approach',
        'Explore completely different concepts',
        'Validate basic business assumptions'
      ] : [
        'Validate core assumptions with real users',
        'Research competitive landscape',
        'Define clear success metrics'
      ],
      marketPotential: {
        score: Math.min(score - 5, 15),
        marketSize: 'small',
        competitionLevel: 'irrelevant',
        demandIndicators: ['No demand identified'],
        marketTrends: ['Not applicable'],
        targetMarketSize: 'Nonexistent or unclear',
        revenueProjection: 'No viable revenue model',
        barriers: ['Fundamental concept flaws', 'No market demand', 'Business logic failures'],
        opportunities: ['No opportunities identified']
      },
      feasibilityScore: {
        overall: Math.min(score, 15),
        technical: 20,
        financial: 5,
        operational: 15,
        legal: 60,
        timeToMarket: 'Not viable',
        resourceRequirements: ['Complete concept revision', 'New approach needed'],
        riskFactors: ['Guaranteed failure', 'Fundamental flaws', 'No viable path'],
        successFactors: ['Complete concept overhaul required', 'New approach needed']
      },
      recommendations: this.processUltraRealisticRecommendations(null, score),
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
      }
    };
  }

  // Update fallback processing to be ultra-critical
  private static fallbackProcessing(rawInput: string, isExpansion: boolean = false, validation?: any): {
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions?: AISuggestion[];
    expandedIdeas?: any[];
    isExpansion: boolean;
  } {
    console.log('🔄 Using ultra-critical fallback processing for:', rawInput);
    
    if (isExpansion) {
      const actualInput = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
      const expandedIdeas = this.generateFallbackExpandedIdeas(actualInput);
      return { expandedIdeas, isExpansion: true };
    }

    // Use validation score if available, otherwise calculate basic score
    const baseScore = validation?.qualityScore || this.calculateBasicQualityScore(rawInput);
    
    // For nonsensical ideas, cap at 8%
    const finalScore = validation?.isNonsensical ? Math.min(baseScore, 8) : Math.min(baseScore, 35);
    
    const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
      title: this.extractTitle(rawInput),
      description: rawInput,
      category: this.categorizeIdea(rawInput),
      tags: this.generateSmartTags(rawInput),
      painPoints: this.extractPainPoints(rawInput),
      features: this.extractFeatures(rawInput),
      userPersonas: this.extractUserPersonas(rawInput),
      maturityScore: finalScore,
      existingProducts: [],
      developmentStage: 'raw',
      isStarred: false,
      marketAnalysis: this.generateFallbackMarketAnalysis(),
      feasibilityAnalysis: this.generateFallbackFeasibilityAnalysis()
    };

    const suggestions = this.generateUltraCriticalFallbackSuggestions(validation, finalScore);
    
    return { structuredIdea, suggestions, isExpansion: false };
  }

  private static calculateBasicQualityScore(input: string): number {
    let score = 15; // Start lower
    
    if (input.length > 50) score += 10;
    if (input.length > 100) score += 8;
    if (input.split(' ').length > 10) score += 7;
    if (input.includes('user') || input.includes('people')) score += 5;
    
    return Math.min(score, 35); // Cap fallback scores at 35
  }

  private static generateUltraCriticalFallbackSuggestions(validation?: any, score?: number): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    if (score && score < 15) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '🚫 This concept appears to have fundamental flaws. Consider completely rethinking the approach.',
        applied: false,
        createdAt: new Date()
      });
    } else {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'structure',
        content: '⚠️ This idea needs significant development and validation before proceeding.',
        applied: false,
        createdAt: new Date()
      });
    }

    if (validation?.isNonsensical) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'critical',
        content: '❌ This appears to be nonsensical or contradictory. Please provide a coherent business concept.',
        applied: false,
        createdAt: new Date()
      });
    }

    if (validation?.issues) {
      validation.issues.forEach((issue: string) => {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'structure',
          content: `🔍 Critical issue: ${issue}`,
          applied: false,
          createdAt: new Date()
        });
      });
    }

    return suggestions.slice(0, 5);
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
      if (!validation.isValid || validation.isNonsensical) {
        return this.generateFallbackExpandedIdeas(roughIdea);
      }

      const prompt = `
        Expand this rough idea into 4 different business concepts: "${roughIdea}"
        
        Be BRUTALLY REALISTIC about market potential and implementation challenges.
        Don't create fantasy scenarios - be honest about difficulties.
        
        Respond with JSON array of 4 objects:
        {
          "title": "Realistic, honest title",
          "description": "Honest 2-3 sentence description with realistic challenges mentioned",
          "targetAudience": "Specific, realistic target audience",
          "keyFeatures": ["4-5", "realistic", "achievable", "features"],
          "marketAngle": "Honest market positioning including challenges and competition",
          "tags": ["3-5", "relevant", "tags"]
        }
        
        Make each version different but realistic about the significant challenges.
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
        description: idea.description || 'Concept needs significant development and faces major challenges.',
        targetAudience: idea.targetAudience || 'Target audience unclear',
        keyFeatures: Array.isArray(idea.keyFeatures) ? idea.keyFeatures : ['Features need definition'],
        marketAngle: idea.marketAngle || 'Market positioning unclear - high competition expected',
        tags: Array.isArray(idea.tags) ? idea.tags : ['concept', 'high-risk']
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
        description: `A basic implementation of ${roughIdea.toLowerCase()} that would face significant development challenges, market competition, and validation requirements.`,
        targetAudience: 'Target audience needs extensive research and validation',
        keyFeatures: ['Core functionality undefined', 'User interface needed', 'Basic features require development'],
        marketAngle: 'Market position unclear - expect high competition and significant barriers to entry',
        tags: ['concept', 'high-risk', 'validation-required', 'development-intensive']
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
        score: 30,
        challenges: ['Technical assessment needed'],
        requirements: ['Requirements analysis needed']
      },
      financial: {
        score: 20,
        estimatedCost: 'Cost analysis needed',
        revenueModel: ['Revenue model unclear'],
        fundingNeeds: 'Funding requirements unknown'
      },
      market: {
        score: 25,
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
        score: 25,
        challenges: ['Technical challenges unknown'],
        requirements: ['Requirements need definition']
      },
      financial: {
        score: 15,
        estimatedCost: 'Costs unclear',
        revenueModel: ['Revenue model undefined'],
        fundingNeeds: 'Funding needs unknown'
      },
      market: {
        score: 20,
        demand: 'Market demand unvalidated',
        competition: 'Competition level unknown',
        barriers: ['Market barriers unclear']
      }
    };
  }
}