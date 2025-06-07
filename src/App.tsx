import React, { useState, useEffect } from 'react';
import { ThoughtProvider } from './context/ThoughtContext';
import { OpenAIProvider } from './context/OpenAIContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ThoughtComposer from './components/ThoughtComposer';
import ThoughtStream from './components/ThoughtStream';
import ImprovedClusterView from './components/ImprovedClusterView';
import ClusterHierarchyView from './components/ClusterHierarchyView';

import Settings from './components/Settings';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OnboardingTips from './components/OnboardingTips';
import ThoughtAnalytics from './components/ThoughtAnalytics';
import { BookOpen, MessageCircle, Layers, Calendar, Settings as SettingsIcon } from 'lucide-react';

// Main app content component
const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState('stream');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is a first-time user
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDismiss = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const renderView = () => {
    switch (activeView) {
      case 'stream':
        return (
          <div className="space-y-8">
            <ThoughtComposer />
            <ThoughtStream />
          </div>
        );
      case 'clusters':
        return <ImprovedClusterView />;
      case 'analytics':
        return <ThoughtAnalytics />;
      case 'hierarchy':
        return <ClusterHierarchyView />;
      case 'settings':
        return <Settings onSuccess={() => setActiveView('stream')} />;
      default:
        return (
          <div className="space-y-8">
            <ThoughtComposer />
            <ThoughtStream />
          </div>
        );
    }
  };

  const navItems = [
    { id: 'stream', label: 'My Thoughts', icon: MessageCircle, description: 'Write and view your thoughts' },
    { id: 'clusters', label: 'Topics', icon: BookOpen, description: 'Thoughts grouped by topic' },
    { id: 'analytics', label: 'Insights', icon: Layers, description: 'Your thought patterns, analytics & weekly recap' },
    { id: 'hierarchy', label: 'Mind Map', icon: Layers, description: 'Advanced thought connections & organization' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, description: 'App preferences' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Welcome message for first-time users */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Personal Thought Space
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Capture your thoughts, organize them automatically, and discover patterns in your thinking.
              Everything is saved securely on your device.
            </p>
          </div>

          {/* Simple navigation tabs with icons */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 border border-gray-200 dark:border-gray-700">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeView === item.id
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title={item.description}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </div>
                    
                    {/* Tooltip for mobile */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>



          {/* Main content */}
          <div className="relative">
            {renderView()}
          </div>
        </div>
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Subtle save indicator */}
      <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-2 rounded-full text-sm font-medium shadow-md">
        ✓ Auto-saved locally
      </div>

      {/* Onboarding Tips */}
      <OnboardingTips 
        isVisible={showOnboarding} 
        onDismiss={handleOnboardingDismiss} 
      />
    </div>
  );
};

// Main App component with all providers
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OpenAIProvider>
          <ThoughtProvider>
            <AppContent />
          </ThoughtProvider>
        </OpenAIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;