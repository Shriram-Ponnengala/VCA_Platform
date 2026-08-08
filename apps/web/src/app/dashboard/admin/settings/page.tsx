'use client';

import React, { useState, useEffect, useRef } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  Building2, 
  UserCircle, 
  Palette, 
  Camera, 
  Globe, 
  Mail, 
  Phone, 
  ChevronRight,
  Clock,
  Layout,
  Type,
  Settings,
  MoreHorizontal,
  Eye,
  ChevronDown,
  User,
  Shield,
  Columns,
  LayoutGrid,
  Pipette,
  Trash2,
  Pen,
  UploadCloud,
  RefreshCw,
  Image as ImageIcon,
  Pin,
  Square,
  Blend,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Button } from '@vca/ui';
import styles from './settings.module.css';
import {
  TEXTURE_CATEGORIES,
  TEXTURE_REGISTRY,
  TextureCategory,
  renderTextureStyle,
  getTextureById
} from '@/components/chess/textures.config';

// Custom Chess Knight Icon matching the premium piece style section
const ChessKnightIcon = ({ size = 18, className = '', style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M19 22H5c0-3 .5-4 2-6V9c0-3.5 2.5-6 6-6 1.5 0 3 .5 4 1.5.8.8.8 2 .8 2.5 0 2-1 3-3 4.5 3 .5 4.5 2 4.5 4.5V22z" />
    <path d="M9 13.5c1 .5 2 .5 3 0" />
    <path d="M14 8h.01" />
  </svg>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'appearance' | 'administration' | 'academy'>('appearance');
  const [activeAppearanceSubTab, setActiveAppearanceSubTab] = useState<'branding' | 'classroom'>('branding');
  const [activeClassroomNav, setActiveClassroomNav] = useState<'board' | 'panels' | 'background'>('board');
  const [activeTextureCategory, setActiveTextureCategory] = useState<TextureCategory>('paper');
  const [userSelectedCategory, setUserSelectedCategory] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const isSavingRef = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeLogoTab, setActiveLogoTab] = useState<'primary' | 'dark' | 'icon'>('primary');
  const [isDragOver, setIsDragOver] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Venture Chess Academy',
    motto: 'Empowering Future Grandmasters',
    email: 'hello@venturechess.com',
    phone: '+91 95670 27370'
  });

  const [account, setAccount] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@venturechess.com',
    phone: '1234567890',
    fideProfile: '',
    lichessProfile: '',
    chesscomProfile: '',
    profilePhoto: ''
  });

  const [scheduling, setScheduling] = useState({
    timezone: 'Asia/Kolkata',
    duration: '60 Minutes',
    buffer: '15 Minutes',
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    startSlots: '10:00, 16:00, 18:00'
  });

  const [branding, setBranding] = useState<{
    headingFont: string;
    bodyFont: string;
    primaryColor: string;
    boardTheme: string;
    pieceTheme: string;
    boardFrameColor: string;
    boardCoordinatesColor: string;
    boardFramePadding: number;
    panelStyle: string;
    panelOpacity: number;
    panelBlur: number;
    customThemes: any[];
    logoUrl?: string;
    logoUpload?: string;
    logoDarkUrl?: string;
    logoDarkUpload?: string;
    iconUrl?: string;
    iconUpload?: string;
    classroomBackground?: {
      type: 'solid' | 'gradient' | 'texture' | 'image';
      solidColor: string;
      gradient: {
        stops: Array<{ color: string; position: number }>;
        direction: string;
      };
      texture: string;
      textureParams?: {
        baseColor: string;
        patternColor: string;
        scale: number;
        opacity: number;
      };
      imageSource: 'upload' | 'url';
      imageUrl: string;
      imageUpload: string;
      imageOverlay: boolean;
      imageOverlayOpacity?: number;
      imageFit?: 'cover' | 'contain';
    };
    pieceAnimation?: string;
    highlightLastMove?: boolean;
  }>({
    headingFont: 'DM Sans (Default)',
    bodyFont: 'Inter (Default)',
    primaryColor: '#551e19',
    boardTheme: 'brown',
    pieceTheme: 'cburnett',
    boardFrameColor: '#FDF0E4',
    boardCoordinatesColor: '#c8854a',
    boardFramePadding: 10,
    panelStyle: 'solid',
    panelOpacity: 95,
    panelBlur: 0,
    logoUrl: '',
    logoUpload: '',
    logoDarkUrl: '',
    logoDarkUpload: '',
    iconUpload: '',
    customThemes: [],
    pieceAnimation: 'standard',
    highlightLastMove: true,
    classroomBackground: {
      type: 'solid',
      solidColor: '#fdf0e4',
      gradient: {
        stops: [
          { color: '#fdf0e4', position: 0 },
          { color: '#eedcd0', position: 100 }
        ],
        direction: '135deg'
      },
      texture: 'dots',
      textureParams: {
        baseColor: '#fdf0e4',
        patternColor: '#c8854a',
        scale: 100,
        opacity: 50
      },
      imageSource: 'url',
      imageUrl: '',
      imageUpload: '',
      imageOverlay: false,
      imageOverlayOpacity: 0,
      imageFit: 'cover'
    }
  });

  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeLight, setNewThemeLight] = useState('#eedcd0');
  const [newThemeDark, setNewThemeDark] = useState('#c8854a');
  const [activeSquarePicker, setActiveSquarePicker] = useState<'light' | 'dark' | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<{ id: string; name: string } | null>(null);

  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [frameColorExpanded, setFrameColorExpanded] = useState(false);
  const [activePicker, setActivePicker] = useState<'frame' | 'coordinates' | null>(null);
  const [customFrameColors, setCustomFrameColors] = useState<string[]>([]);
  const [customCoordsColors, setCustomCoordsColors] = useState<string[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      let loadedProfile = false;
      let loadedAccount = false;
      let loadedScheduling = false;
      let loadedBranding = false;

      // Load local storage custom themes first as fallback
      let localCustomThemes: any[] = [];
      const storedLocalCustomThemes = localStorage.getItem('vca_custom_board_themes');
      if (storedLocalCustomThemes) {
        try { localCustomThemes = JSON.parse(storedLocalCustomThemes); } catch (e) {}
      }

      try {
        const [resProfile, resAccount, resScheduling, resBranding] = await Promise.all([
          fetch('/api/settings/profile', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/account', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/scheduling', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/branding', { cache: 'no-store' }).catch(() => null)
        ]);
        
        if (resProfile?.ok) { const data = await resProfile.json(); if (data) { setProfile(data); loadedProfile = true; } }
        if (resAccount?.ok) { const data = await resAccount.json(); if (data) { setAccount(data); loadedAccount = true; } }
        if (resScheduling?.ok) { const data = await resScheduling.json(); if (data) { setScheduling(data); loadedScheduling = true; } }
        if (resBranding?.ok) {
          const data = await resBranding.json();
          if (data) {
            setBranding({
              headingFont: data.headingFont || 'DM Sans (Default)',
              bodyFont: data.bodyFont || 'Inter (Default)',
              primaryColor: data.primaryColor || '#551e19',
              boardTheme: data.boardTheme || 'brown',
              pieceTheme: data.pieceTheme || 'cburnett',
              boardFrameColor: data.boardFrameColor || '#FDF0E4',
              boardCoordinatesColor: data.boardCoordinatesColor || '#c8854a',
              boardFramePadding: data.boardFramePadding ?? 10,
              panelStyle: data.panelStyle || 'solid',
              panelOpacity: data.panelOpacity ?? 95,
              panelBlur: data.panelBlur ?? 0,
              logoUrl: data.logoUrl || '',
              logoUpload: data.logoUpload || '',
              logoDarkUrl: data.logoDarkUrl || '',
              logoDarkUpload: data.logoDarkUpload || '',
              iconUrl: data.iconUrl || '',
              iconUpload: data.iconUpload || '',
              pieceAnimation: data.pieceAnimation || 'standard',
              highlightLastMove: data.highlightLastMove ?? true,
              customThemes: data.customThemes && data.customThemes.length > 0 ? data.customThemes : localCustomThemes,
              classroomBackground: data.classroomBackground || {
                type: 'solid',
                solidColor: '#fdf0e4',
                gradient: {
                  stops: [
                    { color: '#fdf0e4', position: 0 },
                    { color: '#eedcd0', position: 100 }
                  ],
                  direction: '135deg'
                },
                texture: 'dots',
                imageSource: 'url',
                imageUrl: '',
                imageUpload: '',
                imageOverlay: false
              }
            });
            loadedBranding = true;
          }
        }
      } catch (e) {
        console.error('Failed to load global settings', e);
      }
      
      if (!loadedProfile) { const stored = localStorage.getItem('vca_settings_profile'); if (stored) setProfile(JSON.parse(stored)); }
      if (!loadedAccount) { const stored = localStorage.getItem('vca_settings_account'); if (stored) setAccount(JSON.parse(stored)); }
      if (!loadedScheduling) { const stored = localStorage.getItem('vca_settings_scheduling'); if (stored) setScheduling(JSON.parse(stored)); }
      if (!loadedBranding) {
        const stored = localStorage.getItem('vca_settings_branding');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setBranding({
              headingFont: data.headingFont || 'DM Sans (Default)',
              bodyFont: data.bodyFont || 'Inter (Default)',
              primaryColor: data.primaryColor || '#551e19',
              boardTheme: data.boardTheme || 'brown',
              pieceTheme: data.pieceTheme || 'cburnett',
              boardFrameColor: data.boardFrameColor || '#FDF0E4',
              boardCoordinatesColor: data.boardCoordinatesColor || '#c8854a',
              boardFramePadding: data.boardFramePadding ?? 10,
              panelStyle: data.panelStyle || 'solid',
              panelOpacity: data.panelOpacity ?? 95,
              panelBlur: data.panelBlur ?? 0,
              logoUrl: data.logoUrl || '',
              logoUpload: data.logoUpload || '',
              logoDarkUrl: data.logoDarkUrl || '',
              logoDarkUpload: data.logoDarkUpload || '',
              iconUrl: data.iconUrl || '',
              iconUpload: data.iconUpload || '',
              pieceAnimation: data.pieceAnimation || 'standard',
              highlightLastMove: data.highlightLastMove ?? true,
              customThemes: data.customThemes && data.customThemes.length > 0 ? data.customThemes : localCustomThemes,
              classroomBackground: data.classroomBackground || {
                type: 'solid',
                solidColor: '#fdf0e4',
                gradient: {
                  stops: [
                    { color: '#fdf0e4', position: 0 },
                    { color: '#eedcd0', position: 100 }
                  ],
                  direction: '135deg'
                },
                texture: 'dots',
                imageSource: 'url',
                imageUrl: '',
                imageUpload: '',
                imageOverlay: false
              }
            });
          } catch (e) {}
        }
      }
    };
    
    // Load custom swatches from localStorage
    const storedCustomFrame = localStorage.getItem('vca_custom_frame_colors');
    if (storedCustomFrame) {
      try { setCustomFrameColors(JSON.parse(storedCustomFrame)); } catch (e) {}
    }
    const storedCustomCoords = localStorage.getItem('vca_custom_coords_colors');
    if (storedCustomCoords) {
      try { setCustomCoordsColors(JSON.parse(storedCustomCoords)); } catch (e) {}
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    
    try {
      localStorage.setItem('vca_settings_profile', JSON.stringify(profile));
      localStorage.setItem('vca_settings_account', JSON.stringify(account));
      localStorage.setItem('vca_settings_scheduling', JSON.stringify(scheduling));
      
      const sanitizedBranding = { ...branding };
      if (sanitizedBranding.classroomBackground) {
        sanitizedBranding.classroomBackground = {
          ...sanitizedBranding.classroomBackground,
          imageUpload: ''
        };
      }
      localStorage.setItem('vca_settings_branding', JSON.stringify(sanitizedBranding));
    } catch (e) {
      console.warn('Failed to save to localStorage (quota exceeded or storage disabled)', e);
    }
    
    try {
      await Promise.all([
        fetch('/api/settings/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }),
        fetch('/api/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) }),
        fetch('/api/settings/scheduling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduling) }),
        fetch('/api/settings/branding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branding) })
      ]);
    } catch (e) {
      console.error('Failed to save settings globally', e);
    }
    
    // Dispatch event to update globally immediately in current window
    window.dispatchEvent(new Event('vca-branding-updated'));
    
    setToastMessage('Settings saved successfully!');
    setShowToast(true);
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimeoutRef.current = null;
    }, 3000);
    
    isSavingRef.current = false;
  };

  const handleResetToDefaults = () => {
    setShowResetConfirm(true);
  };

  const confirmResetToDefaults = async () => {
    
    const defaultBranding = {
      primaryColor: '#2d4a6b',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      boardTheme: 'brown',
      pieceTheme: 'cburnett',
      boardFrameColor: '#5C4033',
      boardCoordinatesColor: '#FDF0E4',
      boardFramePadding: 10,
      panelStyle: 'solid',
      panelOpacity: 95,
      panelBlur: 0,
      logoUrl: '',
      logoUpload: '',
      customThemes: [],
      classroomBackground: {
        type: 'solid' as const,
        solidColor: '#fdf0e4',
        gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
        texture: 'dots' as const,
        imageSource: 'url' as const,
        imageUrl: '',
        imageUpload: '',
        imageOverlay: false
      },
      pieceAnimation: 'standard',
      highlightLastMove: true
    };
    
    setBranding(defaultBranding);
    setScheduling({
      timezone: 'Asia/Kolkata',
      duration: '60 Minutes',
      buffer: '10 Minutes',
      startSlots: '10:00, 14:00, 18:00',
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    });
    setProfile({
      name: 'Venture Chess Academy',
      motto: 'Forging Champions, One Move at a Time.',
      email: 'contact@venturechess.com',
      phone: '+1 (555) 123-4567'
    });
    
    localStorage.removeItem('vca_settings_branding');
    try {
      await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultBranding)
      });
    } catch (e) {}
    
    window.dispatchEvent(new Event('vca-branding-updated'));
    setToastMessage('Platform reset to defaults!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePasswordChange = () => {
    alert('Password change request sent! In a real app, this would verify your current password.');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToastMessage('Image size must be less than 2MB');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccount(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrameColorChange = (color: string) => {
    setBranding(prev => ({ ...prev, boardFrameColor: color }));
    
    // Check if it is a default frame color (case insensitive)
    const isDefault = frameColors.some(fc => fc.color.toLowerCase() === color.toLowerCase());
    if (!isDefault) {
      setCustomFrameColors(prev => {
        if (prev.includes(color)) return prev;
        const next = [...prev, color];
        localStorage.setItem('vca_custom_frame_colors', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleCoordsColorChange = (color: string) => {
    setBranding(prev => ({ ...prev, boardCoordinatesColor: color }));
    
    // Check if it is a default coordinate color
    const isDefault = frameColors.some(fc => fc.color.toLowerCase() === color.toLowerCase());
    if (!isDefault) {
      setCustomCoordsColors(prev => {
        if (prev.includes(color)) return prev;
        const next = [...prev, color];
        localStorage.setItem('vca_custom_coords_colors', JSON.stringify(next));
        return next;
      });
    }
  };

  const setBgType = (type: 'solid' | 'gradient' | 'texture' | 'image') => {
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        type
      }
    }));
  };

  const setBgSolidColor = (solidColor: string) => {
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        solidColor
      }
    }));
  };

  const setBgGradientStop = (index: number, color: string) => {
    setBranding(prev => {
      const bg = prev.classroomBackground || {
        type: 'solid',
        solidColor: '#fdf0e4',
        gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
        texture: 'dots',
        imageSource: 'url',
        imageUrl: '',
        imageUpload: '',
        imageOverlay: false
      };
      const stops = [...bg.gradient.stops];
      stops[index] = { ...stops[index], color };
      return {
        ...prev,
        classroomBackground: {
          ...bg,
          gradient: {
            ...bg.gradient,
            stops
          }
        }
      };
    });
  };

  const setBgGradientDirection = (direction: string) => {
    setBranding(prev => {
      const bg = prev.classroomBackground || {
        type: 'solid',
        solidColor: '#fdf0e4',
        gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
        texture: 'dots',
        imageSource: 'url',
        imageUrl: '',
        imageUpload: '',
        imageOverlay: false
      };
      return {
        ...prev,
        classroomBackground: {
          ...bg,
          gradient: {
            ...bg.gradient,
            direction
          }
        }
      };
    });
  };

  const setBgTexture = (texture: string) => {
    const texDef = getTextureById(texture);
    setBranding(prev => {
      const currentBg = prev.classroomBackground || {
        type: 'solid',
        solidColor: '#fdf0e4',
        gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
        texture: 'dots',
        imageSource: 'url',
        imageUrl: '',
        imageUpload: '',
        imageOverlay: false
      };
      return {
        ...prev,
        classroomBackground: {
          ...currentBg,
          type: 'texture',
          texture,
          textureParams: currentBg.texture === texture && currentBg.textureParams
            ? currentBg.textureParams
            : { ...texDef.defaultParams }
        }
      };
    });
  };

  const setBgTextureParam = (key: 'baseColor' | 'patternColor' | 'scale' | 'opacity', val: any) => {
    setBranding(prev => {
      const currentBg = prev.classroomBackground || {
        type: 'solid',
        solidColor: '#fdf0e4',
        gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
        texture: 'dots',
        imageSource: 'url',
        imageUrl: '',
        imageUpload: '',
        imageOverlay: false
      };
      const activeDef = getTextureById(currentBg.texture || 'dots');
      const currentParams = currentBg.textureParams || { ...activeDef.defaultParams };

      return {
        ...prev,
        classroomBackground: {
          ...currentBg,
          textureParams: {
            ...currentParams,
            [key]: val
          }
        }
      };
    });
  };

  const setBgImageSource = (imageSource: 'upload' | 'url') => {
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        imageSource
      }
    }));
  };

  const [imageUrlError, setImageUrlError] = useState<string | null>(null);

  const setBgImageUrl = (imageUrl: string) => {
    setImageUrlError(null);
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        imageUrl
      }
    }));

    if (imageUrl.trim()) {
      const img = new Image();
      img.onload = () => {
        setImageUrlError(null);
      };
      img.onerror = () => {
        setImageUrlError('Invalid image URL: failed to load resource');
      };
      img.src = imageUrl;
    }
  };

  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageUploadError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageUploadError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding(prev => ({
          ...prev,
          classroomBackground: {
            ...(prev.classroomBackground || {
              type: 'solid',
              solidColor: '#fdf0e4',
              gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
              texture: 'dots',
              imageSource: 'url',
              imageUrl: '',
              imageUpload: '',
              imageOverlay: false
            }),
            imageUpload: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const setBgImageOverlayOpacity = (opacity: number) => {
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        imageOverlayOpacity: opacity,
        imageOverlay: opacity > 0
      }
    }));
  };

  const setBgImageFit = (imageFit: 'cover' | 'contain') => {
    setBranding(prev => ({
      ...prev,
      classroomBackground: {
        ...(prev.classroomBackground || {
          type: 'solid',
          solidColor: '#fdf0e4',
          gradient: { stops: [{ color: '#fdf0e4', position: 0 }, { color: '#eedcd0', position: 100 }], direction: '135deg' },
          texture: 'dots',
          imageSource: 'url',
          imageUrl: '',
          imageUpload: '',
          imageOverlay: false
        }),
        imageFit
      }
    }));
  };

  const getPreviewBackgroundStyle = (): React.CSSProperties => {
    const bg = branding.classroomBackground || { type: 'solid', solidColor: '#fdf0e4' };
    
    if (bg.type === 'solid') {
      return { background: bg.solidColor || '#fdf0e4' };
    }
    
    if (bg.type === 'gradient') {
      const stops = bg.gradient?.stops || [
        { color: '#fdf0e4', position: 0 },
        { color: '#eedcd0', position: 100 }
      ];
      const direction = bg.gradient?.direction || '135deg';
      const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
      return { background: `linear-gradient(${direction}, ${stopsStr})` };
    }
    
    if (bg.type === 'texture') {
      const texStyle = renderTextureStyle(bg.texture || 'dots', bg.textureParams);
      return {
        backgroundColor: texStyle.background,
        backgroundImage: texStyle.backgroundImage,
        backgroundSize: texStyle.backgroundSize,
        backgroundRepeat: (texStyle.backgroundRepeat || 'repeat') as any,
        backgroundPosition: texStyle.backgroundPosition || '0 0'
      };
    }
    
    if (bg.type === 'image') {
      const imgUrl = bg.imageSource === 'upload' ? bg.imageUpload : bg.imageUrl;
      if (imgUrl) {
        return {
          backgroundImage: `url('${imgUrl}')`,
          backgroundSize: bg.imageFit || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: bg.imageFit === 'contain' ? 'no-repeat' : 'no-repeat'
        };
      }
    }
    
    return { background: '#fdf0e4' };
  };

  const getPreviewOverlayColor = (): string => {
    const bg = branding.classroomBackground || { type: 'solid', solidColor: '#fdf0e4' };
    const opacityPct = bg.imageOverlayOpacity !== undefined 
      ? bg.imageOverlayOpacity 
      : (bg.imageOverlay ? 45 : 0);
    if (opacityPct > 0) {
      return `rgba(0, 0, 0, ${(opacityPct / 100).toFixed(2)})`;
    }
    return 'transparent';
  };

  const handleCreateCustomTheme = () => {
    setIsCreatingTheme(true);
    setEditingThemeId(null);
    setNewThemeName('');
    setNewThemeLight('#eedcd0');
    setNewThemeDark('#c8854a');
    setActiveSquarePicker(null);
  };

  const handleEditCustomTheme = (theme: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingTheme(true);
    setEditingThemeId(theme.id);
    setNewThemeName(theme.name);
    setNewThemeLight(theme.light);
    setNewThemeDark(theme.dark);
    setActiveSquarePicker(null);
  };

  const handleDeleteCustomTheme = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const theme = (branding.customThemes || []).find(t => t.id === themeId);
    if (!theme) return;
    setThemeToDelete({ id: themeId, name: theme.name });
  };

  const confirmDeleteCustomTheme = () => {
    if (!themeToDelete) return;
    const themeId = themeToDelete.id;

    const nextCustomThemes = (branding.customThemes || []).filter(t => t.id !== themeId);
    const nextActiveTheme = branding.boardTheme === themeId ? 'brown' : branding.boardTheme;

    setBranding(prev => ({
      ...prev,
      boardTheme: nextActiveTheme,
      customThemes: nextCustomThemes
    }));

    localStorage.setItem('vca_custom_board_themes', JSON.stringify(nextCustomThemes));
    setThemeToDelete(null);
  };

  const handleSaveCustomTheme = () => {
    if (!newThemeName.trim()) {
      alert("Please enter a theme name");
      return;
    }

    let nextCustomThemes = [...(branding.customThemes || [])];
    let themeId = editingThemeId;

    if (editingThemeId) {
      nextCustomThemes = nextCustomThemes.map(t => {
        if (t.id === editingThemeId) {
          return { ...t, name: newThemeName.trim(), light: newThemeLight, dark: newThemeDark };
        }
        return t;
      });
    } else {
      themeId = `custom_${Date.now()}`;
      nextCustomThemes.push({
        id: themeId,
        name: newThemeName.trim(),
        light: newThemeLight,
        dark: newThemeDark
      });
    }

    setBranding(prev => ({
      ...prev,
      boardTheme: themeId!,
      customThemes: nextCustomThemes
    }));

    localStorage.setItem('vca_custom_board_themes', JSON.stringify(nextCustomThemes));

    setIsCreatingTheme(false);
    setEditingThemeId(null);
    setNewThemeName('');
    setActiveSquarePicker(null);
  };

  const getThemeDisplayName = (themeId: string) => {
    if (themeId.startsWith('custom_')) {
      const custom = branding.customThemes?.find(t => t.id === themeId);
      return custom ? `Custom · ${custom.name}` : 'Custom Theme';
    }

    const classic = [
      { id: 'brown', name: 'Classic · Brown' },
      { id: 'blue', name: 'Classic · Blue' },
      { id: 'green', name: 'Classic · Green' },
      { id: 'grey', name: 'Classic · Grey' },
      { id: 'purple', name: 'Classic · Purple' },
      { id: 'olive', name: 'Classic · Olive' },
      { id: 'pink', name: 'Classic · Pink' },
    ];
    const wood = [
      { id: 'wood_maple', name: 'Wood grain · Maple' },
      { id: 'wood_maple2', name: 'Wood grain · Maple II' },
      { id: 'wood_mahogany', name: 'Wood grain · Mahogany' },
      { id: 'wood_birch', name: 'Wood grain · Birch' },
      { id: 'wood_walnut', name: 'Wood grain · Walnut' },
      { id: 'wood_dark', name: 'Wood grain · Dark' },
      { id: 'wood_olive', name: 'Wood grain · Olive' },
    ];
    const marble = [
      { id: 'marble_green', name: 'Marble · Green' },
      { id: 'marble_blue', name: 'Marble · Blue' },
    ];
    const other = [
      { id: 'metal', name: 'Material · Metal' },
      { id: 'leather', name: 'Material · Leather' },
      { id: 'canvas', name: 'Material · Canvas' },
      { id: 'grey_cb', name: 'Material · Grey' },
      { id: 'blue_cb', name: 'Material · Blue' },
      { id: 'purple_diag', name: 'Material · Purple' },
    ];

    const all = [...classic, ...wood, ...marble, ...other];
    const found = all.find(t => t.id === themeId);
    return found ? found.name : 'Classic · Brown';
  };

  const frameColors = [
    { id: '#5C4033', name: 'Walnut Brown', color: '#5C4033' },
    { id: '#3B2A22', name: 'Espresso', color: '#3B2A22' },
    { id: '#A67C52', name: 'Oak', color: '#A67C52' },
    { id: '#2D4A6B', name: 'Navy', color: '#2D4A6B' },
    // Expandable +6 colors
    { id: '#4B5563', name: 'Slate', color: '#4B5563' },
    { id: '#1F2937', name: 'Charcoal', color: '#1F2937' },
    { id: '#FDF0E4', name: 'Cream', color: '#FDF0E4' },
    { id: '#C8854A', name: 'Caramel', color: '#C8854A' },
    { id: '#355E3B', name: 'Forest Green', color: '#355E3B' },
    { id: '#6B2C3A', name: 'Burgundy', color: '#6B2C3A' }
  ];

  const visibleFrameColors = frameColorExpanded ? frameColors : frameColors.slice(0, 4);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Welcome back to the academy</p>
        </div>
        <div className={styles.headerActions} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#927c65', backgroundColor: '#fdf5ea', padding: '6px 12px', borderRadius: '16px' }}>
            Admin view · sees both groups
          </span>
          <Button 
            className={styles.saveBtn}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </header>

      {/* Top Navigation Tabs */}
      <nav className={styles.topNavTabs}>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={`${styles.topNavTab} ${activeTab === 'personal' ? styles.topNavTabActive : ''}`}
            onClick={() => { setActiveTab('personal'); setShowThemeDropdown(false); }}
          >
            <User size={16} /> Personal
          </button>
          <button
            type="button"
            className={`${styles.topNavTab} ${activeTab === 'account' ? styles.topNavTabActive : ''}`}
            onClick={() => { setActiveTab('account'); setShowThemeDropdown(false); }}
          >
            <UserCircle size={16} /> Account
          </button>
        </div>
        
        <div className={styles.navDivider}></div>
        
        <div className={styles.navGroup}>
          <div className={styles.adminMarker}>
            <Shield size={14} /> Admin
          </div>
          <button
            type="button"
            className={`${styles.topNavTab} ${activeTab === 'administration' ? styles.topNavTabActive : ''}`}
            onClick={() => { setActiveTab('administration'); setShowThemeDropdown(false); }}
          >
            <Shield size={16} /> Administration
          </button>
          <button
            type="button"
            className={`${styles.topNavTab} ${activeTab === 'academy' ? styles.topNavTabActive : ''}`}
            onClick={() => { setActiveTab('academy'); setShowThemeDropdown(false); }}
          >
            <Building2 size={16} /> Academy profile
          </button>
          <button
            type="button"
            className={`${styles.topNavTab} ${activeTab === 'appearance' ? styles.topNavTabActive : ''}`}
            onClick={() => { setActiveTab('appearance'); setShowThemeDropdown(false); }}
          >
            <Palette size={16} /> Appearance
          </button>
        </div>
      </nav>

      {/* singular card widget */}
      <div className={styles.cardContainer}>
        {/* Card Header matching mockup removed */}

        {/* Card Body grid with sidebar and content */}
        <div className={styles.cardBodyGridSingle}>
          {/* Left Sidebar */}
          {/* Right Content Pane */}
          <div className={styles.cardContentPane}>

            {/* 1. PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className={styles.tabContent}>
                <div className={styles.accountGrid}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Admin Profile</h3>
                    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                      <div className={styles.avatarSection}>
                        <div className={styles.avatarPreview}>
                          {account.profilePhoto ? (
                            <img src={account.profilePhoto} alt="Profile" className={styles.avatarImage} />
                          ) : (
                            <div className={styles.avatarPlaceholder}>
                              {account.firstName?.[0] || 'A'}
                            </div>
                          )}
                        </div>
                        <div className={styles.avatarActions}>
                          <label className={styles.uploadBtn}>
                            Upload Photo
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                          </label>
                          <button 
                            type="button" 
                            className={styles.removePhotoBtn}
                            onClick={() => setAccount(prev => ({ ...prev, profilePhoto: '' }))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className={styles.row}>
                        <div className={styles.fieldGroup}>
                          <label>FIRST NAME</label>
                          <input 
                            type="text" 
                            value={account.firstName} 
                            onChange={(e) => setAccount({ ...account, firstName: e.target.value })}
                            className={styles.input} 
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label>LAST NAME</label>
                          <input 
                            type="text" 
                            value={account.lastName} 
                            onChange={(e) => setAccount({ ...account, lastName: e.target.value })}
                            className={styles.input} 
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ADMIN EMAIL</label>
                        <input 
                          type="email" 
                          value={account.email} 
                          onChange={(e) => setAccount({ ...account, email: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ADMIN PHONE</label>
                        <input 
                          type="text" 
                          value={account.phone} 
                          onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                    </form>
                  </div>
                  
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Security</h3>
                    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                      <div className={styles.fieldGroup}>
                        <label>CURRENT PASSWORD</label>
                        <input type="password" name="current-password" placeholder="••••••••" className={styles.input} autoComplete="current-password" />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>NEW PASSWORD</label>
                        <input type="password" name="new-password" placeholder="••••••••" className={styles.input} autoComplete="new-password" />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>CONFIRM PASSWORD</label>
                        <input type="password" name="confirm-password" placeholder="••••••••" className={styles.input} autoComplete="new-password" />
                      </div>
                      <Button 
                        type="submit"
                        variant="secondary" 
                        className={styles.changePasswordBtn}
                      >
                        Change Password
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className={styles.tabContent}>
                <div className={styles.row}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Admin Credentials</h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>USERNAME</label>
                        <input 
                          type="text" 
                          value="admin" 
                          disabled
                          className={styles.input} 
                          style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                        />
                        <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>Username is fixed for the administrator.</small>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ACCOUNT STATUS</label>
                        <input 
                          type="text" 
                          value="Active (Academy Owner)" 
                          disabled
                          className={styles.input} 
                          style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Chess Platform Profiles</h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>FIDE PROFILE ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 1503014"
                          value={account.fideProfile} 
                          onChange={(e) => setAccount({ ...account, fideProfile: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>LICHESS USERNAME</label>
                        <input 
                          type="text" 
                          placeholder="e.g. vca_admin"
                          value={account.lichessProfile} 
                          onChange={(e) => setAccount({ ...account, lichessProfile: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>CHESS.COM USERNAME</label>
                        <input 
                          type="text" 
                          placeholder="e.g. vca_admin_chess"
                          value={account.chesscomProfile} 
                          onChange={(e) => setAccount({ ...account, chesscomProfile: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ADMINISTRATION TAB (Admin only scheduling configuration) */}
            {activeTab === 'administration' && (
              <div className={styles.tabContent}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    <Clock size={18} /> Class & Session Scheduling Configuration
                  </h3>
                  <div className={styles.form}>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Default Timezone</label>
                        <select 
                          className={styles.select}
                          value={scheduling.timezone}
                          onChange={(e) => setScheduling({ ...scheduling, timezone: e.target.value })}
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="UTC">Coordinated Universal Time (UTC)</option>
                          <option value="America/New_York">America/New_York (EST/EDT)</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Default Session Duration</label>
                        <select 
                          className={styles.select}
                          value={scheduling.duration}
                          onChange={(e) => setScheduling({ ...scheduling, duration: e.target.value })}
                        >
                          <option value="45 Minutes">45 Minutes</option>
                          <option value="60 Minutes">60 Minutes</option>
                          <option value="90 Minutes">90 Minutes</option>
                          <option value="120 Minutes">120 Minutes</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Buffer Time Between Classes</label>
                        <select 
                          className={styles.select}
                          value={scheduling.buffer}
                          onChange={(e) => setScheduling({ ...scheduling, buffer: e.target.value })}
                        >
                          <option value="0 Minutes">No Buffer</option>
                          <option value="10 Minutes">10 Minutes</option>
                          <option value="15 Minutes">15 Minutes</option>
                          <option value="30 Minutes">30 Minutes</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Standard Start Slots</label>
                        <input 
                          type="text" 
                          value={scheduling.startSlots} 
                          onChange={(e) => setScheduling({ ...scheduling, startSlots: e.target.value })}
                          className={styles.input} 
                          placeholder="e.g. 10:00, 14:00, 18:00"
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label>Academy Working Days</label>
                      <div className={styles.dayPills}>
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
                          const isActive = scheduling.workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`${styles.dayPill} ${isActive ? styles.activeDay : ''}`}
                              onClick={() => {
                                let updated = [...scheduling.workingDays];
                                if (isActive) {
                                  updated = updated.filter(d => d !== day);
                                } else {
                                  updated.push(day);
                                }
                                setScheduling({ ...scheduling, workingDays: updated });
                              }}
                              style={!isActive ? { backgroundColor: '#f1f5f9', color: '#475569' } : {}}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.card} style={{ marginTop: '24px', border: '1px solid #fee2e2' }}>
                  <h3 className={styles.cardTitle} style={{ color: '#ef4444' }}>
                    Danger Zone
                  </h3>
                  <div className={styles.form}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#4a2018' }}>Reset Platform to Defaults</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                          This will reset all styling, branding, logos, scheduling rules, and academy profile data back to the original VCA defaults.
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={handleResetToDefaults}
                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        Reset Defaults
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. ACADEMY PROFILE TAB */}
            {activeTab === 'academy' && (
              <div className={styles.tabContent}>
                <div className={styles.row}>
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>General Information</h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>Academy Name</label>
                        <input 
                          type="text" 
                          value={profile.name} 
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Academy Motto</label>
                        <input 
                          type="text" 
                          value={profile.motto} 
                          onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Contact Details</h3>
                    <div className={styles.form}>
                      <div className={styles.fieldGroup}>
                        <label>Public Email</label>
                        <input 
                          type="email" 
                          value={profile.email} 
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Public Phone</label>
                        <input 
                          type="text" 
                          value={profile.phone} 
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className={styles.input} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className={styles.tabContent}>
                
                {/* SUB-TABS NAVIGATION (Segmented Control) */}
                <div className={styles.segmentedControl}>
                  <button 
                    type="button"
                    className={`${styles.segmentButton} ${activeAppearanceSubTab === 'branding' ? styles.segmentButtonActive : ''}`}
                    onClick={() => setActiveAppearanceSubTab('branding')}
                  >
                    Branding
                  </button>
                  <button 
                    type="button"
                    className={`${styles.segmentButton} ${activeAppearanceSubTab === 'classroom' ? styles.segmentButtonActive : ''}`}
                    onClick={() => setActiveAppearanceSubTab('classroom')}
                  >
                    Classroom
                  </button>
                </div>

                {/* BRANDING SUB-TAB CONTENT */}
                {activeAppearanceSubTab === 'branding' && (
                  <div className={styles.brandingFormColumn} style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                      <div>
                        <h3 className={styles.sectionHeading} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.25rem', color: 'var(--primary)' }}>
                          <ImageIcon size={20} /> Academy branding
                        </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* 1. LOGO SECTION */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#2d1510' }}>Logo</h3>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                            {/* Logo Tile & Action Links */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                              <div className={styles.singleLogoBox}>
                                {branding.logoUpload ? (
                                  <img src={branding.logoUpload} alt="Academy Logo" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                                ) : branding.logoUrl ? (
                                  <img src={branding.logoUrl} alt="Academy Logo" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                                ) : (
                                  <img src="/vca_logo.png" alt="Academy Logo" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}>
                                  <RefreshCw size={12} /> Replace
                                  <input
                                    type="file"
                                    accept="image/png, image/svg+xml"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        if (file.size > 2 * 1024 * 1024) {
                                          setToastMessage('Image must be under 2MB');
                                          setShowToast(true);
                                          setTimeout(() => setShowToast(false), 3000);
                                          return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setBranding((prev: any) => ({ ...prev, logoUpload: reader.result, logoUrl: '' }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setBranding((prev: any) => ({ ...prev, logoUpload: '', logoUrl: '' }))}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer', padding: 0 }}
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </div>
                            </div>

                            {/* Small Rectangular Upload Box (~200px wide, ~72px tall) */}
                            <label
                              className={`${styles.smallUploadDropzone} ${isDragOver ? styles.uploadDropzoneActive : ''}`}
                              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file && (file.type === 'image/png' || file.type === 'image/svg+xml')) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    setToastMessage('Image must be under 2MB');
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 3000);
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setBranding((prev: any) => ({ ...prev, logoUpload: reader.result, logoUrl: '' }));
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  setToastMessage('Only PNG or SVG allowed');
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                }
                              }}
                            >
                              <UploadCloud size={20} style={{ color: '#2563eb', marginBottom: '2px' }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>Upload logo</span>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PNG/SVG · max 2MB</span>
                              <input
                                type="file"
                                accept="image/png, image/svg+xml"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      setToastMessage('Image must be under 2MB');
                                      setShowToast(true);
                                      setTimeout(() => setShowToast(false), 3000);
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setBranding((prev: any) => ({ ...prev, logoUpload: reader.result, logoUrl: '' }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </section>

                        <div style={{ height: '1px', background: '#e2e8f0' }} />

                        {/* 2. COLORS SECTION */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Palette size={18} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#2d1510' }}>Colors</h3>
                          </div>

                          {/* Brand Color */}
                          <div className={styles.colorRoleRow}>
                            <div className={styles.colorRoleMeta}>
                              <span className={styles.colorRoleTitle}>Brand color</span>
                              <span className={styles.colorRoleSubtitle}>· buttons & accents</span>
                            </div>
                            <div className={styles.colorSwatchesGroup}>
                              {['#551e19', '#2d4a6b', '#10b981', '#f59e0b', '#c8854a'].map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`${styles.colorCircle} ${branding.primaryColor === color ? styles.colorCircleActive : ''}`}
                                  style={{ background: color }}
                                  onClick={() => setBranding({ ...branding, primaryColor: color })}
                                  title={color}
                                />
                              ))}
                              <label className={styles.customColorPickerPlus} title="Custom color">
                                +
                                <input
                                  type="color"
                                  value={branding.primaryColor || '#551e19'}
                                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                  style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Heading Text */}
                          <div className={styles.colorRoleRow}>
                            <div className={styles.colorRoleMeta}>
                              <span className={styles.colorRoleTitle}>Heading text</span>
                            </div>
                            <div className={styles.colorSwatchesGroup}>
                              {['#2d1510', '#551e19', '#1e293b', '#0f172a', '#111827'].map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`${styles.colorCircle} ${(branding.headingTextColor || '#2d1510') === color ? styles.colorCircleActive : ''}`}
                                  style={{ background: color }}
                                  onClick={() => setBranding({ ...branding, headingTextColor: color })}
                                  title={color}
                                />
                              ))}
                              <label className={styles.customColorPickerPlus} title="Custom color">
                                +
                                <input
                                  type="color"
                                  value={branding.headingTextColor || '#2d1510'}
                                  onChange={(e) => setBranding({ ...branding, headingTextColor: e.target.value })}
                                  style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Body / Paragraph Text */}
                          <div className={styles.colorRoleRow}>
                            <div className={styles.colorRoleMeta}>
                              <span className={styles.colorRoleTitle}>Body / paragraph text</span>
                            </div>
                            <div className={styles.colorSwatchesGroup}>
                              {['#4a2018', '#334155', '#475569', '#64748b', '#1f2937'].map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`${styles.colorCircle} ${(branding.bodyTextColor || '#4a2018') === color ? styles.colorCircleActive : ''}`}
                                  style={{ background: color }}
                                  onClick={() => setBranding({ ...branding, bodyTextColor: color })}
                                  title={color}
                                />
                              ))}
                              <label className={styles.customColorPickerPlus} title="Custom color">
                                +
                                <input
                                  type="color"
                                  value={branding.bodyTextColor || '#4a2018'}
                                  onChange={(e) => setBranding({ ...branding, bodyTextColor: e.target.value })}
                                  style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
                                />
                              </label>
                            </div>
                          </div>
                        </section>

                        <div style={{ height: '1px', background: '#e2e8f0' }} />

                        {/* 3. TYPOGRAPHY SECTION */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <label style={{ fontWeight: 600, color: '#4a2018', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Typography</label>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>HEADING FONT</label>
                              <select 
                                className={styles.select}
                                value={branding.headingFont}
                                onChange={(e) => setBranding({ ...branding, headingFont: e.target.value })}
                                style={{ width: '100%' }}
                              >
                                <option>DM Sans (Default)</option>
                                <option>Playfair Display</option>
                                <option>Montserrat</option>
                                <option>Open Sans</option>
                                <option>Oleo Script</option>
                                <option>Lato</option>
                                <option>Merriweather</option>
                                <option>Nunito</option>
                                <option>Poppins</option>
                                <option>Roboto</option>
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>BODY FONT</label>
                              <select 
                                className={styles.select}
                                value={branding.bodyFont}
                                onChange={(e) => setBranding({ ...branding, bodyFont: e.target.value })}
                                style={{ width: '100%' }}
                              >
                                <option>Inter (Default)</option>
                                <option>Poppins</option>
                                <option>Roboto</option>
                                <option>Open Sans</option>
                                <option>Lato</option>
                                <option>Merriweather</option>
                                <option>Nunito</option>
                              </select>
                            </div>
                          </div>

                          {/* Typography Preview */}
                          <div style={{ marginTop: '16px', padding: '24px', background: '#fdf5ea', border: '1px solid #eedcd0', borderRadius: '12px' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8a6c5b', marginBottom: '8px' }}>
                              PREVIEW
                            </span>
                            <h2 style={{
                              fontFamily: branding.headingFont === 'DM Sans (Default)' ? 'DM Sans' : (branding.headingFont || 'inherit'),
                              color: branding.headingTextColor || '#2d1510',
                              fontSize: '1.5rem',
                              lineHeight: '1.2',
                              margin: '0 0 12px 0',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal'
                            }}>
                              Typography preview
                            </h2>
                            <p style={{
                              fontFamily: branding.bodyFont === 'Inter (Default)' ? 'Inter' : (branding.bodyFont || 'inherit'),
                              color: branding.bodyTextColor || '#4a2018',
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              margin: 0
                            }}>
                              This is how your academy's content will look. The heading font captures attention, while the body font ensures readability for your students and staff.
                            </p>
                          </div>
                        </section>
                        
                      </div>
                    </div>
                  </div>
                )}

                {/* CLASSROOM SUB-TAB CONTENT */}
                {activeAppearanceSubTab === 'classroom' && (() => {
                  const getThemeCategory = (themeId: string) => {
                    if (themeId.startsWith('custom_')) return 'custom';
                    if (['wood_maple', 'wood_maple2', 'wood_mahogany', 'wood_birch', 'wood_walnut', 'wood_dark', 'wood_olive'].includes(themeId)) return 'wood';
                    if (['marble_green', 'marble_blue'].includes(themeId)) return 'marble';
                    if (['metal', 'leather', 'canvas', 'grey_cb', 'blue_cb', 'purple_diag'].includes(themeId)) return 'other';
                    return 'classic';
                  };
                  const activeCategory = userSelectedCategory || getThemeCategory(branding.boardTheme);

                  return (
                  <div className={styles.stickyPreviewGrid}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                      {/* Vertical Sub-Nav */}
                      <div style={{ width: '160px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '24px' }}>
                        {[
                          { id: 'board', label: 'Board' },
                          { id: 'panels', label: 'Panels' },
                          { id: 'background', label: 'Background' }
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveClassroomNav(item.id as any)}
                            style={{
                              padding: '10px 16px',
                              textAlign: 'left',
                              background: activeClassroomNav === item.id ? '#fdf5ea' : 'transparent',
                              color: activeClassroomNav === item.id ? '#c8854a' : '#64748b',
                              fontWeight: activeClassroomNav === item.id ? 600 : 500,
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '0.95rem'
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <div className={styles.classroomFormColumn} style={{ flex: 1, minWidth: 0 }}>
                {/* Green badge */}
                <div className={styles.visibilityBadge}>
                  <Eye size={16} />
                  <span>Visible to every user</span>
                </div>

                {activeClassroomNav === 'board' && (
                  <>
                {/* Board frame customization */}
                <section className={styles.boardPiecesSection}>
                  <h3 className={styles.sectionHeading}>
                    <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>#</span> Board frame
                  </h3>
                  
                  {/* Frame color picker */}
                  <div className={styles.boardPiecesRow} style={{ flexWrap: 'wrap' }}>
                    <span className={styles.rowLabel}>Frame color</span>
                    <div className={styles.customColorRow} style={{ flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`${styles.plusButton} ${activePicker === 'frame' ? styles.plusButtonActive : ''}`}
                        onClick={() => setActivePicker(activePicker === 'frame' ? null : 'frame')}
                        title="Add custom color"
                      >
                        +
                      </button>
                      {visibleFrameColors.map(fc => (
                        <button
                          key={fc.id}
                          type="button"
                          className={`${styles.colorCircle} ${branding.boardFrameColor === fc.id ? styles.colorCircleActive : ''}`}
                          style={{ background: fc.color }}
                          onClick={() => setBranding({ ...branding, boardFrameColor: fc.id })}
                          title={fc.name}
                        />
                      ))}
                      {customFrameColors.map((color, idx) => (
                        <button
                          key={`custom-frame-${idx}`}
                          type="button"
                          className={`${styles.colorCircle} ${branding.boardFrameColor === color ? styles.colorCircleActive : ''}`}
                          style={{ background: color }}
                          onClick={() => setBranding({ ...branding, boardFrameColor: color })}
                          title="Custom Color"
                        />
                      ))}
                      <button
                        type="button"
                        className={styles.expandLink}
                        onClick={() => setFrameColorExpanded(!frameColorExpanded)}
                      >
                        {frameColorExpanded ? 'Show less' : `+${frameColors.length - 4}`}
                      </button>
                    </div>
                  </div>

                  {activePicker === 'frame' && (
                    <div className={styles.pickerWrapper}>
                      <AddColorTool
                        color={branding.boardFrameColor}
                        onChange={handleFrameColorChange}
                        onClose={() => setActivePicker(null)}
                      />
                    </div>
                  )}

                  {/* Frame Padding Slider & Coordinates Color (Reorganized in Board frame section) */}
                  <div className={styles.boardPiecesRow} style={{ flexWrap: 'wrap' }}>
                    <span className={styles.rowLabel}>Coordinates Color</span>
                    <div className={styles.customColorRow} style={{ flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`${styles.plusButton} ${activePicker === 'coordinates' ? styles.plusButtonActive : ''}`}
                        onClick={() => setActivePicker(activePicker === 'coordinates' ? null : 'coordinates')}
                        title="Add custom color"
                      >
                        +
                      </button>
                      {frameColors.slice(0, 4).map(fc => (
                        <button
                          key={fc.id}
                          type="button"
                          className={`${styles.colorCircle} ${branding.boardCoordinatesColor === fc.id ? styles.colorCircleActive : ''}`}
                          style={{ background: fc.color }}
                          onClick={() => setBranding({ ...branding, boardCoordinatesColor: fc.id })}
                          title={fc.name}
                        />
                      ))}
                      {customCoordsColors.map((color, idx) => (
                        <button
                          key={`custom-coords-${idx}`}
                          type="button"
                          className={`${styles.colorCircle} ${branding.boardCoordinatesColor === color ? styles.colorCircleActive : ''}`}
                          style={{ background: color }}
                          onClick={() => setBranding({ ...branding, boardCoordinatesColor: color })}
                          title="Custom Color"
                        />
                      ))}
                    </div>
                  </div>

                  {activePicker === 'coordinates' && (
                    <div className={styles.pickerWrapper}>
                      <AddColorTool
                        color={branding.boardCoordinatesColor}
                        onChange={handleCoordsColorChange}
                        onClose={() => setActivePicker(null)}
                      />
                    </div>
                  )}

                  <div className={styles.boardPiecesRow}>
                    <span className={styles.rowLabel}>Frame Padding</span>
                    <div className={styles.sliderRow} style={{ minWidth: '160px', margin: 0 }}>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        step={2}
                        value={branding.boardFramePadding}
                        onChange={(e) => setBranding({ ...branding, boardFramePadding: Number(e.target.value) })}
                        className={styles.paddingSlider}
                      />
                      <span className={styles.paddingValue}>{branding.boardFramePadding}px</span>
                    </div>
                  </div>
                </section>

                {/* Board theme customization */}
                <section className={styles.boardPiecesSection}>
                  <h3 className={styles.sectionHeading}>Board theme</h3>
                  <div className={styles.fieldGroup}>
                    <label>Chess Board Color Theme</label>

                    {/* Custom Themes Creator */}
                    {isCreatingTheme && (
                      <div className={styles.customThemeCreator}>
                        <h4 className={styles.customThemeCreatorHeading}>
                          {editingThemeId ? 'Modify Custom Theme' : 'Create Custom Theme'}
                        </h4>
                        <div className={styles.form}>
                          <div className={styles.fieldGroup}>
                            <label>Theme Name</label>
                            <input
                              type="text"
                              value={newThemeName}
                              onChange={(e) => setNewThemeName(e.target.value)}
                              className={styles.input}
                              placeholder="e.g. Electric Emerald"
                            />
                          </div>

                          <div className={styles.squareColorsRow}>
                            <div className={styles.squareColorSelector}>
                              <span className={styles.squareLabel}>Light Squares</span>
                              <button
                                type="button"
                                className={`${styles.squareColorPreview} ${activeSquarePicker === 'light' ? styles.squareColorPreviewActive : ''}`}
                                style={{ background: newThemeLight }}
                                onClick={() => setActiveSquarePicker(activeSquarePicker === 'light' ? null : 'light')}
                                title="Customize light squares"
                              />
                            </div>

                            <div className={styles.squareColorSelector}>
                              <span className={styles.squareLabel}>Dark Squares</span>
                              <button
                                type="button"
                                className={`${styles.squareColorPreview} ${activeSquarePicker === 'dark' ? styles.squareColorPreviewActive : ''}`}
                                style={{ background: newThemeDark }}
                                onClick={() => setActiveSquarePicker(activeSquarePicker === 'dark' ? null : 'dark')}
                                title="Customize dark squares"
                              />
                            </div>
                          </div>

                          {activeSquarePicker && (
                            <div className={styles.pickerWrapper}>
                              <AddColorTool
                                color={activeSquarePicker === 'light' ? newThemeLight : newThemeDark}
                                onChange={(color) => {
                                  if (activeSquarePicker === 'light') {
                                    setNewThemeLight(color);
                                  } else {
                                    setNewThemeDark(color);
                                  }
                                }}
                                onClose={() => setActiveSquarePicker(null)}
                              />
                            </div>
                          )}

                          <div className={styles.creatorActions}>
                            <Button
                              type="button"
                              onClick={handleSaveCustomTheme}
                              className={styles.saveThemeBtn}
                            >
                              Save Theme
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setIsCreatingTheme(false);
                                setEditingThemeId(null);
                                setActiveSquarePicker(null);
                              }}
                              className={styles.cancelThemeBtn}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* THEME CATEGORY CHIPS */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {[
                        { id: 'custom', label: '🎨 Custom' },
                        { id: 'classic', label: '🎨 Classic' },
                        { id: 'wood', label: '🪵 Wood Grain' },
                        { id: 'marble', label: '🪨 Marble & Stone' },
                        { id: 'other', label: '✨ Other Materials' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setUserSelectedCategory(cat.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: activeCategory === cat.id ? '#c8854a' : '#e2e8f0',
                            background: activeCategory === cat.id ? '#fdf5ea' : '#ffffff',
                            color: activeCategory === cat.id ? '#c8854a' : '#64748b',
                            fontSize: '0.85rem',
                            fontWeight: activeCategory === cat.id ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Themes Category */}
                    {activeCategory === 'custom' && (
                    <div className={styles.themeCategory}>
                      <span className={styles.themeCategoryLabel} style={{ display: 'none' }}>🎨 Custom Themes</span>
                      <div className={styles.boardThemeGrid}>
                        {/* (+) Create Theme Card */}
                        <div 
                          className={`${styles.boardThemeItem} ${styles.createThemeCard}`}
                          onClick={handleCreateCustomTheme}
                          title="Create custom board theme"
                        >
                          <div className={styles.createThemeBox}>
                            +
                          </div>
                          <span className={styles.boardName}>Create Theme</span>
                        </div>

                        {/* Custom Themes List */}
                        {(branding.customThemes || []).map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''} ${styles.customThemeItem}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div className={styles.boardPreviewBox}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
                                <div style={{ background: theme.light }} />
                                <div style={{ background: theme.dark }} />
                                <div style={{ background: theme.dark }} />
                                <div style={{ background: theme.light }} />
                              </div>
                            </div>
                            <span className={styles.boardName}>{theme.name}</span>
                            
                            {/* Hover Overlay with Edit/Delete */}
                            <div className={styles.themeOverlayActions}>
                              <button
                                type="button"
                                className={styles.themeActionBtn}
                                onClick={(e) => handleEditCustomTheme(theme, e)}
                                title="Edit theme"
                              >
                                <Pen size={12} />
                              </button>
                              <button
                                type="button"
                                className={styles.themeActionBtn}
                                onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                                title="Delete theme"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Classic Flat Themes */}
                    {activeCategory === 'classic' && (
                    <div className={styles.themeCategory}>
                      <span className={styles.themeCategoryLabel} style={{ display: 'none' }}>🎨 Classic</span>
                      <div className={styles.boardThemeGrid}>
                        {[
                          { id: 'brown', name: 'Brown', light: '#eedcd0', dark: '#c8854a' },
                          { id: 'blue', name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
                          { id: 'green', name: 'Green', light: '#ffffdd', dark: '#86a666' },
                          { id: 'grey', name: 'Grey', light: '#e3e3e3', dark: '#a6a6a6' },
                          { id: 'purple', name: 'Purple', light: '#d2c3db', dark: '#887295' },
                          { id: 'olive', name: 'Olive', light: '#e0e0c0', dark: '#809070' },
                          { id: 'pink', name: 'Pink', light: '#fdf5ea', dark: '#e47070' },
                        ].map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div className={styles.boardPreviewBox}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
                                <div style={{ backgroundColor: theme.light }} />
                                <div style={{ backgroundColor: theme.dark }} />
                                <div style={{ backgroundColor: theme.dark }} />
                                <div style={{ backgroundColor: theme.light }} />
                              </div>
                            </div>
                            <span className={styles.boardName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Wood Grain Themes */}
                    {activeCategory === 'wood' && (
                    <div className={styles.themeCategory}>
                      <span className={styles.themeCategoryLabel} style={{ display: 'none' }}>🪵 Wood Grain</span>
                      <div className={styles.boardThemeGrid}>
                        {[
                          { id: 'wood_maple', name: 'Maple', image: 'https://lichess1.org/assets/images/board/maple.jpg' },
                          { id: 'wood_maple2', name: 'Maple II', image: 'https://lichess1.org/assets/images/board/maple2.jpg' },
                          { id: 'wood_mahogany', name: 'Mahogany', image: 'https://lichess1.org/assets/images/board/wood.jpg' },
                          { id: 'wood_birch', name: 'Birch', image: 'https://lichess1.org/assets/images/board/wood2.jpg' },
                          { id: 'wood_walnut', name: 'Walnut', image: 'https://lichess1.org/assets/images/board/wood3.jpg' },
                          { id: 'wood_dark', name: 'Dark Wood', image: 'https://lichess1.org/assets/images/board/wood4.jpg' },
                          { id: 'wood_olive', name: 'Olive Wood', image: 'https://lichess1.org/assets/images/board/olive.jpg' },
                        ].map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div 
                              className={styles.boardPreviewBox}
                              style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                            />
                            <span className={styles.boardName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Marble & Stone Themes */}
                    {activeCategory === 'marble' && (
                    <div className={styles.themeCategory}>
                      <span className={styles.themeCategoryLabel} style={{ display: 'none' }}>🪨 Marble & Stone</span>
                      <div className={styles.boardThemeGrid}>
                        {[
                          { id: 'marble_green', name: 'Green Marble', image: 'https://lichess1.org/assets/images/board/marble.jpg' },
                          { id: 'marble_blue', name: 'Blue Marble', image: 'https://lichess1.org/assets/images/board/blue-marble.jpg' },
                        ].map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div 
                              className={styles.boardPreviewBox}
                              style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                            />
                            <span className={styles.boardName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Other Materials */}
                    {activeCategory === 'other' && (
                    <div className={styles.themeCategory}>
                      <span className={styles.themeCategoryLabel} style={{ display: 'none' }}>✨ Other Materials</span>
                      <div className={styles.boardThemeGrid}>
                        {[
                          { id: 'metal', name: 'Metal', image: 'https://lichess1.org/assets/images/board/metal.jpg' },
                          { id: 'leather', name: 'Leather', image: 'https://lichess1.org/assets/images/board/leather.jpg' },
                          { id: 'canvas', name: 'Canvas', image: 'https://lichess1.org/assets/images/board/canvas2.jpg' },
                          { id: 'grey_cb', name: 'Grey', image: 'https://lichess1.org/assets/images/board/grey.jpg' },
                          { id: 'blue_cb', name: 'Blue', image: 'https://lichess1.org/assets/images/board/blue2.jpg' },
                          { id: 'purple_diag', name: 'Purple', image: 'https://lichess1.org/assets/images/board/purple-diag.png' },
                        ].map(theme => (
                          <div 
                            key={theme.id}
                            className={`${styles.boardThemeItem} ${branding.boardTheme === theme.id ? styles.activeBoard : ''}`}
                            onClick={() => setBranding({ ...branding, boardTheme: theme.id })}
                          >
                            <div 
                              className={styles.boardPreviewBox}
                              style={{ backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block' }}
                            />
                            <span className={styles.boardName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                </section>

                {/* Piece style customization */}
                <section className={styles.boardPiecesSection}>
                  <h3 className={styles.sectionHeading}>
                    <ChessKnightIcon size={18} style={{ marginRight: '6px' }} /> Piece style
                  </h3>
                  <div className={styles.fieldGroup}>
                    <label>Chess Piece Style</label>
                    <div className={styles.pieceStyleGrid}>
                      {[
                        { id: 'cburnett', name: 'cburnett' },
                        { id: 'merida', name: 'merida' },
                        { id: 'alpha', name: 'alpha' },
                        { id: 'staunty', name: 'staunty' },
                        { id: 'pixel', name: 'pixel' },
                        { id: 'letter', name: 'letter' },
                        { id: 'chessbuddy', name: 'Chess Buddy' },
                      ].map(pieceSet => {
                        const previewUrl = pieceSet.id === 'chessbuddy'
                          ? '/pieces/chessbuddy/wN.png'
                          : `https://lichess1.org/assets/_L5MIdy/piece/${pieceSet.id}/wN.svg`;
                        return (
                          <div 
                            key={pieceSet.id}
                            className={`${styles.pieceItem} ${branding.pieceTheme === pieceSet.id ? styles.activePiece : ''}`}
                            onClick={() => setBranding({ ...branding, pieceTheme: pieceSet.id })}
                          >
                            <div 
                              className={styles.piecePreview} 
                              style={{ backgroundImage: `url(${previewUrl})` }} 
                            />
                            <span className={styles.pieceName}>{pieceSet.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className={styles.boardPiecesSection}>
                  <h3 className={styles.sectionHeading}>Piece animations</h3>
                  
                  <div className={styles.boardPiecesRow} style={{ alignItems: 'center' }}>
                    <span className={styles.rowLabel}>Animation style</span>
                    <div style={{ flex: 1, maxWidth: '200px' }}>
                      <select
                        value={branding.pieceAnimation || 'standard'}
                        onChange={(e) => setBranding({ ...branding, pieceAnimation: e.target.value })}
                        className={styles.input}
                        style={{ height: '36px', padding: '0 12px', cursor: 'pointer' }}
                      >
                        <option value="none">None (Instant)</option>
                        <option value="teleport">Teleport</option>
                        <option value="standard">Standard (Slide)</option>
                        <option value="arcade">Arcade (Comet Trail)</option>
                        <option value="bounce">Bounce (Subtle Settle)</option>
                        <option value="trail">Trail (Particle Streak)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.boardPiecesRow} style={{ alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={styles.rowLabel}>Highlight last move</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Show subtle highlight on the from/to squares</span>
                    </div>
                    <label className={styles.toggleSwitch} style={{ marginLeft: 'auto' }}>
                      <input
                        type="checkbox"
                        checked={branding.highlightLastMove !== false}
                        onChange={(e) => setBranding({ ...branding, highlightLastMove: e.target.checked })}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </section>
                  </>
                )}

                {activeClassroomNav === 'panels' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* 1. PANEL STYLE PRESETS */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '12px' }}>
                        PANEL STYLE
                      </label>
                      <div className={styles.panelThemeGrid}>
                        {[
                          { id: 'solid', name: 'Solid', previewStyle: { background: branding.panelColor || '#ffffff', border: '1.5px solid #eedcd0' } },
                          { id: 'glass', name: 'Glass', previewStyle: { background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)' } },
                          { id: 'slate', name: 'Slate', previewStyle: { background: branding.panelColor || '#2d4a6b', border: '1.5px solid rgba(255,255,255,0.15)' } },
                          { id: 'parchment', name: 'Parch.', previewStyle: { background: '#fdf5ea', backgroundImage: 'radial-gradient(#eedcd0 1px, transparent 0), radial-gradient(#eedcd0 1px, #fdf5ea 0)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px', border: '1.5px solid #eedcd0' } },
                          { id: 'gradient', name: 'Grad.', previewStyle: { background: 'linear-gradient(to bottom, #ffffff, #fdf5ea)', border: '1.5px solid #eedcd0' } },
                          { id: 'image', name: 'Image', icon: ImageIcon, previewStyle: { background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                        ].map(theme => (
                          <div
                            key={theme.id}
                            className={`${styles.panelThemeItem} ${branding.panelStyle === theme.id ? styles.activePanelTheme : ''}`}
                            onClick={() => setBranding({ ...branding, panelStyle: theme.id })}
                          >
                            <div className={styles.panelPreviewBox} style={theme.previewStyle}>
                              {theme.icon && <theme.icon size={22} style={{ color: '#2563eb' }} />}
                            </div>
                            <span className={styles.panelThemeName}>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. CUSTOMIZE CARD */}
                    <div className={styles.chessSettingsCard} style={{ marginTop: 0, padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Sliders size={18} style={{ color: 'var(--primary)' }} />
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Customize</h3>
                      </div>
                      <p style={{ marginTop: 0, marginBottom: '24px', fontSize: '0.82rem', color: '#64748b' }}>
                        Controls adapt to the selected style.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Panel Color (Solid & Slate) */}
                        {(branding.panelStyle === 'solid' || branding.panelStyle === 'slate') && (
                          <div className={styles.colorRoleRow}>
                            <div className={styles.colorRoleMeta}>
                              <span className={styles.colorRoleTitle}>Panel color</span>
                              <span className={styles.colorRoleSubtitle}>Solid & Slate</span>
                            </div>
                            <div className={styles.colorSwatchesGroup}>
                              {['#ffffff', '#2d4a6b', '#334155', '#451a03'].map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`${styles.colorCircle} ${(branding.panelColor || (branding.panelStyle === 'slate' ? '#2d4a6b' : '#ffffff')) === color ? styles.colorCircleActive : ''}`}
                                  style={{ background: color, border: color === '#ffffff' ? '1px solid #cbd5e1' : undefined }}
                                  onClick={() => setBranding({ ...branding, panelColor: color })}
                                  title={color}
                                />
                              ))}
                              <label className={styles.customColorPickerPlus} title="Custom color">
                                +
                                <input
                                  type="color"
                                  value={branding.panelColor || (branding.panelStyle === 'slate' ? '#2d4a6b' : '#ffffff')}
                                  onChange={(e) => setBranding({ ...branding, panelColor: e.target.value })}
                                  style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: 'pointer' }}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Background Image Controls (Image type) */}
                        {branding.panelStyle === 'image' && (
                          <>
                            {/* Background Image Source Toggle */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className={styles.colorRoleMeta}>
                                <span className={styles.colorRoleTitle}>Background image</span>
                                <span className={styles.colorRoleSubtitle}>Image</span>
                              </div>
                              <div className={styles.imageSourceToggle}>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${(branding.panelImageSource || 'upload') === 'upload' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBranding({ ...branding, panelImageSource: 'upload' })}
                                >
                                  Upload
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${branding.panelImageSource === 'url' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBranding({ ...branding, panelImageSource: 'url' })}
                                >
                                  URL
                                </button>
                              </div>
                            </div>

                            {/* Upload Zone or URL Input */}
                            {(branding.panelImageSource || 'upload') === 'upload' ? (
                              <label
                                className={`${styles.smallUploadDropzone} ${isDragOver ? styles.uploadDropzoneActive : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDragOver(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file && file.type.startsWith('image/')) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      setToastMessage('Image must be under 2MB');
                                      setShowToast(true);
                                      setTimeout(() => setShowToast(false), 3000);
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setBranding((prev: any) => ({ ...prev, panelImageUpload: reader.result, panelImageUrl: '' }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ width: '100%', height: '84px' }}
                              >
                                <UploadCloud size={20} style={{ color: '#2563eb', marginBottom: '2px' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
                                  {branding.panelImageUpload ? 'Image uploaded — Click to replace' : 'Upload panel image'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PNG/SVG/JPG · max 2MB</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        setToastMessage('Image must be under 2MB');
                                        setShowToast(true);
                                        setTimeout(() => setShowToast(false), 3000);
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setBranding((prev: any) => ({ ...prev, panelImageUpload: reader.result, panelImageUrl: '' }));
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            ) : (
                              <input
                                type="text"
                                value={branding.panelImageUrl || ''}
                                onChange={(e) => setBranding({ ...branding, panelImageUrl: e.target.value })}
                                placeholder="https://example.com/panel-bg.jpg"
                                className={styles.input}
                              />
                            )}

                            {/* Fit Control */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className={styles.colorRoleMeta}>
                                <span className={styles.colorRoleTitle}>Fit</span>
                                <span className={styles.colorRoleSubtitle}>Image</span>
                              </div>
                              <div className={styles.imageSourceToggle} style={{ maxWidth: '180px' }}>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${(branding.panelImageFit || 'cover') === 'cover' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBranding({ ...branding, panelImageFit: 'cover' })}
                                >
                                  Cover
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${branding.panelImageFit === 'contain' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBranding({ ...branding, panelImageFit: 'contain' })}
                                >
                                  Contain
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Opacity Slider (Solid · Glass · Image) */}
                        {(branding.panelStyle === 'solid' || branding.panelStyle === 'glass' || branding.panelStyle === 'image') && (
                          <div className={styles.fieldGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className={styles.colorRoleMeta}>
                                <span className={styles.colorRoleTitle}>Opacity</span>
                                <span className={styles.colorRoleSubtitle}>Solid · Glass · Image</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {branding.panelOpacity ?? 95}%
                              </span>
                            </div>
                            <div className={styles.sliderRow} style={{ margin: 0 }}>
                              <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={branding.panelOpacity ?? 95}
                                onChange={(e) => setBranding({ ...branding, panelOpacity: Number(e.target.value) })}
                                className={styles.paddingSlider}
                              />
                            </div>
                          </div>
                        )}

                        {/* Blur Slider (Glass · Image) */}
                        {(branding.panelStyle === 'glass' || branding.panelStyle === 'image') && (
                          <div className={styles.fieldGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className={styles.colorRoleMeta}>
                                <span className={styles.colorRoleTitle}>Blur</span>
                                <span className={styles.colorRoleSubtitle}>Glass · Image</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {branding.panelBlur ?? 0}px
                              </span>
                            </div>
                            <div className={styles.sliderRow} style={{ margin: 0 }}>
                              <input
                                type="range"
                                min={0}
                                max={20}
                                step={1}
                                value={branding.panelBlur ?? 0}
                                onChange={(e) => setBranding({ ...branding, panelBlur: Number(e.target.value) })}
                                className={styles.paddingSlider}
                              />
                            </div>
                          </div>
                        )}

                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                          Panel color applies to Solid & Slate · Opacity applies to Solid, Glass & Image · Blur applies to Glass & Image
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeClassroomNav === 'background' && (
                  <div style={{ marginTop: '0' }}>
                    {/* Classroom Background Section */}
                    <h3 className={styles.sectionHeading} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.25rem', color: 'var(--primary)' }}>
                      <ImageIcon size={20} /> Classroom background
                    </h3>
                    <div className={styles.form}>
                      {/* ═══ 1. BACKGROUND TYPE ═══ */}
                      <div className={styles.fieldGroup}>
                        <label>Background Type</label>
                        <div className={styles.bgTypeSegmented}>
                          {[
                            { id: 'solid', label: 'Solid', icon: Square },
                            { id: 'gradient', label: 'Gradient', icon: Blend },
                            { id: 'texture', label: 'Texture', icon: Sparkles },
                            { id: 'image', label: 'Image', icon: ImageIcon }
                          ].map(t => {
                            const IconComp = t.icon;
                            const isActive = (branding.classroomBackground?.type || 'solid') === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={`${styles.bgTypeSegmentItem} ${isActive ? styles.bgTypeSegmentItemActive : ''}`}
                                onClick={() => setBgType(t.id as any)}
                              >
                                <IconComp size={14} />
                                <span>{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Solid Controls */}
                      {branding.classroomBackground?.type === 'solid' && (
                        <div className={styles.fieldGroup}>
                          <label>Solid Background Color</label>
                          <div className={styles.row} style={{ margin: 0, alignItems: 'center', gap: '12px' }}>
                            <input
                              type="color"
                              value={branding.classroomBackground.solidColor || '#fdf0e4'}
                              onChange={(e) => setBgSolidColor(e.target.value)}
                              style={{ width: '45px', height: '40px', padding: 0, border: '1px solid #eedcd0', borderRadius: '8px', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              className={styles.input}
                              value={branding.classroomBackground.solidColor || '#fdf0e4'}
                              onChange={(e) => setBgSolidColor(e.target.value)}
                              placeholder="#FFFFFF"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Gradient Controls */}
                      {branding.classroomBackground?.type === 'gradient' && (
                        <div className={styles.fieldGroup}>
                          <label>Gradient Settings</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className={styles.row} style={{ margin: 0, gap: '16px' }}>
                              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.68rem', color: '#8c7060' }}>Start Color</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="color"
                                    value={branding.classroomBackground.gradient?.stops?.[0]?.color || '#fdf0e4'}
                                    onChange={(e) => setBgGradientStop(0, e.target.value)}
                                    style={{ width: '40px', height: '36px', padding: 0, border: '1px solid #eedcd0', borderRadius: '6px', cursor: 'pointer' }}
                                  />
                                  <input
                                    type="text"
                                    className={styles.input}
                                    value={branding.classroomBackground.gradient?.stops?.[0]?.color || '#fdf0e4'}
                                    onChange={(e) => setBgGradientStop(0, e.target.value)}
                                    style={{ padding: '8px 12px' }}
                                  />
                                </div>
                              </div>
                              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.68rem', color: '#8c7060' }}>End Color</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="color"
                                    value={branding.classroomBackground.gradient?.stops?.[1]?.color || '#eedcd0'}
                                    onChange={(e) => setBgGradientStop(1, e.target.value)}
                                    style={{ width: '40px', height: '36px', padding: 0, border: '1px solid #eedcd0', borderRadius: '6px', cursor: 'pointer' }}
                                  />
                                  <input
                                    type="text"
                                    className={styles.input}
                                    value={branding.classroomBackground.gradient?.stops?.[1]?.color || '#eedcd0'}
                                    onChange={(e) => setBgGradientStop(1, e.target.value)}
                                    style={{ padding: '8px 12px' }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className={styles.fieldGroup}>
                              <label style={{ fontSize: '0.68rem', color: '#8c7060' }}>Direction</label>
                              <select
                                className={styles.select}
                                value={branding.classroomBackground.gradient?.direction || '135deg'}
                                onChange={(e) => setBgGradientDirection(e.target.value)}
                              >
                                <option value="135deg">Diagonal (135°)</option>
                                <option value="90deg">Horizontal (90°)</option>
                                <option value="180deg">Vertical (180°)</option>
                                <option value="0deg">To Top (0°)</option>
                                <option value="45deg">Diagonal Up (45°)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ═══ 3. TEXTURES — PARAMETRIC + REGISTRY ═══ */}
                      {branding.classroomBackground?.type === 'texture' && (
                        <div className={styles.fieldGroup}>
                          <label>SELECT A TEXTURE</label>
                          
                          {/* Category Chips */}
                          <div className={styles.categoryChipsRow}>
                            {TEXTURE_CATEGORIES.map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                className={`${styles.categoryChip} ${activeTextureCategory === cat.id ? styles.categoryChipActive : ''}`}
                                onClick={() => setActiveTextureCategory(cat.id)}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>

                          {/* Texture Cards for selected category */}
                          <div className={styles.textureGrid}>
                            {TEXTURE_REGISTRY.filter(t => t.category === activeTextureCategory).map(p => {
                              const activeTextureId = branding.classroomBackground?.texture || 'dots';
                              const isSelected = activeTextureId === p.id;
                              const currentParams = isSelected && branding.classroomBackground?.textureParams
                                ? branding.classroomBackground.textureParams
                                : p.defaultParams;
                              const previewStyle = p.renderCss(currentParams);

                              return (
                                <div
                                  key={p.id}
                                  className={`${styles.textureCard} ${isSelected ? styles.textureCardActive : ''}`}
                                  onClick={() => setBgTexture(p.id)}
                                >
                                  <div
                                    className={styles.textureCardPreview}
                                    style={{
                                      backgroundColor: previewStyle.background,
                                      backgroundImage: previewStyle.backgroundImage,
                                      backgroundSize: previewStyle.backgroundSize,
                                      backgroundRepeat: previewStyle.backgroundRepeat || 'repeat',
                                      backgroundPosition: previewStyle.backgroundPosition || '0 0'
                                    }}
                                  />
                                  <span className={styles.textureCardLabel}>{p.name}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Customize Panel for current selected texture */}
                          {(() => {
                            const activeTexDef = getTextureById(branding.classroomBackground?.texture || 'dots');
                            const currentParams = {
                              ...activeTexDef.defaultParams,
                              ...(branding.classroomBackground?.textureParams || {})
                            };

                            const presetBases = activeTexDef.presetBaseColors || ['#fdf0e4', '#f0f4f8', '#f5f0f8', '#f0f8f4'];
                            const presetPatterns = activeTexDef.presetPatternColors || ['#c8854a', '#708090', '#c06c84', '#4a7c59'];

                            return (
                              <div className={styles.textureCustomizePanel}>
                                <div className={styles.customizeHeader}>
                                  <Sliders size={16} />
                                  <span>Customize · {activeTexDef.name}</span>
                                </div>

                                {/* Base color */}
                                <div className={styles.customizeRow}>
                                  <span className={styles.customizeLabel}>Base color</span>
                                  <div className={styles.swatchGroup}>
                                    {presetBases.map(c => (
                                      <div
                                        key={c}
                                        className={`${styles.swatchCircle} ${currentParams.baseColor.toLowerCase() === c.toLowerCase() ? styles.swatchCircleActive : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setBgTextureParam('baseColor', c)}
                                      />
                                    ))}
                                    <input
                                      type="color"
                                      value={currentParams.baseColor}
                                      onChange={(e) => setBgTextureParam('baseColor', e.target.value)}
                                      style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                    />
                                  </div>
                                </div>

                                {/* Pattern color */}
                                <div className={styles.customizeRow}>
                                  <span className={styles.customizeLabel}>Pattern color</span>
                                  <div className={styles.swatchGroup}>
                                    {presetPatterns.map(c => (
                                      <div
                                        key={c}
                                        className={`${styles.swatchCircle} ${currentParams.patternColor.toLowerCase() === c.toLowerCase() ? styles.swatchCircleActive : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setBgTextureParam('patternColor', c)}
                                      />
                                    ))}
                                    <input
                                      type="color"
                                      value={currentParams.patternColor}
                                      onChange={(e) => setBgTextureParam('patternColor', e.target.value)}
                                      style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                    />
                                  </div>
                                </div>

                                {/* Scale */}
                                <div className={styles.customizeRow}>
                                  <span className={styles.customizeLabel}>Scale</span>
                                  <input
                                    type="range"
                                    min={50}
                                    max={200}
                                    step={5}
                                    value={currentParams.scale}
                                    onChange={(e) => setBgTextureParam('scale', Number(e.target.value))}
                                    className={styles.customizeSlider}
                                  />
                                </div>

                                {/* Opacity */}
                                <div className={styles.customizeRow}>
                                  <span className={styles.customizeLabel}>Opacity</span>
                                  <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    step={5}
                                    value={currentParams.opacity}
                                    onChange={(e) => setBgTextureParam('opacity', Number(e.target.value))}
                                    className={styles.customizeSlider}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* ═══ 2. IMAGE SETTINGS ═══ */}
                      {branding.classroomBackground?.type === 'image' && (
                        <div className={styles.fieldGroup}>
                          <label>Image Settings</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Source Selector */}
                            <div className={styles.imageSourceToggle}>
                              <button
                                type="button"
                                className={`${styles.imageSourceBtn} ${branding.classroomBackground.imageSource === 'upload' ? styles.imageSourceBtnActive : ''}`}
                                onClick={() => setBgImageSource('upload')}
                              >
                                Upload Image
                              </button>
                              <button
                                type="button"
                                className={`${styles.imageSourceBtn} ${branding.classroomBackground.imageSource === 'url' ? styles.imageSourceBtnActive : ''}`}
                                onClick={() => setBgImageSource('url')}
                              >
                                Image URL
                              </button>
                            </div>

                            {/* Upload Form */}
                            {branding.classroomBackground.imageSource === 'upload' && (
                              <div>
                                <label className={styles.uploadContainer} style={{ display: 'block' }}>
                                  <UploadCloud size={24} style={{ margin: '0 auto 8px auto', color: 'var(--primary)' }} />
                                  <div className={styles.uploadText}>Click or drag image file here</div>
                                  <div className={styles.uploadSubtext}>JPG, PNG or WEBP (Max 5MB)</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBgImageUpload}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                                {imageUploadError && (
                                  <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>{imageUploadError}</p>
                                )}
                                {branding.classroomBackground.imageUpload && (
                                  <div className={styles.imagePreviewBox}>
                                    <img
                                      src={branding.classroomBackground.imageUpload}
                                      alt="Uploaded preview"
                                      className={styles.imagePreview}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* URL Form */}
                            {branding.classroomBackground.imageSource === 'url' && (
                              <div className={styles.fieldGroup}>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Paste Image Address</label>
                                <input
                                  type="text"
                                  className={styles.input}
                                  value={branding.classroomBackground.imageUrl || ''}
                                  onChange={(e) => setBgImageUrl(e.target.value)}
                                  placeholder="https://example.com/background.jpg"
                                />
                                {imageUrlError && (
                                  <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>{imageUrlError}</p>
                                )}
                                {branding.classroomBackground.imageUrl && !imageUrlError && (
                                  <div className={styles.imagePreviewBox}>
                                    <img
                                      src={branding.classroomBackground.imageUrl}
                                      alt="URL preview"
                                      className={styles.imagePreview}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Readability Overlay & Fit Controls */}
                      <div className={styles.fieldGroup} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>Readability overlay</label>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {branding.classroomBackground?.imageOverlayOpacity !== undefined 
                                  ? branding.classroomBackground.imageOverlayOpacity 
                                  : (branding.classroomBackground?.imageOverlay ? 45 : 0)}% darken
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={60}
                              step={5}
                              value={branding.classroomBackground?.imageOverlayOpacity !== undefined 
                                ? branding.classroomBackground.imageOverlayOpacity 
                                : (branding.classroomBackground?.imageOverlay ? 45 : 0)}
                              onChange={(e) => setBgImageOverlayOpacity(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                          </div>

                          {branding.classroomBackground?.type === 'image' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>Fit</label>
                              <div className={styles.imageSourceToggle} style={{ maxWidth: '180px' }}>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${(branding.classroomBackground?.imageFit || 'cover') === 'cover' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBgImageFit('cover')}
                                >
                                  Cover
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.imageSourceBtn} ${branding.classroomBackground?.imageFit === 'contain' ? styles.imageSourceBtnActive : ''}`}
                                  onClick={() => setBgImageFit('contain')}
                                >
                                  Contain
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            {/* ═══ 4. CLASSROOM LIVE PREVIEW (Faithful Miniature) ═══ */}
            <div className={styles.stickyPreviewPane}>
              <div className={styles.previewPin}>
                <Pin size={12} /> Stays in view while you scroll
              </div>
              <div className={styles.livePreviewWrapper}>
                <span className={styles.livePreviewTitle}>Classroom Live Preview</span>
                <div
                  className={styles.livePreviewBackgroundContainer}
                  style={getPreviewBackgroundStyle()}
                >
                  <div
                    className={styles.livePreviewOverlay}
                    style={{
                      backgroundColor: getPreviewOverlayColor()
                    }}
                  />
                  {/* Mini Board */}
                  <div className={styles.miniBoard}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', width: '100%', height: '100%' }}>
                      {[0, 1, 2, 3].map(row =>
                        [0, 1, 2, 3].map(col => {
                          const isDark = (row + col) % 2 === 1;
                          return (
                            <div
                              key={`${row}-${col}`}
                              style={{
                                backgroundColor: isDark
                                  ? (branding.boardTheme.startsWith('custom_') ? branding.customThemes?.find(t => t.id === branding.boardTheme)?.dark || '#c8854a' : '#c8854a')
                                  : (branding.boardTheme.startsWith('custom_') ? branding.customThemes?.find(t => t.id === branding.boardTheme)?.light || '#eedcd0' : '#eedcd0')
                              }}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Mini Panel */}
                  <div
                    className={styles.miniPanel}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      border: (branding.panelStyle === 'glass' || branding.panelStyle === 'image') ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid #eedcd0',
                      backdropFilter: (branding.panelStyle === 'glass' && (branding.panelBlur ?? 0) > 0) ? `blur(${branding.panelBlur}px)` : 'none'
                    }}
                  >
                    {/* Inner Background Layer for Panel */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        background: (() => {
                          const pStyle = branding.panelStyle || 'solid';
                          const op = (branding.panelOpacity ?? 95) / 100;
                          const overlayAlpha = (100 - (branding.panelOpacity ?? 95)) / 100;
                          const hexToRgba = (hex: string, a: number) => {
                            if (!hex) return `rgba(255,255,255,${a})`;
                            let c = hex.replace('#', '');
                            if (c.length === 3) c = c.split('').map(x => x + x).join('');
                            const num = parseInt(c, 16);
                            if (isNaN(num)) return `rgba(255,255,255,${a})`;
                            return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`;
                          };
                          if (pStyle === 'solid') return hexToRgba(branding.panelColor || '#ffffff', op);
                          if (pStyle === 'slate') return hexToRgba(branding.panelColor || '#2d4a6b', op);
                          if (pStyle === 'glass') return `rgba(255, 255, 255, ${op})`;
                          if (pStyle === 'image') {
                            const img = (branding.panelImageSource === 'upload' && branding.panelImageUpload)
                              ? branding.panelImageUpload
                              : (branding.panelImageUrl || '');
                            return img
                              ? `linear-gradient(rgba(255, 255, 255, ${overlayAlpha}), rgba(255, 255, 255, ${overlayAlpha})), url('${img}') center / ${branding.panelImageFit || 'cover'} no-repeat`
                              : `rgba(255, 255, 255, ${op})`;
                          }
                          if (pStyle === 'parchment') return '#fdf5ea';
                          return 'linear-gradient(to bottom, #ffffff, #fdf5ea)';
                        })(),
                        filter: (branding.panelStyle === 'image' && (branding.panelBlur ?? 0) > 0)
                          ? `blur(${branding.panelBlur}px)`
                          : 'none',
                        transform: (branding.panelStyle === 'image' && (branding.panelBlur ?? 0) > 0)
                          ? 'scale(1.2)'
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />

                    {/* Content Layer */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', height: '100%' }}>
                      <div className={styles.miniPanelHeader} />
                      <div className={styles.miniPanelLine} />
                      <div className={styles.miniPanelLineShort} />
                      <div className={styles.miniPanelLine} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  )}

          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${showToast ? styles.toastVisible : ''}`}>
          {toastMessage}
        </div>

      <ConfirmDialog
        isOpen={themeToDelete !== null}
        title="Delete custom theme?"
        message={themeToDelete ? `This will permanently remove "${themeToDelete.name}" from your themes. This can't be undone.` : ''}
        confirmText="Delete theme"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteCustomTheme}
        onCancel={() => setThemeToDelete(null)}
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset settings?"
        message="Are you sure you want to reset all platform settings to defaults? This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
        onConfirm={async () => {
          setShowResetConfirm(false);
          await confirmResetToDefaults();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// COLOR CONVERSION HELPERS
// ----------------------------------------------------------------------

function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  const hex = color.trim();
  if (hex.startsWith('#')) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(fullHex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
  }
  if (hex.startsWith('rgb')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      };
    }
  }
  return { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// Gradient string parsing/serialization
function parseGradient(gradientStr: string) {
  const isRadial = gradientStr.includes('radial-gradient');
  const stops: GradientStop[] = [];
  const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\(.*?\))\s*(\d+)?%/g;
  let match;
  while ((match = stopRegex.exec(gradientStr)) !== null) {
    const color = match[1];
    const position = match[2] ? parseInt(match[2], 10) : 0;
    stops.push({ color, position });
  }
  if (stops.length < 2) {
    stops.push({ color: '#EEDCD0', position: 0 });
    stops.push({ color: '#C8854A', position: 100 });
  }
  let styleIndex = 0;
  if (isRadial) {
    styleIndex = 3;
  } else {
    if (gradientStr.includes('135deg')) styleIndex = 0;
    else if (gradientStr.includes('0deg')) styleIndex = 1;
    else if (gradientStr.includes('90deg')) styleIndex = 2;
    else if (gradientStr.includes('180deg')) styleIndex = 4;
  }
  return { stops, styleIndex, isRadial };
}

function serializeGradient(stops: GradientStop[], styleIndex: number): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  switch (styleIndex) {
    case 0: return `linear-gradient(135deg, ${stopsStr})`;
    case 1: return `linear-gradient(0deg, ${stopsStr})`;
    case 2: return `linear-gradient(90deg, ${stopsStr})`;
    case 3: return `radial-gradient(circle, ${stopsStr})`;
    case 4: return `linear-gradient(180deg, ${stopsStr})`;
    default: return `linear-gradient(135deg, ${stopsStr})`;
  }
}

// ----------------------------------------------------------------------
// CUSTOM COLOR PICKER COMPONENT (AddColorTool)
// ----------------------------------------------------------------------

interface GradientStop {
  color: string;
  position: number;
}

interface AddColorToolProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

function AddColorTool({ color, onChange, onClose }: AddColorToolProps) {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>('solid');
  
  // Solid color states
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [value, setValue] = useState(100);
  const [hexInput, setHexInput] = useState('#FFFFFF');
  
  // Gradient states
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#EEDCD0', position: 0 },
    { color: '#C8854A', position: 100 }
  ]);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [gradientStyleIndex, setGradientStyleIndex] = useState(0);

  const svCanvasRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  // Parse color on mount / prop change
  useEffect(() => {
    if (color && (color.includes('linear-gradient') || color.includes('radial-gradient'))) {
      setActiveTab('gradient');
      const parsed = parseGradient(color);
      setStops(parsed.stops);
      setGradientStyleIndex(parsed.styleIndex);
      
      const activeColor = parsed.stops[activeStopIndex]?.color || '#ffffff';
      const rgb = parseColorToRgb(activeColor);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setHexInput(activeColor);
    } else if (color) {
      setActiveTab('solid');
      const rgb = parseColorToRgb(color);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setHexInput(color);
    }
  }, [color]);

  // Sync controls when activeStopIndex changes in gradient tab
  useEffect(() => {
    if (activeTab === 'gradient' && stops[activeStopIndex]) {
      const stopColor = stops[activeStopIndex].color;
      const rgb = parseColorToRgb(stopColor);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setHexInput(stopColor);
    }
  }, [activeStopIndex, activeTab]);

  const updateColorFromHsv = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex);
    
    if (activeTab === 'solid') {
      onChange(hex);
    } else {
      const newStops = [...stops];
      newStops[activeStopIndex] = {
        ...newStops[activeStopIndex],
        color: hex
      };
      setStops(newStops);
      onChange(serializeGradient(newStops, gradientStyleIndex));
    }
  };

  const handleSvCoordUpdate = (clientX: number, clientY: number) => {
    if (!svCanvasRef.current) return;
    const rect = svCanvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);
    
    setSaturation(s);
    setValue(v);
    updateColorFromHsv(hue, s, v);
  };

  const handleSvMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleSvCoordUpdate(e.clientX, e.clientY);
    
    const handleMouseMove = (mv: MouseEvent) => {
      handleSvCoordUpdate(mv.clientX, mv.clientY);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSvTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleSvCoordUpdate(e.touches[0].clientX, e.touches[0].clientY);
    
    const handleTouchMove = (mv: TouchEvent) => {
      handleSvCoordUpdate(mv.touches[0].clientX, mv.touches[0].clientY);
    };
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleHueCoordUpdate = (clientX: number) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    
    const h = Math.round((x / rect.width) * 360);
    setHue(h);
    updateColorFromHsv(h, saturation, value);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleHueCoordUpdate(e.clientX);
    
    const handleMouseMove = (mv: MouseEvent) => {
      handleHueCoordUpdate(mv.clientX);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHueTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleHueCoordUpdate(e.touches[0].clientX);
    
    const handleTouchMove = (mv: TouchEvent) => {
      handleHueCoordUpdate(mv.touches[0].clientX);
    };
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    
    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
      const formattedHex = val.startsWith('#') ? val : `#${val}`;
      const rgb = parseColorToRgb(formattedHex);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      
      if (activeTab === 'solid') {
        onChange(formattedHex);
      } else {
        const newStops = [...stops];
        newStops[activeStopIndex] = {
          ...newStops[activeStopIndex],
          color: formattedHex
        };
        setStops(newStops);
        onChange(serializeGradient(newStops, gradientStyleIndex));
      }
    }
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  
  const handleEyeDropper = async () => {
    if (!hasEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      setHexInput(hex);
      
      const rgb = parseColorToRgb(hex);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      
      if (activeTab === 'solid') {
        onChange(hex);
      } else {
        const newStops = [...stops];
        newStops[activeStopIndex] = {
          ...newStops[activeStopIndex],
          color: hex
        };
        setStops(newStops);
        onChange(serializeGradient(newStops, gradientStyleIndex));
      }
    } catch (err) {}
  };

  const handleAddStop = () => {
    if (stops.length >= 5) return;
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    let newPos = 50;
    if (sorted.length >= 2) {
      let maxGap = 0;
      let gapStart = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i+1].position - sorted[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = sorted[i].position;
        }
      }
      newPos = Math.round(gapStart + maxGap / 2);
    }
    const newStops = [...stops, { color: '#FFFFFF', position: newPos }];
    setStops(newStops);
    setActiveStopIndex(newStops.length - 1);
    onChange(serializeGradient(newStops, gradientStyleIndex));
  };

  const handleDeleteActiveStop = () => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, idx) => idx !== activeStopIndex);
    setStops(newStops);
    setActiveStopIndex(Math.max(0, activeStopIndex - 1));
    onChange(serializeGradient(newStops, gradientStyleIndex));
  };

  const handleStyleChange = (idx: number) => {
    setGradientStyleIndex(idx);
    onChange(serializeGradient(stops, idx));
  };

  const activeStopColor = stops[activeStopIndex]?.color || '#ffffff';

  return (
    <div className={styles.colorPickerCard}>
      {/* Tab bar */}
      <div className={styles.pickerTabs}>
        <button
          type="button"
          className={`${styles.pickerTab} ${activeTab === 'solid' ? styles.pickerTabActive : ''}`}
          onClick={() => {
            setActiveTab('solid');
            const rgb = hsvToRgb(hue, saturation, value);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            onChange(hex);
          }}
        >
          Solid colour
        </button>
        <button
          type="button"
          className={`${styles.pickerTab} ${activeTab === 'gradient' ? styles.pickerTabActive : ''}`}
          onClick={() => {
            setActiveTab('gradient');
            onChange(serializeGradient(stops, gradientStyleIndex));
          }}
        >
          Gradient
        </button>
      </div>

      {activeTab === 'gradient' && (
        <div className={styles.gradientSection}>
          <span className={styles.pickerSubheading}>Gradient colours</span>
          <div className={styles.stopsRow}>
            {stops.map((stop, idx) => (
              <button
                key={`stop-${idx}`}
                type="button"
                className={`${styles.stopCircle} ${idx === activeStopIndex ? styles.stopCircleActive : ''}`}
                style={{ backgroundColor: stop.color }}
                onClick={() => setActiveStopIndex(idx)}
                title={`Stop ${idx + 1}: ${stop.position}%`}
              />
            ))}
            
            {stops.length < 5 && (
              <button
                type="button"
                className={styles.addStopBtn}
                onClick={handleAddStop}
                title="Add gradient color stop"
              >
                +
              </button>
            )}

            {stops.length > 2 && (
              <button
                type="button"
                className={styles.deleteStopBtn}
                onClick={handleDeleteActiveStop}
                title="Delete active color stop"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <span className={styles.pickerSubheading}>Style</span>
          <div className={styles.gradientStylesGrid}>
            {[0, 1, 2, 3, 4].map(idx => {
              const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
              let bg = '';
              if (idx === 0) bg = `linear-gradient(135deg, ${stopsStr})`;
              else if (idx === 1) bg = `linear-gradient(0deg, ${stopsStr})`;
              else if (idx === 2) bg = `linear-gradient(90deg, ${stopsStr})`;
              else if (idx === 3) bg = `radial-gradient(circle, ${stopsStr})`;
              else if (idx === 4) bg = `linear-gradient(180deg, ${stopsStr})`;
              
              return (
                <button
                  key={`style-${idx}`}
                  type="button"
                  className={`${styles.stylePreviewCard} ${gradientStyleIndex === idx ? styles.stylePreviewCardActive : ''}`}
                  style={{ background: bg }}
                  onClick={() => handleStyleChange(idx)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Solid Picker Canvas & Slider */}
      <div className={styles.pickerMainControls}>
        <div 
          ref={svCanvasRef}
          className={styles.svCanvas}
          style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
          onMouseDown={handleSvMouseDown}
          onTouchStart={handleSvTouchStart}
        >
          <div className={styles.svWhiteGradient} />
          <div className={styles.svBlackGradient} />
          <div 
            className={styles.svHandle}
            style={{
              left: `${saturation}%`,
              top: `${100 - value}%`,
              backgroundColor: activeTab === 'solid' ? hexInput : activeStopColor
            }}
          />
        </div>

        <div 
          ref={hueSliderRef}
          className={styles.hueSlider}
          onMouseDown={handleHueMouseDown}
          onTouchStart={handleHueTouchStart}
        >
          <div 
            className={styles.hueHandle}
            style={{
              left: `${(hue / 360) * 100}%`
            }}
          />
        </div>

        {/* Input box row */}
        <div className={styles.hexInputRow}>
          <div className={styles.inputContainer}>
            <div 
              className={styles.inputPreviewDot} 
              style={{ background: activeTab === 'solid' ? hexInput : activeStopColor }}
            />
            <input
              type="text"
              className={styles.hexText}
              value={hexInput}
              onChange={handleHexInputChange}
              placeholder="#FFFFFF"
            />
          </div>
          
          <button
            type="button"
            className={`${styles.dropperBtn} ${!hasEyeDropper ? styles.dropperBtnDisabled : ''}`}
            onClick={handleEyeDropper}
            disabled={!hasEyeDropper}
            title={hasEyeDropper ? "Pick screen color" : "Screen color picker not supported in this browser"}
          >
            <Pipette size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
