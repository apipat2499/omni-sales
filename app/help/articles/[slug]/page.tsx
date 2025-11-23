'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Tag,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import type { HelpArticleWithRelations } from '@/types/help';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<HelpArticleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/help/articles/${slug}`);

      if (!response.ok) {
        throw new Error('Article not found');
      }

      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (isHelpful: boolean) => {
    if (!article || feedbackSubmitted) return;

    try {
      await fetch(`/api/help/feedback/${article.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_helpful: isHelpful,
          feedback_text: feedbackText || undefined,
        }),
      });

      setFeedbackSubmitted(true);
      setShowFeedbackForm(false);

      // Update local counts
      if (article) {
        setArticle({
          ...article,
          helpful_count: isHelpful ? article.helpful_count + 1 : article.helpful_count,
          not_helpful_count: !isHelpful ? article.not_helpful_count + 1 : article.not_helpful_count,
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleFeedbackClick = (isHelpful: boolean) => {
    if (isHelpful) {
      submitFeedback(true);
    } else {
      setShowFeedbackForm(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link href="/help" className="text-blue-600 hover:underline">
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  const totalFeedback = article.helpful_count + article.not_helpful_count;
  const helpfulPercentage = totalFeedback > 0
    ? Math.round((article.helpful_count / totalFeedback) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/help" className="hover:text-blue-600">
              Help Center
            </Link>
            {article.category && (
              <>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link
                  href={`/help/category/${article.category.slug}`}
                  className="hover:text-blue-600"
                >
                  {article.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Article Header */}
          <div className="border-b px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {article.published_at && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(article.published_at).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {article.view_count} views
              </div>
              {article.author_name && (
                <div>By {article.author_name}</div>
              )}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/help/tag/${tag.slug}`}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Article Body */}
          <div className="px-8 py-6">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: article.content_type === 'html'
                  ? article.content
                  : `<div class="markdown-content">${article.content}</div>`
              }}
            />
          </div>

          {/* Feedback Section */}
          <div className="border-t px-8 py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Was this article helpful?
              </h3>

              {!feedbackSubmitted && !showFeedbackForm && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleFeedbackClick(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleFeedbackClick(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <ThumbsDown className="h-5 w-5" />
                    No
                  </button>
                </div>
              )}

              {showFeedbackForm && (
                <div className="max-w-md mx-auto">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="How can we improve this article? (optional)"
                    className="w-full px-4 py-2 border rounded-lg mb-4"
                    rows={4}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => submitFeedback(false)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Submit Feedback
                    </button>
                    <button
                      onClick={() => setShowFeedbackForm(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {feedbackSubmitted && (
                <div className="text-green-600 font-medium">
                  Thank you for your feedback!
                </div>
              )}

              {totalFeedback > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  {helpfulPercentage}% of {totalFeedback} people found this helpful
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {article.related_articles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/help/articles/${relatedArticle.slug}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {relatedArticle.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {relatedArticle.description}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    {relatedArticle.view_count} views
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Help */}
        <div className="mt-8 text-center">
          <Link
            href="/help"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
