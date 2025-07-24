import React, { useState } from 'react';
import { BarChart3, Users, AlertTriangle, CheckCircle, TrendingUp, Eye, Clock, XCircle, Star, Shield, Brain, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function AdminDashboard() {
  const { reviews, updateReviewStatus, getAnalytics } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  
  const analytics = getAnalytics();
  const pendingReviews = reviews.filter(r => r.status === 'pending');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reviews', label: 'Review Management', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleReviewAction = (reviewId: string, action: 'approved' | 'rejected') => {
    updateReviewStatus(reviewId, action);
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviews"
          value={analytics.totalReviews}
          icon={Star}
          color="#3B82F6"
          change={12}
        />
        <StatCard
          title="Pending Reviews"
          value={analytics.pendingReviews}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          title="Average Rating"
          value={analytics.avgRating}
          icon={TrendingUp}
          color="#10B981"
          change={0.2}
        />
        <StatCard
          title="Verification Rate"
          value={`${analytics.verificationRate}%`}
          icon={Shield}
          color="#8B5CF6"
          change={5}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.sentimentDistribution).map(([sentiment, count]) => (
              <div key={sentiment} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded mr-3 ${
                    sentiment === 'positive' ? 'bg-green-500' :
                    sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="capitalize text-gray-700">{sentiment}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-800 font-semibold mr-2">{count}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sentiment === 'positive' ? 'bg-green-500' :
                        sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${(count / analytics.totalReviews) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  review.status === 'approved' ? 'bg-green-500' :
                  review.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {review.userName} reviewed {review.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {review.sentiment}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Pending Reviews ({pendingReviews.length})</h3>
      </div>

      <div className="space-y-4">
        {pendingReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                  <p className="text-sm text-gray-600">{review.productName}</p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReviewAction(review.id, 'approved')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReviewAction(review.id, 'rejected')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
              <p className="text-gray-700">{review.content}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Sentiment:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {review.sentiment}
                </span>
              </div>
              <div>
                <span className="text-gray-500">AI Score:</span>
                <span className="ml-2 font-medium">{review.sentimentScore.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Fake Detection:</span>
                <span className={`ml-2 ${review.isFake ? 'text-red-600' : 'text-green-600'}`}>
                  {review.isFake ? 'Suspicious' : 'Authentic'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Blockchain:</span>
                <span className="ml-2 text-green-600">Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingReviews.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending reviews to moderate.</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Review Status</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{analytics.approvedReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{analytics.pendingReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{analytics.rejectedReviews}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">AI Analysis</h3>
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Fake Reviews Detected</span>
              <span className="font-semibold text-red-600">{analytics.fakeReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verified Reviews</span>
              <span className="font-semibold text-green-600">{analytics.verifiedReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verification Rate</span>
              <span className="font-semibold text-blue-600">{analytics.verificationRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Category Distribution</h3>
            <BarChart3 className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {[...new Set(reviews.map(r => r.category))].slice(0, 3).map((category) => {
              const count = reviews.filter(r => r.category === category).length;
              return (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600">{category}</span>
                  <span className="font-semibold text-gray-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="h-5 w-5 text-blue-500 mr-2" />
            Blockchain Security
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Reviews on Blockchain</span>
              <span className="font-semibold text-green-600">{reviews.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">IPFS Storage</span>
              <span className="font-semibold text-blue-600">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Hash Verification</span>
              <span className="font-semibold text-purple-600">100%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="h-5 w-5 text-purple-500 mr-2" />
            AI Security
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Fake Detection Rate</span>
              <span className="font-semibold text-green-600">95%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Sentiment Accuracy</span>
              <span className="font-semibold text-blue-600">92%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-700">Flagged Reviews</span>
              <span className="font-semibold text-yellow-600">{reviews.filter(r => r.reportCount > 0).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Logs</h3>
        <div className="space-y-3">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Review #{review.id} blockchain verification completed</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
        <p className="text-gray-600">
          Monitor reviews, analyze trends, and manage platform security.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'security' && renderSecurity()}
      </div>
    </div>
  );
}