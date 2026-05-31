'use client';

import { useEffect } from 'react';

export default function BrandingProvider() {
  useEffect(() => {
    const applyVariables = (branding: any) => {
      if (!branding) return;
      try {
        if (branding.primaryColor) {
          document.documentElement.style.setProperty('--primary', branding.primaryColor);
        }
        
        if (branding.headingFont) {
          let headingVar = 'var(--font-playfair), serif'; // fallback
          if (branding.headingFont.includes('DM Sans')) headingVar = 'var(--font-dm-sans), sans-serif';
          else if (branding.headingFont.includes('Playfair')) headingVar = 'var(--font-playfair), serif';
          else if (branding.headingFont.includes('Montserrat')) headingVar = 'var(--font-montserrat), sans-serif';
          else if (branding.headingFont.includes('Open Sans')) headingVar = 'var(--font-open-sans), sans-serif';
          else if (branding.headingFont.includes('Oleo Script')) headingVar = 'var(--font-oleo-script), cursive, serif';
          else if (branding.headingFont.includes('Lato')) headingVar = 'var(--font-lato), sans-serif';
          else if (branding.headingFont.includes('Merriweather')) headingVar = 'var(--font-merriweather), serif';
          else if (branding.headingFont.includes('Nunito')) headingVar = 'var(--font-nunito), sans-serif';
          else if (branding.headingFont.includes('Poppins')) headingVar = 'var(--font-poppins), sans-serif';
          else if (branding.headingFont.includes('Roboto')) headingVar = 'var(--font-roboto), sans-serif';
          
          document.documentElement.style.setProperty('--font-serif', `${headingVar}`);
        }
        
        if (branding.bodyFont) {
          let bodyVar = 'var(--font-inter), sans-serif'; // fallback
          if (branding.bodyFont.includes('Inter')) bodyVar = 'var(--font-inter), sans-serif';
          else if (branding.bodyFont.includes('Poppins')) bodyVar = 'var(--font-poppins), sans-serif';
          else if (branding.bodyFont.includes('Roboto')) bodyVar = 'var(--font-roboto), sans-serif';
          else if (branding.bodyFont.includes('Open Sans')) bodyVar = 'var(--font-open-sans), sans-serif';
          else if (branding.bodyFont.includes('Lato')) bodyVar = 'var(--font-lato), sans-serif';
          else if (branding.bodyFont.includes('Merriweather')) bodyVar = 'var(--font-merriweather), serif';
          else if (branding.bodyFont.includes('Nunito')) bodyVar = 'var(--font-nunito), sans-serif';
          
          document.documentElement.style.setProperty('--font-sans', `${bodyVar}`);
        }
      } catch (e) {
        console.error('Failed to apply branding settings', e);
      }
    };

    const syncAndApply = async () => {
      // 1. Try local storage first for instant application
      const storedBranding = localStorage.getItem('vca_settings_branding');
      if (storedBranding) {
        try { applyVariables(JSON.parse(storedBranding)); } catch (e) {}
      }

      // 2. Fetch global settings from API
      try {
        const res = await fetch('/api/settings/branding', { cache: 'no-store' });
        if (res.ok) {
          const globalBranding = await res.json();
          if (globalBranding) {
            applyVariables(globalBranding);
            localStorage.setItem('vca_settings_branding', JSON.stringify(globalBranding));
          }
        }
      } catch (e) {
        console.error('Failed to fetch global branding', e);
      }
    };

    syncAndApply();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vca_settings_branding') {
        const stored = localStorage.getItem('vca_settings_branding');
        if (stored) applyVariables(JSON.parse(stored));
      }
    };
    
    const handleCustomChange = () => {
      const stored = localStorage.getItem('vca_settings_branding');
      if (stored) applyVariables(JSON.parse(stored));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vca-branding-updated', handleCustomChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vca-branding-updated', handleCustomChange);
    };
  }, []);

  return null;
}
