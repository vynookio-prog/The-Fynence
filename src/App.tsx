import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';

// Pages
import WelcomePage from '@/app/page';
import DashboardPage from '@/app/dashboard/page';
import TradingPage from '@/app/trading/page';
import MarketPage from '@/app/market/page';
import NewsPage from '@/app/news/page';
import ReportPage from '@/app/report/page';
import ProfilePage from '@/app/profile/page';
import LoginPage from '@/app/login/page';
import SignUpPage from '@/app/signup/page';
import NewspaperPreviewPage from '@/app/newspaper/preview/page';
import AuthCallback from '@/components/auth/AuthCallback';

export default function App() {
  return (
    <AppProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#080B0E] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-[#00F2C2] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/newspaper/preview" element={<NewspaperPreviewPage />} />
          <Route path="/calendar" element={<Navigate to="/dashboard" replace />} />
          <Route path="/money" element={<Navigate to="/dashboard" replace />} />
          <Route path="/ai" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/api/auth/callback" element={<AuthCallback />} />
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
