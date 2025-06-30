import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Sparkles, BarChart3, CheckCircle } from 'lucide-react';
import { LoadingState } from '../types';

interface LoadingAnimationProps {
  loadingState: LoadingState;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ loadingState }) => {
  const getIcon = () => {
    switch (loadingState.stage) {
      case 'categorizing': return Brain;
      case 'searching': return Search;
      case 'generating': return Sparkles;
      case 'analyzing': return BarChart3;
      case 'complete': return CheckCircle;
      default: return Brain;
    }
  };

  const Icon = getIcon();

  if (!loadingState.isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center"
      >
        <motion.div
          animate={{ 
            rotate: loadingState.stage === 'complete' ? 0 : 360,
            scale: loadingState.stage === 'complete' ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 2, repeat: loadingState.stage === 'complete' ? 0 : Infinity, ease: "linear" },
            scale: { duration: 0.3 }
          }}
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            loadingState.stage === 'complete' ? 'bg-green-100' : 'bg-primary-100'
          }`}
        >
          <Icon className={`h-8 w-8 ${
            loadingState.stage === 'complete' ? 'text-green-600' : 'text-primary-600'
          }`} />
        </motion.div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {loadingState.stage === 'complete' ? 'All done!' : 'Processing your idea...'}
        </h3>
        
        <p className="text-gray-600 mb-4">{loadingState.message}</p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${loadingState.progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              loadingState.stage === 'complete' ? 'bg-green-500' : 'bg-primary-500'
            }`}
          />
        </div>
        
        <p className="text-sm text-gray-500">{loadingState.progress}% complete</p>
      </motion.div>
    </motion.div>
  );
};