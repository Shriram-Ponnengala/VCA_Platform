const { Chess } = require('chess.js');
const game = new Chess();
game.loadPgn('1. e4 e5 2. Nf3 Nc6');
console.log(game.history({ verbose: true }));
