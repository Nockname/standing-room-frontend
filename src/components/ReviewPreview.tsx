import React, { useState, useEffect } from 'react';
import { ExternalLink, Star, Calendar, User } from 'lucide-react';

interface ReviewPreviewProps {
  reviewUrl: string;
  showTitle: string;
}

interface ReviewMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  publishedDate?: string;
  author?: string;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({ reviewUrl, showTitle }) => {
  const [metadata, setMetadata] = useState<ReviewMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Since we can't fetch external metadata due to CORS, we'll create a rich preview
    // based on the URL pattern and show title
    const extractReviewInfo = (url: string) => {
      try {
        const urlObj = new URL(url);
        
        // Extract info based on common NYT URL patterns
        if (urlObj.hostname.includes('nytimes.com')) {
          return {
            title: `'${showTitle}' Review`,
            description: `Read the New York Times theater review for ${showTitle}.`,
            siteName: 'The New York Times',
            imageUrl: undefined, // We can't fetch this due to CORS
            publishedDate: undefined,
            author: undefined
          };
        }
        
        // Generic fallback
        return {
          title: `Review: ${showTitle}`,
          description: `Read the theater review for ${showTitle}.`,
          siteName: new URL(url).hostname,
          imageUrl: undefined,
          publishedDate: undefined,
          author: undefined
        };
      } catch (e) {
        return null;
      }
    };

    const info = extractReviewInfo(reviewUrl);
    setMetadata(info);
    setLoading(false);
    
    if (!info) {
      setError(true);
    }
  }, [reviewUrl, showTitle]);

  const handleClick = () => {
    window.open(reviewUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-neutral-200 rounded flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded mb-1"></div>
            <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
      >
        <Star className="h-4 w-4" />
        Read Review
        <ExternalLink className="h-3 w-3" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="border border-neutral-200 hover:border-primary-300 rounded-lg p-4 w-full text-left transition-all duration-200 hover:shadow-md group"
    >
      <div className="flex gap-4">
        {/* Icon placeholder since we can't fetch images */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex-shrink-0 flex items-center justify-center">
          <Star className="h-8 w-8 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-neutral-900 group-hover:text-primary-700 transition-colors duration-200">
              {metadata.title}
            </h4>
            <ExternalLink className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors duration-200 flex-shrink-0" />
          </div>
          
          <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
            {metadata.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {metadata.siteName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {metadata.siteName}
              </span>
            )}
            {metadata.publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {metadata.publishedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ReviewPreview;
