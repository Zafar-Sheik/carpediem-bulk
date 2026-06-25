'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileDisplay = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;

  return mobileRegex.test(userAgent.toLowerCase()) || isMobileDisplay;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname?.startsWith('/admin')) {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowBanner(false);
      return;
    }

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      if (isMobileDevice()) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [mounted, pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('installPromptDismissed', 'true');
    }
  };

  if (!mounted || isInstalled || !isInstallable || !showBanner) {
    return null;
  }

  if (typeof window !== 'undefined' && sessionStorage.getItem('installPromptDismissed') === 'true') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-20 left-0 right-0 z-50 p-4"
    >
      <div className="max-w-md mx-auto bg-white border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-11 h-11 bg-[#22438c]/5 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#22438c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                Install App
              </h3>
              <p className="text-xs text-muted-text mt-0.5">
                Add to your home screen for quick access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 bg-[#22438c] hover:bg-[#1a3575] text-white text-sm font-bold rounded-lg transition-colors"
            >
              Install
            </motion.button>
            <button
              onClick={handleDismiss}
              className="py-2 px-4 text-muted hover:text-foreground text-sm font-semibold transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function usePWAInstallable() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallable = () => {
      if (typeof window === 'undefined') return;

      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setIsInstallable(false);
        return;
      }

      const isPWASupported = 'BeforeInstallPromptEvent' in window;
      setIsInstallable(isPWASupported);
    };

    checkInstallable();

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return { isInstallable, isInstalled };
}

export default InstallPrompt;
