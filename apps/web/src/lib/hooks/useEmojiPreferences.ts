import { useState, useEffect, useCallback } from 'react';
import { EmojiConfig, EMOJIS } from '../../components/chess/emojis';

interface EmojiPreferences {
  favourites: string[]; // array of 5 emoji IDs
  usage: Record<string, number>;
  customShortcuts: Record<string, string>;
}

const DEFAULT_PREFERENCES: EmojiPreferences = {
  // Default top 5 emojis from the list
  favourites: [EMOJIS[0].id, EMOJIS[1].id, EMOJIS[2].id, EMOJIS[3].id, EMOJIS[4].id],
  usage: {},
  customShortcuts: {}
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
          favourites: parsed.favourites?.length === 5 ? parsed.favourites : prev.favourites,
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

  const updateFavourites = useCallback((newFavourites: string[]) => {
    if (newFavourites.length > 5) return; // Enforce max 5
    setPreferences(prev => {
      const newPrefs = { ...prev, favourites: newFavourites };
      localStorage.setItem('vca_emoji_prefs', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const updateShortcut = useCallback((id: string, shortcut: string) => {
    setPreferences(prev => {
      const newShortcuts = { ...prev.customShortcuts };
      
      // Remove shortcut from other emoji if it's already used
      if (shortcut) {
         Object.keys(newShortcuts).forEach(key => {
             if (newShortcuts[key] === shortcut) {
                 newShortcuts[key] = '';
             }
         });
         
         // Also check base shortcuts to override them if conflict
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

  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Compute active emojis list based on base EMOJIS + customShortcuts
  const activeEmojis = EMOJIS.map(emoji => {
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

  // Fill up if there are not enough emojis somehow
  while (favouriteEmojis.length < 5) {
      const unused = activeEmojis.find(e => !favouriteEmojis.some(fe => fe.id === e.id));
      if (unused) {
          favouriteEmojis.push(unused);
      } else {
          break; // shouldn't happen unless EMOJIS < 5
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
    updateFavourites,
    updateShortcut,
    resetToDefaults
  };
}
