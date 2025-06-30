import React from 'react';
import { motion } from 'framer-motion';
import { IdeaCluster, Idea } from '../types';
import { IdeaCard } from './IdeaCard';

interface IdeaClusterViewProps {
  cluster: IdeaCluster;
  ideas: Idea[];
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
  onAIExpand: (idea: Idea) => void;
  onRemix: (idea: Idea) => void;
}

export const IdeaClusterView: React.FC<IdeaClusterViewProps> = ({
  cluster,
  ideas,
  onEditIdea,
  onDeleteIdea,
  onAIExpand,
  onRemix,
}) => {
  const clusterIdeas = ideas.filter(idea => cluster.ideaIds.includes(idea.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border-2 border-dashed ${cluster.color} mb-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{cluster.name}</h3>
          <p className="text-sm text-gray-600">{clusterIdeas.length} related ideas</p>
        </div>
        <div className="text-xs text-gray-500">
          Clustered by AI
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusterIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onEdit={onEditIdea}
            onDelete={onDeleteIdea}
            onAIExpand={onAIExpand}
            onRemix={onRemix}
            isInCluster={true}
          />
        ))}
      </div>
    </motion.div>
  );
};