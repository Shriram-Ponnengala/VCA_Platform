const { Chess } = require('chess.js');

try {
  const c = new Chess('8/8/8/8/8/8/8/2R5 w - - 0 1', { skipValidation: true });
  c._isKingAttacked = function(color) {
    return false;
  };
  
  console.log('inCheck:', c.inCheck());
  console.log('isCheckmate:', c.isCheckmate());
  console.log('isStalemate:', c.isStalemate());
  console.log('isDraw:', c.isDraw());
  console.log('isGameOver:', c.isGameOver());
  
  // Try generating moves for the whole board
  console.log('All board moves:', c.moves().map(m => typeof m === 'string' ? m : m.san));
} catch (e) {
  console.error('Error during test:', e);
}
