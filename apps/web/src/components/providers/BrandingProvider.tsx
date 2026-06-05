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

        // Apply Chess Board & Piece themes
        const boardKey = (branding.boardTheme || 'brown').toLowerCase();
        const themes: Record<string, { light: string; dark: string }> = {
          brown: { light: '#eedcd0', dark: '#c8854a' },
          blue: { light: '#dee3e6', dark: '#8ca2ad' },
          green: { light: '#ffffdd', dark: '#86a666' },
          purple: { light: '#d2c3db', dark: '#887295' },
          olive: { light: '#e0e0c0', dark: '#809070' },
          grey: { light: '#e3e3e3', dark: '#a6a6a6' },
          wood: { light: '#e9d3b4', dark: '#a06a42' },
          minimal: { light: '#f0f0f0', dark: '#505050' },
          pink: { light: '#fdf5ea', dark: '#e47070' }
        };
        const theme = themes[boardKey] || themes.brown;
        document.documentElement.style.setProperty('--board-light', theme.light);
        document.documentElement.style.setProperty('--board-dark', theme.dark);

        const pTheme = (branding.pieceTheme || 'cburnett').toLowerCase();
        const pieces = ['wP', 'wB', 'wN', 'wR', 'wQ', 'wK', 'bP', 'bB', 'bN', 'bR', 'bQ', 'bK'];
        pieces.forEach(p => {
          document.documentElement.style.setProperty(
            `--piece-${p.toLowerCase()}`,
            `url(https://lichess1.org/assets/_L5MIdy/piece/${pTheme}/${p}.svg)`
          );
        });
      } catch (e) {
        console.error('Failed to apply branding settings', e);
      }
    };

    const reloadStylesheet = () => {
      const link = document.getElementById('branding-css-link');
      if (link) {
        link.setAttribute('href', `/api/settings/branding/css?t=${Date.now()}`);
      }
    };

    const syncAndApply = async () => {
      // 1. Try local storage first for instant application
      const storedBranding = localStorage.getItem('vca_settings_branding');
      if (storedBranding) {
        try { 
          applyVariables(JSON.parse(storedBranding)); 
          reloadStylesheet();
        } catch (e) {}
      }

      // 2. Fetch global settings from API
      try {
        const res = await fetch('/api/settings/branding', { cache: 'no-store' });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const globalBranding = await res.json();
            if (globalBranding) {
              try { applyVariables(globalBranding); } catch (e) {}
              localStorage.setItem('vca_settings_branding', JSON.stringify(globalBranding));
              reloadStylesheet();
            }
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
        if (stored) {
          try { applyVariables(JSON.parse(stored)); } catch (e) {}
          reloadStylesheet();
        }
      }
    };
    
    const handleCustomChange = () => {
      const stored = localStorage.getItem('vca_settings_branding');
      if (stored) {
        try { applyVariables(JSON.parse(stored)); } catch (e) {}
        reloadStylesheet();
      }
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
