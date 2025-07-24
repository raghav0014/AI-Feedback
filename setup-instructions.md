# Decentralized AI-Powered Feedback Platform - Local Setup

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

## Step 1: Create New React Project
```bash
npm create vite@latest feedback-platform -- --template react-ts
cd feedback-platform
```

## Step 2: Install Dependencies
```bash
npm install react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
```

## Step 3: Setup Tailwind CSS
```bash
npx tailwindcss init -p
```

## Step 4: Project Structure
Create the following folder structure:
```
src/
├── components/
│   └── Navbar.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── DataContext.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── FeedbackPage.tsx
│   ├── ReviewsPage.tsx
│   └── AdminDashboard.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## Step 5: Configuration Files

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 6: Copy Source Files
Copy all the source files from the current project:
- src/App.tsx
- src/main.tsx
- src/components/Navbar.tsx
- src/contexts/AuthContext.tsx
- src/contexts/DataContext.tsx
- src/pages/HomePage.tsx
- src/pages/LoginPage.tsx
- src/pages/FeedbackPage.tsx
- src/pages/ReviewsPage.tsx
- src/pages/AdminDashboard.tsx

## Step 7: Update package.json
Make sure your package.json includes these scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

## Step 8: Run the Application
```bash
npm run dev
```

## Demo Credentials
- **Admin**: admin@feedback.com / admin123
- **User**: Any email / Any password

## Features Included
- ✅ User Authentication & Authorization
- ✅ Feedback Submission with AI Analysis Simulation
- ✅ Blockchain Integration Simulation
- ✅ Admin Dashboard with Analytics
- ✅ Review Management & Moderation
- ✅ Responsive Design
- ✅ Modern UI with Tailwind CSS

## Next Steps for Production
1. **Backend Integration**: Replace mock data with real API calls
2. **AI Services**: Integrate with OpenAI or HuggingFace for real sentiment analysis
3. **Blockchain**: Implement actual blockchain integration with Web3 libraries
4. **Database**: Connect to MongoDB or PostgreSQL
5. **Authentication**: Implement real authentication with Firebase or Auth0
6. **File Upload**: Add real file upload functionality
7. **Real-time Updates**: Add WebSocket support for live updates

## Deployment Options
- **Netlify**: For frontend deployment
- **Vercel**: Alternative frontend deployment
- **Railway/Render**: For full-stack deployment with backend

The current version is a fully functional MVP that demonstrates all core concepts with beautiful UI and simulated backend services.