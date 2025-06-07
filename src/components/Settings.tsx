import React, { useState, useEffect } from 'react';
import { useOpenAI } from '../context/OpenAIContext';
import { useThoughts } from '../context/ThoughtContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Key, 
  RefreshCw, 
  Check, 
  X, 
  Info, 
  Eye, 
  EyeOff, 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  Sparkles,
  Palette,
  Monitor,
  Sun,
  Moon,
  AlertCircle,
  Download,
  Upload,
  Lock
} from 'lucide-react';
import { useSpring, animated } from 'react-spring';

interface SettingsProps {
  onSuccess?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onSuccess }) => {
  const { apiKey, setApiKey, clearApiKey, isKeyValid, validateKey, isLoading } = useOpenAI();
  const { refreshClusters, refreshWeeklyRecap, hardReset } = useThoughts();
  const { theme, setTheme, actualTheme } = useTheme();
  
  // State management
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(!!apiKey);
  const [activeSection, setActiveSection] = useState('theme');
  
  // Animation for settings sections
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 }
  });
  
  // Reset validation status after timeout
  const resetValidationStatus = () => {
    setTimeout(() => {
      setValidationMessage('');
      setValidationStatus('idle');
    }, 5000);
  };
  
  // Initialize form with existing API key
  useEffect(() => {
    if (apiKey) {
      setApiKeyInput(apiKey);
      setIsAiEnabled(true);
      
      // Check if the key is already validated
      if (isKeyValid) {
        setValidationStatus('success');
      }
    }
  }, [apiKey, isKeyValid]);
  
  // Handle API toggle
  const handleAiToggle = () => {
    if (isAiEnabled) {
      // User turning off AI
      clearApiKey();
      setApiKeyInput('');
      setIsAiEnabled(false);
      setValidationStatus('idle');
      setValidationMessage('');
    } else {
      // User turning on AI
      setIsAiEnabled(true);
    }
  };
  
  // Validate key format
  const isValidKeyFormat = (key: string) => {
    return key.trim().startsWith('sk-') && key.trim().length > 10;
  };
  
  // Handle API key submission
  const handleSubmitApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const key = apiKeyInput.trim();
    
    // Reset previous messages
    setValidationMessage('');
    
    // Check if key format is valid
    if (!isValidKeyFormat(key)) {
      setValidationStatus('error');
      setValidationMessage('API key must start with "sk-" and be a valid OpenAI key');
      return;
    }
    
    // Start validation process
    setIsSubmitting(true);
    setValidationStatus('idle');
    
    try {
      // Save the key first to make it available for validation
      setApiKey(key);
      
      // Validate the key
      const isValid = await validateKey();
      
      if (isValid) {
        setValidationStatus('success');
        setValidationMessage('API key is valid! Your ThoughtDrop experience will now be enhanced with AI capabilities.');
        
        // Refresh data that depends on AI
        refreshClusters();
        refreshWeeklyRecap();
        
        // Return to main screen if requested
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setValidationStatus('error');
        setValidationMessage('Invalid API key. Please check your key and try again.');
      }
    } catch (error) {
      setValidationStatus('error');
      setValidationMessage('An error occurred during validation. Please try again.');
    } finally {
      setIsSubmitting(false);
      resetValidationStatus();
    }
  };

  // Render the AI integration section
  const renderAISection = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 glassmorphism">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sparkles size={18} className="mr-2 text-indigo-500 dark:text-indigo-400" />
              <h3 className="font-medium text-gray-800 dark:text-gray-100">AI Integration</h3>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isAiEnabled}
                onChange={handleAiToggle}
                aria-label="Toggle AI features"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enable advanced features powered by OpenAI including automatic thought categorization, 
            intelligent clustering, and weekly insights.
          </p>
          
          {isAiEnabled && (
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-in-out animate-fade-in">
              <form onSubmit={handleSubmitApiKey} className="space-y-4">
                {/* Hidden username field for accessibility */}
                <input 
                  type="hidden"
                  name="username"
                  id="api-username-component"
                  autoComplete="username"
                  value="openai-api"
                />
                
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OpenAI API Key
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-gray-400" />
                    </div>
                    
                    <input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter your OpenAI API key (starts with sk-)"
                      className="bg-white dark:bg-gray-800 w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoComplete="new-password"
                      required
                    />
                    
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Validation message */}
                {validationMessage && (
                  <div className={`mt-2 text-sm flex items-start rounded-md p-3 ${
                    validationStatus === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {validationStatus === 'success' ? (
                      <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{validationMessage}</span>
                  </div>
                )}
                
                {/* Key indicator */}
                {apiKey && isKeyValid && validationStatus !== 'error' && !validationMessage && (
                  <div className="flex items-center text-green-600 dark:text-green-400 text-sm mt-1">
                    <Check size={16} className="mr-1" />
                    <span>API key is valid and active</span>
                  </div>
                )}
                
                <div className="flex mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !apiKeyInput.trim() || (apiKeyInput === apiKey && isKeyValid)}
                    className={`px-4 py-2 rounded-md font-medium text-white flex items-center ${
                      isSubmitting || !apiKeyInput.trim() || (apiKeyInput === apiKey && isKeyValid)
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="mr-2" />
                        <span>Save & Validate</span>
                      </>
                    )}
                  </button>
                  
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        clearApiKey();
                        setApiKeyInput('');
                        setValidationStatus('idle');
                        setValidationMessage('');
                      }}
                      className="ml-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Clear Key
                    </button>
                  )}
                </div>
              </form>
              
              {/* Help text */}
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md border border-yellow-100 dark:border-yellow-800 mt-6">
                <div className="flex items-start">
                  <Info size={16} className="text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Important:</p>
                    <p>
                      Your OpenAI API key is stored locally in your browser and is never sent to our servers.
                      You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">OpenAI's website</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the theme section
  const renderThemeSection = () => {
    const themeOptions = [
      { value: 'light', label: 'Light', icon: Sun, description: 'Clean, bright interface' },
      { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes, great for low light' },
      { value: 'system', label: 'System', icon: Monitor, description: 'Follows your device preference' }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 glassmorphism">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Palette size={18} className="mr-2 text-indigo-500 dark:text-indigo-400" />
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Theme & Appearance</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose how the app looks. Dark theme is easier on the eyes and saves battery on OLED displays.
          </p>
          
          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        isSelected 
                          ? 'bg-indigo-100 dark:bg-indigo-800' 
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <Icon size={18} className={`${
                          isSelected 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          isSelected 
                            ? 'text-indigo-900 dark:text-indigo-200' 
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {option.label}
                        </h4>
                        <p className={`text-sm ${
                          isSelected 
                            ? 'text-indigo-700 dark:text-indigo-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start">
              <Info size={16} className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-1">Currently active: {actualTheme === 'dark' ? 'Dark' : 'Light'} theme</p>
                <p>The theme setting is saved to your browser and will persist across sessions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the data management section
  const renderDataSection = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 glassmorphism">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Database size={18} className="mr-2 text-indigo-500 dark:text-indigo-400" />
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Data Management</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            All your thoughts are stored locally in your browser. Nothing is sent to any server unless you enable AI features.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Export Data</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Download all your thoughts as JSON</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-md flex items-center">
                <Download size={14} className="mr-2" />
                Export
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Import Data</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restore from a previous export</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-md flex items-center">
                <Upload size={14} className="mr-2" />
                Import
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">Hard Reset All Data</h4>
                <p className="text-xs text-red-600 dark:text-red-400">Clears ALL thoughts, clusters, and settings. This cannot be undone.</p>
              </div>
              <button 
                onClick={async () => {
                  if (window.confirm('⚠️ This will permanently delete ALL your thoughts, clusters, and settings. Are you absolutely sure?')) {
                    await hardReset();
                    if (onSuccess) onSuccess();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
              >
                🧹 Hard Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the about section
  const renderAboutSection = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 glassmorphism">
        <div>
          <div className="flex items-center mb-4">
            <Info size={18} className="mr-2 text-indigo-500 dark:text-indigo-400" />
            <h3 className="font-medium text-gray-800 dark:text-gray-100">About ThoughtDrop</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            ThoughtDrop is a tool for capturing, organizing, and reflecting on your thoughts.
            It uses AI to help categorize your thoughts, find connections between them, and 
            provide meaningful insights.
          </p>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">Features</h4>
            <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-2">
              <li className="flex items-start">
                <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Capture thoughts quickly with automatic categorization</span>
              </li>
              <li className="flex items-start">
                <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Organize related thoughts into threads</span>
              </li>
              <li className="flex items-start">
                <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Get weekly insights on your thinking patterns</span>
              </li>
              <li className="flex items-start">
                <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>Private by default - all data stays in your browser</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0
          </div>
        </div>
      </div>
    );
  };
  
  // Get active section content
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'ai':
        return renderAISection();
      case 'theme':
        return renderThemeSection();
      case 'data':
        return renderDataSection();
      case 'about':
        return renderAboutSection();
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <SettingsIcon size={20} className="mr-2 text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
      </div>
      
      {/* Settings navigation */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setActiveSection('ai')}
          className={`px-4 py-2 text-sm font-medium ${
            activeSection === 'ai' 
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          AI Integration
        </button>
        <button 
          onClick={() => setActiveSection('theme')}
          className={`px-4 py-2 text-sm font-medium ${
            activeSection === 'theme' 
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Theme
        </button>
        <button 
          onClick={() => setActiveSection('data')}
          className={`px-4 py-2 text-sm font-medium ${
            activeSection === 'data' 
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Data Management
        </button>
        <button 
          onClick={() => setActiveSection('about')}
          className={`px-4 py-2 text-sm font-medium ${
            activeSection === 'about' 
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          About
        </button>
      </div>
      
      {/* Active settings section */}
      <animated.div style={fadeIn}>
        {renderActiveSection()}
      </animated.div>
    </div>
  );
};

export default Settings; 