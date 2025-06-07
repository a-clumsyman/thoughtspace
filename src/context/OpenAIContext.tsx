import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OpenAIContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isKeyValid: boolean;
  isLoading: boolean;
  validateKey: () => Promise<boolean>;
}

const OpenAIContext = createContext<OpenAIContextType>({
  apiKey: null,
  setApiKey: () => {},
  clearApiKey: () => {},
  isKeyValid: false,
  isLoading: false,
  validateKey: async () => false
});

export const OpenAIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load API key from localStorage on initial render
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKeyState(savedKey);
      // We don't immediately validate to avoid unnecessary API calls
      // User will need to attempt an AI action to trigger validation
    }
  }, []);

  // Set API key and store in localStorage
  const setApiKey = (key: string) => {
    if (key && key.startsWith('sk-')) {
      localStorage.setItem('openai_api_key', key);
      setApiKeyState(key);
      validateKey(); // Validate the key immediately
    } else {
      clearApiKey();
      setIsKeyValid(false);
    }
  };

  // Clear API key
  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKeyState(null);
    setIsKeyValid(false);
  };

  // Validate API key with a simple API call
  const validateKey = async (): Promise<boolean> => {
    if (!apiKey) return false;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const valid = response.ok;
      setIsKeyValid(valid);
      
      if (!valid) {
        // Invalid OpenAI API key
      }
      
      return valid;
    } catch (error) {
      setIsKeyValid(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OpenAIContext.Provider 
      value={{ 
        apiKey, 
        setApiKey, 
        clearApiKey,
        isKeyValid,
        isLoading,
        validateKey
      }}
    >
      {children}
    </OpenAIContext.Provider>
  );
};

// Custom hook to use the OpenAI context
export const useOpenAI = () => useContext(OpenAIContext); 