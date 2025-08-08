'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show install prompt after a delay (not immediately)
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-shown');
        const hasDeclined = localStorage.getItem('pwa-install-declined');
        
        if (!hasSeenPrompt && !hasDeclined) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Show after 10 seconds of usage
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Track successful installation
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
        localStorage.setItem('pwa-install-declined', 'true');
      }
      
      // Mark prompt as shown
      localStorage.setItem('pwa-install-prompt-shown', 'true');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
    
    // Show again in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    localStorage.setItem('pwa-install-remind-later', sevenDaysFromNow.toISOString());
  };

  const canShowPrompt = () => {
    // Only run on client side
    if (typeof window === 'undefined') return false;
    
    const remindLater = localStorage.getItem('pwa-install-remind-later');
    if (remindLater && new Date(remindLater) > new Date()) {
      return false;
    }
    return isInstallable && !isInstalled && showInstallPrompt;
  };

  return {
    isInstallable,
    isInstalled,
    showInstallPrompt: canShowPrompt(),
    installApp,
    dismissInstallPrompt
  };
}