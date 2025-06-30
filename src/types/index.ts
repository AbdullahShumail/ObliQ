export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  maturityScore: number;
  tags: string[];
  painPoints: string[];
  features: string[];
  userPersonas: string[];
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  aiSuggestions?: AISuggestion[];
  clusterId?: string;
  existingProducts?: ExistingProduct[];
  remixVariants?: RemixVariant[];
  isStarred?: boolean;
  developmentStage: 'raw' | 'structured' | 'validated' | 'developed';
  marketAnalysis?: MarketAnalysis;
  feasibilityAnalysis?: FeasibilityAnalysis;
}

export type IdeaCategory = 'tech' | 'business' | 'social' | 'education' | 'health' | 'entertainment' | 'other';

export interface AISuggestion {
  id: string;
  type: 'expansion' | 'remix' | 'structure' | 'maturity' | 'connection';
  content: string;
  applied: boolean;
  createdAt: Date;
}

export interface RemixVariant {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  twist: string;
  category?: IdeaCategory;
}

export interface MaturityAnalysis {
  score: number;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  missingElements: {
    painPoints: number;
    features: number;
    userPersonas: number;
    branding: boolean;
  };
  marketPotential?: MarketPotential;
  feasibilityScore?: FeasibilityScore;
  recommendations?: ActionableRecommendations;
}

export interface MarketPotential {
  score: number; // 0-100
  marketSize: 'small' | 'medium' | 'large' | 'massive';
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated';
  demandIndicators: string[];
  marketTrends: string[];
  targetMarketSize: string;
  revenueProjection: string;
  barriers: string[];
  opportunities: string[];
}

export interface FeasibilityScore {
  overall: number; // 0-100
  technical: number; // 0-100
  financial: number; // 0-100
  operational: number; // 0-100
  legal: number; // 0-100
  timeToMarket: string;
  resourceRequirements: string[];
  riskFactors: string[];
  successFactors: string[];
}

export interface ActionableRecommendations {
  immediate: RecommendationItem[]; // Next 1-2 weeks
  shortTerm: RecommendationItem[]; // Next 1-3 months
  longTerm: RecommendationItem[]; // 3+ months
  criticalPath: string[];
  keyMilestones: Milestone[];
}

export interface RecommendationItem {
  id: string;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  resources: string[];
  estimatedTime: string;
  dependencies?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  successCriteria: string[];
  deliverables: string[];
}

export interface MarketAnalysis {
  size: string;
  growth: string;
  trends: string[];
  competitors: string[];
  opportunities: string[];
  threats: string[];
}

export interface FeasibilityAnalysis {
  technical: {
    score: number;
    challenges: string[];
    requirements: string[];
  };
  financial: {
    score: number;
    estimatedCost: string;
    revenueModel: string[];
    fundingNeeds: string;
  };
  market: {
    score: number;
    demand: string;
    competition: string;
    barriers: string[];
  };
}

export interface ExistingProduct {
  id: string;
  name: string;
  description: string;
  url: string;
  similarity: number;
  category: string;
  foundAt: Date;
}

export interface IdeaCluster {
  id: string;
  name: string;
  ideaIds: string[];
  theme: string;
  color: string;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  lastActiveAt: Date;
  totalIdeas: number;
  returningUser: boolean;
  lastIdeaQuery?: string;
}

export interface LoadingState {
  isLoading: boolean;
  stage: 'categorizing' | 'analyzing' | 'searching' | 'clustering' | 'generating' | 'complete';
  message: string;
  progress: number;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'connection' | 'suggestion' | 'milestone';
  title: string;
  message: string;
  ideaId?: string;
  createdAt: Date;
  read: boolean;
  actionable: boolean;
}