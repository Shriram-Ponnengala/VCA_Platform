const jiti = require('jiti')(__filename);
const { Chess } = jiti('./src/index.ts');

try {
  // Gamified FEN: just a white rook on a1, no kings on the board
  const startFen = '8/8/8/8/8/8/8/R7 w - - 0 1|targets:e1=pnd,g7=co|blocks:a8=tre,b8=tre,c8=tre,d8=rdbar,f8=pit,g8=brkwl,h8=brkwl,a7=tre,b7=tre,c7=tre,d7=rdbar,h7=brkwl,a6=tre,b6=tre,c6=tre,d6=rdbar,f6=rck,g6=rdbar,h6=brkwl,a5=tre,b5=tre,c5=rdbar,f5=pit,g5=pit,h5=brkwl,a4=rdbar,b4=rdbar,f4=rdbar,g4=rdbar,h4=brkwl,a3=rck,b3=rck,d3=rck,h3=rck,a2=rck,b2=rck,d2=tre,e2=rck,f2=rck,g2=rck,h2=wtr,f1=wtr,g1=wtr,h1=wtr';
  console.log('1. Loading starting FEN:', startFen);
  const game = new Chess(startFen);
  console.log('   Game loaded. Turn is:', game.turn());
  console.log('   Dummy kings added at:', game.addedKings);
  console.log('   Valid moves for a1:', game.moves({ square: 'a1' }));

  console.log('\n2. Making 1st move: a1 to b1');
  game.move({ from: 'a1', to: 'b1' });
  const fen1 = game.fen();
  console.log('   Move 1 made. New FEN:', fen1);
  
  console.log('\n3. Loading 1st move FEN into new Chess instance');
  const game1 = new Chess(fen1);
  console.log('   Game 1 loaded. Turn is:', game1.turn());
  console.log('   Dummy kings added at:', game1.addedKings);
  console.log('   Valid moves for b1:', game1.moves({ square: 'b1' }));

  console.log('\n4. Making 2nd move: b1 to c1');
  game1.move({ from: 'b1', to: 'c1' });
  const fen2 = game1.fen();
  console.log('   Move 2 made. New FEN:', fen2);

  console.log('\n5. Loading 2nd move FEN into new Chess instance');
  const game2 = new Chess(fen2);
  console.log('   Game 2 loaded. Turn is:', game2.turn());
  console.log('   Dummy kings added at:', game2.addedKings);
  console.log('   Valid moves for c1:', game2.moves({ square: 'c1' }));

  console.log('\n6. Making 3rd move: c1 to d1');
  game2.move({ from: 'c1', to: 'd1' });
  const fen3 = game2.fen();
  console.log('   Move 3 made. New FEN:', fen3);
  console.log('   Success!');
} catch (e) {
  console.error('Error encountered:', e);
}
