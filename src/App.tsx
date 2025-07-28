import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import FeedbackPage from './pages/FeedbackPage';
import ReviewsPage from './pages/ReviewsPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import CompanyIntegration from './components/CompanyIntegration';
import WebSocketStatus from './components/WebSocketStatus';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading FeedbackChain..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <WebSocketStatus />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/feedback" element={user ? <FeedbackPage /> : <Navigate to="/login" />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/integration" element={<CompanyIntegration />} />
        <Route 
          path="/admin" 
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppContent />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;