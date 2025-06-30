import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Sparkles,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';
import { Idea } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface IdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onAIExpand: (idea: Idea) => void;
  onRemix: (idea: Idea) => void;
  onToggleStar?: (id: string) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onEdit,
  onDelete,
  onAIExpand,
  onRemix,
  onToggleStar,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getCategoryClass = (category: string) => {
    return `category-${category}`;
  };

  const getMaturityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-500';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white rounded-lg border border-gray-200 p-6 card-shadow hover:card-shadow-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-gray-400" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryClass(idea.category)}`}>
            {idea.category}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onToggleStar && (
            <button
              onClick={() => onToggleStar(idea.id)}
              className={`p-1.5 rounded-md transition-colors ${
                idea.isStarred 
                  ? 'text-yellow-500 hover:bg-yellow-50' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
              }`}
            >
              <Star className={`h-4 w-4 ${idea.isStarred ? 'fill-current' : ''}`} />
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                  onClick={() => {
                    onEdit(idea);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onAIExpand(idea);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Expand</span>
                </button>
                <button
                  onClick={() => {
                    onRemix(idea);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                >
                  <Zap className="h-4 w-4" />
                  <span>Remix</span>
                </button>
                <hr className="border-gray-100" />
                <button
                  onClick={() => {
                    onDelete(idea.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-sm text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{idea.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{idea.description}</p>

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {idea.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span className={`font-medium ${getMaturityColor(idea.maturityScore)}`}>
              {idea.maturityScore}%
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(idea.createdAt, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};