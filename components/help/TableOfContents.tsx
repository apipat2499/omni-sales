'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { TableOfContentsItem } from '@/types/help';

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export default function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [items, setItems] = useState<TableOfContentsItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse headings from content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4'));
    const tocItems: TableOfContentsItem[] = headings.map((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';
      const id = heading.id || `heading-${index}`;

      // Add ID to heading if it doesn't have one
      if (!heading.id) {
        heading.id = id;
      }

      return {
        id,
        title: text,
        level,
      };
    });

    setItems(tocItems);

    // Set up intersection observer for active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Observe all headings
    headings.forEach((heading) => {
      const realHeading = document.getElementById(heading.id);
      if (realHeading) {
        observer.observe(realHeading);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <List className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Table of Contents</h3>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left py-2 text-sm transition-colors ${
              item.level === 1 ? 'font-semibold' : ''
            } ${
              activeId === item.id
                ? 'text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            {item.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
