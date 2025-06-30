import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, MessageCircle, Sparkles, BarChart3, TrendingUp, Award, Lightbulb, Target, ChevronDown } from 'lucide-react';
import { IntroSection } from './components/IntroSection';
import { IdeaInputForm } from './components/IdeaInputForm';
import { IdeaExpansionForm } from './components/IdeaExpansionForm';
import { IdeaExpansionResults } from './components/IdeaExpansionResults';
import { ReviewsSection } from './components/ReviewsSection';
import { AIIdeaGenerator } from './components/AIIdeaGenerator';
import { FeedbackForm } from './components/FeedbackForm';
import { IdeaAnalysisPanel } from './components/IdeaAnalysisPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { EnhancedAIService } from './services/enhancedAIService';
import { MaturityAnalysis, ExistingProduct } from './types/index';
import { useTheme } from './hooks/useTheme';

interface ExpandedIdea {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  marketAngle: string;
  tags: string[];
}

function App() {
  const [currentIdea, setCurrentIdea] = useState<string>('');
  const [analysis, setAnalysis] = useState<MaturityAnalysis | null>(null);
  const [existingSolutions, setExistingSolutions] = useState<ExistingProduct[]>([]);
  const [expandedIdeas, setExpandedIdeas] = useState<ExpandedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showExpansionResults, setShowExpansionResults] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [activeEngine, setActiveEngine] = useState<'analyzer' | 'expansion' | 'generator' | 'feedback' | null>(null);
  const [scanTime, setScanTime] = useState<number>(0);
  const [showStats, setShowStats] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleIdeaSubmit = async (idea: string) => {
    setCurrentIdea(idea);
    setIsLoading(true);
    setShowResults(false);
    setShowExpansionResults(false);
    setShowIntro(false);
    setActiveEngine(null);
    setAnalysis(null);
    setExistingSolutions([]);
    setExpandedIdeas([]);
    setScanTime(0);

    try {
      const result = await EnhancedAIService.processNewIdea(idea);
      setScanTime(result.scanTime || 0);
      
      if (result.isExpansion) {
        setExpandedIdeas(result.expandedIdeas || []);
        setShowExpansionResults(true);
      } else {
        const analysisResult = await EnhancedAIService.analyzeMaturity(result.structuredIdea!);
        setAnalysis(analysisResult);
        setExistingSolutions(result.existingProducts || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error processing idea:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandedIdeaSelect = async (expandedIdea: ExpandedIdea) => {
    const ideaForAnalysis = `${expandedIdea.title}. ${expandedIdea.description} Target audience: ${expandedIdea.targetAudience}. Key features: ${expandedIdea.keyFeatures.join(', ')}.`;
    
    setCurrentIdea(ideaForAnalysis);
    setIsLoading(true);
    setShowExpansionResults(false);
    setScanTime(0);

    try {
      const result = await EnhancedAIService.processNewIdea(ideaForAnalysis);
      setScanTime(result.scanTime || 0);
      
      if (!result.isExpansion && result.structuredIdea) {
        const analysisResult = await EnhancedAIService.analyzeMaturity(result.structuredIdea);
        setAnalysis(analysisResult);
        setExistingSolutions(result.existingProducts || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error analyzing expanded idea:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setShowResults(false);
    setShowExpansionResults(false);
    setShowIntro(true);
    setActiveEngine(null);
    setCurrentIdea('');
    setAnalysis(null);
    setExistingSolutions([]);
    setExpandedIdeas([]);
    setIsLoading(false);
    setScanTime(0);
  };

  const handleEngineSelect = (engine: 'analyzer' | 'expansion' | 'generator' | 'feedback') => {
    setShowIntro(false);
    setActiveEngine(engine);
  };

  // Platform statistics data
  const stats = [
    { number: "10,000+", label: "Ideas Analyzed", icon: Lightbulb },
    { number: "95%", label: "Accuracy Rate", icon: Target },
    { number: "500+", label: "Success Stories", icon: Award },
    { number: "24/7", label: "AI Availability", icon: Brain }
  ];

  // Features data
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI analyzes your ideas for market potential, feasibility, and competitive landscape"
    },
    {
      icon: TrendingUp,
      title: "Market Research",
      description: "Instant market analysis with competitor identification and opportunity assessment"
    },
    {
      icon: Target,
      title: "Actionable Roadmap",
      description: "Get step-by-step recommendations from concept to market launch"
    },
    {
      icon: Sparkles,
      title: "Idea Expansion",
      description: "Transform half-baked concepts into fully developed business ideas"
    }
  ];

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-secondary border-b border-primary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Minimized Logo and Name */}
            <div className="flex items-center space-x-3">
              <div className="gradient-animation p-2 rounded-lg neon-glow">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-primary neon-text">ObliQ</h1>
            </div>
            
            {/* Header Navigation with Stats and Features */}
            <div className="flex items-center space-x-6">
              {/* Platform Statistics Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center space-x-2 px-4 py-2 text-secondary hover:text-primary hover:bg-tertiary rounded-lg transition-all duration-300"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden md:inline">Statistics</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-secondary rounded-xl border border-primary shadow-2xl z-50 p-6 glass"
                    >
                      <h3 className="text-lg font-semibold text-primary mb-4">Platform Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat) => (
                          <div key={stat.label} className="text-center p-4 bg-tertiary rounded-lg border border-primary">
                            <stat.icon className="h-6 w-6 text-neon mx-auto mb-2" />
                            <div className="text-xl font-bold text-neon">{stat.number}</div>
                            <div className="text-xs text-muted">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Features Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="flex items-center space-x-2 px-4 py-2 text-secondary hover:text-primary hover:bg-tertiary rounded-lg transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="hidden md:inline">Features</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showFeatures && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-96 bg-secondary rounded-xl border border-primary shadow-2xl z-50 p-6 glass"
                    >
                      <h3 className="text-lg font-semibold text-primary mb-4">Powerful Features</h3>
                      <div className="space-y-4">
                        {features.map((feature) => (
                          <div key={feature.title} className="flex items-start space-x-3 p-3 bg-tertiary rounded-lg border border-primary">
                            <div className="gradient-animation p-2 rounded-lg neon-glow">
                              <feature.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-primary text-sm">{feature.title}</h4>
                              <p className="text-xs text-secondary leading-relaxed">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              
              {/* Navigation Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                {!showIntro && !showResults && !showExpansionResults && (
                  <>
                    <button
                      onClick={() => handleEngineSelect('generator')}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        activeEngine === 'generator' 
                          ? 'bg-neon/20 text-neon border border-neon/30' 
                          : 'text-secondary hover:text-primary hover:bg-tertiary'
                      }`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Generator</span>
                    </button>
                    <button
                      onClick={() => handleEngineSelect('feedback')}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        activeEngine === 'feedback' 
                          ? 'bg-neon/20 text-neon border border-neon/30' 
                          : 'text-secondary hover:text-primary hover:bg-tertiary'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Feedback</span>
                    </button>
                  </>
                )}
              </div>
              
              {(showResults || showExpansionResults || activeEngine) && (
                <button
                  onClick={handleStartOver}
                  className="flex items-center space-x-2 px-4 py-2 text-secondary hover:text-primary hover:bg-tertiary rounded-lg transition-all duration-300 card-hover"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Home</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {showIntro && !showResults && !showExpansionResults && !activeEngine ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IntroSection onEngineSelect={handleEngineSelect} />
            </motion.div>
          ) : activeEngine === 'analyzer' ? (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              <section>
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold text-primary neon-text mb-6">AI-Powered Idea Analyzer</h2>
                  <p className="text-secondary text-2xl max-w-4xl mx-auto leading-relaxed">Get comprehensive analysis and market insights for your ideas</p>
                </div>
                <IdeaInputForm onSubmit={handleIdeaSubmit} isLoading={isLoading} />
              </section>

              <section>
                <ReviewsSection />
              </section>
            </motion.div>
          ) : activeEngine === 'expansion' ? (
            <motion.div
              key="expansion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              <section>
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold text-primary neon-text mb-6">Idea Expansion Engine</h2>
                  <p className="text-secondary text-2xl max-w-4xl mx-auto leading-relaxed">Transform vague concepts into comprehensive business ideas</p>
                </div>
                <IdeaExpansionForm onSubmit={handleIdeaSubmit} isLoading={isLoading} />
              </section>

              <section>
                <ReviewsSection />
              </section>
            </motion.div>
          ) : activeEngine === 'generator' ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              <AIIdeaGenerator isVisible={true} />
              
              <section>
                <ReviewsSection />
              </section>
            </motion.div>
          ) : activeEngine === 'feedback' ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-primary neon-text mb-6">Feedback & Support</h2>
                <p className="text-secondary text-2xl max-w-4xl mx-auto leading-relaxed">Help us improve ObliQ with your valuable feedback</p>
              </div>
              
              <FeedbackForm />
              
              <section>
                <ReviewsSection />
              </section>
            </motion.div>
          ) : showExpansionResults ? (
            <motion.div
              key="expansion-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IdeaExpansionResults
                originalIdea={currentIdea.replace(/please expand this rough idea into a comprehensive concept:\s*/i, '').trim()}
                expandedIdeas={expandedIdeas}
                isLoading={isLoading}
                onSelectIdea={handleExpandedIdeaSelect}
                scanTime={scanTime}
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-secondary rounded-2xl border border-primary p-10 mb-12 card-hover glass">
                <h2 className="text-2xl font-semibold text-primary mb-6">Your Analyzed Idea</h2>
                <p className="text-secondary leading-relaxed text-xl">{currentIdea}</p>
              </div>

              <IdeaAnalysisPanel
                analysis={analysis}
                existingSolutions={existingSolutions}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-secondary border-t border-primary mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center text-muted">
            <p className="text-xl">Powered by ObliQ AI • Transform ideas, discover opportunities, build the future</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;