import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Send, Sparkles } from 'lucide-react';

interface IdeaInputFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

export const IdeaInputForm: React.FC<IdeaInputFormProps> = ({
  onSubmit,
  isLoading
}) => {
  const [idea, setIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim() && !isLoading) {
      onSubmit(idea.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIdea(e.target.value);
  };

  const exampleIdeas = [
    "An app that helps people find local study groups based on their subjects and schedule",
    "A platform where neighbors can share tools and equipment instead of buying everything",
    "A service that connects elderly people with tech-savvy volunteers for digital assistance",
    "An AI-powered meal planner that considers dietary restrictions and food waste reduction"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-secondary rounded-2xl border border-primary p-8 card-hover glass float-animation"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="idea-input" className="block text-lg font-medium text-primary mb-4">
              What's your idea? Be as detailed as you'd like.
            </label>
            <textarea
              id="idea-input"
              name="idea"
              value={idea}
              onChange={handleInputChange}
              placeholder="Describe your idea here... What problem does it solve? Who would use it? What makes it unique?"
              className="input-field min-h-[140px] w-full"
              disabled={isLoading}
              rows={5}
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
                {idea.length} characters
              </span>
              <span className="text-sm text-muted">
                Minimum 20 characters
              </span>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={idea.trim().length < 20 || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-4 px-8 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Analyzing your idea...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                <span>Analyze My Idea</span>
                <Send className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Example Ideas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10"
      >
        <h3 className="text-xl font-semibold text-primary mb-6 text-center neon-text">
          Need inspiration? Try these examples:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exampleIdeas.map((example, index) => (
            <motion.button
              key={index}
              onClick={() => setIdea(example)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-secondary hover:bg-tertiary rounded-xl text-left text-sm text-secondary transition-all duration-300 border border-primary hover:border-neon card-hover glass"
              disabled={isLoading}
            >
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-neon mt-1 flex-shrink-0" />
                <span className="leading-relaxed">{example}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};