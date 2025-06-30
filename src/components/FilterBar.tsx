import React from 'react';
import { Filter, SortAsc, SortDesc } from 'lucide-react';
import { IdeaCategory } from '../types';

interface FilterBarProps {
  selectedCategory: IdeaCategory | 'all';
  onCategoryChange: (category: IdeaCategory | 'all') => void;
  sortBy: 'date' | 'maturity' | 'title';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'date' | 'maturity' | 'title') => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  totalIdeas: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  totalIdeas,
}) => {
  const categories: Array<{ value: IdeaCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'tech', label: 'Tech' },
    { value: 'business', label: 'Business' },
    { value: 'social', label: 'Social' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <div className="flex space-x-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''}
            </span>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as 'date' | 'maturity' | 'title')}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="date">Date</option>
                <option value="maturity">Maturity</option>
                <option value="title">Title</option>
              </select>
              
              <button
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 text-gray-600" />
                ) : (
                  <SortDesc className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};