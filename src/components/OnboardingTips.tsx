import React, { useState, useEffect } from 'react';
import { X, Brain, Heart, BookOpen, Zap, Check } from 'lucide-react';
import { useSpring, animated } from 'react-spring';

interface OnboardingTipsProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const OnboardingTips: React.FC<OnboardingTipsProps> = ({ isVisible, onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tips = [
    {
      icon: Brain,
      title: "Welcome to your thought space!",
      description: "This is your personal space to capture any thought, feeling, or idea. Everything stays private on your device.",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
    },
    {
      icon: Heart,
      title: "Just start writing",
      description: "Don't worry about organizing - just capture what's on your mind. The app will automatically group similar thoughts together.",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/30"
    },
    {
      icon: BookOpen,
      title: "Discover patterns",
      description: "Check the 'Mind Map' tab to see how your thoughts connect. You'll be surprised by the patterns you'll discover!",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30"
    },
    {
      icon: Zap,
      title: "Your data is safe",
      description: "Everything is saved automatically on your device. No cloud, no servers, just you and your thoughts.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    }
  ];

  const modalAnimation = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
    config: { tension: 300, friction: 20 }
  });

  const contentAnimation = useSpring({
    opacity: 1,
    transform: 'translateY(0)',
    from: { opacity: 0, transform: 'translateY(20px)' },
    reset: true,
    config: { tension: 400, friction: 25 }
  });

  const nextTip = () => {
    if (currentStep < tips.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onDismiss();
    }
  };

  const prevTip = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const currentTip = tips[currentStep];
  const Icon = currentTip.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <animated.div
        style={modalAnimation}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>

        <animated.div style={contentAnimation} key={currentStep}>
          <div className="text-center mb-6">
            <div className={`inline-flex p-4 rounded-full ${currentTip.bgColor} mb-4`}>
              <Icon className={`h-8 w-8 ${currentTip.color}`} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {currentTip.title}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              {currentTip.description}
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 mb-6">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStep
                    ? 'bg-indigo-600 dark:bg-indigo-400'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevTip}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Previous
            </button>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep + 1} of {tips.length}
            </div>

            <button
              onClick={nextTip}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {currentStep === tips.length - 1 ? (
                <>
                  <Check size={16} />
                  <span>Get Started</span>
                </>
              ) : (
                <span>Next</span>
              )}
            </button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={onDismiss}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Skip tutorial
            </button>
          </div>
        </animated.div>
      </animated.div>
    </div>
  );
};

export default OnboardingTips; 