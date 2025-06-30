import { Idea, AISuggestion, RemixVariant, MaturityAnalysis, LoadingState } from '../types';
import { WebSearchService } from './webSearchService';
import { OpenRouterService } from './openrouterService';

interface ExpandedIdea {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  marketAngle: string;
  tags: string[];
}

export class EnhancedAIService {
  private static loadingCallback?: (state: LoadingState) => void;
  private static startTime: number = 0;
  
  static setLoadingCallback(callback: (state: LoadingState) => void): void {
    this.loadingCallback = callback;
  }
  
  private static updateLoading(stage: LoadingState['stage'], message: string, progress: number): void {
    if (this.loadingCallback) {
      this.loadingCallback({
        isLoading: true,
        stage,
        message,
        progress
      });
    }
  }
  
  static async processNewIdea(rawInput: string): Promise<{
    structuredIdea?: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>;
    existingProducts?: any[];
    suggestions?: AISuggestion[];
    expandedIdeas?: ExpandedIdea[];
    isExpansion: boolean;
    scanTime?: number;
  }> {
    this.startTime = Date.now();
    this.updateLoading('categorizing', 'Processing your idea with AI...', 20);
    
    // Use OpenRouter AI to process the idea
    const result = await OpenRouterService.processIdeaWithAI(rawInput);
    
    if (result.isExpansion) {
      // For expansion requests, return the expanded ideas directly
      this.updateLoading('complete', 'Expansion complete!', 100);
      const scanTime = (Date.now() - this.startTime) / 1000;
      
      return {
        expandedIdeas: result.expandedIdeas,
        isExpansion: true,
        scanTime
      };
    } else {
      // For regular analysis, continue with existing product search
      this.updateLoading('searching', 'Searching for existing solutions...', 60);
      
      // Search for existing products
      const existingProducts = await WebSearchService.searchExistingProducts(
        result.structuredIdea!.title, 
        result.structuredIdea!.description
      );
      
      this.updateLoading('complete', 'Analysis complete!', 100);
      const scanTime = (Date.now() - this.startTime) / 1000;
      
      // Update the structured idea with existing products
      const finalIdea = {
        ...result.structuredIdea!,
        existingProducts
      };
      
      return { 
        structuredIdea: finalIdea, 
        existingProducts, 
        suggestions: result.suggestions,
        isExpansion: false,
        scanTime
      };
    }
  }
  
  static async generateRemixVariants(idea: Idea): Promise<RemixVariant[]> {
    return await OpenRouterService.generateRemixVariants(idea);
  }
  
  static async analyzeMaturity(ideaData: any): Promise<MaturityAnalysis> {
    // Convert the idea data to a proper Idea object if needed
    const idea: Idea = {
      id: ideaData.id || crypto.randomUUID(),
      title: ideaData.title || '',
      description: ideaData.description || '',
      category: ideaData.category || 'other',
      maturityScore: ideaData.maturityScore || 0,
      tags: ideaData.tags || [],
      painPoints: ideaData.painPoints || [],
      features: ideaData.features || [],
      userPersonas: ideaData.userPersonas || [],
      createdAt: ideaData.createdAt || new Date(),
      updatedAt: ideaData.updatedAt || new Date(),
      existingProducts: ideaData.existingProducts || [],
      developmentStage: ideaData.developmentStage || 'raw',
      isStarred: ideaData.isStarred || false
    };
    
    return await OpenRouterService.analyzeIdeaMaturity(idea);
  }
}