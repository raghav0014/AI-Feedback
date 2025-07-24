# Decentralized AI-Powered Feedback Platform

A modern, production-ready feedback platform that combines AI sentiment analysis, blockchain verification, and QR code purchase validation.

## 🚀 Features

### Core Features
- **Real AI Integration**: OpenAI GPT-3.5 for sentiment analysis and fake review detection
- **Backend API Integration**: RESTful API with authentication and data persistence
- **QR Code Verification**: Camera-based product verification with purchase validation
- **Blockchain Security**: Immutable review storage with IPFS integration
- **Company Integration**: Embeddable widgets for any website

### AI Capabilities
- **Sentiment Analysis**: Real-time emotion and tone detection
- **Fake Review Detection**: ML-powered authenticity verification
- **Content Summarization**: Automatic review summaries
- **Keyword Extraction**: Important topic identification

### Security Features
- **JWT Authentication**: Secure user sessions
- **Purchase Verification**: QR code-based ownership validation
- **Blockchain Hashing**: Tamper-proof review storage
- **Role-based Access**: Admin and user permissions

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18+
- OpenAI API Key
- Backend API (optional - has fallback)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd feedback-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start development server**
```bash
npm run dev
```

## 🔧 API Integration

### Backend Requirements

The platform expects a REST API with these endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/verify` - Token verification

#### Reviews
- `GET /api/reviews` - Get reviews with filters
- `POST /api/reviews` - Submit new review
- `PATCH /api/reviews/:id/status` - Update review status

#### Purchase Verification
- `POST /api/verify-purchase` - Verify QR code purchase

#### Analytics
- `GET /api/analytics` - Get platform analytics

### Fallback Mode

If no backend is available, the platform automatically falls back to:
- Mock authentication (demo accounts)
- Local storage for reviews
- Client-side AI analysis
- Simulated purchase verification

## 🤖 AI Configuration

### OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `VITE_OPENAI_API_KEY=your_key`
3. The platform uses GPT-3.5-turbo for analysis

### Features Analyzed
- **Sentiment**: Positive/Negative/Neutral classification
- **Authenticity**: Fake review detection
- **Summary**: Automatic content summarization
- **Keywords**: Key topic extraction

## 🏢 Company Integration

### Embeddable Widget

Add to any website:

```html
<div id="feedbackchain-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.feedbackchain.com/widget.js';
    script.onload = function() {
      FeedbackChain.init({
        companyId: 'your-company-id',
        productId: 'product-123',
        theme: 'light',
        compact: false,
        container: '#feedbackchain-widget'
      });
    };
    document.head.appendChild(script);
  })();
</script>
```

### React Component

```jsx
import { FeedbackChainWidget } from '@feedbackchain/react';

function ProductPage() {
  return (
    <FeedbackChainWidget
      companyId="your-company-id"
      productId="product-123"
      theme="light"
      compact={false}
    />
  );
}
```

## 📱 QR Code Integration

### QR Code Format
The platform expects QR codes in format: `PRODUCT_{timestamp}_{productId}`

### Purchase Verification Flow
1. **Scan QR Code** → Camera captures product QR
2. **API Verification** → Validates purchase with retailer
3. **Enhanced Reviews** → Verified purchases get special badges

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Role-based access control (user/admin)
- Secure password handling

### Review Integrity
- Blockchain hash generation
- IPFS content storage
- Purchase verification
- AI-powered fake detection

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-api.com/api
VITE_OPENAI_API_KEY=your_production_openai_key
```

## 🧪 Demo Credentials

For testing without backend:
- **Admin**: admin@feedback.com / admin123
- **User**: Any email / Any password

## 📊 Analytics Dashboard

The admin dashboard provides:
- Review sentiment analysis
- Fake review detection rates
- Purchase verification statistics
- User engagement metrics
- Blockchain verification status

## 🔄 Fallback Systems

The platform includes comprehensive fallbacks:
- **API Failures** → Local processing
- **AI Failures** → Rule-based analysis  
- **Auth Failures** → Demo authentication
- **QR Failures** → Manual entry

## 🛡 Production Considerations

### Security
- Move OpenAI API calls to backend
- Implement rate limiting
- Add CSRF protection
- Use HTTPS everywhere

### Performance
- Implement caching
- Add CDN for static assets
- Optimize bundle size
- Add service worker

### Monitoring
- Add error tracking (Sentry)
- Implement analytics
- Monitor API performance
- Track user engagement

## 📝 License

MIT License - see LICENSE file for details.