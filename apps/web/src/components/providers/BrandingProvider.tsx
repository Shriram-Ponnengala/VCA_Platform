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
        const themes: Record<string, { light: string; dark: string; image?: string; hasOverlay?: boolean }> = {
          // Classic flat color themes
          brown: { light: '#eedcd0', dark: '#c8854a' },
          blue: { light: '#dee3e6', dark: '#8ca2ad' },
          green: { light: '#ffffdd', dark: '#86a666' },
          purple: { light: '#d2c3db', dark: '#887295' },
          olive: { light: '#e0e0c0', dark: '#809070' },
          grey: { light: '#e3e3e3', dark: '#a6a6a6' },
          pink: { light: '#fdf5ea', dark: '#e47070' },
          // ChessBase/Fritz-style: Wood textures
          wood_maple: { light: '#f0dfc0', dark: '#b06a30', image: 'https://lichess1.org/assets/images/board/maple.jpg' },
          wood_maple2: { light: '#eedcb8', dark: '#b87840', image: 'https://lichess1.org/assets/images/board/maple2.jpg' },
          wood_mahogany: { light: '#e8ccaa', dark: '#9e4a20', image: 'https://lichess1.org/assets/images/board/wood.jpg' },
          wood_birch: { light: '#f2e4c8', dark: '#c09050', image: 'https://lichess1.org/assets/images/board/wood2.jpg' },
          wood_walnut: { light: '#d8c0a0', dark: '#805030', image: 'https://lichess1.org/assets/images/board/wood3.jpg' },
          wood_dark: { light: '#c8a880', dark: '#604020', image: 'https://lichess1.org/assets/images/board/wood4.jpg' },
          wood_olive: { light: '#d8d0a0', dark: '#788050', image: 'https://lichess1.org/assets/images/board/olive.jpg' },
          // ChessBase/Fritz-style: Marble & stone textures
          marble_green: { light: '#e8f0e0', dark: '#5a9050', image: 'https://lichess1.org/assets/images/board/marble.jpg' },
          marble_blue: { light: '#d8e4f0', dark: '#4a70a8', image: 'https://lichess1.org/assets/images/board/blue-marble.jpg' },
          // Other materials
          metal: { light: '#e0e8f0', dark: '#7a90a8', image: 'https://lichess1.org/assets/images/board/metal.jpg' },
          leather: { light: '#e8d4b8', dark: '#8a6040', image: 'https://lichess1.org/assets/images/board/leather.jpg' },
          canvas: { light: '#f0e8d4', dark: '#a08858', image: 'https://lichess1.org/assets/images/board/canvas2.jpg' },
          // Digital/modern
          grey_cb: { light: '#f0f0f0', dark: '#808080', image: 'https://lichess1.org/assets/images/board/grey.jpg' },
          blue_cb: { light: '#dce8f8', dark: '#4878c8', image: 'https://lichess1.org/assets/images/board/blue2.jpg' },
          purple_diag: { light: '#d8c0e8', dark: '#8050a8', image: 'https://lichess1.org/assets/images/board/purple-diag.png' },
        };
        const theme = themes[boardKey] || themes.brown;
        document.documentElement.style.setProperty('--board-light', theme.light);
        document.documentElement.style.setProperty('--board-dark', theme.dark);
        if (theme.image) {
          if (theme.hasOverlay) {
            document.documentElement.style.setProperty(
              '--board-image',
              `conic-gradient(rgba(0, 0, 0, 0.22) 25%, transparent 0 50%, rgba(0, 0, 0, 0.22) 0 75%, transparent 0), url('${theme.image}')`
            );
          } else {
            document.documentElement.style.setProperty('--board-image', `url('${theme.image}')`);
          }
          document.documentElement.style.setProperty('--board-size', '100% 100%');
        } else {
          document.documentElement.style.setProperty(
            '--board-image',
            `conic-gradient(var(--board-dark) 25%, transparent 0 50%, var(--board-dark) 0 75%, transparent 0)`
          );
          document.documentElement.style.setProperty('--board-size', '25% 25%');
        }

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
