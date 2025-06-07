import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {

          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          // Service Worker registration failed
        });
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);

    };

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // User accepted the install prompt
    } else {
      // User dismissed the install prompt
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdateClick = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Remember user choice for 30 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show install prompt if user dismissed it recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (dismissedTime > thirtyDaysAgo) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {updateAvailable && (
          <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Update Available</h3>
                <p className="text-sm opacity-90">A new version is ready to install</p>
              </div>
              <button
                onClick={handleUpdateClick}
                className="ml-4 bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center">
              📱 Install ADHD Notes
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Install this app for a better experience with offline access and notifications
            </p>
          </div>
          <button
            onClick={dismissInstallPrompt}
            className="ml-2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-50"
          >
            Install App
          </button>
          <button
            onClick={dismissInstallPrompt}
            className="px-3 py-2 rounded text-sm border border-white/30 hover:bg-white/10"
          >
            Not now
          </button>
        </div>

        <div className="flex items-center justify-center mt-3 text-xs opacity-75">
          <span>🔒 Privacy-first • 💾 Offline-capable • 🚀 Fast</span>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 