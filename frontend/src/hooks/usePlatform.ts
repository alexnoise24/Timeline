import { Capacitor } from '@capacitor/core';

interface PlatformInfo {
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

// Capacitor.getPlatform() is synchronous — no useEffect needed
export function usePlatform(): PlatformInfo {
  const isNative = Capacitor.isNativePlatform();
  const currentPlatform = Capacitor.getPlatform();
  return {
    isNative,
    isIOS: currentPlatform === 'ios',
    isAndroid: currentPlatform === 'android',
    isWeb: currentPlatform === 'web',
  };
}
