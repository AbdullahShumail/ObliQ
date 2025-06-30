import React from 'react';
import { Brain, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onNewIdea: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onIdeaSelect?: (ideaId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewIdea,
  searchQuery,
  onSearchChange,
  onIdeaSelect,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">IdeaBoard</h1>
              <p className="text-xs text-gray-500">AI-Powered Creative Workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input-field pl-10 w-80"
              />
            </div>
            
            <NotificationCenter onIdeaSelect={onIdeaSelect} />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewIdea}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Idea</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};