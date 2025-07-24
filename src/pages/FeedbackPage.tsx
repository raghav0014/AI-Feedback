import React, { useState } from 'react';
import { Star, Upload, Send, Loader, CheckCircle, AlertCircle, QrCode, Camera } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import QRScanner from '../components/QRScanner';
import PurchaseVerification from '../components/PurchaseVerification';

export default function FeedbackPage() {
  const { addReview } = useData();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    title: '',
    content: '',
    rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [purchaseVerified, setPurchaseVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'scan' | 'verify' | 'complete'>('scan');

  const categories = [
    'Technology', 'Automotive', 'Food & Dining', 'Healthcare', 
    'Education', 'Entertainment', 'Travel', 'Finance', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addReview({
        ...formData,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        isVerified: purchaseVerified,
        qrCode: qrData
      });
      
      setSuccess(true);
      setFormData({
        productName: '',
        category: '',
        title: '',
        content: '',
        rating: 0
      });
      
      // Reset verification state
      setQrData(null);
      setPurchaseVerified(false);
      setVerificationStep('scan');
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    setQrData(data);
    setVerificationStep('verify');
    setShowQRScanner(false);
  };

  const handleVerificationComplete = (purchaseData: any) => {
    if (purchaseData && purchaseData.verified) {
      setPurchaseVerified(true);
      setFormData(prev => ({
        ...prev,
        productName: purchaseData.productName
      }));
    }
    setVerificationStep('complete');
  };

  const isFormValid = formData.productName && formData.category && formData.title && 
                     formData.content && formData.rating > 0;

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Review Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been processed with AI analysis and recorded on the blockchain. 
            It will be reviewed by our moderation team before being published.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• AI sentiment analysis completed</li>
              <li>• Review hashed and stored on blockchain</li>
              <li>• Fake review detection performed</li>
              <li>• Purchase verification {purchaseVerified ? 'confirmed' : 'pending'}</li>
              <li>• Awaiting moderation approval</li>
            </ul>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Submit Your Feedback</h1>
          <p className="text-gray-600">
            Share your honest experience. Our AI will analyze sentiment and blockchain will ensure immutability.
          </p>
        </div>

        {/* QR Code Verification Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-blue-600" />
            Purchase Verification (Recommended)
          </h3>
          
          {verificationStep === 'scan' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Scan the QR code on your product or receipt to verify your purchase and increase review credibility.
              </p>
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <Camera className="h-5 w-5" />
                <span>Scan QR Code</span>
              </button>
              <p className="text-sm text-gray-500 mt-2">
                You can skip this step, but verified reviews have higher credibility
              </p>
            </div>
          )}
          
          {verificationStep === 'verify' && qrData && (
            <PurchaseVerification 
              qrData={qrData} 
              onVerificationComplete={handleVerificationComplete}
            />
          )}
          
          {verificationStep === 'complete' && (
            <div className={`p-4 rounded-lg border ${
              purchaseVerified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center">
                <CheckCircle className={`h-5 w-5 mr-2 ${
                  purchaseVerified ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <p className={`font-medium ${
                  purchaseVerified ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {purchaseVerified 
                    ? 'Purchase verified! Your review will be marked as verified.'
                    : 'Purchase could not be verified, but you can still submit your review.'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setVerificationStep('scan');
                  setQrData(null);
                  setPurchaseVerified(false);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2 underline"
              >
                Try scanning again
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product & Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product/Service Name *
              </label>
              <input
                type="text"
                required
                disabled={purchaseVerified}
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  purchaseVerified ? 'bg-green-50 border-green-300' : ''
                }`}
                placeholder="e.g., iPhone 15 Pro, Tesla Model 3"
              />
              {purchaseVerified && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Product verified from QR scan
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({...formData, rating})}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-4 text-gray-600">
                {formData.rating > 0 && (
                  <>
                    {formData.rating}/5 -{' '}
                    {formData.rating === 5 ? 'Excellent' :
                     formData.rating === 4 ? 'Good' :
                     formData.rating === 3 ? 'Average' :
                     formData.rating === 2 ? 'Poor' : 'Terrible'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Summarize your experience in a few words"
            />
          </div>

          {/* Review Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Review *
            </label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Share your detailed experience, what you liked or disliked, and any recommendations..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                Be honest and specific. AI will analyze sentiment and authenticity.
              </p>
              <span className="text-sm text-gray-400">
                {formData.content.length}/1000
              </span>
            </div>
          </div>

          {/* Blockchain Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Blockchain Security Notice</h4>
                <p className="text-blue-700 text-sm">
                  Your review will be hashed and recorded on the blockchain for immutability. 
                  This ensures your feedback cannot be tampered with while maintaining your privacy.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  );
}