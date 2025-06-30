import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Target,
  Users,
  Zap,
  BarChart3,
  Clock,
  Star,
  ArrowRight,
  CheckSquare,
  Timer
} from 'lucide-react';
import { MaturityAnalysis, ExistingProduct } from '../types';

interface IdeaAnalysisPanelProps {
  analysis: MaturityAnalysis | null;
  existingSolutions: ExistingProduct[];
  isLoading: boolean;
}

export const IdeaAnalysisPanel: React.FC<IdeaAnalysisPanelProps> = ({
  analysis,
  existingSolutions,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'feasibility' | 'recommendations'>('overview');
  const [scanTime, setScanTime] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    let interval: number;
    
    if (isLoading) {
      interval = setInterval(() => {
        setScanTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } else if (analysis) {
      // Final scan time when analysis is complete
      setScanTime(Math.floor((Date.now() - startTime) / 1000));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, analysis, startTime]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Scanning Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-neon/30 p-6 text-center glass"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon"></div>
            <Timer className="h-6 w-6 text-neon" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Scanning Your Idea...</h3>
          <p className="text-secondary mb-4">AI is analyzing market potential, competition, and feasibility</p>
          <div className="text-2xl font-bold text-neon">
            {scanTime.toFixed(1)}s
          </div>
          <p className="text-sm text-muted">Elapsed time</p>
        </motion.div>

        {/* Loading Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-secondary rounded-2xl border border-primary p-8 pulse-neon">
              <div className="animate-pulse">
                <div className="h-6 bg-tertiary rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-tertiary rounded"></div>
                  <div className="h-4 bg-tertiary rounded w-5/6"></div>
                  <div className="h-4 bg-tertiary rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-secondary rounded-2xl border border-primary p-8 text-center glass">
        <Brain className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No analysis available yet.</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-muted bg-tertiary border-primary';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '✨';
      default: return '📝';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Scan Complete Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-2xl border border-green-500/30 p-6 text-center glass"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <Timer className="h-6 w-6 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Analysis Complete!</h3>
        <p className="text-secondary mb-4">Your idea has been thoroughly analyzed</p>
        <div className="text-2xl font-bold text-green-400">
          {scanTime.toFixed(1)}s
        </div>
        <p className="text-sm text-muted">Total scan time</p>
      </motion.div>

      {/* Tab Navigation - Mobile Optimized */}
      <div className="bg-secondary rounded-2xl border border-primary overflow-hidden animated-border">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-primary">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'market', label: 'Market', icon: TrendingUp },
            { id: 'feasibility', label: 'Feasibility', icon: BarChart3 },
            { id: 'recommendations', label: 'Action Plan', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-4 md:px-6 md:py-4 text-xs md:text-sm font-medium transition-all duration-300 flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 ${
                activeTab === id
                  ? 'bg-neon/10 text-neon border-b-2 border-neon neon-glow'
                  : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-center">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Maturity Score */}
                <div className="text-center mb-8">
                  <div className={`text-5xl md:text-6xl font-bold mb-4 neon-text ${getScoreColor(analysis.score)}`}>
                    {analysis.score}%
                  </div>
                  <p className="text-secondary text-lg">Idea Maturity Score</p>
                </div>

                {/* Strengths and Gaps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                      Strengths
                    </h4>
                    <div className="space-y-4">
                      {analysis.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start space-x-3 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <AlertCircle className="h-6 w-6 text-orange-400 mr-3" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-4">
                      {analysis.gaps.map((gap, index) => (
                        <div key={index} className="flex items-start space-x-3 text-orange-400">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Existing Solutions */}
                <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <Search className="h-6 w-6 text-neon mr-3" />
                    Market Research
                  </h4>
                  
                  {existingSolutions.length === 0 ? (
                    <div className="text-center py-8 bg-green-900/20 rounded-xl border border-green-500/30">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-green-400 font-medium text-lg">Unique Opportunity!</p>
                      <p className="text-green-300">No direct competitors found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {existingSolutions.map((product) => (
                        <div key={product.id} className="border border-primary rounded-xl p-4 glass">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium text-primary">{product.name}</h5>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neon hover:text-neon-light transition-colors"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          </div>
                          <p className="text-sm text-secondary mb-3 leading-relaxed">{product.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted">{product.category}</span>
                            <span className="bg-neon/20 text-neon px-3 py-1 rounded-full border border-neon/30">
                              {Math.round(product.similarity * 100)}% similar
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'market' && analysis.marketPotential && (
              <motion.div
                key="market"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Market Score */}
                <div className="text-center mb-8">
                  <div className={`text-5xl md:text-6xl font-bold mb-4 neon-text ${getScoreColor(analysis.marketPotential.score)}`}>
                    {analysis.marketPotential.score}%
                  </div>
                  <p className="text-secondary text-lg">Market Potential Score</p>
                </div>

                {/* Market Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-6 bg-blue-900/20 rounded-xl border border-blue-500/30">
                    <div className="text-xl font-semibold text-blue-400 capitalize mb-2">
                      {analysis.marketPotential.marketSize}
                    </div>
                    <div className="text-sm text-blue-300">Market Size</div>
                  </div>
                  <div className="text-center p-6 bg-purple-900/20 rounded-xl border border-purple-500/30">
                    <div className="text-xl font-semibold text-purple-400 capitalize mb-2">
                      {analysis.marketPotential.competitionLevel}
                    </div>
                    <div className="text-sm text-purple-300">Competition</div>
                  </div>
                  <div className="text-center p-6 bg-green-900/20 rounded-xl border border-green-500/30">
                    <div className="text-xl font-semibold text-green-400 mb-2">
                      {analysis.marketPotential.opportunities.length}
                    </div>
                    <div className="text-sm text-green-300">Opportunities</div>
                  </div>
                  <div className="text-center p-6 bg-orange-900/20 rounded-xl border border-orange-500/30">
                    <div className="text-xl font-semibold text-orange-400 mb-2">
                      {analysis.marketPotential.barriers.length}
                    </div>
                    <div className="text-sm text-orange-300">Barriers</div>
                  </div>
                </div>

                {/* Market Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
                      Market Trends
                    </h4>
                    <div className="space-y-3">
                      {analysis.marketPotential.marketTrends.map((trend, index) => (
                        <div key={index} className="flex items-center space-x-3 text-blue-400">
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <Star className="h-6 w-6 text-green-400 mr-3" />
                      Opportunities
                    </h4>
                    <div className="space-y-3">
                      {analysis.marketPotential.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center space-x-3 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue and Size */}
                <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                  <h4 className="font-semibold text-primary mb-6 text-lg">Market Sizing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-secondary font-medium">Target Market:</span>
                      <p className="font-medium text-primary mt-2">{analysis.marketPotential.targetMarketSize}</p>
                    </div>
                    <div>
                      <span className="text-secondary font-medium">Revenue Projection:</span>
                      <p className="font-medium text-primary mt-2">{analysis.marketPotential.revenueProjection}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'feasibility' && analysis.feasibilityScore && (
              <motion.div
                key="feasibility"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Overall Feasibility */}
                <div className="text-center mb-8">
                  <div className={`text-5xl md:text-6xl font-bold mb-4 neon-text ${getScoreColor(analysis.feasibilityScore.overall)}`}>
                    {analysis.feasibilityScore.overall}%
                  </div>
                  <p className="text-secondary text-lg">Overall Feasibility Score</p>
                </div>

                {/* Feasibility Breakdown */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Technical', score: analysis.feasibilityScore.technical, icon: '⚙️' },
                    { label: 'Financial', score: analysis.feasibilityScore.financial, icon: '💰' },
                    { label: 'Operational', score: analysis.feasibilityScore.operational, icon: '🏢' },
                    { label: 'Legal', score: analysis.feasibilityScore.legal, icon: '⚖️' }
                  ].map(({ label, score, icon }) => (
                    <div key={label} className="text-center p-6 bg-secondary border border-primary rounded-xl hover-neon">
                      <div className="text-3xl mb-3">{icon}</div>
                      <div className={`text-2xl font-semibold mb-2 ${getScoreColor(score)}`}>
                        {score}%
                      </div>
                      <div className="text-sm text-muted">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Time to Market */}
                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-6 w-6 text-blue-400" />
                    <h4 className="font-semibold text-blue-400 text-lg">Time to Market</h4>
                  </div>
                  <p className="text-blue-300 font-medium text-lg">{analysis.feasibilityScore.timeToMarket}</p>
                </div>

                {/* Resources and Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <Users className="h-6 w-6 text-purple-400 mr-3" />
                      Resource Requirements
                    </h4>
                    <div className="space-y-3">
                      {analysis.feasibilityScore.resourceRequirements.map((resource, index) => (
                        <div key={index} className="flex items-center space-x-3 text-purple-400">
                          <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{resource}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                      Risk Factors
                    </h4>
                    <div className="space-y-3">
                      {analysis.feasibilityScore.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-center space-x-3 text-red-400">
                          <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Success Factors */}
                <div className="bg-tertiary rounded-xl p-6 border border-primary hover-neon">
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                    Critical Success Factors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.feasibilityScore.successFactors.map((factor, index) => (
                      <div key={index} className="flex items-center space-x-3 text-green-400">
                        <CheckSquare className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'recommendations' && analysis.recommendations && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Critical Path */}
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-neon/30 neon-glow">
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <ArrowRight className="h-6 w-6 text-neon mr-3" />
                    Critical Path to Success
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {analysis.recommendations!.criticalPath.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <span className="bg-neon/20 text-neon px-4 py-2 rounded-full text-sm font-medium border border-neon/30">
                          {index + 1}. {step}
                        </span>
                        {index < analysis.recommendations!.criticalPath.length - 1 && (
                          <ArrowRight className="h-5 w-5 text-neon mx-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immediate Actions */}
                <div>
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <Zap className="h-6 w-6 text-red-400 mr-3" />
                    Immediate Actions (Next 1-2 weeks)
                  </h4>
                  <div className="space-y-4">
                    {analysis.recommendations!.immediate.map((item) => (
                      <div key={item.id} className="border border-primary rounded-xl p-6 glass hover-neon">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <h5 className="font-medium text-primary text-lg mb-2 md:mb-0">{item.action}</h5>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="text-2xl">{getEffortIcon(item.effort)}</span>
                          </div>
                        </div>
                        <p className="text-secondary mb-4 leading-relaxed">{item.description}</p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-muted space-y-2 md:space-y-0">
                          <span>⏱️ {item.estimatedTime}</span>
                          <span>📊 {item.impact} impact</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Short-term Actions */}
                <div>
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <Target className="h-6 w-6 text-orange-400 mr-3" />
                    Short-term Actions (Next 1-3 months)
                  </h4>
                  <div className="space-y-4">
                    {analysis.recommendations!.shortTerm.map((item) => (
                      <div key={item.id} className="border border-primary rounded-xl p-6 glass hover-neon">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <h5 className="font-medium text-primary text-lg mb-2 md:mb-0">{item.action}</h5>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="text-2xl">{getEffortIcon(item.effort)}</span>
                          </div>
                        </div>
                        <p className="text-secondary mb-4 leading-relaxed">{item.description}</p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-muted space-y-2 md:space-y-0">
                          <span>⏱️ {item.estimatedTime}</span>
                          <span>📊 {item.impact} impact</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long-term Actions */}
                <div>
                  <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                    <TrendingUp className="h-6 w-6 text-green-400 mr-3" />
                    Long-term Actions (3+ months)
                  </h4>
                  <div className="space-y-4">
                    {analysis.recommendations!.longTerm.map((item) => (
                      <div key={item.id} className="border border-primary rounded-xl p-6 glass hover-neon">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <h5 className="font-medium text-primary text-lg mb-2 md:mb-0">{item.action}</h5>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="text-2xl">{getEffortIcon(item.effort)}</span>
                          </div>
                        </div>
                        <p className="text-secondary mb-4 leading-relaxed">{item.description}</p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-muted space-y-2 md:space-y-0">
                          <span>⏱️ {item.estimatedTime}</span>
                          <span>📊 {item.impact} impact</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Milestones */}
                {analysis.recommendations!.keyMilestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-6 flex items-center text-lg">
                      <Star className="h-6 w-6 text-purple-400 mr-3" />
                      Key Milestones
                    </h4>
                    <div className="space-y-6">
                      {analysis.recommendations!.keyMilestones.map((milestone) => (
                        <div key={milestone.id} className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 hover-neon">
                          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                            <h5 className="font-medium text-purple-400 text-lg mb-2 md:mb-0">{milestone.title}</h5>
                            <span className="text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/30 text-sm">
                              {milestone.targetDate}
                            </span>
                          </div>
                          <p className="text-purple-300 mb-6 leading-relaxed">{milestone.description}</p>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                            <div>
                              <span className="font-medium text-purple-400 block mb-3">Success Criteria:</span>
                              <ul className="space-y-2">
                                {milestone.successCriteria.map((criteria, index) => (
                                  <li key={index} className="text-purple-300 flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{criteria}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium text-purple-400 block mb-3">Deliverables:</span>
                              <ul className="space-y-2">
                                {milestone.deliverables.map((deliverable, index) => (
                                  <li key={index} className="text-purple-300 flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{deliverable}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};