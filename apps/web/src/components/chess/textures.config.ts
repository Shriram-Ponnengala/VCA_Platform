export type TextureCategory = 'paper' | 'fun' | 'wood' | 'fabric' | 'space';

export interface TextureCategoryMeta {
  id: TextureCategory;
  label: string;
}

export interface TextureParams {
  baseColor: string;
  patternColor: string;
  scale: number;   // Percentage, e.g., 50 to 200 (100 = default size)
  opacity: number; // Percentage, e.g., 0 to 100
}

export interface TextureDefinition {
  id: string;
  name: string;
  category: TextureCategory;
  defaultParams: TextureParams;
  presetBaseColors?: string[];
  presetPatternColors?: string[];
  renderCss: (params: TextureParams) => {
    background: string;
    backgroundImage: string;
    backgroundSize: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;
  };
}

export const TEXTURE_CATEGORIES: TextureCategoryMeta[] = [
  { id: 'paper', label: 'Paper' },
  { id: 'fun', label: 'Fun & kids' },
  { id: 'wood', label: 'Wood' },
  { id: 'fabric', label: 'Fabric' },
  { id: 'space', label: 'Space' }
];

function svgDataUrl(svg: string): string {
  const clean = svg.replace(/\n/g, '').replace(/\s+/g, ' ');
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}")`;
}

