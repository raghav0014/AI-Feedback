import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, ThumbsUp, Flag, Shield, ExternalLink, Calendar, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function ReviewsPage() {
  const { reviews } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const approvedReviews = reviews.filter(r => r.status === 'approved');
  
  const categories = [...new Set(approvedReviews.map(r => r.category))];

  const filteredAndSortedReviews = useMemo(() => {
    let filtered = approvedReviews.filter(review => {
      const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || review.category === selectedCategory;
      const matchesSentiment = !selectedSentiment || review.sentiment === selectedSentiment;
      const matchesRating = !selectedRating || review.rating.toString() === selectedRating;
      
      return matchesSearch && matchesCategory && matchesSentiment && matchesRating;
    });

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'highest-rated':
          return b.rating - a.rating;
        case 'lowest-rated':
          return a.rating - b.rating;
        case 'most-helpful':
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

    return filtered;
  }, [approvedReviews, searchTerm, selectedCategory, selectedSentiment, selectedRating, sortBy]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Community Reviews</h1>
        <p className="text-gray-600">
          Browse verified, AI-analyzed, and blockchain-secured reviews from our community.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="lowest-rated">Lowest Rated</option>
              <option value="most-helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory || selectedSentiment || selectedRating) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Category: {selectedCategory}
              </span>
            )}
            {selectedSentiment && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Sentiment: {selectedSentiment}
              </span>
            )}
            {selectedRating && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Rating: {selectedRating} star{selectedRating !== '1' ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedSentiment('');
                setSelectedRating('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs hover:bg-gray-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredAndSortedReviews.length} of {approvedReviews.length} reviews
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredAndSortedReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{review.userName}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(review.timestamp)}</span>
                      {review.isVerified && (
                        <>
                          <span>•</span>
                          <Shield className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(review.sentiment)}`}>
                    {review.sentiment}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {review.category}
                  </span>
                </div>
              </div>

              {/* Product & Rating */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{review.productName}</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              {/* AI Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <h6 className="text-sm font-semibold text-gray-700 mb-1">AI Summary</h6>
                <p className="text-sm text-gray-600">{review.summary}</p>
              </div>

              {/* Blockchain Info */}
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="text-sm font-semibold text-purple-800 mb-1 flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Blockchain Verified
                    </h6>
                    <p className="text-xs text-purple-700">
                      Hash: {review.blockchainHash.substring(0, 20)}...
                    </p>
                  </div>
                  <button className="text-purple-600 hover:text-purple-800 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">Helpful ({review.helpful})</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
                    <Flag className="h-4 w-4" />
                    <span className="text-sm">Report</span>
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Sentiment Score: {review.sentimentScore > 0 ? '+' : ''}{review.sentimentScore.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedReviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms to find more reviews.
          </p>
        </div>
      )}
    </div>
  );
}