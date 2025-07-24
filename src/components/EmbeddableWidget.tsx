import React, { useState } from 'react';
import { Star, MessageSquare, TrendingUp, Shield } from 'lucide-react';

interface EmbeddableWidgetProps {
  productId?: string;
  companyId?: string;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export default function EmbeddableWidget({ 
  productId = 'default', 
  companyId = 'demo',
  theme = 'light',
  compact = false 
}: EmbeddableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data for the widget
  const widgetData = {
    averageRating: 4.3,
    totalReviews: 1247,
    verifiedPercentage: 89,
    recentReviews: [
      {
        id: '1',
        rating: 5,
        text: 'Excellent product! Highly recommended.',
        author: 'John D.',
        verified: true,
        date: '2 days ago'
      },
      {
        id: '2',
        rating: 4,
        text: 'Good quality, fast delivery.',
        author: 'Sarah M.',
        verified: true,
        date: '1 week ago'
      }
    ]
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 text-white border-gray-700' 
    : 'bg-white text-gray-800 border-gray-200';

  if (compact) {
    return (
      <div className={`rounded-lg border p-4 shadow-sm ${themeClasses} max-w-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(widgetData.averageRating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold">{widgetData.averageRating}</span>
          </div>
          <Shield className="h-4 w-4 text-green-500" />
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {widgetData.totalReviews} reviews • {widgetData.verifiedPercentage}% verified
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          {isExpanded ? 'Hide Reviews' : 'View Reviews'}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {widgetData.recentReviews.map((review) => (
              <div key={review.id} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.verified && (
                    <Shield className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <p className="text-gray-700 mb-1">{review.text}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{review.author}</span>
                  <span>{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 shadow-lg ${themeClasses} max-w-md`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        <div className="flex items-center space-x-1">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600">Verified</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(widgetData.averageRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xl font-bold">{widgetData.averageRating}</span>
        </div>
        
        <div className="text-sm text-gray-600">
          Based on {widgetData.totalReviews} reviews
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{widgetData.totalReviews}</div>
          <div className="text-xs text-gray-500">Total Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{widgetData.verifiedPercentage}%</div>
          <div className="text-xs text-gray-500">Verified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{widgetData.averageRating}</div>
          <div className="text-xs text-gray-500">Avg Rating</div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-sm">Recent Reviews</h4>
        {widgetData.recentReviews.map((review) => (
          <div key={review.id} className="border-l-2 border-blue-500 pl-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < review.rating 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {review.verified && (
                <Shield className="h-3 w-3 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-700 mb-1">{review.text}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{review.author}</span>
              <span>{review.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>Write Review</span>
        </button>
        <button className="flex-1 border border-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>View All</span>
        </button>
      </div>
    </div>
  );
}