export const TEXTURE_REGISTRY: TextureDefinition[] = [
  // ─── PAPER ──────────────────────────────────────────────────────────────────
  {
    id: 'dots',
    name: 'Fine dots',
    category: 'paper',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#c8854a',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#fdf0e4', '#f0f4f8', '#f5f0f8', '#f0f8f4'],
    presetPatternColors: ['#c8854a', '#708090', '#c06c84', '#4a7c59'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(8, Math.round(16 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2" fill="${patternColor}" fill-opacity="${alpha}"/></svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'grid',
    name: 'Math grid',
    category: 'paper',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#c8854a',
      scale: 100,
      opacity: 40
    },
    presetBaseColors: ['#fdf0e4', '#f8fafc', '#faf5ff', '#f0fdf4'],
    presetPatternColors: ['#c8854a', '#64748b', '#a855f7', '#16a34a'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(10, Math.round(20 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 20 20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1"/></svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'graph',
    name: 'Graph',
    category: 'paper',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#b8753a',
      scale: 100,
      opacity: 45
    },
    presetBaseColors: ['#fdf0e4', '#f1f5f9', '#fdf4ff'],
    presetPatternColors: ['#b8753a', '#475569', '#9333ea'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(20, Math.round(40 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 40 40">
        <path d="M 10 0 L 10 40 M 20 0 L 20 40 M 30 0 L 30 40 M 0 10 L 40 10 M 0 20 L 40 20 M 0 30 L 40 30" fill="none" stroke="${patternColor}" stroke-opacity="${alpha * 0.4}" stroke-width="0.75"/>
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.5"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'lined',
    name: 'Lined',
    category: 'paper',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#c8854a',
      scale: 100,
      opacity: 35
    },
    presetBaseColors: ['#fdf0e4', '#f8fafc', '#fffbeb'],
    presetPatternColors: ['#c8854a', '#0284c7', '#d97706'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(12, Math.round(24 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 24 24"><line x1="0" y1="23" x2="24" y2="23" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.2"/></svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'stripes',
    name: 'Stripes',
    category: 'paper',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#f5e4d7',
      scale: 100,
      opacity: 80
    },
    presetBaseColors: ['#fdf0e4', '#f1f5f9', '#fff1f2'],
    presetPatternColors: ['#f5e4d7', '#e2e8f0', '#fecdd3'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(10, Math.round(20 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 20 20"><path d="M-5,5 L5,-5 M0,20 L20,0 M15,25 L25,15" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="4"/></svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },

  // ─── FUN & KIDS ─────────────────────────────────────────────────────────────
  {
    id: 'doodles',
    name: 'Chess doodles',
    category: 'fun',
    defaultParams: {
      baseColor: '#fff5f5',
      patternColor: '#ff6b6b',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#fff5f5', '#f0fdf4', '#f0f9ff'],
    presetPatternColors: ['#ff6b6b', '#16a34a', '#0284c7'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(30, Math.round(60 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 60 60">
        <path d="M12 18 L18 12 L24 18 L18 24 Z" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.5"/>
        <circle cx="45" cy="15" r="4" fill="${patternColor}" fill-opacity="${alpha}"/>
        <path d="M15 45 L25 45 L20 32 Z" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.5"/>
        <circle cx="42" cy="42" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'polka',
    name: 'Polka dots',
    category: 'fun',
    defaultParams: {
      baseColor: '#f0f8ff',
      patternColor: '#4169e1',
      scale: 100,
      opacity: 45
    },
    presetBaseColors: ['#f0f8ff', '#fff0f5', '#fafad2'],
    presetPatternColors: ['#4169e1', '#ff69b4', '#ff8c00'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(16, Math.round(32 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 32 32">
        <circle cx="8" cy="8" r="4" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="24" cy="24" r="4" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="24" cy="8" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="8" cy="24" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'waves',
    name: 'Playful waves',
    category: 'fun',
    defaultParams: {
      baseColor: '#f5fffa',
      patternColor: '#2e8b57',
      scale: 100,
      opacity: 40
    },
    presetBaseColors: ['#f5fffa', '#f0ffff', '#fff5ee'],
    presetPatternColors: ['#2e8b57', '#008b8b', '#cd5c5c'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(20, Math.round(40 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 40 40">
        <path d="M 0 10 C 10 0, 30 20, 40 10 M 0 30 C 10 20, 30 40, 40 30" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.8"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'hearts',
    name: 'Mini stars',
    category: 'fun',
    defaultParams: {
      baseColor: '#fff0f5',
      patternColor: '#db7093',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#fff0f5', '#f3e8ff', '#fef9c3'],
    presetPatternColors: ['#db7093', '#9333ea', '#ca8a04'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(18, Math.round(36 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 36 36">
        <path d="M18 4 L20 12 L28 12 L22 17 L24 25 L18 20 L12 25 L14 17 L8 12 L16 12 Z" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'puzzle',
    name: 'Jigsaw tiles',
    category: 'fun',
    defaultParams: {
      baseColor: '#fffaf0',
      patternColor: '#d2691e',
      scale: 100,
      opacity: 35
    },
    presetBaseColors: ['#fffaf0', '#f0fdf4', '#eff6ff'],
    presetPatternColors: ['#d2691e', '#15803d', '#1d4ed8'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(16, Math.round(32 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 32 32">
        <path d="M 0 0 L 12 0 C 12 4 20 4 20 0 L 32 0 L 32 12 C 28 12 28 20 32 20 L 32 32 L 20 32 C 20 28 12 28 12 32 L 0 32 L 0 20 C 4 20 4 12 0 12 Z" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.2"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },

  // ─── WOOD ───────────────────────────────────────────────────────────────────
  {
    id: 'maple',
    name: 'Maple wood',
    category: 'wood',
    defaultParams: {
      baseColor: '#fdf0e4',
      patternColor: '#d4a373',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#fdf0e4', '#faedcd', '#f4a261'],
    presetPatternColors: ['#d4a373', '#ccd5ae', '#e76f51'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <path d="M 0 15 C 30 25, 90 5, 120 15 M 0 35 C 40 20, 80 50, 120 35 M 0 55 C 35 70, 85 40, 120 55 M 0 75 C 45 60, 75 90, 120 75 M 0 95 C 30 110, 90 80, 120 95 M 0 115 C 40 100, 80 130, 120 115" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M 40 45 C 60 25, 80 25, 60 45 C 50 55, 45 50, 40 45" fill="none" stroke="${patternColor}" stroke-opacity="${alpha * 0.7}" stroke-width="1.2"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'oak',
    name: 'Oak grain',
    category: 'wood',
    defaultParams: {
      baseColor: '#e9c46a',
      patternColor: '#f4a261',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#e9c46a', '#deab68', '#f3d5b5'],
    presetPatternColors: ['#f4a261', '#264653', '#8b5e34'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <path d="M 0 10 C 35 22, 85 -2, 120 10 M 0 32 C 40 15, 80 49, 120 32 M 0 54 C 30 70, 90 38, 120 54 M 0 76 C 45 60, 75 92, 120 76 M 0 98 C 35 114, 85 82, 120 98 M 0 118 C 40 104, 80 132, 120 118" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.8"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'walnut',
    name: 'Dark walnut',
    category: 'wood',
    defaultParams: {
      baseColor: '#4a3525',
      patternColor: '#2c1d11',
      scale: 100,
      opacity: 70
    },
    presetBaseColors: ['#4a3525', '#3d2b1f', '#5c4033'],
    presetPatternColors: ['#2c1d11', '#1a0f07', '#8b5a2b'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <path d="M 0 18 C 40 32, 80 4, 120 18 M 0 42 C 30 24, 90 60, 120 42 M 0 66 C 45 84, 75 48, 120 66 M 0 90 C 35 72, 85 108, 120 90 M 0 114 C 40 128, 80 100, 120 114" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="2"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'birch',
    name: 'Light birch',
    category: 'wood',
    defaultParams: {
      baseColor: '#fefae0',
      patternColor: '#e9edc9',
      scale: 100,
      opacity: 70
    },
    presetBaseColors: ['#fefae0', '#f4f1de', '#fdf0e4'],
    presetPatternColors: ['#e9edc9', '#ccd5ae', '#d4a373'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <path d="M 0 20 C 30 28, 90 12, 120 20 M 0 45 C 40 35, 80 55, 120 45 M 0 70 C 35 82, 85 58, 120 70 M 0 95 C 45 85, 75 105, 120 95" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.2"/>
        <ellipse cx="40" cy="32" rx="6" ry="2" fill="${patternColor}" fill-opacity="${alpha * 0.6}"/>
        <ellipse cx="90" cy="82" rx="8" ry="2.5" fill="${patternColor}" fill-opacity="${alpha * 0.6}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'mahogany',
    name: 'Mahogany',
    category: 'wood',
    defaultParams: {
      baseColor: '#6b2d2d',
      patternColor: '#4a1c1c',
      scale: 100,
      opacity: 65
    },
    presetBaseColors: ['#6b2d2d', '#581c1c', '#7a3434'],
    presetPatternColors: ['#4a1c1c', '#2e0e0e', '#a84343'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <path d="M 0 12 C 35 24, 85 0, 120 12 M 0 34 C 40 18, 80 50, 120 34 M 0 56 C 30 72, 90 40, 120 56 M 0 78 C 45 62, 75 94, 120 78 M 0 100 C 35 116, 85 84, 120 100 M 0 116 C 40 102, 80 130, 120 116" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.8"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },

  // ─── FABRIC ──────────────────────────────────────────────────────────────────
  {
    id: 'canvas',
    name: 'Canvas weave',
    category: 'fabric',
    defaultParams: {
      baseColor: '#f7f4ea',
      patternColor: '#d8ceb9',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#f7f4ea', '#ede0d4', '#e6ccb2'],
    presetPatternColors: ['#d8ceb9', '#b08968', '#7f5539'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(8, Math.round(16 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 16 16">
        <path d="M 0 8 L 16 8 M 8 0 L 8 16" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.5"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'linen',
    name: 'Linen fiber',
    category: 'fabric',
    defaultParams: {
      baseColor: '#f3efe6',
      patternColor: '#c9bfae',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#f3efe6', '#e9ecef', '#fae1dd'],
    presetPatternColors: ['#c9bfae', '#adb5bd', '#f0efeb'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(12, Math.round(24 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 24 24">
        <path d="M 0 6 L 24 6 M 0 18 L 24 18 M 6 0 L 6 24 M 18 0 L 18 24" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="0.8"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'denim',
    name: 'Twill denim',
    category: 'fabric',
    defaultParams: {
      baseColor: '#2b4c7e',
      patternColor: '#1a365d',
      scale: 100,
      opacity: 70
    },
    presetBaseColors: ['#2b4c7e', '#1e3a8a', '#3b82f6'],
    presetPatternColors: ['#1a365d', '#172554', '#60a5fa'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(6, Math.round(12 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 12 12">
        <path d="M-3,3 L3,-3 M0,12 L12,0 M9,15 L15,9" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="2"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'corduroy',
    name: 'Corduroy ridges',
    category: 'fabric',
    defaultParams: {
      baseColor: '#e0c9a6',
      patternColor: '#b89d74',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#e0c9a6', '#d4a373', '#9c6644'],
    presetPatternColors: ['#b89d74', '#a5a58d', '#7f5539'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(8, Math.round(16 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 16 16">
        <rect x="0" y="0" width="8" height="16" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'felt',
    name: 'Soft felt',
    category: 'fabric',
    defaultParams: {
      baseColor: '#e9ecef',
      patternColor: '#ced4da',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#e9ecef', '#dee2e6', '#f8f9fa'],
    presetPatternColors: ['#ced4da', '#adb5bd', '#6c757d'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(8, Math.round(16 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 16 16">
        <circle cx="4" cy="4" r="1.5" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="12" cy="12" r="1.5" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },

  // ─── SPACE ───────────────────────────────────────────────────────────────────
  {
    id: 'stars',
    name: 'Cosmic sky',
    category: 'space',
    defaultParams: {
      baseColor: '#0d1b2a',
      patternColor: '#ffffff',
      scale: 100,
      opacity: 80
    },
    presetBaseColors: ['#0d1b2a', '#1a1a2e', '#000000'],
    presetPatternColors: ['#ffffff', '#e0e1dd', '#9d4edd'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <circle cx="15" cy="20" r="1.5" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="75" cy="40" r="2" fill="${patternColor}" fill-opacity="${alpha * 0.9}"/>
        <circle cx="40" cy="85" r="1" fill="${patternColor}" fill-opacity="${alpha * 0.7}"/>
        <circle cx="100" cy="100" r="2.5" fill="${patternColor}" fill-opacity="${alpha}"/>
        <polygon points="50,15 52,19 56,19 53,22 54,26 50,23 46,26 47,22 44,19 48,19" fill="${patternColor}" fill-opacity="${alpha * 0.8}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'nebula',
    name: 'Nebula dust',
    category: 'space',
    defaultParams: {
      baseColor: '#1b263b',
      patternColor: '#7209b7',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#1b263b', '#0f172a', '#2d124d'],
    presetPatternColors: ['#7209b7', '#4cc9f0', '#f72585'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(50, Math.round(150 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="50" fill="${patternColor}" fill-opacity="${alpha * 0.3}"/>
        <circle cx="20" cy="30" r="1.5" fill="#ffffff" fill-opacity="${alpha}"/>
        <circle cx="130" cy="110" r="2" fill="#ffffff" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'constellations',
    name: 'Star chart',
    category: 'space',
    defaultParams: {
      baseColor: '#0b090a',
      patternColor: '#b1a7a6',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#0b090a', '#161a1d', '#1e1b4b'],
    presetPatternColors: ['#b1a7a6', '#64748b', '#38bdf8'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(40, Math.round(100 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 100 100">
        <path d="M 20 20 L 50 40 L 80 25 M 50 40 L 40 80" stroke="${patternColor}" stroke-opacity="${alpha * 0.5}" stroke-width="1"/>
        <circle cx="20" cy="20" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="50" cy="40" r="2.5" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="80" cy="25" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
        <circle cx="40" cy="80" r="2" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'orbit',
    name: 'Planetary orbits',
    category: 'space',
    defaultParams: {
      baseColor: '#161a1d',
      patternColor: '#a3b18a',
      scale: 100,
      opacity: 50
    },
    presetBaseColors: ['#161a1d', '#0f172a', '#1c1917'],
    presetPatternColors: ['#a3b18a', '#38bdf8', '#f43f5e'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(50, Math.round(120 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 120 120">
        <ellipse cx="60" cy="60" rx="45" ry="20" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.2"/>
        <circle cx="60" cy="60" r="6" fill="${patternColor}" fill-opacity="${alpha}"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  },
  {
    id: 'moondust',
    name: 'Lunar craters',
    category: 'space',
    defaultParams: {
      baseColor: '#212529',
      patternColor: '#6c757d',
      scale: 100,
      opacity: 60
    },
    presetBaseColors: ['#212529', '#343a40', '#1f2937'],
    presetPatternColors: ['#6c757d', '#adb5bd', '#9ca3af'],
    renderCss: ({ baseColor, patternColor, scale, opacity }) => {
      const tileSize = Math.max(30, Math.round(80 * (scale / 100)));
      const alpha = Math.max(0, Math.min(1, opacity / 100));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 80 80">
        <circle cx="20" cy="20" r="10" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1.5"/>
        <circle cx="60" cy="50" r="14" fill="none" stroke="${patternColor}" stroke-opacity="${alpha * 0.7}" stroke-width="1.5"/>
        <circle cx="35" cy="65" r="6" fill="none" stroke="${patternColor}" stroke-opacity="${alpha}" stroke-width="1"/>
      </svg>`;
      return {
        background: baseColor,
        backgroundImage: svgDataUrl(svg),
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      };
    }
  }
];

export function getTextureById(id: string): TextureDefinition {
  return TEXTURE_REGISTRY.find(t => t.id === id) || TEXTURE_REGISTRY[0];
}

export function renderTextureStyle(
  textureId: string,
  customParams?: Partial<TextureParams>
): {
  background: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat?: string;
  backgroundPosition?: string;
} {
  const def = getTextureById(textureId);
  const mergedParams: TextureParams = {
    ...def.defaultParams,
    ...customParams
  };
  return def.renderCss(mergedParams);
}
