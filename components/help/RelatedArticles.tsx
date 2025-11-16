import Link from 'next/link';
import { Eye, ChevronRight } from 'lucide-react';
import type { HelpArticle } from '@/types/help';

interface RelatedArticlesProps {
  articles: HelpArticle[];
  title?: string;
  maxItems?: number;
}

export default function RelatedArticles({
  articles,
  title = 'Related Articles',
  maxItems = 5,
}: RelatedArticlesProps) {
  const displayArticles = articles.slice(0, maxItems);

  if (displayArticles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            href={`/help/articles/${article.slug}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {article.view_count} views
                  </div>
                  {article.category && (
                    <span>{article.category.name}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
