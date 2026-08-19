'use client';

import { useEffect } from 'react';

import { renderTextureStyle } from '@/components/chess/textures.config';

if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
  try {
    const originalMeasure = window.performance.measure;
    window.performance.measure = function (...args: any[]) {
      try {
        return (originalMeasure as any).apply(window.performance, args);
      } catch (e) {}
    };
  } catch (e) {}
}

export default function BrandingProvider() {
  useEffect(() => {
    const applyVariables = (branding: any) => {
      if (!branding) return;
      try {
        if (branding.primaryColor) {
          document.documentElement.style.setProperty('--primary', branding.primaryColor);
        }
        if (branding.headingTextColor) {
          document.documentElement.style.setProperty('--heading-color', branding.headingTextColor);
        } else {
          document.documentElement.style.removeProperty('--heading-color');
        }
        if (branding.bodyTextColor) {
          document.documentElement.style.setProperty('--body-color', branding.bodyTextColor);
        } else {
          document.documentElement.style.removeProperty('--body-color');
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
        console.log('[BrandingProvider] boardKey:', boardKey);
        if (boardKey.startsWith('custom_')) {
          console.log('[BrandingProvider] branding.customThemes:', branding.customThemes);
          let customTheme: any = null;
          if (branding.customThemes) {
            customTheme = branding.customThemes.find((t: any) => t.id.toLowerCase() === boardKey);
          }
          if (!customTheme) {
            try {
              const localCustoms = localStorage.getItem('vca_custom_board_themes');
              console.log('[BrandingProvider] localCustoms:', localCustoms);
              if (localCustoms) {
                const parsed = JSON.parse(localCustoms);
                customTheme = parsed.find((t: any) => t.id.toLowerCase() === boardKey);
              }
            } catch (e) {
              console.error('[BrandingProvider] Error loading local customs:', e);
            }
          }
          console.log('[BrandingProvider] customTheme resolved:', customTheme);
          
          if (customTheme) {
            document.documentElement.style.setProperty('--board-light', 'transparent');
            document.documentElement.style.setProperty('--board-image', 'none');
            document.documentElement.style.setProperty('--board-square-light', customTheme.light);
            document.documentElement.style.setProperty('--board-square-dark', customTheme.dark);
          } else {
            const theme = themes.brown;
            document.documentElement.style.setProperty('--board-light', theme.light);
            document.documentElement.style.setProperty('--board-dark', theme.dark);
            document.documentElement.style.setProperty(
              '--board-image',
              `conic-gradient(var(--board-dark) 25%, transparent 0 50%, var(--board-dark) 0 75%, transparent 0)`
            );
            document.documentElement.style.setProperty('--board-size', '25% 25%');
            document.documentElement.style.setProperty('--board-square-light', 'transparent');
            document.documentElement.style.setProperty('--board-square-dark', 'transparent');
          }
        } else {
          document.documentElement.style.setProperty('--board-square-light', 'transparent');
          document.documentElement.style.setProperty('--board-square-dark', 'transparent');
          
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
        }

        let pTheme = (branding.pieceTheme || 'cburnett').toLowerCase();
        if (pTheme === 'chibi') pTheme = 'cburnett'; // Fallback for removed legacy theme
        const pieces = ['wP', 'wB', 'wN', 'wR', 'wQ', 'wK', 'bP', 'bB', 'bN', 'bR', 'bQ', 'bK'];
        pieces.forEach(p => {
          const url = pTheme === 'chessbuddy'
            ? `/pieces/chessbuddy/${p}.png`
            : `https://lichess1.org/assets/_L5MIdy/piece/${pTheme}/${p}.svg`;
          document.documentElement.style.setProperty(
            `--piece-${p.toLowerCase()}`,
            `url(${url})`
          );
        });

        if (branding.boardFrameColor) {
          document.documentElement.style.setProperty('--board-frame-color', branding.boardFrameColor);
        }
        if (branding.boardCoordinatesColor) {
          document.documentElement.style.setProperty('--board-coords-color', branding.boardCoordinatesColor);
        }
        if (branding.boardFramePadding !== undefined && branding.boardFramePadding !== null) {
          document.documentElement.style.setProperty('--board-frame-padding', `${branding.boardFramePadding}px`);
        }

        // Apply panel themes (Panel Style)
        const pStyle = (branding.panelStyle || 'solid').toLowerCase();
        const pOpacity = branding.panelOpacity !== undefined ? branding.panelOpacity : 95;
        const pBlur = branding.panelBlur !== undefined ? branding.panelBlur : 0;

        let panelBg = '#ffffff';
        let panelBackdropFilter = 'none';
        let panelTextColor = '#4a2018';
        let panelBorderColor = '#eedcd0';
        let panelBoxShadow = '0 8px 32px rgba(45, 74, 107, 0.08)';
        let panelAccentColor = '#c8854a';
        let panelSubtextColor = 'rgba(74, 32, 24, 0.6)';
        let panelCardBg = '#ffffff';
        let panelBgInner = '#fdf5ea';
        let panelBgImage = 'none';
        let panelBgSize = 'auto';
        let panelBgPosition = '0 0';
        let panelAvatarBg = 'rgba(45, 74, 107, 0.1)';

        const hexToRgba = (hex: string, alpha: number) => {
          if (!hex) return `rgba(255, 255, 255, ${alpha})`;
          let c = hex.replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
          return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
        };

        const isDarkColor = (hex: string) => {
          if (!hex) return false;
          let c = hex.replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          if (isNaN(num)) return false;
          const r = (num >> 16) & 255;
          const g = (num >> 8) & 255;
          const b = num & 255;
          return (r * 299 + g * 587 + b * 114) / 1000 < 128;
        };

        if (pStyle === 'solid') {
          const sColor = branding.panelColor || '#ffffff';
          panelBg = hexToRgba(sColor, pOpacity / 100);
          if (isDarkColor(sColor)) {
            panelTextColor = '#ffffff';
            panelSubtextColor = 'rgba(255, 255, 255, 0.7)';
            panelCardBg = 'rgba(255, 255, 255, 0.05)';
            panelBgInner = 'rgba(0, 0, 0, 0.2)';
            panelAvatarBg = 'rgba(255, 255, 255, 0.15)';
            panelBorderColor = 'rgba(255, 255, 255, 0.15)';
          } else {
            panelBorderColor = `rgba(238, 220, 208, ${pOpacity / 100})`;
          }
        } else if (pStyle === 'slate') {
          const sColor = branding.panelColor || '#2d4a6b';
          panelBg = hexToRgba(sColor, pOpacity / 100);
          if (isDarkColor(sColor)) {
            panelTextColor = '#ffffff';
            panelSubtextColor = 'rgba(255, 255, 255, 0.7)';
            panelCardBg = 'rgba(255, 255, 255, 0.05)';
            panelBgInner = 'rgba(0, 0, 0, 0.2)';
            panelAvatarBg = 'rgba(255, 255, 255, 0.15)';
            panelBorderColor = 'rgba(255, 255, 255, 0.15)';
          } else {
            panelTextColor = '#4a2018';
            panelSubtextColor = 'rgba(74, 32, 24, 0.6)';
            panelBorderColor = `rgba(238, 220, 208, ${pOpacity / 100})`;
          }
          panelBoxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
          panelAccentColor = '#e58e26';
        } else if (pStyle === 'glass') {
          panelBg = `rgba(255, 255, 255, ${pOpacity / 100})`;
          panelBackdropFilter = pBlur > 0 ? `blur(${pBlur}px)` : 'none';
          panelBorderColor = `rgba(255, 255, 255, 0.25)`;
          panelBoxShadow = '0 8px 32px rgba(31, 38, 135, 0.06)';
        } else if (pStyle === 'image') {
          let imgUrl = '';
          if (branding.panelImageSource === 'upload' && branding.panelImageUpload) {
            imgUrl = branding.panelImageUpload;
          } else {
            imgUrl = branding.panelImageUrl || '';
          }
          const overlayAlpha = (100 - pOpacity) / 100;
          panelBg = `rgba(255, 255, 255, ${pOpacity / 100})`;
          if (imgUrl) {
            panelBgImage = `linear-gradient(rgba(255, 255, 255, ${overlayAlpha}), rgba(255, 255, 255, ${overlayAlpha})), url('${imgUrl}')`;
            panelBgSize = branding.panelImageFit || 'cover';
            panelBgPosition = 'center';
          } else {
            panelBgImage = 'none';
          }
          panelBackdropFilter = pBlur > 0 ? `blur(${pBlur}px)` : 'none';
          panelBorderColor = `rgba(255, 255, 255, 0.3)`;
          panelBoxShadow = '0 8px 32px rgba(31, 38, 135, 0.08)';
        } else if (pStyle === 'parchment') {
          panelBg = '#fdf5ea';
          panelBgImage = 'radial-gradient(#eedcd0 1px, transparent 0), radial-gradient(#eedcd0 1px, #fdf5ea 0)';
          panelBgSize = '8px 8px';
          panelBgPosition = '0 0, 4px 4px';
          panelBoxShadow = '0 8px 32px rgba(74, 32, 24, 0.04)';
          panelBgInner = '#eedcd0';
        } else if (pStyle === 'gradient') {
          panelBg = 'linear-gradient(to bottom, #ffffff, #fdf5ea)';
        }

        document.documentElement.style.setProperty('--panel-bg', panelBg);
        document.documentElement.style.setProperty('--panel-backdrop-filter', panelBackdropFilter);
        document.documentElement.style.setProperty('--panel-filter', pStyle === 'image' && pBlur > 0 ? `blur(${pBlur}px)` : 'none');
        document.documentElement.style.setProperty('--panel-text-color', panelTextColor);
        document.documentElement.style.setProperty('--panel-border-color', panelBorderColor);
        document.documentElement.style.setProperty('--panel-box-shadow', panelBoxShadow);
        document.documentElement.style.setProperty('--panel-accent-color', panelAccentColor);
        document.documentElement.style.setProperty('--panel-subtext-color', panelSubtextColor);
        document.documentElement.style.setProperty('--panel-card-bg', panelCardBg);
        document.documentElement.style.setProperty('--panel-bg-inner', panelBgInner);
        document.documentElement.style.setProperty('--panel-bg-image', panelBgImage);
        document.documentElement.style.setProperty('--panel-bg-size', panelBgSize);
        document.documentElement.style.setProperty('--panel-bg-position', panelBgPosition);
        document.documentElement.style.setProperty('--panel-avatar-bg', panelAvatarBg);

        // Classroom Background Custom CSS Properties
        const bg = branding.classroomBackground || { type: 'solid', solidColor: '#fdf0e4' };
        let bgValue = '#fdf0e4';
        let bgSize = 'auto';
        let bgRepeat = 'repeat';
        let bgPosition = '0 0';
        let bgOverlay = 'transparent';

        const overlayPct = bg.imageOverlayOpacity !== undefined 
          ? bg.imageOverlayOpacity 
          : (bg.imageOverlay ? 45 : 0);
        if (overlayPct > 0) {
          bgOverlay = `rgba(0, 0, 0, ${(overlayPct / 100).toFixed(2)})`;
        }

        if (bg.type === 'solid') {
          bgValue = bg.solidColor || '#fdf0e4';
        } else if (bg.type === 'gradient') {
          const stops = bg.gradient?.stops || [
            { color: '#fdf0e4', position: 0 },
            { color: '#eedcd0', position: 100 }
          ];
          const direction = bg.gradient?.direction || '135deg';
          const stopsStr = stops.map((s: any) => `${s.color} ${s.position}%`).join(', ');
          bgValue = `linear-gradient(${direction}, ${stopsStr})`;
        } else if (bg.type === 'texture') {
          const texStyle = renderTextureStyle(bg.texture || 'dots', bg.textureParams);
          bgValue = texStyle.backgroundImage
            ? `${texStyle.background} ${texStyle.backgroundImage}`
            : texStyle.background;
          bgSize = texStyle.backgroundSize || 'auto';
          bgRepeat = texStyle.backgroundRepeat || 'repeat';
          bgPosition = texStyle.backgroundPosition || '0 0';
        } else if (bg.type === 'image') {
          let imgUrl: string;
          if (bg.imageSource === 'upload' && bg.imageUpload) {
            imgUrl = '/api/settings/branding/background-image';
          } else {
            imgUrl = bg.imageUrl || '';
          }
          if (imgUrl) {
            bgValue = `url('${imgUrl}')`;
            bgSize = bg.imageFit || 'cover';
            bgPosition = 'center';
            bgRepeat = bg.imageFit === 'contain' ? 'no-repeat' : 'no-repeat';
          } else {
            bgValue = '';
          }
        }

        if (bgValue) {
          document.documentElement.style.setProperty('--classroom-bg', bgValue);
          document.documentElement.style.setProperty('--classroom-bg-size', bgSize);
          document.documentElement.style.setProperty('--classroom-bg-repeat', bgRepeat);
          document.documentElement.style.setProperty('--classroom-bg-position', bgPosition);
          document.documentElement.style.setProperty('--classroom-bg-overlay', bgOverlay);
        } else {
          document.documentElement.style.removeProperty('--classroom-bg');
          document.documentElement.style.removeProperty('--classroom-bg-size');
          document.documentElement.style.removeProperty('--classroom-bg-repeat');
          document.documentElement.style.removeProperty('--classroom-bg-position');
          document.documentElement.style.removeProperty('--classroom-bg-overlay');
        }

        // Apply piece animations and last move highlight settings globally
        document.documentElement.setAttribute('data-piece-animation', branding.pieceAnimation || 'standard');
        document.documentElement.setAttribute('data-highlight-last-move', branding.highlightLastMove !== false ? 'true' : 'false');

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
              try {
                const sanitized = { ...globalBranding };
                if (sanitized.classroomBackground) {
                  sanitized.classroomBackground = {
                    ...sanitized.classroomBackground,
                    imageUpload: ''
                  };
                }
                localStorage.setItem('vca_settings_branding', JSON.stringify(sanitized));
              } catch (e) {
                console.warn('Failed to save branding to localStorage (quota exceeded or storage disabled)', e);
              }
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
