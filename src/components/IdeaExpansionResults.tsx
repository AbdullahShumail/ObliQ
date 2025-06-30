import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Users, Target, Zap, Copy, Save, ArrowRight, Timer, CheckCircle } from 'lucide-react';

interface ExpandedIdea {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  marketAngle: string;
  tags: string[];
}

interface IdeaExpansionResultsProps {
  originalIdea: string;
  expandedIdeas: ExpandedIdea[];
  isLoading: boolean;
  onSelectIdea: (idea: ExpandedIdea) => void;
  scanTime?: number;
}

export const IdeaExpansionResults: React.FC<IdeaExpansionResultsProps> = ({
  originalIdea,
  expandedIdeas,
  isLoading,
  onSelectIdea,
  scanTime = 0
}) => {
  const copyToClipboard = (idea: ExpandedIdea) => {
    const text = `${idea.title}\n\n${idea.description}\n\nTarget Audience: ${idea.targetAudience}\n\nMarket Angle: ${idea.marketAngle}\n\nKey Features:\n${idea.keyFeatures.map(f => `• ${f}`).join('\n')}\n\nTags: ${idea.tags.join(', ')}`;
    navigator.clipboard.writeText(text);
  };

  const saveIdea = (idea: ExpandedIdea) => {
    const savedIdeas = JSON.parse(localStorage.getItem('saved-expanded-ideas') || '[]');
    savedIdeas.push(idea);
    localStorage.setItem('saved-expanded-ideas', JSON.stringify(savedIdeas));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Loading Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 p-6 text-center glass"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <Timer className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Expanding Your Idea...</h3>
          <p className="text-secondary mb-4">AI is creating multiple concept variations</p>
          <div className="text-2xl font-bold text-purple-400">
            {scanTime.toFixed(1)}s
          </div>
          <p className="text-sm text-muted">Elapsed time</p>
        </motion.div>

        {/* Loading Skeleton */}
        <div className="space-y-6">
          <div className="bg-secondary rounded-xl border border-primary p-6 glass">
            <div className="animate-pulse">
              <div className="h-4 bg-tertiary rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-tertiary rounded mb-2"></div>
              <div className="h-3 bg-tertiary rounded w-5/6"></div>
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-secondary rounded-xl border border-primary p-6 glass">
              <div className="animate-pulse">
                <div className="h-6 bg-tertiary rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-tertiary rounded"></div>
                  <div className="h-3 bg-tertiary rounded w-4/5"></div>
                  <div className="h-3 bg-tertiary rounded w-3/5"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Expansion Complete Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-900/20 to-purple-900/20 rounded-2xl border border-green-500/30 p-6 text-center glass"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <Timer className="h-6 w-6 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">Expansion Complete!</h3>
        <p className="text-secondary mb-4">Your rough idea has been transformed into 4 detailed concepts</p>
        <div className="text-2xl font-bold text-green-400">
          {scanTime.toFixed(1)}s
        </div>
        <p className="text-sm text-muted">Total expansion time</p>
      </motion.div>

      {/* Original Idea Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 p-8 glass"
      >
        <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
          <Lightbulb className="h-6 w-6 text-purple-400 mr-3" />
          Your Original Rough Idea
        </h3>
        <p className="text-secondary leading-relaxed italic text-lg">"{originalIdea}"</p>
      </motion.div>

      {/* Expanded Ideas */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary neon-text mb-4">
            🚀 Expanded Concept Variations
          </h2>
          <p className="text-secondary text-lg mb-8 max-w-3xl mx-auto leading-relaxed">
            Here are multiple ways to develop your rough idea into comprehensive concepts. 
            Each version targets different markets and approaches.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {expandedIdeas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="bg-secondary rounded-2xl border border-primary p-8 card-hover glass relative overflow-hidden"
            >
              {/* Version Badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Version {index + 1}
              </div>

              <div className="space-y-8">
                {/* Title and Description */}
                <div className="pr-20">
                  <h3 className="text-2xl font-bold text-primary mb-4 leading-tight">{idea.title}</h3>
                  <p className="text-secondary leading-relaxed text-lg">{idea.description}</p>
                </div>

                {/* Target Audience */}
                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-blue-400">Target Audience</span>
                  </div>
                  <p className="text-blue-300 leading-relaxed">{idea.targetAudience}</p>
                </div>

                {/* Market Angle */}
                <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-green-400">Market Angle</span>
                  </div>
                  <p className="text-green-300 leading-relaxed">{idea.marketAngle}</p>
                </div>

                {/* Key Features */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Zap className="h-5 w-5 text-neon" />
                    <span className="font-medium text-neon">Key Features</span>
                  </div>
                  <ul className="space-y-3">
                    {idea.keyFeatures.map((feature, idx) => (
                      <li key={idx} className="text-secondary flex items-start leading-relaxed">
                        <div className="w-2 h-2 bg-neon rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3">
                  {idea.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-neon/20 text-neon text-sm rounded-full border border-neon/30 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-primary">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => copyToClipboard(idea)}
                      className="p-3 text-muted hover:text-neon transition-colors rounded-xl hover:bg-tertiary"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => saveIdea(idea)}
                      className="p-3 text-muted hover:text-green-400 transition-colors rounded-xl hover:bg-tertiary"
                      title="Save this version"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <motion.button
                    onClick={() => onSelectIdea(idea)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-3 hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    <span>Analyze This</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="text-center p-10 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 glass"
      >
        <h3 className="text-2xl font-bold text-primary mb-6">
          💡 Found a concept you like?
        </h3>
        <p className="text-secondary mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
          Click "Analyze This" on any version to get a comprehensive market analysis, 
          feasibility assessment, and actionable roadmap for that specific concept.
        </p>
      </motion.div>
    </div>
  );
};