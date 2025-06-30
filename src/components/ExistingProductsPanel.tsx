import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { ExistingProduct } from '../types';

interface ExistingProductsPanelProps {
  products: ExistingProduct[];
  isVisible: boolean;
}

export const ExistingProductsPanel: React.FC<ExistingProductsPanelProps> = ({
  products,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        {products.length > 0 ? (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        <h3 className="font-semibold text-gray-900">
          {products.length > 0 ? 'Similar Solutions Found' : 'Unique Idea!'}
        </h3>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600">
            Great news! We couldn't find any existing solutions that match your idea closely. 
            This could be a unique opportunity to explore.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            We found some existing solutions. Use these for inspiration and to refine your unique approach:
          </p>
          
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {Math.round(product.similarity * 100)}% similar
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <span className="text-xs text-gray-500">{product.category}</span>
                </div>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Use these as inspiration to refine your unique value proposition. 
              What can you do differently or better?
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};