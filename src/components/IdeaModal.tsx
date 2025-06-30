import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Lightbulb, Tag, Users, Target, Zap } from 'lucide-react';
import { Idea, IdeaCategory } from '../types';
import TextareaAutosize from 'react-textarea-autosize';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  idea?: Idea;
}

export const IdeaModal: React.FC<IdeaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  idea,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as IdeaCategory,
    tags: [] as string[],
    painPoints: [] as string[],
    features: [] as string[],
    userPersonas: [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newUserPersona, setNewUserPersona] = useState('');

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        tags: idea.tags,
        painPoints: idea.painPoints,
        features: idea.features,
        userPersonas: idea.userPersonas,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'other',
        tags: [],
        painPoints: [],
        features: [],
        userPersonas: [],
      });
    }
  }, [idea, isOpen]);

  const handleSave = () => {
    const ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      maturityScore: calculateMaturityScore(),
      existingProducts: idea?.existingProducts || [],
      developmentStage: idea?.developmentStage || 'raw',
      isStarred: idea?.isStarred || false,
      lastViewedAt: new Date(),
    };
    
    onSave(ideaData);
    onClose();
  };

  const calculateMaturityScore = (): number => {
    let score = 10;
    if (formData.painPoints.length > 0) score += 20;
    if (formData.features.length > 0) score += 20;
    if (formData.userPersonas.length > 0) score += 20;
    if (formData.description.length > 100) score += 15;
    if (formData.tags.length > 2) score += 15;
    return Math.min(score, 100);
  };

  const addItem = (type: 'tags' | 'painPoints' | 'features' | 'userPersonas', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      
      // Clear the input
      switch (type) {
        case 'tags': setNewTag(''); break;
        case 'painPoints': setNewPainPoint(''); break;
        case 'features': setNewFeature(''); break;
        case 'userPersonas': setNewUserPersona(''); break;
      }
    }
  };

  const removeItem = (type: 'tags' | 'painPoints' | 'features' | 'userPersonas', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {idea ? 'Edit Idea' : 'New Idea'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Give your idea a catchy title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <TextareaAutosize
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Describe your idea in detail..."
                  minRows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as IdeaCategory }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="social">Social</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeItem('tags', index)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('tags', newTag)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={() => addItem('tags', newTag)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Pain Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="inline h-4 w-4 mr-1" />
                  Pain Points
                </label>
                <div className="space-y-2 mb-2">
                  {formData.painPoints.map((point, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <span className="text-sm text-red-800">{point}</span>
                      <button
                        onClick={() => removeItem('painPoints', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newPainPoint}
                    onChange={(e) => setNewPainPoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('painPoints', newPainPoint)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What problem does this solve?"
                  />
                  <button
                    onClick={() => addItem('painPoints', newPainPoint)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Zap className="inline h-4 w-4 mr-1" />
                  Features
                </label>
                <div className="space-y-2 mb-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-800">{feature}</span>
                      <button
                        onClick={() => removeItem('features', index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('features', newFeature)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What features would it have?"
                  />
                  <button
                    onClick={() => addItem('features', newFeature)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* User Personas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  User Personas
                </label>
                <div className="space-y-2 mb-2">
                  {formData.userPersonas.map((persona, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">{persona}</span>
                      <button
                        onClick={() => removeItem('userPersonas', index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newUserPersona}
                    onChange={(e) => setNewUserPersona(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('userPersonas', newUserPersona)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Who would use this?"
                  />
                  <button
                    onClick={() => addItem('userPersonas', newUserPersona)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Maturity Score: <span className="font-medium">{calculateMaturityScore()}%</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Idea</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};