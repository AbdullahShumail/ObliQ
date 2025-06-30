import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Lightbulb } from 'lucide-react';
import { Idea } from '../types';
import { MemoryService } from '../services/memoryService';

interface MemoryRecallProps {
  ideas: Idea[];
  onIdeaFound: (idea: Idea) => void;
}

export const MemoryRecall: React.FC<MemoryRecallProps> = ({ ideas, onIdeaFound }) => {
  const [query, setQuery] = useState('');
  const [foundIdea, setFoundIdea] = useState<Idea | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    MemoryService.saveLastQuery(query);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const idea = await MemoryService.findIdeaByQuery(query, ideas);
    setFoundIdea(idea);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Clock className="h-5 w-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">Remember something?</h3>
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What was that idea about renting routers?"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isSearching ? 'Searching...' : 'Find'}
        </button>
      </div>
      
      <AnimatePresence>
        {foundIdea && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">{foundIdea.title}</h4>
                <p className="text-sm text-blue-700 mt-1">{foundIdea.description.slice(0, 100)}...</p>
                <button
                  onClick={() => onIdeaFound(foundIdea)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  Want to keep working on it? →
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {query && !foundIdea && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-gray-50 rounded-lg"
          >
            <p className="text-sm text-gray-600">
              Hmm, I couldn't find that idea. Try describing it differently or check if it might be in a different category.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};