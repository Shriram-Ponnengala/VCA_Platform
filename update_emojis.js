const fs = require('fs');
const file = 'apps/web/src/components/chess/EmojiReactions.tsx';
let content = fs.readFileSync(file, 'utf8');

const newEmojis = `export const EMOJIS: EmojiConfig[] = [
  { id: 'angry', glyph: '😠', name: 'angry', shortcutKey: 'A', animation: 'angry', shakeLevel: 'heavy', shock: false, burst: false, flash: 'red', sound: 'thud', particles: { glyphs: ['💨', '♨️', '🔥', '😠'], count: 12, mode: 'rise' } },
  { id: 'party', glyph: '🥳', name: 'party', shortcutKey: 'B', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['🎉', '🎊', '✨', '🎈', '🌟'], count: 20, mode: 'rise' } },
  { id: 'crying', glyph: '😭', name: 'crying', shortcutKey: 'C', animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💧', '💦', '😭', '😢'], count: 16, mode: 'rain' } },
  { id: 'dizzy', glyph: '😵‍💫', name: 'dizzy', shortcutKey: 'D', animation: 'spin', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['💫', '⭐', '✨', '🌀'], count: 12, mode: 'orbit' } },
  { id: 'peeking', glyph: '🫣', name: 'peeking', shortcutKey: 'E', animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['✨', '💫'], count: 6, mode: 'rise' } },
  { id: 'thinking', glyph: '🤔', name: 'thinking', shortcutKey: 'F', animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['❓', '💭', '✨'], count: 8, mode: 'rise' } },
  { id: 'ok', glyph: '👌', name: 'ok', shortcutKey: 'G', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '⭐', '👌'], count: 10, mode: 'burst' } },
  { id: 'happy', glyph: '😄', name: 'happy', shortcutKey: 'H', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🎉', '✨', '⭐', '🎈', '😄'], count: 14, mode: 'rise' } },
  { id: 'hii', glyph: '👋', name: 'hii', shortcutKey: 'I', animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['👋', '✨', '🌸', '💫'], count: 10, mode: 'orbit' } },
  { id: 'clown', glyph: '🤡', name: 'clown', shortcutKey: 'J', animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🎈', '✨', '🌸', '🎪'], count: 14, mode: 'rise' } },
  { id: 'handshake', glyph: '🤝', name: 'handshake', shortcutKey: 'K', animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '🤝', '⭐', '✨'], count: 16, mode: 'burst' } },
  { id: 'laughing', glyph: '😂', name: 'laughing', shortcutKey: 'L', animation: 'giggle', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['😂', '😆', '😹'], count: 12, mode: 'burst' } },
  { id: 'mindblown', glyph: '🤯', name: 'mindblown', shortcutKey: 'M', animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '🔥', '✨', '⭐', '💫'], count: 20, mode: 'burst' } },
  { id: 'yawning', glyph: '🥱', name: 'yawning', shortcutKey: 'N', animation: 'bob', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'snore', particles: { glyphs: ['💤', '🥱', 'z', 'Z'], count: 8, mode: 'rise' } },
  { id: 'cool', glyph: '😎', name: 'cool', shortcutKey: 'O', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '😎', '⭐', '🕶️'], count: 12, mode: 'burst' } },
  { id: 'punch', glyph: '👊', name: 'punch', shortcutKey: 'P', animation: 'slam', shakeLevel: 'heavy', shock: true, burst: true, flash: 'white', sound: 'thud', particles: { glyphs: ['💥', '✨', '⭐', '👊', '🔥'], count: 18, mode: 'burst' } },
  { id: 'shush', glyph: '🤫', name: 'shush', shortcutKey: 'Q', animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['🤫', '💨', '✨'], count: 6, mode: 'rise' } },
  { id: 'clap', glyph: '👏', name: 'clap', shortcutKey: 'R', animation: 'slam', shakeLevel: 'light', shock: false, burst: false, flash: 'none', sound: 'thud', particles: { glyphs: ['✨', '⭐', '👏'], count: 12, mode: 'burst' } },
  { id: 'sad', glyph: '😢', name: 'sad', shortcutKey: 'S', animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💧', '💦', '😢'], count: 12, mode: 'rain' } },
  { id: 'teasing', glyph: '😜', name: 'teasing', shortcutKey: 'T', animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'whoosh', particles: { glyphs: ['⭐', '✨', '💫', '😜'], count: 10, mode: 'orbit' } },
  { id: 'thumbsup', glyph: '👍', name: 'thumbsup', shortcutKey: 'U', animation: 'rise', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '⭐', '👍'], count: 10, mode: 'rise' } },
  { id: 'suspecting', glyph: '🤨', name: 'suspecting', shortcutKey: 'V', animation: 'wag', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'blips', particles: { glyphs: ['🤨', '❓', '💨'], count: 8, mode: 'rise' } },
  { id: 'winking', glyph: '😉', name: 'winking', shortcutKey: 'W', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['✨', '💛', '⭐', '💖', '😉'], count: 12, mode: 'rise' } },
  { id: 'thumbsdown', glyph: '👎', name: 'thumbsdown', shortcutKey: 'X', animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'tone', particles: { glyphs: ['💨', '👎'], count: 8, mode: 'rain' } },
  { id: 'yummy', glyph: '😋', name: 'yummy', shortcutKey: 'Y', animation: 'giggle', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'pop', particles: { glyphs: ['🍕', '🧁', '🍓', '😋', '❤️'], count: 12, mode: 'rise' } },
  { id: 'closingeyes', glyph: '😌', name: 'closing eyes', shortcutKey: 'Z', animation: 'droop', shakeLevel: 'none', shock: false, burst: false, flash: 'none', sound: 'snore', particles: { glyphs: ['✨', '😌', '💤'], count: 10, mode: 'rise' } }
];`;

const startIdx = content.indexOf('export const EMOJIS: EmojiConfig[] = [');
const endIdx = content.indexOf('];', startIdx) + 2;

content = content.substring(0, startIdx) + newEmojis + content.substring(endIdx);
fs.writeFileSync(file, content);
console.log('Done!');
