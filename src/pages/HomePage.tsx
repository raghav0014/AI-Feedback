import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, Link as LinkIcon, BarChart3, Users, CheckCircle, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function HomePage() {
  const { user } = useAuth();
  const { reviews } = useData();
  
  const recentReviews = reviews.filter(r => r.status === 'approved').slice(0, 3);
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced sentiment analysis and fake review detection using machine learning models.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable review storage on blockchain with IPFS integration for complete transparency.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Comprehensive insights and trends analysis for informed decision making.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Decentralized platform where users contribute to review authenticity verification.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'Total Reviews', value: reviews.length.toLocaleString(), icon: Star },
    { label: 'Verified Reviews', value: `${Math.round((reviews.filter(r => r.isVerified).length / reviews.length) * 100)}%`, icon: CheckCircle },
    { label: 'Average Rating', value: avgRating.toFixed(1), icon: TrendingUp },
    { label: 'Active Users', value: '2.5K+', icon: Users },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Decentralized
              </span>
              <br />
              <span className="text-gray-800">Feedback Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Harness the power of AI and blockchain technology to create transparent, 
              tamper-proof, and intelligent feedback systems that users can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/feedback"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Submit Feedback
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Get Started
                </Link>
              )}
              <Link
                to="/reviews"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              >
                View Reviews
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Why Choose FeedbackChain?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with blockchain technology to revolutionize 
              how feedback is collected, verified, and analyzed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      {recentReviews.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Latest Reviews
              </h2>
              <p className="text-xl text-gray-600">
                See what our community is saying
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {recentReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                      <div className="flex items-center">
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
                  <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{review.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{review.productName}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      review.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                      review.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {review.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/reviews"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                View All Reviews
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience Trustworthy Reviews?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust our AI-powered, blockchain-secured feedback platform.
          </p>
          {!user && (
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}