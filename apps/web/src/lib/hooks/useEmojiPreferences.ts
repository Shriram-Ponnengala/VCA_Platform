import { useState, useEffect, useCallback } from 'react';
import { EmojiConfig, EMOJIS } from '../../components/chess/emojis';

interface EmojiPreferences {
  favourites: string[]; // array of emoji IDs
  usage: Record<string, number>;
  customShortcuts: Record<string, string>;
  hiddenEmojiIds: string[];
  customEmojis: EmojiConfig[];
}

const DEFAULT_PREFERENCES: EmojiPreferences = {
  favourites: [EMOJIS[0].id, EMOJIS[1].id, EMOJIS[2].id, EMOJIS[3].id, EMOJIS[4].id],
  usage: {},
  customShortcuts: {},
  hiddenEmojiIds: [],
  customEmojis: []
};

export function useEmojiPreferences() {
  const [preferences, setPreferences] = useState<EmojiPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vca_emoji_prefs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<EmojiPreferences>;
        setPreferences(prev => ({
          ...prev,
          ...parsed,
          favourites: parsed.favourites || prev.favourites,
          hiddenEmojiIds: parsed.hiddenEmojiIds || [],
          customEmojis: parsed.customEmojis || []
        }));
      } catch (e) {
        console.error('Failed to parse emoji preferences', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const savePreferences = useCallback((newPrefs: EmojiPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
  }, []);

  const incrementUsage = useCallback((id: string) => {
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        usage: {
          ...prev.usage,
          [id]: (prev.usage[id] || 0) + 1
        }
      };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const toggleFavourite = useCallback((id: string) => {
    setPreferences(prev => {
      let newFavs = [...prev.favourites];
      if (newFavs.includes(id)) {
        newFavs = newFavs.filter(favId => favId !== id);
      } else {
        if (newFavs.length >= 5) {
          newFavs.shift(); // keep max 5
        }
        newFavs.push(id);
      }
      const newPrefs = { ...prev, favourites: newFavs };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const updateFavourites = useCallback((newFavourites: string[]) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, favourites: newFavourites.slice(0, 5) };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const updateShortcut = useCallback((id: string, shortcut: string) => {
    setPreferences(prev => {
      const newShortcuts = { ...prev.customShortcuts };
      
      if (shortcut) {
         Object.keys(newShortcuts).forEach(key => {
             if (newShortcuts[key] === shortcut) {
                 newShortcuts[key] = '';
             }
         });
         
         EMOJIS.forEach(em => {
            if (em.shortcutKey === shortcut && em.id !== id && newShortcuts[em.id] === undefined) {
                 newShortcuts[em.id] = '';
            }
         });
      }

      newShortcuts[id] = shortcut;
      
      const newPrefs = { ...prev, customShortcuts: newShortcuts };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const addCustomEmoji = useCallback((newEmoji: EmojiConfig) => {
    setPreferences(prev => {
      const updatedCustom = [...(prev.customEmojis || []), newEmoji];
      const newPrefs = { ...prev, customEmojis: updatedCustom };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const deleteEmoji = useCallback((id: string) => {
    setPreferences(prev => {
      const hidden = new Set(prev.hiddenEmojiIds || []);
      hidden.add(id);
      const newFavs = prev.favourites.filter(favId => favId !== id);
      const newCustom = (prev.customEmojis || []).filter(e => e.id !== id);

      const newPrefs = {
        ...prev,
        favourites: newFavs,
        hiddenEmojiIds: Array.from(hidden),
        customEmojis: newCustom
      };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Compute active emojis list based on base EMOJIS + customEmojis - hiddenEmojiIds + customShortcuts
  const hiddenSet = new Set(preferences.hiddenEmojiIds || []);
  const combinedList = [...EMOJIS, ...(preferences.customEmojis || [])];

  const activeEmojis = combinedList
    .filter(emoji => !hiddenSet.has(emoji.id))
    .map(emoji => {
      if (preferences.customShortcuts[emoji.id] !== undefined) {
        return { ...emoji, shortcutKey: preferences.customShortcuts[emoji.id] };
      }
      return emoji;
    });

  // Calculate most used (top 5 excluding favourites)
  const mostUsed = activeEmojis
    .filter(e => !preferences.favourites.includes(e.id))
    .sort((a, b) => (preferences.usage[b.id] || 0) - (preferences.usage[a.id] || 0))
    .slice(0, 5);
    
  const favouriteEmojis = preferences.favourites.map(id => activeEmojis.find(e => e.id === id)).filter(Boolean) as EmojiConfig[];

  while (favouriteEmojis.length < 5) {
      const unused = activeEmojis.find(e => !favouriteEmojis.some(fe => fe.id === e.id));
      if (unused) {
          favouriteEmojis.push(unused);
      } else {
          break;
      }
  }
  
  while (mostUsed.length < 5) {
      const unused = activeEmojis.find(e => !favouriteEmojis.some(fe => fe.id === e.id) && !mostUsed.some(mu => mu.id === e.id));
      if (unused) {
          mostUsed.push(unused);
      } else {
          break;
      }
  }

  return {
    isLoaded,
    preferences,
    activeEmojis,
    favouriteEmojis,
    mostUsed,
    incrementUsage,
    toggleFavourite,
    updateFavourites,
    updateShortcut,
    addCustomEmoji,
    deleteEmoji,
    resetToDefaults
  };
}
