import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, Target, Zap, ArrowRight, Sparkles, BarChart3, Users, Star, Award } from 'lucide-react';

interface IntroSectionProps {
  onEngineSelect: (engine: 'analyzer' | 'expansion') => void;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ onEngineSelect }) => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-scroll-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      step: "01",
      title: "Choose Your Engine",
      description: "Select Analyzer for detailed ideas or Expansion for rough concepts",
      icon: Lightbulb,
      delay: 0.1
    },
    {
      step: "02", 
      title: "AI Analysis",
      description: "Our AI analyzes market potential, competition, and feasibility",
      icon: BarChart3,
      delay: 0.2
    },
    {
      step: "03",
      title: "Get Your Roadmap",
      description: "Receive actionable insights and step-by-step recommendations",
      icon: Target,
      delay: 0.3
    }
  ];

  return (
    <div className="space-y-24 relative">
      {/* 3D Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl rotate-12 animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-blue-500/10 rounded-2xl -rotate-12 animate-float-delayed"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl rotate-45 animate-float-slow"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse-slow-delayed"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-neon/30 rounded-full animate-float-particle"></div>
        <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-float-particle-delayed"></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-float-particle-slow"></div>
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-12 max-w-5xl mx-auto"
        >
          <div className="space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-6 mb-8"
            >
              <div className="gradient-animation p-5 rounded-3xl neon-glow float-animation">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-6xl font-bold text-primary neon-text">ObliQ</h1>
                <p className="text-xl text-secondary">AI-Powered Idea Intelligence</p>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl text-secondary max-w-4xl mx-auto leading-relaxed font-light"
            >
              "Transform your ideas into market-ready concepts with AI-powered analysis"
            </motion.p>
          </div>

          {/* Main Action Buttons with Blue and Pink Colors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col lg:flex-row gap-8 justify-center items-center max-w-5xl mx-auto"
          >
            <motion.button
              onClick={() => onEngineSelect('analyzer')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full lg:w-auto bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-12 py-6 rounded-2xl font-semibold flex items-center justify-center space-x-6 group hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 card-hover glass border border-blue-500/30 neon-glow"
            >
              <BarChart3 className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-xl">Idea Analyzer</div>
                <div className="text-sm opacity-90">Comprehensive analysis & insights</div>
              </div>
              <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
            </motion.button>
            
            <motion.button
              onClick={() => onEngineSelect('expansion')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full lg:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-pink-700 text-white px-12 py-6 rounded-2xl font-semibold flex items-center justify-center space-x-6 group hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 card-hover glass border border-pink-500/30 pink-glow"
            >
              <Zap className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-xl">Expansion Engine</div>
                <div className="text-sm opacity-90">Turn rough ideas into concepts</div>
              </div>
              <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* How It Works Section - Added pt-32 for extra upper padding */}
        <motion.div
          id="how-it-works"
          data-scroll-animate
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: visibleElements.has('how-it-works') ? 1 : 0, y: visibleElements.has('how-it-works') ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-16 pt-32"
        >
          <div className="text-center">
            <h3 className="text-4xl font-bold text-primary neon-text mb-6">How ObliQ Works</h3>
            <p className="text-secondary max-w-3xl mx-auto text-xl leading-relaxed">
              Simple, powerful, and intelligent. Get comprehensive analysis in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: visibleElements.has('how-it-works') ? 1 : 0, x: visibleElements.has('how-it-works') ? 0 : -30 }}
                transition={{ delay: step.delay, duration: 0.6 }}
                className="relative"
              >
                <div className="p-10 bg-secondary rounded-2xl border border-primary card-hover glass text-center group">
                  <div className="gradient-animation p-5 rounded-full w-fit mx-auto mb-8 neon-glow group-hover:neon-glow-strong transition-all duration-300">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-sm font-bold text-neon mb-4 tracking-wider">STEP {step.step}</div>
                  <h4 className="text-2xl font-semibold text-primary mb-6">{step.title}</h4>
                  <p className="text-secondary leading-relaxed text-lg">{step.description}</p>
                </div>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="h-10 w-10 text-neon" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA with Blue and Pink Colors */}
        <motion.div
          id="final-cta"
          data-scroll-animate
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: visibleElements.has('final-cta') ? 1 : 0, y: visibleElements.has('final-cta') ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center p-12 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-3xl border border-neon/30 neon-glow glass"
        >
          <h3 className="text-4xl font-bold text-primary neon-text mb-8">
            Ready to Transform Your Ideas?
          </h3>
          <p className="text-secondary mb-10 max-w-3xl mx-auto text-xl leading-relaxed">
            Join thousands of innovators who trust ObliQ to validate and develop their concepts into market-ready solutions.
          </p>
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            <motion.button
              onClick={() => onEngineSelect('analyzer')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-12 py-5 font-semibold flex items-center space-x-4 mx-auto group text-xl rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 border border-blue-500/30 neon-glow"
            >
              <BarChart3 className="h-7 w-7" />
              <span>Start Analyzing Ideas</span>
              <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
            </motion.button>
            <motion.button
              onClick={() => onEngineSelect('expansion')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-pink-700 text-white px-12 py-5 font-semibold rounded-xl flex items-center space-x-4 mx-auto group hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 text-xl border border-pink-500/30 pink-glow"
            >
              <Zap className="h-7 w-7" />
              <span>Expand Rough Ideas</span>
              <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};