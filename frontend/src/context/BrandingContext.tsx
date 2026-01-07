import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface BrandingData {
  enabled: boolean;
  studioName: string | null;
  logo: string | null;
  accentColor: string | null;
  subdomain: string | null;
}

interface BrandingContextType {
  branding: BrandingData | null;
  isLoading: boolean;
  refreshBranding: () => void;
}

const defaultBranding: BrandingData = {
  enabled: false,
  studioName: null,
  logo: null,
  accentColor: null,
  subdomain: null,
};

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  refreshBranding: () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBranding = () => {
    if (isAuthenticated && user) {
      // Get branding from user object
      if (user.branding?.enabled) {
        setBranding({
          enabled: true,
          studioName: user.branding.studioName || null,
          logo: user.branding.logo || null,
          accentColor: user.branding.accentColor || null,
          subdomain: user.branding.subdomain || null,
        });
        
        // Apply accent color as CSS variable
        if (user.branding.accentColor) {
          document.documentElement.style.setProperty('--color-accent', user.branding.accentColor);
        }
      } else {
        setBranding(defaultBranding);
        // Reset to default accent color
        document.documentElement.style.setProperty('--color-accent', '#D4E157');
      }
    } else {
      setBranding(null);
      document.documentElement.style.setProperty('--color-accent', '#D4E157');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBranding();
  }, [user, isAuthenticated]);

  const refreshBranding = () => {
    loadBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
