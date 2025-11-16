'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';

interface FeedbackFormProps {
  articleId: string;
  onSubmit?: (isHelpful: boolean, feedbackText?: string) => void;
  className?: string;
}

export default function FeedbackForm({
  articleId,
  onSubmit,
  className = '',
}: FeedbackFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showTextarea, setShowTextarea] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);

  const handleFeedbackSubmit = async (isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/help/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_helpful: isHelpful,
          feedback_text: feedbackText || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSubmit) {
          onSubmit(isHelpful, feedbackText || undefined);
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRatingClick = (isHelpful: boolean) => {
    setSelectedRating(isHelpful);
    if (isHelpful) {
      // If helpful, submit immediately
      handleFeedbackSubmit(true);
    } else {
      // If not helpful, show textarea for additional feedback
      setShowTextarea(true);
    }
  };

  const handleTextSubmit = () => {
    if (selectedRating !== null) {
      handleFeedbackSubmit(selectedRating);
    }
  };

  if (submitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-green-600 font-medium mb-2">
          Thank you for your feedback!
        </div>
        <p className="text-sm text-green-700">
          Your input helps us improve our documentation.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
        Was this article helpful?
      </h3>

      {!showTextarea ? (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleRatingClick(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ThumbsUp className="h-5 w-5" />
            Yes, it was helpful
          </button>
          <button
            onClick={() => handleRatingClick(false)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ThumbsDown className="h-5 w-5" />
            No, needs improvement
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <p className="text-sm text-gray-600 mb-3">
            We're sorry this article wasn't helpful. Please tell us how we can improve it:
          </p>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Your feedback (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            rows={4}
          />
          <div className="flex gap-3">
            <button
              onClick={handleTextSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              Submit Feedback
            </button>
            <button
              onClick={() => {
                setShowTextarea(false);
                setSelectedRating(null);
                setFeedbackText('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
