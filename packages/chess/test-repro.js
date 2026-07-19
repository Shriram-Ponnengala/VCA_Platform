const jiti = require('jiti')(__filename);
const { Chess } = jiti('./src/index.ts');

const fen = '8/8/8/8/8/8/8/2R5 w - - 0 1|targets:a6=bu|blocks:a4=brkwl,b2=brkwl,b4=brkwl,b7=brkwl,c4=brkwl,c7=brkwl,d3=brkwl,d4=brkwl,e6=brkwl,f2=tre,f4=tre,g1=tre,g2=tre,g5=tre';

const game = new Chess(fen);
console.log('Turn:', game.turn());
console.log('Legal moves from c1:', game.moves({ square: 'c1', verbose: true }).map(m => m.san));
try {
  const move = game.move({ from: 'c1', to: 'e1' });
  console.log('Move succeeded:', move.san);
} catch (e) {
  console.log('Move failed:', e.message);
}
