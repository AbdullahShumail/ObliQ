import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, BarChart3, Lightbulb, ArrowRight } from 'lucide-react';
import { Idea, RemixVariant, MaturityAnalysis } from '../types';
import { EnhancedAIService } from '../services/enhancedAIService';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  idea,
  onUpdateIdea,
}) => {
  const [activeTab, setActiveTab] = useState<'expand' | 'remix' | 'analyze'>('expand');
  const [loading, setLoading] = useState(false);
  const [remixVariants, setRemixVariants] = useState<RemixVariant[]>([]);
  const [maturityAnalysis, setMaturityAnalysis] = useState<MaturityAnalysis | null>(null);

  const handleRemix = async () => {
    if (!idea) return;
    
    setLoading(true);
    try {
      const variants = await EnhancedAIService.generateRemixVariants(idea);
      setRemixVariants(variants);
    } catch (error) {
      console.error('Error generating remixes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!idea) return;
    
    setLoading(true);
    try {
      const analysis = await EnhancedAIService.analyzeMaturity(idea);
      setMaturityAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing maturity:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyRemix = (variant: RemixVariant) => {
    if (!idea) return;
    
    onUpdateIdea(idea.id, {
      title: variant.title,
      description: variant.description,
      category: variant.category || idea.category,
      developmentStage: 'structured',
    });
    
    onClose();
  };

  if (!isOpen || !idea) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, x: 300 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.95, opacity: 0, x: 300 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 p-6 border-r border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{idea.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{idea.description}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('expand')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'expand' ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Expand Idea</div>
                    <div className="text-xs text-gray-500">Add structure and details</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('remix');
                  if (remixVariants.length === 0) handleRemix();
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'remix' ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Remix Variants</div>
                    <div className="text-xs text-gray-500">Explore different angles</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analyze');
                  if (!maturityAnalysis) handleAnalyze();
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'analyze' ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Maturity Analysis</div>
                    <div className="text-xs text-gray-500">Identify gaps and strengths</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'expand' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expand Your Idea</h3>
                <div className="space-y-4">
                  {idea.aiSuggestions?.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-900">{suggestion.content}</p>
                      <div className="mt-2 text-xs text-blue-600">
                        {suggestion.type} • {suggestion.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  
                  {(!idea.aiSuggestions || idea.aiSuggestions.length === 0) && (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No AI suggestions available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'remix' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remix Variants</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating creative variants...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {remixVariants.map((variant) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{variant.title}</h4>
                          <button
                            onClick={() => applyRemix(variant)}
                            className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                          >
                            <span>Apply</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{variant.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Target: {variant.targetAudience}</span>
                          <span>Twist: {variant.twist}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analyze' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maturity Analysis</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Analyzing idea maturity...</p>
                  </div>
                ) : maturityAnalysis ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-600 mb-2">
                        {maturityAnalysis.score}%
                      </div>
                      <p className="text-gray-600">Maturity Score</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Strengths</h4>
                      <div className="space-y-2">
                        {maturityAnalysis.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center space-x-2 text-green-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement</h4>
                      <div className="space-y-2">
                        {maturityAnalysis.gaps.map((gap, index) => (
                          <div key={index} className="flex items-center space-x-2 text-orange-700">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
                      <div className="space-y-2">
                        {maturityAnalysis.nextSteps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2 text-blue-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Click "Maturity Analysis" to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};