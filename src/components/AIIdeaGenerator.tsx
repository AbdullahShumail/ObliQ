import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Copy, Save, Download, RefreshCw, Lightbulb } from 'lucide-react';

interface GeneratedIdea {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  targetAudience: string;
  keyFeatures: string[];
}

interface AIIdeaGeneratorProps {
  isVisible: boolean;
}

export const AIIdeaGenerator: React.FC<AIIdeaGeneratorProps> = ({ isVisible }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<GeneratedIdea[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockIdeas: GeneratedIdea[] = [
      {
        id: crypto.randomUUID(),
        title: "EcoShare Marketplace",
        summary: "A peer-to-peer platform for sharing and renting eco-friendly products within local communities, reducing waste and promoting sustainable consumption.",
        tags: ["sustainability", "marketplace", "community", "eco-friendly"],
        targetAudience: "Environmentally conscious consumers aged 25-45",
        keyFeatures: ["Product sharing", "Local community focus", "Sustainability scoring", "Carbon footprint tracking"]
      },
      {
        id: crypto.randomUUID(),
        title: "SkillSwap Network",
        summary: "Connect people to exchange skills and knowledge without money - trade guitar lessons for coding tutorials, cooking classes for language practice.",
        tags: ["education", "community", "skill-sharing", "bartering"],
        targetAudience: "Lifelong learners and skill enthusiasts",
        keyFeatures: ["Skill matching algorithm", "Video call integration", "Progress tracking", "Community ratings"]
      },
      {
        id: crypto.randomUUID(),
        title: "MindfulMoments AI",
        summary: "AI-powered mental wellness companion that provides personalized meditation, breathing exercises, and mood tracking based on daily activities and stress levels.",
        tags: ["mental health", "AI", "wellness", "meditation"],
        targetAudience: "Busy professionals and students seeking mental wellness",
        keyFeatures: ["AI mood analysis", "Personalized content", "Stress level monitoring", "Progress insights"]
      }
    ];
    
    setGeneratedIdeas(mockIdeas);
    setIsGenerating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const copyToClipboard = (idea: GeneratedIdea) => {
    const text = `${idea.title}\n\n${idea.summary}\n\nTarget Audience: ${idea.targetAudience}\n\nKey Features:\n${idea.keyFeatures.map(f => `• ${f}`).join('\n')}\n\nTags: ${idea.tags.join(', ')}`;
    navigator.clipboard.writeText(text);
  };

  const saveIdea = (idea: GeneratedIdea) => {
    if (!savedIdeas.find(saved => saved.id === idea.id)) {
      setSavedIdeas([...savedIdeas, idea]);
    }
  };

  const downloadIdea = (idea: GeneratedIdea) => {
    const text = `${idea.title}\n\n${idea.summary}\n\nTarget Audience: ${idea.targetAudience}\n\nKey Features:\n${idea.keyFeatures.map(f => `• ${f}`).join('\n')}\n\nTags: ${idea.tags.join(', ')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary neon-text mb-4">AI Idea Generator</h2>
        <p className="text-secondary text-lg">Generate fresh, innovative ideas based on themes or problems</p>
      </div>

      {/* Input Section */}
      <div className="bg-secondary rounded-2xl border border-primary p-8 card-hover glass float-animation">
        <div className="space-y-6">
          <div>
            <label htmlFor="generator-prompt" className="block text-lg font-medium text-primary mb-4">
              What kind of ideas are you looking for?
            </label>
            <textarea
              id="generator-prompt"
              name="prompt"
              value={prompt}
              onChange={handleInputChange}
              placeholder="e.g., 'sustainable technology solutions', 'apps for remote workers', 'social impact projects'..."
              className="input-field min-h-[120px] w-full"
              rows={4}
              disabled={isGenerating}
              autoComplete="off"
              spellCheck="true"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-primary)'
              }}
            />
          </div>
          
          <motion.button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary py-4 px-8 rounded-xl font-semibold flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Generating Ideas...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                <span>Generate Ideas</span>
                <Send className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Generated Ideas */}
      {generatedIdeas.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-primary">Generated Ideas</h3>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-2 text-neon hover:text-neon-light transition-colors btn-secondary px-4 py-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Generate More</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-secondary rounded-2xl border border-primary p-8 card-hover glass"
              >
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-primary mb-3">{idea.title}</h4>
                    <p className="text-secondary leading-relaxed">{idea.summary}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">Target Audience:</p>
                    <p className="text-secondary">{idea.targetAudience}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted mb-3">Key Features:</p>
                    <ul className="space-y-2">
                      {idea.keyFeatures.map((feature, idx) => (
                        <li key={idx} className="text-sm text-secondary flex items-center">
                          <div className="w-2 h-2 bg-neon rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-neon/20 text-neon text-sm rounded-full border border-neon/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-primary">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(idea)}
                        className="p-2 text-muted hover:text-neon transition-colors rounded-lg hover:bg-tertiary"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => saveIdea(idea)}
                        className="p-2 text-muted hover:text-green-400 transition-colors rounded-lg hover:bg-tertiary"
                        title="Save idea"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => downloadIdea(idea)}
                        className="p-2 text-muted hover:text-blue-400 transition-colors rounded-lg hover:bg-tertiary"
                        title="Download as text"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                    <span className="text-sm text-muted">
                      {savedIdeas.find(saved => saved.id === idea.id) ? '✓ Saved' : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Ideas History */}
      {savedIdeas.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-primary">Saved Ideas ({savedIdeas.length})</h3>
          <div className="bg-tertiary rounded-xl p-6 max-h-80 overflow-y-auto glass">
            <div className="space-y-3">
              {savedIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between p-4 bg-secondary rounded-xl border border-primary card-hover">
                  <div className="flex items-center space-x-3">
                    <Lightbulb className="h-5 w-5 text-neon" />
                    <span className="font-medium text-primary">{idea.title}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(idea)}
                      className="p-2 text-muted hover:text-neon transition-colors rounded-lg hover:bg-tertiary"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadIdea(idea)}
                      className="p-2 text-muted hover:text-blue-400 transition-colors rounded-lg hover:bg-tertiary"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};