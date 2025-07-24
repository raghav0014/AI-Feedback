import React, { useState } from 'react';
import { Code, Copy, Eye, Settings, Palette, Monitor } from 'lucide-react';
import EmbeddableWidget from './EmbeddableWidget';

export default function CompanyIntegration() {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
  const [isCompact, setIsCompact] = useState(false);
  const [companyId, setCompanyId] = useState('your-company-id');
  const [productId, setProductId] = useState('product-123');
  const [copied, setCopied] = useState(false);

  const generateEmbedCode = () => {
    return `<!-- FeedbackChain Widget -->
<div id="feedbackchain-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.feedbackchain.com/widget.js';
    script.onload = function() {
      FeedbackChain.init({
        companyId: '${companyId}',
        productId: '${productId}',
        theme: '${selectedTheme}',
        compact: ${isCompact},
        container: '#feedbackchain-widget'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const generateReactCode = () => {
    return `import { FeedbackChainWidget } from '@feedbackchain/react';

function ProductPage() {
  return (
    <div>
      {/* Your product content */}
      
      <FeedbackChainWidget
        companyId="${companyId}"
        productId="${productId}"
        theme="${selectedTheme}"
        compact={${isCompact}}
      />
    </div>
  );
}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Company Integration</h1>
        <p className="text-gray-600">
          Integrate FeedbackChain into your website with our embeddable widgets and APIs.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Widget Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company ID
                </label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-company-id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="product-123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="light"
                      checked={selectedTheme === 'light'}
                      onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark')}
                      className="mr-2"
                    />
                    <Palette className="h-4 w-4 mr-1" />
                    Light
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dark"
                      checked={selectedTheme === 'dark'}
                      onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark')}
                      className="mr-2"
                    />
                    <Monitor className="h-4 w-4 mr-1" />
                    Dark
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isCompact}
                    onChange={(e) => setIsCompact(e.target.checked)}
                    className="mr-2"
                  />
                  Compact Mode
                </label>
              </div>
            </div>
          </div>

          {/* Integration Code */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Integration Code
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">HTML/JavaScript</h4>
                  <button
                    onClick={() => copyToClipboard(generateEmbedCode())}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateEmbedCode()}</code>
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">React Component</h4>
                  <button
                    onClick={() => copyToClipboard(generateReactCode())}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateReactCode()}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Endpoints</h3>
            
            <div className="space-y-4 text-sm">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="font-mono text-blue-600">GET /api/reviews/{productId}</div>
                <p className="text-gray-600">Fetch reviews for a specific product</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <div className="font-mono text-green-600">POST /api/reviews</div>
                <p className="text-gray-600">Submit a new review with QR verification</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="font-mono text-purple-600">GET /api/analytics/{companyId}</div>
                <p className="text-gray-600">Get analytics data for company dashboard</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="font-mono text-orange-600">POST /api/verify-purchase</div>
                <p className="text-gray-600">Verify purchase using QR code data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Widget Preview
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Standard Widget</h4>
                <div className="flex justify-center">
                  <EmbeddableWidget
                    productId={productId}
                    companyId={companyId}
                    theme={selectedTheme}
                    compact={false}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Compact Widget</h4>
                <div className="flex justify-center">
                  <EmbeddableWidget
                    productId={productId}
                    companyId={companyId}
                    theme={selectedTheme}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Integration Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">QR Code Purchase Verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">AI-Powered Sentiment Analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Blockchain Review Verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Real-time Analytics Dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Customizable Themes & Layouts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Mobile-Responsive Design</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">RESTful API Integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}