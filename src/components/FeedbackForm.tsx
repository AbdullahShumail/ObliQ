import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Star, CheckCircle } from 'lucide-react';

export const FeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    category: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        rating: 5,
        category: 'general',
        message: ''
      });
    }, 3000);
  };

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="cursor-pointer hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
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

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-secondary rounded-xl border border-primary p-8 text-center hover-neon"
      >
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Thank You!</h3>
        <p className="text-secondary">Your feedback has been submitted successfully. We appreciate your input!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-xl border border-primary p-8 hover-neon animated-border"
    >
      <div className="flex items-center space-x-3 mb-6">
        <MessageCircle className="h-6 w-6 text-neon" />
        <h3 className="text-xl font-semibold text-primary">Share Your Feedback</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field w-full"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Overall Rating
            </label>
            {renderStars(formData.rating, (rating) => 
              setFormData({ ...formData, rating })
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field w-full"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Your Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="input-field w-full resize-none"
            rows={4}
            placeholder="Tell us about your experience, report a bug, or suggest improvements..."
            required
          />
        </div>

        <motion.button
          type="submit"
          disabled={!formData.message.trim() || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full btn-primary py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Send Feedback</span>
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
        <p className="text-sm text-blue-300">
          💡 <strong>Your feedback matters!</strong> Help us improve ObliQ by sharing your thoughts, 
          reporting issues, or suggesting new features. We read every message!
        </p>
      </div>
    </motion.div>
  );
};