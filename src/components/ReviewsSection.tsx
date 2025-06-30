import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, User, ThumbsUp, MessageCircle } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      rating: 5,
      comment: 'ObliQ transformed my vague app idea into a comprehensive business plan. The AI analysis was incredibly detailed and helped me identify market opportunities I never considered.',
      date: '2024-01-15',
      helpful: 12
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      rating: 5,
      comment: 'As a first-time entrepreneur, I was overwhelmed by where to start. ObliQ gave me a clear roadmap and validated my assumptions. Now I\'m building my MVP with confidence!',
      date: '2024-01-10',
      helpful: 8
    },
    {
      id: '3',
      name: 'Emily Watson',
      rating: 4,
      comment: 'The market analysis feature is fantastic. It found competitors I didn\'t know existed and helped me refine my unique value proposition. Highly recommend!',
      date: '2024-01-08',
      helpful: 15
    },
    {
      id: '4',
      name: 'David Kim',
      rating: 5,
      comment: 'I\'ve used several idea validation tools, but ObliQ is by far the most comprehensive. The AI recommendations are actionable and the interface is beautiful.',
      date: '2024-01-05',
      helpful: 6
    }
  ]);

  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: ''
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.name.trim() && newReview.comment.trim()) {
      const review: Review = {
        id: Date.now().toString(),
        name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split('T')[0],
        helpful: 0
      };
      
      setReviews([review, ...reviews]);
      setNewReview({ name: '', rating: 5, comment: '' });
      setShowForm(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary neon-text mb-2">User Reviews</h2>
        <p className="text-secondary">See what innovators are saying about ObliQ</p>
      </div>

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary rounded-xl border border-primary p-6 text-center hover-neon"
      >
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-4xl font-bold text-neon">{averageRating.toFixed(1)}</div>
          <div>
            {renderStars(Math.round(averageRating))}
            <p className="text-sm text-muted mt-1">{reviews.length} reviews</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-6 py-2 flex items-center space-x-2 mx-auto"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Write a Review</span>
        </button>
      </motion.div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary rounded-xl border border-primary p-6 animated-border"
          >
            <h3 className="text-lg font-semibold text-primary mb-4">Share Your Experience</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Your Name</label>
                  <input
                    type="text"
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {renderStars(newReview.rating, true, (rating) => 
                      setNewReview({ ...newReview, rating })
                    )}
                    <span className="text-sm text-muted">({newReview.rating}/5)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="input-field w-full resize-none"
                  rows={4}
                  placeholder="Share your experience with ObliQ..."
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-secondary rounded-xl border border-primary p-6 hover-neon glass"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">{review.name}</h4>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-muted">{review.date}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-secondary mb-4 leading-relaxed">{review.comment}</p>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center space-x-2 text-muted hover:text-neon transition-colors"
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">Helpful ({review.helpful})</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};