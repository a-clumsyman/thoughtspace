import React from 'react';
import { Brain, Settings, HelpCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, onViewChange }) => {
  const { actualTheme, toggleTheme } = useTheme();
  
  const showOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    window.location.reload();
  };
  
  return (
    <nav className="w-full bg-white dark:bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-40 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ThoughtSpace</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your personal thinking companion</p>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={showOnboarding}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Show tutorial"
              title="Show tutorial again"
            >
              <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {actualTheme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            <button
              onClick={() => onViewChange('settings')}
              className={`p-2 rounded-full transition-colors ${
                activeView === 'settings'
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              aria-label="Settings"
              title="App settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;