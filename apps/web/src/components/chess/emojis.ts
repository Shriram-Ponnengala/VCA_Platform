export interface EmojiConfig {
  id: string;
  glyph: string;
  name: string;
  shortcutKey: string; // '' means palette-only, no keyboard shortcut
  category?: ('reactions' | 'praise' | 'surprise' | 'fun' | 'thinking' | 'symbols')[];
  animation: 'slam' | 'angry' | 'rise' | 'giggle' | 'droop' | 'wag' | 'bob' | 'spin' | 'zip';
  shakeLevel: 'heavy' | 'medium' | 'light' | 'none';
  shock: boolean;
  burst: boolean;
  flash: 'white' | 'red' | 'none';
  sound: 'thud' | 'pop' | 'whoosh' | 'tone' | 'blips' | 'snore';
  particles: {
    glyphs: string[];
    count: number;
    mode: 'burst' | 'rain' | 'rise' | 'orbit';
  };
}

export const EMOJIS: EmojiConfig[] = [
  { id: 'happy', glyph: '😄', name: 'happy', shortcutKey: 'H', category: ['reactions'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🎉', '✨', '⭐', '🎈', '😄'], count: 14, mode: 'rise' } },
  { id: 'laughing', glyph: '😂', name: 'laughing', shortcutKey: 'L', category: ['reactions', 'fun'], animation: 'giggle', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['😂', '😆', '😹'], count: 12, mode: 'burst' } },
  { id: 'love', glyph: '😍', name: 'love', shortcutKey: '', category: ['reactions', 'praise'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['😍', '❤️', '💖', '✨'], count: 14, mode: 'rise' } },
  { id: 'party', glyph: '🥳', name: 'party', shortcutKey: 'B', category: ['reactions', 'fun', 'praise'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['🎉', '🎊', '✨', '🎈', '🌟'], count: 20, mode: 'rise' } },
  { id: 'surprise_face', glyph: '😮', name: 'surprised', shortcutKey: '', category: ['reactions', 'surprise'], animation: 'slam', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['😮', '✨', '❗'], count: 10, mode: 'burst' } },
  { id: 'thinking', glyph: '🤔', name: 'thinking', shortcutKey: 'F', category: ['reactions', 'thinking'], animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['❓', '💭', '✨'], count: 8, mode: 'rise' } },
  { id: 'neutral', glyph: '😑', name: 'neutral', shortcutKey: '', category: ['reactions'], animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💬', '💨'], count: 6, mode: 'rise' } },
  { id: 'ok', glyph: '👌', name: 'ok', shortcutKey: 'G', category: ['reactions', 'praise'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '⭐', '👌'], count: 10, mode: 'burst' } },

  { id: 'clap', glyph: '👏', name: 'clap', shortcutKey: 'R', category: ['praise'], animation: 'slam', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'thud', particles: { glyphs: ['✨', '⭐', '👏'], count: 12, mode: 'burst' } },
  { id: 'thumbsup', glyph: '👍', name: 'thumbsup', shortcutKey: 'U', category: ['praise'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '⭐', '👍'], count: 10, mode: 'rise' } },
  { id: 'flex', glyph: '💪', name: 'flex', shortcutKey: '', category: ['praise'], animation: 'slam', shakeLevel: 'medium', shock: false, burst: true, flash: 'none', sound: 'thud', particles: { glyphs: ['💥', '⚡', '💪'], count: 12, mode: 'burst' } },
  { id: 'handshake', glyph: '🤝', name: 'handshake', shortcutKey: 'K', category: ['praise'], animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '🤝', '⭐', '✨'], count: 16, mode: 'burst' } },
  { id: 'fire', glyph: '🔥', name: 'fire', shortcutKey: '', category: ['praise', 'symbols'], animation: 'giggle', shakeLevel: 'light', shock: false, burst: true, flash: 'red', sound: 'whoosh', particles: { glyphs: ['🔥', '♨️', '💥'], count: 16, mode: 'rise' } },
  { id: 'hundred', glyph: '💯', name: 'hundred', shortcutKey: '', category: ['praise', 'symbols'], animation: 'slam', shakeLevel: 'medium', shock: false, burst: true, flash: 'none', sound: 'pop', particles: { glyphs: ['💯', '✨', '⭐'], count: 14, mode: 'burst' } },
  { id: 'star', glyph: '⭐', name: 'star', shortcutKey: '', category: ['praise', 'symbols'], animation: 'spin', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['⭐', '✨', '🌟'], count: 14, mode: 'orbit' } },
  { id: 'target', glyph: '🎯', name: 'target', shortcutKey: '', category: ['praise', 'symbols'], animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['🎯', '💥', '✨'], count: 16, mode: 'burst' } },

  { id: 'crown', glyph: '👑', name: 'crown', shortcutKey: '', category: ['symbols', 'praise'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['👑', '✨', '🌟'], count: 12, mode: 'rise' } },
  { id: 'trophy', glyph: '🏆', name: 'trophy', shortcutKey: '', category: ['symbols', 'praise'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['🏆', '⭐', '✨'], count: 14, mode: 'rise' } },
  { id: 'knight', glyph: '🐴', name: 'knight', shortcutKey: '', category: ['symbols', 'fun'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🐴', '✨', '⭐'], count: 10, mode: 'burst' } },
  { id: 'queen', glyph: '👸', name: 'queen', shortcutKey: '', category: ['symbols', 'fun'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['👸', '👑', '✨'], count: 12, mode: 'rise' } },
  { id: 'exclamation', glyph: '❗', name: 'exclamation', shortcutKey: '', category: ['symbols', 'surprise'], animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'red', sound: 'thud', particles: { glyphs: ['❗', '💥', '⚠️'], count: 12, mode: 'burst' } },
  { id: 'question', glyph: '❓', name: 'question', shortcutKey: '', category: ['symbols', 'thinking', 'surprise'], animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['❓', '💭'], count: 8, mode: 'rise' } },
  { id: 'idea', glyph: '💡', name: 'idea', shortcutKey: '', category: ['symbols', 'thinking', 'surprise'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['💡', '✨', '🌟'], count: 10, mode: 'rise' } },
  { id: 'flag', glyph: '🚩', name: 'flag', shortcutKey: '', category: ['symbols'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['🚩', '✨'], count: 8, mode: 'orbit' } },

  { id: 'angry', glyph: '😠', name: 'angry', shortcutKey: 'A', category: ['reactions'], animation: 'angry', shakeLevel: 'heavy', shock: false, burst: false, flash: 'red', sound: 'thud', particles: { glyphs: ['💨', '♨️', '🔥', '😠'], count: 12, mode: 'rise' } },
  { id: 'crying', glyph: '😭', name: 'crying', shortcutKey: 'C', category: ['reactions'], animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💧', '💦', '😭', '😢'], count: 16, mode: 'rain' } },
  { id: 'dizzy', glyph: '😵‍💫', name: 'dizzy', shortcutKey: 'D', category: ['reactions', 'surprise'], animation: 'spin', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['💫', '⭐', '✨', '🌀'], count: 12, mode: 'orbit' } },
  { id: 'peeking', glyph: '🫣', name: 'peeking', shortcutKey: 'E', category: ['reactions', 'surprise'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['✨', '💫'], count: 6, mode: 'rise' } },
  { id: 'hii', glyph: '👋', name: 'hii', shortcutKey: 'I', category: ['reactions', 'fun'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['👋', '✨', '🌸', '💫'], count: 10, mode: 'orbit' } },
  { id: 'clown', glyph: '🤡', name: 'clown', shortcutKey: 'J', category: ['reactions', 'fun'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🎈', '✨', '🌸', '🎪'], count: 14, mode: 'rise' } },
  { id: 'mindblown', glyph: '🤯', name: 'mindblown', shortcutKey: 'M', category: ['reactions', 'surprise'], animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '🔥', '✨', '⭐', '💫'], count: 20, mode: 'burst' } },
  { id: 'yawning', glyph: '🥱', name: 'yawning', shortcutKey: 'N', category: ['reactions'], animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'snore', particles: { glyphs: ['💤', '🥱', 'z', 'Z'], count: 8, mode: 'rise' } },
  { id: 'cool', glyph: '😎', name: 'cool', shortcutKey: 'O', category: ['reactions', 'fun'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '😎', '⭐', '🕶️'], count: 12, mode: 'burst' } },
  { id: 'punch', glyph: '👊', name: 'punch', shortcutKey: 'P', category: ['praise'], animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '✨', '⭐', '👊', '🔥'], count: 18, mode: 'burst' } },
  { id: 'shush', glyph: '🤫', name: 'shush', shortcutKey: 'Q', category: ['reactions', 'thinking'], animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['🤫', '💨', '✨'], count: 6, mode: 'rise' } },
  { id: 'sad', glyph: '😢', name: 'sad', shortcutKey: 'S', category: ['reactions'], animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💧', '💦', '😢'], count: 12, mode: 'rain' } },
  { id: 'teasing', glyph: '😜', name: 'teasing', shortcutKey: 'T', category: ['reactions', 'fun'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['⭐', '✨', '💫', '😜'], count: 10, mode: 'orbit' } },
  { id: 'suspecting', glyph: '🤨', name: 'suspecting', shortcutKey: 'V', category: ['reactions', 'thinking'], animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['🤨', '❓', '💨'], count: 8, mode: 'rise' } },
  { id: 'winking', glyph: '😉', name: 'winking', shortcutKey: 'W', category: ['reactions', 'fun'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '💛', '⭐', '💖', '😉'], count: 12, mode: 'rise' } },
  { id: 'thumbsdown', glyph: '👎', name: 'thumbsdown', shortcutKey: 'X', category: ['reactions'], animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💨', '👎'], count: 8, mode: 'rain' } },
  { id: 'yummy', glyph: '😋', name: 'yummy', shortcutKey: 'Y', category: ['reactions', 'fun'], animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🍕', '🧁', '🍓', '😋', '❤️'], count: 12, mode: 'rise' } },
  { id: 'closingeyes', glyph: '😌', name: 'closing eyes', shortcutKey: 'Z', category: ['reactions'], animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'snore', particles: { glyphs: ['✨', '😌', '💤'], count: 10, mode: 'rise' } }
];
