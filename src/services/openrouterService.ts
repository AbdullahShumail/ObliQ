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

  private static async makeAPICall(messages: Array<{role: string, content: string}>): Promise<string> {
    try {
      console.log('🤖 Making API call to OpenRouter...');
      console.log('🔑 API Key present:', !!this.API_KEY);
      console.log('🔑 API Key starts with:', this.API_KEY?.substring(0, 10) + '...');
      console.log('📝 Messages:', messages);
      
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
          "temperature": 0.7,
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
          throw new Error(`Authentication failed (401). Please check your OpenRouter API key. Make sure it's valid and has sufficient credits.`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded (429). Please wait a moment before trying again.`);
        } else {
          throw new Error(`API request failed (${response.status}): ${response.statusText}`);
        }
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      console.log('✅ AI Response received:');
      console.log('📄 Raw response:', aiResponse);
      
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
      
      // Check if this is an expansion request
      const isExpansionRequest = rawInput.toLowerCase().includes('expand this rough idea');
      
      if (isExpansionRequest) {
        // Extract the actual rough idea from the expansion prompt
        const roughIdea = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
        console.log('🔄 Expansion Engine - Processing rough idea:', roughIdea);
        
        const expandedIdeas = await this.generateExpandedIdeas(roughIdea);
        return { expandedIdeas, isExpansion: true };
      } else {
        console.log('📊 Idea Analyzer - Processing detailed idea:', rawInput);
        
        const prompt = `
          Analyze this detailed idea and provide comprehensive structured feedback: "${rawInput}"
          
          Please respond with a JSON object containing:
          {
            "title": "A refined, professional title (max 60 chars)",
            "description": "Enhanced description with more detail and clarity",
            "category": "One of: tech, business, social, education, health, entertainment, other",
            "tags": ["array", "of", "3-5", "relevant", "tags"],
            "painPoints": ["array", "of", "2-4", "problems", "this", "solves"],
            "features": ["array", "of", "3-5", "key", "features"],
            "userPersonas": ["array", "of", "2-3", "target", "user", "types"],
            "marketAnalysis": {
              "size": "estimated market size",
              "growth": "growth potential",
              "trends": ["relevant", "market", "trends"],
              "competitors": ["potential", "competitors"],
              "opportunities": ["market", "opportunities"],
              "threats": ["potential", "threats"]
            },
            "feasibilityAnalysis": {
              "technical": {
                "score": 85,
                "challenges": ["technical", "challenges"],
                "requirements": ["technical", "requirements"]
              },
              "financial": {
                "score": 75,
                "estimatedCost": "development cost estimate",
                "revenueModel": ["potential", "revenue", "streams"],
                "fundingNeeds": "funding requirements"
              },
              "market": {
                "score": 80,
                "demand": "market demand assessment",
                "competition": "competitive landscape",
                "barriers": ["market", "barriers"]
              }
            },
            "suggestions": [
              {
                "type": "structure",
                "content": "suggestion text"
              }
            ]
          }
          
          Focus on analyzing and improving the existing idea rather than expanding it.
        `;

        const response = await this.makeAPICall([
          { role: "user", content: prompt }
        ]);

        // Parse the JSON response
        let parsedResponse;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : response;
          parsedResponse = JSON.parse(jsonString);
          
          console.log('✅ Parsed AI response:', parsedResponse);
        } catch (parseError) {
          console.warn('⚠️ Failed to parse AI response, using fallback:', parseError);
          return this.fallbackProcessing(rawInput, false);
        }

        // Process the structured idea
        const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
          title: parsedResponse.title || this.extractTitle(rawInput),
          description: parsedResponse.description || rawInput,
          category: this.validateCategory(parsedResponse.category) || this.categorizeIdea(rawInput),
          tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags.slice(0, 5) : this.generateSmartTags(rawInput),
          painPoints: Array.isArray(parsedResponse.painPoints) ? parsedResponse.painPoints.slice(0, 4) : this.extractPainPoints(rawInput),
          features: Array.isArray(parsedResponse.features) ? parsedResponse.features.slice(0, 5) : this.extractFeatures(rawInput),
          userPersonas: Array.isArray(parsedResponse.userPersonas) ? parsedResponse.userPersonas.slice(0, 3) : this.extractUserPersonas(rawInput),
          maturityScore: this.calculateMaturityScore(parsedResponse),
          existingProducts: [],
          developmentStage: 'raw',
          isStarred: false,
          marketAnalysis: this.processMarketAnalysisFromResponse(parsedResponse.marketAnalysis),
          feasibilityAnalysis: this.processFeasibilityAnalysisFromResponse(parsedResponse.feasibilityAnalysis)
        };

        const suggestions: AISuggestion[] = Array.isArray(parsedResponse.suggestions) 
          ? parsedResponse.suggestions.map((s: any) => ({
              id: crypto.randomUUID(),
              type: s.type || 'structure',
              content: s.content || 'Consider expanding on this aspect of your idea.',
              applied: false,
              createdAt: new Date()
            }))
          : this.generateDefaultSuggestions(false);

        console.log('🎯 Final structured idea:', structuredIdea);
        console.log('💡 Generated suggestions:', suggestions);

        return { structuredIdea, suggestions, isExpansion: false };
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      return this.fallbackProcessing(rawInput, rawInput.toLowerCase().includes('expand this rough idea'));
    }
  }

  static async generateExpandedIdeas(roughIdea: string): Promise<ExpandedIdea[]> {
    try {
      console.log('🎯 Generating expanded ideas for:', roughIdea);
      
      const prompt = `
        You are an expert idea expansion specialist. Take this VERY ROUGH idea and create 4 DIFFERENT comprehensive business concepts from it. Correct any spelling mistakes iff there are any spelling mistakes.

        Rough idea: "${roughIdea}"

        Create 4 completely different interpretations and expansions of this rough concept. Each should target different markets, use different approaches, and solve different aspects of the problem space.

        Please respond with a JSON array of 4 objects, each containing:
        {
          "title": "A professional, marketable title for this specific interpretation",
          "description": "A comprehensive 2-3 sentence description explaining this specific concept and its unique value proposition",
          "targetAudience": "Specific target audience for this version (be detailed - age, profession, needs)",
          "keyFeatures": ["4-5", "specific", "features", "for", "this", "version"],
          "marketAngle": "What makes this version unique in the market - its specific positioning and competitive advantage",
          "tags": ["3-5", "relevant", "tags"]
        }

        Make each version DISTINCTLY different:
        - Version 1: Consumer/B2C focused
        - Version 2: Business/B2B focused  
        - Version 3: Community/Social focused
        - Version 4: Premium/Niche focused

        Be creative and expansive. Turn even the simplest idea into 4 viable, distinct business concepts.
      `;

      const response = await this.makeAPICall([
        { role: "user", content: prompt }
      ]);

      let expandedIdeas;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        expandedIdeas = JSON.parse(jsonString);
        
        console.log('🎨 Generated expanded ideas:', expandedIdeas);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse expanded ideas, using fallback');
        return this.generateFallbackExpandedIdeas(roughIdea);
      }

      return expandedIdeas.map((idea: any, index: number) => ({
        id: crypto.randomUUID(),
        title: idea.title || `${roughIdea} - Version ${index + 1}`,
        description: idea.description || 'A comprehensive expansion of your original concept.',
        targetAudience: idea.targetAudience || 'General users',
        keyFeatures: Array.isArray(idea.keyFeatures) ? idea.keyFeatures : ['Core functionality', 'User interface', 'Basic features'],
        marketAngle: idea.marketAngle || 'Unique market positioning',
        tags: Array.isArray(idea.tags) ? idea.tags : ['innovation', 'solution']
      }));
    } catch (error) {
      console.error('❌ Expansion generation error:', error);
      return this.generateFallbackExpandedIdeas(roughIdea);
    }
  }

  private static generateFallbackExpandedIdeas(roughIdea: string): ExpandedIdea[] {
    console.log('🔄 Using fallback expansion for:', roughIdea);
    
    return [
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Consumer App`,
        description: `A consumer-focused mobile application that makes ${roughIdea.toLowerCase()} accessible to everyday users through an intuitive interface and social features.`,
        targetAudience: 'Tech-savvy consumers aged 18-35 who value convenience and social connectivity',
        keyFeatures: ['Mobile-first design', 'Social sharing', 'User-friendly interface', 'Push notifications', 'Offline functionality'],
        marketAngle: 'Consumer convenience with social elements',
        tags: ['mobile', 'consumer', 'social', 'convenience']
      },
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Business Solution`,
        description: `An enterprise-grade platform that helps businesses implement ${roughIdea.toLowerCase()} with advanced analytics, team collaboration, and integration capabilities.`,
        targetAudience: 'Business managers and teams in companies with 50-500 employees',
        keyFeatures: ['Team collaboration', 'Advanced analytics', 'API integrations', 'Admin dashboard', 'Compliance features'],
        marketAngle: 'Enterprise efficiency and scalability',
        tags: ['business', 'enterprise', 'analytics', 'collaboration']
      },
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Community Platform`,
        description: `A community-driven platform where people can connect, share experiences, and collaborate around ${roughIdea.toLowerCase()} with peer-to-peer features.`,
        targetAudience: 'Community-minded individuals who value peer connections and shared experiences',
        keyFeatures: ['Community forums', 'Peer matching', 'Event organization', 'Knowledge sharing', 'Reputation system'],
        marketAngle: 'Community-powered collaboration and knowledge sharing',
        tags: ['community', 'social', 'collaboration', 'peer-to-peer']
      },
      {
        id: crypto.randomUUID(),
        title: `${roughIdea} - Premium Service`,
        description: `A high-end, personalized service that delivers ${roughIdea.toLowerCase()} through expert consultation, custom solutions, and premium support.`,
        targetAudience: 'High-income professionals and businesses willing to pay premium for personalized service',
        keyFeatures: ['Personal consultation', 'Custom solutions', '24/7 premium support', 'Exclusive features', 'White-glove service'],
        marketAngle: 'Premium, personalized experience with expert guidance',
        tags: ['premium', 'personalized', 'consultation', 'exclusive']
      }
    ];
  }

  // New helper method to process market analysis from AI response
  private static processMarketAnalysisFromResponse(data: any) {
    if (!data) return this.generateFallbackMarketAnalysis();
    
    return {
      size: data.size || 'Market size analysis needed',
      growth: data.growth || 'Growth potential to be determined',
      trends: Array.isArray(data.trends) ? data.trends : ['Market research required'],
      competitors: Array.isArray(data.competitors) ? data.competitors : ['Competitive analysis needed'],
      opportunities: Array.isArray(data.opportunities) ? data.opportunities : ['Opportunity assessment required'],
      threats: Array.isArray(data.threats) ? data.threats : ['Risk analysis needed']
    };
  }

  // New helper method to process feasibility analysis from AI response
  private static processFeasibilityAnalysisFromResponse(data: any) {
    if (!data) return this.generateFallbackFeasibilityAnalysis();
    
    return {
      technical: {
        score: Math.min(Math.max(data.technical?.score || 50, 0), 100),
        challenges: Array.isArray(data.technical?.challenges) ? data.technical.challenges : ['Technical assessment needed'],
        requirements: Array.isArray(data.technical?.requirements) ? data.technical.requirements : ['Requirements analysis needed']
      },
      financial: {
        score: Math.min(Math.max(data.financial?.score || 50, 0), 100),
        estimatedCost: data.financial?.estimatedCost || 'Cost analysis needed',
        revenueModel: Array.isArray(data.financial?.revenueModel) ? data.financial.revenueModel : ['Revenue model development needed'],
        fundingNeeds: data.financial?.fundingNeeds || 'Funding requirements to be determined'
      },
      market: {
        score: Math.min(Math.max(data.market?.score || 50, 0), 100),
        demand: data.market?.demand || 'Market demand analysis needed',
        competition: data.market?.competition || 'Competitive landscape analysis needed',
        barriers: Array.isArray(data.market?.barriers) ? data.market.barriers : ['Market barrier analysis needed']
      }
    };
  }

  static async generateRemixVariants(idea: Idea): Promise<RemixVariant[]> {
    try {
      console.log('🎭 Generating remix variants for:', idea.title);
      
      const prompt = `
        Create 4 creative remix variants for this idea: "${idea.title} - ${idea.description}"
        
        Please respond with a JSON array of objects, each containing:
        {
          "title": "Remixed title",
          "description": "How this variant differs from the original",
          "targetAudience": "Who this variant targets",
          "twist": "What makes this variant unique",
          "category": "tech/business/social/education/health/entertainment/other"
        }
        
        Make each variant target a different market or approach (e.g., enterprise, mobile-first, AI-powered, community-driven).
      `;

      const response = await this.makeAPICall([
        { role: "user", content: prompt }
      ]);

      let variants;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        variants = JSON.parse(jsonString);
        
        console.log('🎨 Generated remix variants:', variants);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse remix variants, using fallback');
        return this.generateFallbackRemixVariants(idea);
      }

      return variants.map((variant: any) => ({
        id: crypto.randomUUID(),
        title: variant.title || `${idea.title} Remix`,
        description: variant.description || 'A creative variation of the original idea.',
        targetAudience: variant.targetAudience || 'General users',
        twist: variant.twist || 'Unique approach',
        category: this.validateCategory(variant.category) || idea.category
      }));
    } catch (error) {
      console.error('❌ Remix generation error:', error);
      return this.generateFallbackRemixVariants(idea);
    }
  }

  static async analyzeIdeaMaturity(idea: Idea): Promise<MaturityAnalysis> {
    try {
      console.log('📈 Analyzing idea maturity for:', idea.title);
      
      const prompt = `
        Provide a comprehensive maturity analysis for this idea:
        
        Title: ${idea.title}
        Description: ${idea.description}
        Pain Points: ${idea.painPoints.join(', ')}
        Features: ${idea.features.join(', ')}
        User Personas: ${idea.userPersonas.join(', ')}
        Category: ${idea.category}
        
        Please respond with a JSON object containing:
        {
          "score": 85,
          "strengths": ["array", "of", "strengths"],
          "gaps": ["array", "of", "improvement", "areas"],
          "nextSteps": ["array", "of", "recommended", "next", "steps"],
          "marketPotential": {
            "score": 80,
            "marketSize": "medium",
            "competitionLevel": "medium",
            "demandIndicators": ["indicators", "of", "market", "demand"],
            "marketTrends": ["relevant", "trends"],
            "targetMarketSize": "estimated size",
            "revenueProjection": "revenue potential",
            "barriers": ["market", "barriers"],
            "opportunities": ["market", "opportunities"]
          },
          "feasibilityScore": {
            "overall": 75,
            "technical": 80,
            "financial": 70,
            "operational": 75,
            "legal": 85,
            "timeToMarket": "6-12 months",
            "resourceRequirements": ["required", "resources"],
            "riskFactors": ["potential", "risks"],
            "successFactors": ["critical", "success", "factors"]
          },
          "recommendations": {
            "immediate": [
              {
                "action": "Validate core assumptions",
                "description": "Conduct user interviews to validate problem-solution fit",
                "priority": "high",
                "effort": "medium",
                "impact": "high",
                "resources": ["time", "survey tools"],
                "estimatedTime": "1-2 weeks"
              }
            ],
            "shortTerm": [
              {
                "action": "Build MVP",
                "description": "Create minimum viable product for testing",
                "priority": "high",
                "effort": "high",
                "impact": "high",
                "resources": ["development team", "budget"],
                "estimatedTime": "2-3 months"
              }
            ],
            "longTerm": [
              {
                "action": "Scale and expand",
                "description": "Expand to new markets and features",
                "priority": "medium",
                "effort": "high",
                "impact": "high",
                "resources": ["funding", "team expansion"],
                "estimatedTime": "6+ months"
              }
            ],
            "criticalPath": ["validation", "mvp", "launch", "scale"],
            "keyMilestones": [
              {
                "title": "Problem Validation",
                "description": "Confirm market need exists",
                "targetDate": "2 weeks",
                "successCriteria": ["50+ user interviews", "clear pain point validation"],
                "deliverables": ["validation report", "user personas"]
              }
            ]
          }
        }
        
        Provide realistic scores (0-100) and actionable recommendations.
      `;

      const response = await this.makeAPICall([
        { role: "user", content: prompt }
      ]);

      let analysis;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        analysis = JSON.parse(jsonString);
        
        console.log('📊 Maturity analysis result:', analysis);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse maturity analysis, using fallback');
        return this.generateFallbackMaturityAnalysis(idea);
      }

      // Process recommendations to ensure proper structure
      const processedRecommendations = this.processRecommendations(analysis.recommendations);

      const result = {
        score: Math.min(Math.max(analysis.score || 50, 0), 100),
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ['Idea has potential'],
        gaps: Array.isArray(analysis.gaps) ? analysis.gaps : ['Needs more development'],
        nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : ['Continue refining the concept'],
        marketPotential: this.processMarketPotential(analysis.marketPotential),
        feasibilityScore: this.processFeasibilityScore(analysis.feasibilityScore),
        recommendations: processedRecommendations,
        missingElements: {
          painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
          features: Math.max(0, 4 - (idea.features?.length || 0)),
          userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
          branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
        }
      };

      console.log('✅ Final maturity analysis:', result);
      return result;
    } catch (error) {
      console.error('❌ Maturity analysis error:', error);
      return this.generateFallbackMaturityAnalysis(idea);
    }
  }

  // Helper methods for processing AI responses
  private static processMarketPotential(data: any): MarketPotential {
    return {
      score: Math.min(Math.max(data?.score || 50, 0), 100),
      marketSize: ['small', 'medium', 'large', 'massive'].includes(data?.marketSize) ? data.marketSize : 'medium',
      competitionLevel: ['low', 'medium', 'high', 'saturated'].includes(data?.competitionLevel) ? data.competitionLevel : 'medium',
      demandIndicators: Array.isArray(data?.demandIndicators) ? data.demandIndicators : ['Market research needed'],
      marketTrends: Array.isArray(data?.marketTrends) ? data.marketTrends : ['Trend analysis needed'],
      targetMarketSize: data?.targetMarketSize || 'To be determined',
      revenueProjection: data?.revenueProjection || 'Revenue model needs development',
      barriers: Array.isArray(data?.barriers) ? data.barriers : ['Competition', 'Market entry costs'],
      opportunities: Array.isArray(data?.opportunities) ? data.opportunities : ['Market gap exists']
    };
  }

  private static processFeasibilityScore(data: any): FeasibilityScore {
    return {
      overall: Math.min(Math.max(data?.overall || 50, 0), 100),
      technical: Math.min(Math.max(data?.technical || 50, 0), 100),
      financial: Math.min(Math.max(data?.financial || 50, 0), 100),
      operational: Math.min(Math.max(data?.operational || 50, 0), 100),
      legal: Math.min(Math.max(data?.legal || 50, 0), 100),
      timeToMarket: data?.timeToMarket || '6-12 months',
      resourceRequirements: Array.isArray(data?.resourceRequirements) ? data.resourceRequirements : ['Development team', 'Initial funding'],
      riskFactors: Array.isArray(data?.riskFactors) ? data.riskFactors : ['Market acceptance', 'Technical challenges'],
      successFactors: Array.isArray(data?.successFactors) ? data.successFactors : ['Strong execution', 'Market timing']
    };
  }

  private static processRecommendations(data: any): ActionableRecommendations {
    const processRecommendationItems = (items: any[]): RecommendationItem[] => {
      if (!Array.isArray(items)) return [];
      
      return items.map((item, index) => ({
        id: crypto.randomUUID(),
        action: item.action || `Action ${index + 1}`,
        description: item.description || 'Description needed',
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        effort: ['low', 'medium', 'high'].includes(item.effort) ? item.effort : 'medium',
        impact: ['low', 'medium', 'high'].includes(item.impact) ? item.impact : 'medium',
        resources: Array.isArray(item.resources) ? item.resources : ['Resources TBD'],
        estimatedTime: item.estimatedTime || 'Time TBD',
        dependencies: Array.isArray(item.dependencies) ? item.dependencies : undefined
      }));
    };

    const processMilestones = (milestones: any[]): Milestone[] => {
      if (!Array.isArray(milestones)) return [];
      
      return milestones.map(milestone => ({
        id: crypto.randomUUID(),
        title: milestone.title || 'Milestone',
        description: milestone.description || 'Description needed',
        targetDate: milestone.targetDate || 'TBD',
        successCriteria: Array.isArray(milestone.successCriteria) ? milestone.successCriteria : ['Criteria TBD'],
        deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables : ['Deliverables TBD']
      }));
    };

    return {
      immediate: processRecommendationItems(data?.immediate || []),
      shortTerm: processRecommendationItems(data?.shortTerm || []),
      longTerm: processRecommendationItems(data?.longTerm || []),
      criticalPath: Array.isArray(data?.criticalPath) ? data.criticalPath : ['Define', 'Build', 'Test', 'Launch'],
      keyMilestones: processMilestones(data?.keyMilestones || [])
    };
  }

  // Existing helper methods (validateCategory, categorizeIdea, etc.) remain the same...
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
    return sentences[0]?.trim().slice(0, 60) || 'Innovative Idea';
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
      'Current solutions are inadequate',
      'Users waste time with inefficient processes'
    ];
  }

  private static extractFeatures(input: string): string[] {
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const featureIndicators = ['feature', 'function', 'allow', 'enable', 'provide'];
    
    const features = sentences.filter(sentence => 
      featureIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );
    
    return features.length > 0 ? features.slice(0, 5) : [
      'User-friendly interface',
      'Core functionality for main use case',
      'Mobile accessibility'
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

    return personas.length > 0 ? personas.slice(0, 3) : ['Primary target users', 'Secondary market segment'];
  }

  private static calculateMaturityScore(data: any): number {
    let score = 20;
    
    if (data.painPoints?.length > 0) score += 20;
    if (data.features?.length > 0) score += 20;
    if (data.userPersonas?.length > 0) score += 20;
    if (data.description?.length > 100) score += 20;
    
    return Math.min(score, 100);
  }

  private static generateDefaultSuggestions(isExpansion: boolean = false): AISuggestion[] {
    if (isExpansion) {
      return [
        {
          id: crypto.randomUUID(),
          type: 'expansion',
          content: 'Consider validating this expanded concept with potential users to confirm market fit.',
          applied: false,
          createdAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          type: 'expansion',
          content: 'Think about what the minimum viable product (MVP) would look like for this concept.',
          applied: false,
          createdAt: new Date()
        }
      ];
    }
    
    return [
      {
        id: crypto.randomUUID(),
        type: 'structure',
        content: 'Consider defining more specific user personas who would benefit from this idea.',
        applied: false,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        type: 'expansion',
        content: 'What would be the minimum viable product (MVP) for this idea?',
        applied: false,
        createdAt: new Date()
      }
    ];
  }

  private static generateFallbackMarketAnalysis() {
    return {
      size: 'Market size analysis needed',
      growth: 'Growth potential to be determined',
      trends: ['Market research required'],
      competitors: ['Competitive analysis needed'],
      opportunities: ['Opportunity assessment required'],
      threats: ['Risk analysis needed']
    };
  }

  private static generateFallbackFeasibilityAnalysis() {
    return {
      technical: {
        score: 50,
        challenges: ['Technical assessment needed'],
        requirements: ['Requirements analysis needed']
      },
      financial: {
        score: 50,
        estimatedCost: 'Cost analysis needed',
        revenueModel: ['Revenue model development needed'],
        fundingNeeds: 'Funding requirements to be determined'
      },
      market: {
        score: 50,
        demand: 'Market demand analysis needed',
        competition: 'Competitive landscape analysis needed',
        barriers: ['Market barrier analysis needed']
      }
    };
  }

  private static generateFallbackRemixVariants(idea: Idea): RemixVariant[] {
    return [
      {
        id: crypto.randomUUID(),
        title: `${idea.title} for Enterprise`,
        description: 'B2B version with advanced analytics and team collaboration features.',
        targetAudience: 'Enterprise teams',
        twist: 'Professional-grade with enterprise security',
        category: 'business'
      },
      {
        id: crypto.randomUUID(),
        title: `Mobile-First ${idea.title}`,
        description: 'Reimagined as a mobile-native experience with offline capabilities.',
        targetAudience: 'Mobile-first users',
        twist: 'Mobile-native with offline functionality',
        category: idea.category
      }
    ];
  }

  private static generateFallbackMaturityAnalysis(idea: Idea): MaturityAnalysis {
    let score = 20;
    const strengths: string[] = [];
    const gaps: string[] = [];

    if (idea.title && idea.title.length > 5) {
      score += 15;
      strengths.push('Clear and descriptive title');
    } else {
      gaps.push('Needs a more descriptive title');
    }

    if (idea.painPoints && idea.painPoints.length >= 2) {
      score += 25;
      strengths.push('Problem identification is clear');
    } else {
      gaps.push('Need to identify more specific pain points');
    }

    if (idea.features && idea.features.length >= 3) {
      score += 25;
      strengths.push('Core features are defined');
    } else {
      gaps.push('Need to define more key features');
    }

    if (idea.userPersonas && idea.userPersonas.length >= 2) {
      score += 15;
      strengths.push('Target users are identified');
    } else {
      gaps.push('Need to define target user personas');
    }

    // Generate fallback recommendations
    const fallbackRecommendations: ActionableRecommendations = {
      immediate: [
        {
          id: crypto.randomUUID(),
          action: 'Validate core assumptions',
          description: 'Conduct user interviews to validate problem-solution fit',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          resources: ['time', 'survey tools'],
          estimatedTime: '1-2 weeks'
        },
        {
          id: crypto.randomUUID(),
          action: 'Research competitors',
          description: 'Analyze existing solutions and identify differentiation opportunities',
          priority: 'high',
          effort: 'low',
          impact: 'medium',
          resources: ['research time'],
          estimatedTime: '3-5 days'
        }
      ],
      shortTerm: [
        {
          id: crypto.randomUUID(),
          action: 'Build MVP',
          description: 'Create minimum viable product for testing',
          priority: 'high',
          effort: 'high',
          impact: 'high',
          resources: ['development team', 'budget'],
          estimatedTime: '2-3 months'
        },
        {
          id: crypto.randomUUID(),
          action: 'Test with users',
          description: 'Conduct user testing and gather feedback',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          resources: ['test users', 'feedback tools'],
          estimatedTime: '2-4 weeks'
        }
      ],
      longTerm: [
        {
          id: crypto.randomUUID(),
          action: 'Scale and expand',
          description: 'Expand to new markets and features',
          priority: 'medium',
          effort: 'high',
          impact: 'high',
          resources: ['funding', 'team expansion'],
          estimatedTime: '6+ months'
        }
      ],
      criticalPath: ['validation', 'mvp', 'testing', 'launch', 'scale'],
      keyMilestones: [
        {
          id: crypto.randomUUID(),
          title: 'Problem Validation',
          description: 'Confirm market need exists',
          targetDate: '2 weeks',
          successCriteria: ['50+ user interviews', 'clear pain point validation'],
          deliverables: ['validation report', 'user personas']
        },
        {
          id: crypto.randomUUID(),
          title: 'MVP Launch',
          description: 'Launch minimum viable product',
          targetDate: '3 months',
          successCriteria: ['working prototype', 'initial user feedback'],
          deliverables: ['MVP', 'user feedback report']
        }
      ]
    };

    return {
      score: Math.min(score, 100),
      strengths,
      gaps,
      nextSteps: [
        'Validate assumptions with potential users',
        'Create wireframes or mockups',
        'Research competitive landscape',
        'Define success metrics'
      ],
      marketPotential: {
        score: 50,
        marketSize: 'medium',
        competitionLevel: 'medium',
        demandIndicators: ['Market research needed'],
        marketTrends: ['Trend analysis needed'],
        targetMarketSize: 'To be determined',
        revenueProjection: 'Revenue model needs development',
        barriers: ['Competition', 'Market entry costs'],
        opportunities: ['Market gap exists']
      },
      feasibilityScore: {
        overall: 50,
        technical: 50,
        financial: 50,
        operational: 50,
        legal: 80,
        timeToMarket: '6-12 months',
        resourceRequirements: ['Development team', 'Initial funding'],
        riskFactors: ['Market acceptance', 'Technical challenges'],
        successFactors: ['Strong execution', 'Market timing']
      },
      recommendations: fallbackRecommendations,
      missingElements: {
        painPoints: Math.max(0, 3 - (idea.painPoints?.length || 0)),
        features: Math.max(0, 4 - (idea.features?.length || 0)),
        userPersonas: Math.max(0, 2 - (idea.userPersonas?.length || 0)),
        branding: !idea.title || idea.title.includes('New Idea') || idea.title.length < 5
      }
    };
  }

  private static fallbackProcessing(rawInput: string, isExpansion: boolean = false): {
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    suggestions?: AISuggestion[];
    expandedIdeas?: any[];
    isExpansion: boolean;
  } {
    console.log('🔄 Using fallback processing for:', rawInput);
    
    if (isExpansion) {
      // Extract the actual idea if it's an expansion request
      const actualInput = rawInput.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim();
      const expandedIdeas = this.generateFallbackExpandedIdeas(actualInput);
      return { expandedIdeas, isExpansion: true };
    }

    const structuredIdea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
      title: this.extractTitle(rawInput),
      description: rawInput,
      category: this.categorizeIdea(rawInput),
      tags: this.generateSmartTags(rawInput),
      painPoints: this.extractPainPoints(rawInput),
      features: this.extractFeatures(rawInput),
      userPersonas: this.extractUserPersonas(rawInput),
      maturityScore: 40,
      existingProducts: [],
      developmentStage: 'raw',
      isStarred: false,
      marketAnalysis: this.generateFallbackMarketAnalysis(),
      feasibilityAnalysis: this.generateFallbackFeasibilityAnalysis()
    };

    const suggestions = this.generateDefaultSuggestions(false);
    
    console.log('✅ Fallback processing complete:', { structuredIdea, suggestions });
    
    return { structuredIdea, suggestions, isExpansion: false };
  }
}