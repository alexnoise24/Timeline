import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface PlatformInfo {
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>({
    isNative: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const currentPlatform = Capacitor.getPlatform();
    
    setPlatform({
      isNative,
      isIOS: currentPlatform === 'ios',
      isAndroid: currentPlatform === 'android',
      isWeb: currentPlatform === 'web',
    });
  }, []);

  return platform;
}
