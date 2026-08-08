import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
const service = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response) { 
    try { 
      res.json(await service.get(req.params.key as string)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }

  async upsert(req: Request, res: Response) { 
    try { 
      res.json(await service.upsert(req.params.key as string, req.body)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }

  async getBrandingCss(req: Request, res: Response) {
    try {
      const branding = (await service.get('branding') || {}) as any;
      
      let css = ':root {\n';
      
      if (branding.primaryColor) {
        css += `  --primary: ${branding.primaryColor};\n`;
      }
      if (branding.headingTextColor) {
        css += `  --heading-color: ${branding.headingTextColor};\n`;
      }
      if (branding.bodyTextColor) {
        css += `  --body-color: ${branding.bodyTextColor};\n`;
      }
      
      if (branding.headingFont) {
        let headingVar = 'var(--font-playfair), serif';
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
        
        css += `  --font-serif: ${headingVar};\n`;
      }
      
      if (branding.bodyFont) {
        let bodyVar = 'var(--font-inter), sans-serif';
        if (branding.bodyFont.includes('Inter')) bodyVar = 'var(--font-inter), sans-serif';
        else if (branding.bodyFont.includes('Poppins')) bodyVar = 'var(--font-poppins), sans-serif';
        else if (branding.bodyFont.includes('Roboto')) bodyVar = 'var(--font-roboto), sans-serif';
        else if (branding.bodyFont.includes('Open Sans')) bodyVar = 'var(--font-open-sans), sans-serif';
        else if (branding.bodyFont.includes('Lato')) bodyVar = 'var(--font-lato), sans-serif';
        else if (branding.bodyFont.includes('Merriweather')) bodyVar = 'var(--font-merriweather), serif';
        else if (branding.bodyFont.includes('Nunito')) bodyVar = 'var(--font-nunito), sans-serif';
        
        css += `  --font-sans: ${bodyVar};\n`;
      }
      
      // Chess board colors
      const boardKey = (branding.boardTheme || 'brown').toLowerCase();
      const themes: Record<string, { light: string; dark: string; image?: string; hasOverlay?: boolean }> = {
        brown: { light: '#eedcd0', dark: '#c8854a' },
        blue: { light: '#dee3e6', dark: '#8ca2ad' },
        green: { light: '#ffffdd', dark: '#86a666' },
        purple: { light: '#d2c3db', dark: '#887295' },
        olive: { light: '#e0e0c0', dark: '#809070' },
        grey: { light: '#e3e3e3', dark: '#a6a6a6' },
        wood: { light: '#e9d3b4', dark: '#a06a42' },
        minimal: { light: '#f0f0f0', dark: '#505050' },
        pink: { light: '#fdf5ea', dark: '#e47070' },
        green_marble: { light: '#ffffdd', dark: '#86a666', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80', hasOverlay: true },
        grey_marble: { light: '#e3e3e3', dark: '#a6a6a6', image: 'https://lichess1.org/assets/images/board/marble.jpg' },
        wood_maple: { light: '#eedcd0', dark: '#c8854a', image: 'https://lichess1.org/assets/images/board/maple.jpg' },
        wood_walnut: { light: '#eedcd0', dark: '#c8854a', image: 'https://lichess1.org/assets/images/board/wood3.jpg' },
        wood_cherry: { light: '#eedcd0', dark: '#c8854a', image: 'https://lichess1.org/assets/images/board/wood.jpg' },
        wood_olive: { light: '#eedcd0', dark: '#c8854a', image: 'https://lichess1.org/assets/images/board/olive.jpg' },
        wood_dark_ash: { light: '#eedcd0', dark: '#c8854a', image: 'https://lichess1.org/assets/images/board/wood4.jpg' }
      };
      if (boardKey.startsWith('custom_')) {
        let customTheme: any = null;
        if (branding.customThemes) {
          customTheme = branding.customThemes.find((t: any) => t.id.toLowerCase() === boardKey);
        }
        if (customTheme) {
          css += `  --board-light: transparent;\n`;
          css += `  --board-image: none;\n`;
          css += `  --board-square-light: ${customTheme.light};\n`;
          css += `  --board-square-dark: ${customTheme.dark};\n`;
        } else {
          const theme = themes.brown;
          css += `  --board-light: ${theme.light};\n`;
          css += `  --board-dark: ${theme.dark};\n`;
          css += `  --board-image: conic-gradient(var(--board-dark) 25%, transparent 0 50%, var(--board-dark) 0 75%, transparent 0);\n`;
          css += `  --board-size: 25% 25%;\n`;
          css += `  --board-square-light: transparent;\n`;
          css += `  --board-square-dark: transparent;\n`;
        }
      } else {
        css += `  --board-square-light: transparent;\n`;
        css += `  --board-square-dark: transparent;\n`;
        
        const theme = themes[boardKey] || themes.brown;
        css += `  --board-light: ${theme.light};\n`;
        css += `  --board-dark: ${theme.dark};\n`;
        if (theme.image) {
          if (theme.hasOverlay) {
            css += `  --board-image: conic-gradient(rgba(0, 0, 0, 0.22) 25%, transparent 0 50%, rgba(0, 0, 0, 0.22) 0 75%, transparent 0), url('${theme.image}');\n`;
          } else {
            css += `  --board-image: url('${theme.image}');\n`;
          }
          css += `  --board-size: 100% 100%;\n`;
        } else {
          css += `  --board-image: conic-gradient(var(--board-dark) 25%, transparent 0 50%, var(--board-dark) 0 75%, transparent 0);\n`;
          css += `  --board-size: 25% 25%;\n`;
        }
      }
      
      // Chess pieces styles
      let pTheme = (branding.pieceTheme || 'cburnett').toLowerCase();
      if (pTheme === 'chibi') pTheme = 'cburnett'; // Fallback for removed legacy theme
      const pieces = ['wP', 'wB', 'wN', 'wR', 'wQ', 'wK', 'bP', 'bB', 'bN', 'bR', 'bQ', 'bK'];
      pieces.forEach(p => {
        const url = `https://lichess1.org/assets/_L5MIdy/piece/${pTheme}/${p}.svg`;
        css += `  --piece-${p.toLowerCase()}: url(${url});\n`;
      });
      
      if (branding.boardFrameColor) {
        css += `  --board-frame-color: ${branding.boardFrameColor};\n`;
      }
      if (branding.boardCoordinatesColor) {
        css += `  --board-coords-color: ${branding.boardCoordinatesColor};\n`;
      }
      if (branding.boardFramePadding !== undefined && branding.boardFramePadding !== null) {
        css += `  --board-frame-padding: ${branding.boardFramePadding}px;\n`;
      }

      // Panel Style CSS Custom Properties
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
          imgUrl = '/api/settings/branding/panel-image';
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

      css += `  --panel-bg: ${panelBg};\n`;
      css += `  --panel-backdrop-filter: ${panelBackdropFilter};\n`;
      css += `  --panel-filter: ${pStyle === 'image' && pBlur > 0 ? `blur(${pBlur}px)` : 'none'};\n`;
      css += `  --panel-text-color: ${panelTextColor};\n`;
      css += `  --panel-border-color: ${panelBorderColor};\n`;
      css += `  --panel-box-shadow: ${panelBoxShadow};\n`;
      css += `  --panel-accent-color: ${panelAccentColor};\n`;
      css += `  --panel-subtext-color: ${panelSubtextColor};\n`;
      css += `  --panel-card-bg: ${panelCardBg};\n`;
      css += `  --panel-bg-inner: ${panelBgInner};\n`;
      css += `  --panel-bg-image: ${panelBgImage};\n`;
      css += `  --panel-bg-size: ${panelBgSize};\n`;
      css += `  --panel-bg-position: ${panelBgPosition};\n`;
      css += `  --panel-avatar-bg: ${panelAvatarBg};\n`;
      
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
        const texture = bg.texture || 'dots';
        const params = bg.textureParams || {};
        const baseColor = params.baseColor || '#fdf0e4';
        const patternColor = params.patternColor || '#c8854a';
        const scale = params.scale || 100;
        const opacity = params.opacity !== undefined ? params.opacity : 50;
        const alpha = Math.max(0, Math.min(1, opacity / 100));

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2" fill="${patternColor}" fill-opacity="${alpha}"/></svg>`;
        let tileSize = Math.max(8, Math.round(16 * (scale / 100)));

        if (texture === 'grid') {
          tileSize = Math.max(10, Math.round(20 * (scale / 100)));
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 20 20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1"/></svg>`;
        } else if (texture === 'stripes') {
          tileSize = Math.max(10, Math.round(20 * (scale / 100)));
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 20 20"><path d="M-5,5 L5,-5 M0,20 L20,0 M15,25 L25,15" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="4"/></svg>`;
        }

        const encoded = encodeURIComponent(svg.replace(/\n/g, '').replace(/\s+/g, ' '));
        bgValue = `${baseColor} url("data:image/svg+xml;charset=utf-8,${encoded}")`;
        bgSize = `${tileSize}px ${tileSize}px`;
        bgRepeat = 'repeat';
      } else if (bg.type === 'image') {
        // For uploads, serve via a dedicated endpoint to avoid embedding 5MB+ base64 in CSS
        const imgUrl = bg.imageSource === 'upload'
          ? (bg.imageUpload ? '/api/settings/branding/background-image' : '')
          : (bg.imageUrl || '');
        if (imgUrl) {
          bgValue = `url('${imgUrl}')`;
          bgSize = bg.imageFit || 'cover';
          bgPosition = 'center';
          bgRepeat = 'no-repeat';
        }
      }

      css += `  --classroom-bg: ${bgValue};\n`;
      css += `  --classroom-bg-size: ${bgSize};\n`;
      css += `  --classroom-bg-repeat: ${bgRepeat};\n`;
      css += `  --classroom-bg-position: ${bgPosition};\n`;
      css += `  --classroom-bg-overlay: ${bgOverlay};\n`;
      
      css += '}';
      
      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async getBrandingBackgroundImage(req: Request, res: Response) {
    try {
      const branding = (await service.get('branding') || {}) as any;
      const bg = branding.classroomBackground;
      if (bg?.type === 'image' && bg?.imageSource === 'upload' && bg?.imageUpload) {
        const dataUri: string = bg.imageUpload;
        const commaIdx = dataUri.indexOf(',');
        if (commaIdx === -1) {
          return res.status(400).json({ error: 'Invalid image data' });
        }
        const header = dataUri.substring(0, commaIdx);
        const base64Data = dataUri.substring(commaIdx + 1);
        const mimeMatch = header.match(/data:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(buffer);
      }
      return res.status(404).json({ error: 'No uploaded background image set' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
