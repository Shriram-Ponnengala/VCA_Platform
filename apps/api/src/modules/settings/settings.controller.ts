import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
const service = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response) { 
    try { 
      res.json(await service.get(req.params.key)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }

  async upsert(req: Request, res: Response) { 
    try { 
      res.json(await service.upsert(req.params.key, req.body)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }

  async getBrandingCss(req: Request, res: Response) {
    try {
      const branding = await service.get('branding') || {};
      
      let css = ':root {\n';
      
      if (branding.primaryColor) {
        css += `  --primary: ${branding.primaryColor};\n`;
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
      css += `  --board-light: ${theme.light};\n`;
      css += `  --board-dark: ${theme.dark};\n`;
      
      // Chess pieces styles
      const pTheme = (branding.pieceTheme || 'cburnett').toLowerCase();
      const pieces = ['wP', 'wB', 'wN', 'wR', 'wQ', 'wK', 'bP', 'bB', 'bN', 'bR', 'bQ', 'bK'];
      pieces.forEach(p => {
        css += `  --piece-${p.toLowerCase()}: url(https://lichess1.org/assets/_L5MIdy/piece/${pTheme}/${p}.svg);\n`;
      });
      
      css += '}';
      
      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
