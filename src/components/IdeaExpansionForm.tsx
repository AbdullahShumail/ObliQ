import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, Sparkles, Lightbulb } from 'lucide-react';

interface IdeaExpansionFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

export const IdeaExpansionForm: React.FC<IdeaExpansionFormProps> = ({
  onSubmit,
  isLoading
}) => {
  const [roughIdea, setRoughIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roughIdea.trim() && !isLoading) {
      const expandedPrompt = `Please expand this rough idea into a comprehensive concept: ${roughIdea.trim()}`;
      onSubmit(expandedPrompt);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRoughIdea(e.target.value);
  };

  const exampleRoughIdeas = [
    "App for sharing stuff with neighbors",
    "Something with AI and food",
    "Help old people with technology",
    "Make studying more social"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-secondary rounded-2xl border border-primary p-8 card-hover glass float-animation"
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl shadow-lg shadow-purple-500/25 neon-glow">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-primary neon-text">Idea Expansion Engine</h3>
            <p className="text-secondary">Turn vague thoughts into detailed concepts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="rough-idea-input" className="block text-lg font-medium text-primary mb-4">
              What's your rough idea? Even a few words work!
            </label>
            <textarea
              id="rough-idea-input"
              name="roughIdea"
              value={roughIdea}
              onChange={handleInputChange}
              placeholder="Just type whatever comes to mind... 'app for dog walkers' or 'blockchain something' - we'll expand it!"
              className="input-field min-h-[120px] w-full"
              disabled={isLoading}
              rows={4}
              autoComplete="off"
              spellCheck="true"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-primary)'
              }}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-muted">
                {roughIdea.length} characters
              </span>
              <span className="text-sm text-muted">
                Minimum 5 characters
              </span>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={roughIdea.trim().length < 5 || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 hover:shadow-2xl hover:shadow-purple-500/25 text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Expanding your idea...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                <span>Expand My Idea</span>
                <Send className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Example Rough Ideas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10"
      >
        <h4 className="text-lg font-semibold text-primary mb-6 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-neon mr-3" />
          Try these rough ideas:
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {exampleRoughIdeas.map((example, index) => (
            <motion.button
              key={index}
              onClick={() => setRoughIdea(example)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-tertiary hover:bg-primary/10 rounded-xl text-left text-sm text-secondary transition-all duration-300 border border-primary hover:border-purple-500/50 card-hover glass"
              disabled={isLoading}
            >
              <span className="font-medium">"{example}"</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="mt-8 p-6 bg-purple-900/20 rounded-xl border border-purple-500/30 glass">
        <p className="text-purple-300 leading-relaxed">
          💡 <strong>How it works:</strong> Our AI takes your rough concept and expands it into a detailed idea with 
          target users, features, market analysis, and more. Perfect for when you have a spark but need help developing it!
        </p>
      </div>
    </div>
  );
};