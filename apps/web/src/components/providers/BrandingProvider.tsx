'use client';

import { useEffect } from 'react';

export default function BrandingProvider() {
  useEffect(() => {
    const applyBranding = () => {
      const storedBranding = localStorage.getItem('vca_settings_branding');
      if (storedBranding) {
        try {
          const branding = JSON.parse(storedBranding);
          
          if (branding.primaryColor) {
            document.documentElement.style.setProperty('--primary', branding.primaryColor);
          }
          
          if (branding.headingFont) {
            let headingVar = 'var(--font-playfair)'; // fallback
            if (branding.headingFont.includes('DM Sans')) headingVar = 'var(--font-dm-sans)';
            else if (branding.headingFont.includes('Playfair')) headingVar = 'var(--font-playfair)';
            else if (branding.headingFont.includes('Montserrat')) headingVar = 'var(--font-montserrat)';
            
            document.documentElement.style.setProperty('--font-serif', `${headingVar}, ui-serif, Georgia`);
          }
          
          if (branding.bodyFont) {
            let bodyVar = 'var(--font-inter)'; // fallback
            if (branding.bodyFont.includes('Inter')) bodyVar = 'var(--font-inter)';
            else if (branding.bodyFont.includes('Poppins')) bodyVar = 'var(--font-poppins)';
            else if (branding.bodyFont.includes('Roboto')) bodyVar = 'var(--font-roboto)';
            
            document.documentElement.style.setProperty('--font-sans', `${bodyVar}, ui-sans-serif, system-ui`);
          }
        } catch (e) {
          console.error('Failed to parse branding settings', e);
        }
      }
    };

    applyBranding();
    
    // Also listen to storage events to update immediately when settings are saved
    // or we could use a custom event. But since the settings page might be in the same window,
    // we should dispatch a custom event when saving settings, or we just rely on localStorage event across tabs.
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vca_settings_branding') {
        applyBranding();
      }
    };
    
    // For same window updates
    const handleCustomChange = () => applyBranding();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vca-branding-updated', handleCustomChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vca-branding-updated', handleCustomChange);
    };
  }, []);

  return null;
}
