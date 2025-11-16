import Link from 'next/link';
import { Eye, ThumbsUp, Calendar, Tag } from 'lucide-react';
import type { HelpArticle } from '@/types/help';

interface ArticleCardProps {
  article: HelpArticle;
  showCategory?: boolean;
  showTags?: boolean;
  showStats?: boolean;
}

export default function ArticleCard({
  article,
  showCategory = true,
  showTags = true,
  showStats = true,
}: ArticleCardProps) {
  const totalFeedback = article.helpful_count + article.not_helpful_count;
  const helpfulPercentage = totalFeedback > 0
    ? Math.round((article.helpful_count / totalFeedback) * 100)
    : 0;

  return (
    <Link
      href={`/help/articles/${article.slug}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
    >
      {/* Category Badge */}
      {showCategory && article.category && (
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {article.category.name}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {article.title}
      </h3>

      {/* Description */}
      {article.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {article.description}
        </p>
      )}

      {/* Tags */}
      {showTags && article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag.name}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{article.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {article.view_count}
          </div>
          {totalFeedback > 0 && (
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {helpfulPercentage}% helpful
            </div>
          )}
          {article.published_at && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(article.published_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
