# How to Run FeedbackChain on Your PC

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your PC:

### Required Software:
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Code Editor** (recommended)
   - VS Code: https://code.visualstudio.com/
   - Or any editor of your choice

## 🚀 Step-by-Step Setup

### Step 1: Download the Project

**Option A: If you have the project files**
1. Extract the project folder to your desired location
2. Open terminal/command prompt in the project folder

**Option B: If cloning from repository**
```bash
git clone <repository-url>
cd feedback-platform
```

### Step 2: Install Dependencies

Open terminal in the project root directory and run:

```bash
# Install frontend dependencies
npm install

# If you want to run the backend as well
cd backend
npm install
cd ..
```

### Step 3: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your configuration:
```env
# Basic Configuration (Required)
VITE_API_BASE_URL=http://localhost:3001/api

# AI Services (Optional - app works without these)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Authentication (Optional - uses demo auth if not configured)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Or Auth0 (Alternative to Firebase)
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id

# Blockchain (Optional - uses simulation if not configured)
VITE_WEB3_RPC_URL=https://polygon-rpc.com
VITE_CONTRACT_ADDRESS=your_contract_address

# File Upload (Optional)
VITE_UPLOAD_URL=http://localhost:3001/api/upload
VITE_IPFS_API_KEY=your_pinata_api_key

# WebSocket (Optional)
VITE_WEBSOCKET_URL=ws://localhost:3001
```

### Step 4: Run the Application

**Frontend Only (Recommended for testing):**
```bash
npm run dev
```

The application will start at: http://localhost:5173

**With Backend (if you have backend setup):**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## 🔧 Configuration Options

### Minimal Setup (No external services)
The app works perfectly with just:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```
- Uses demo authentication
- Uses fallback AI analysis
- Uses localStorage for data
- Uses blockchain simulation

### Full Production Setup
For all features, configure:
- OpenAI or HuggingFace API keys
- Firebase or Auth0 authentication
- Real backend API
- Blockchain RPC endpoint
- File upload service

## 🎯 Demo Credentials

If running without real authentication, use these demo credentials:

**Admin Access:**
- Email: `admin@feedback.com`
- Password: `admin123`

**Regular User:**
- Email: Any valid email format
- Password: Any password

## 📱 Accessing the Application

Once running, you can access:

1. **Main Application**: http://localhost:5173
2. **Admin Dashboard**: http://localhost:5173/admin (use admin credentials)
3. **API Health Check**: http://localhost:3001/api/health (if backend running)

## 🛠️ Troubleshooting

### Common Issues:

**1. Port Already in Use**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

**2. Node Version Issues**
```bash
# Check Node version
node --version

# Should be v18 or higher
# Update Node.js if needed
```

**3. Permission Errors (Windows)**
- Run terminal as Administrator
- Or use PowerShell instead of Command Prompt

**4. Module Not Found Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. Environment Variables Not Loading**
- Make sure `.env` file is in the root directory
- Restart the development server after changing `.env`
- Check that variable names start with `VITE_`

## 🔍 Verification Steps

After setup, verify everything works:

1. ✅ Application loads at http://localhost:5173
2. ✅ Can create account or login with demo credentials
3. ✅ Can submit a review
4. ✅ Admin dashboard accessible (with admin credentials)
5. ✅ No console errors in browser developer tools

## 📦 Building for Production

To create a production build:

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` folder.

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors (F12 → Console)
2. Check the terminal for error messages
3. Verify all prerequisites are installed
4. Make sure you're in the correct directory
5. Try clearing cache: `npm run dev -- --force`

## 🎉 Success!

If everything is working, you should see:
- Beautiful, responsive interface
- Working authentication system
- Functional review submission
- Admin dashboard with analytics
- Real-time notifications

The application is now running on your PC and ready for use!