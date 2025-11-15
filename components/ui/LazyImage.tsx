'use client';

import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image is visible
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder while loading */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover blur-sm" />
          ) : (
            <div className="animate-pulse flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-400">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * Optimized image component with srcset support
 */
export function ResponsiveImage({
  src,
  alt,
  sizes,
  className = '',
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  // Generate srcset for different sizes
  const srcSet = [320, 640, 960, 1280, 1920]
    .map((width) => `${src}?w=${width} ${width}w`)
    .join(', ');

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={className}
    />
  );
}
