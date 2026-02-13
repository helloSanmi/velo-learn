import React from 'react';
import AuthView from '../AuthView';
import LandingPage from '../LandingPage';
import PricingPage from '../PricingPage';
import SupportPage from '../SupportPage';
import { User } from '../../types';

interface AuthRouterProps {
  authView: 'landing' | 'pricing' | 'support' | 'login' | 'register' | 'join';
  setAuthView: (view: 'landing' | 'pricing' | 'support' | 'login' | 'register' | 'join') => void;
  onAuthSuccess: (user: User | null) => void;
}

const AuthRouter: React.FC<AuthRouterProps> = ({ authView, setAuthView, onAuthSuccess }) => {
  if (authView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setAuthView('register')}
        onLogin={() => setAuthView('login')}
        onOpenPricing={() => setAuthView('pricing')}
        onOpenSupport={() => setAuthView('support')}
      />
    );
  }

  if (authView === 'pricing') {
    return (
      <PricingPage
        onBackToHome={() => setAuthView('landing')}
        onOpenSupport={() => setAuthView('support')}
        onSignIn={() => setAuthView('login')}
        onGetStarted={() => setAuthView('register')}
      />
    );
  }

  if (authView === 'support') {
    return (
      <SupportPage
        onBackToHome={() => setAuthView('landing')}
        onOpenPricing={() => setAuthView('pricing')}
        onSignIn={() => setAuthView('login')}
        onGetStarted={() => setAuthView('register')}
      />
    );
  }

  return (
    <AuthView
      onAuthSuccess={onAuthSuccess}
      initialMode={authView}
      onBackToHome={() => setAuthView('landing')}
      onOpenPricing={() => setAuthView('pricing')}
      onOpenSupport={() => setAuthView('support')}
    />
  );
};

export default AuthRouter;
